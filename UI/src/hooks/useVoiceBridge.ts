import { useState, useEffect, useCallback, useRef } from 'react';

export interface TranslationData {
  original: string;
  translated: string;
  target_lang: string;
}

interface VoiceBridgeState {
  isConnected: boolean;
  levels: { micLevel: number; aiLevel: number; isAiSpeaking: boolean };
  transcripts: { speaker: string; text: string; translation?: string }[];
  isBargeIn: boolean;
  systemActions: { action: string; target: string }[];
  lastTranslation: TranslationData | null;
}

// Global Singleton State
let globalWs: WebSocket | null = null;
let globalAudioCtx: AudioContext | null = null;
let nextPlayTime: number = 0;
let activeSources: AudioBufferSourceNode[] = [];
let aiSpeakingTimer: any = null;
let reconnectTimer: any = null;
let listeners: Set<(state: VoiceBridgeState) => void> = new Set();

let currentState: VoiceBridgeState = {
  isConnected: false,
  levels: { micLevel: 0, aiLevel: 0, isAiSpeaking: false },
  transcripts: [],
  isBargeIn: false,
  systemActions: [],
  lastTranslation: null,
};

function notifyListeners() {
  listeners.forEach((listener) => listener({ ...currentState }));
}

function updateState(patch: Partial<VoiceBridgeState>) {
  currentState = { ...currentState, ...patch };
  notifyListeners();
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!globalAudioCtx) {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtxClass) {
      globalAudioCtx = new AudioCtxClass({ sampleRate: 24000 });
    }
  }
  if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume().catch(() => {});
  }
  return globalAudioCtx;
}

function stopBrowserAudio() {
  activeSources.forEach((source) => {
    try {
      source.stop();
      source.disconnect();
    } catch (e) {}
  });
  activeSources = [];
  if (globalAudioCtx) {
    nextPlayTime = globalAudioCtx.currentTime;
  }
  updateState({
    levels: { ...currentState.levels, aiLevel: 0, isAiSpeaking: false },
  });
}

function playPcmChunk(base64Data: string, rate: number = 24000) {
  try {
    const audioCtx = getAudioContext();
    if (!audioCtx) return;

    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const int16Array = new Int16Array(bytes.buffer);
    if (int16Array.length === 0) return;

    const float32Array = new Float32Array(int16Array.length);
    let sumSquares = 0;
    for (let i = 0; i < int16Array.length; i++) {
      const val = int16Array[i] / 32768.0;
      float32Array[i] = val;
      sumSquares += val * val;
    }

    const rms = Math.sqrt(sumSquares / int16Array.length);
    const computedAiLevel = Math.min(1.0, rms * 3.5);

    const audioBuffer = audioCtx.createBuffer(1, float32Array.length, rate);
    audioBuffer.getChannelData(0).set(float32Array);

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    const startTime = Math.max(now, nextPlayTime);
    source.start(startTime);
    nextPlayTime = startTime + audioBuffer.duration;

    activeSources.push(source);
    source.onended = () => {
      activeSources = activeSources.filter((s) => s !== source);
    };

    updateState({
      levels: {
        ...currentState.levels,
        aiLevel: Math.max(currentState.levels.aiLevel * 0.7, computedAiLevel),
        isAiSpeaking: true,
      },
    });

    if (globalWs && globalWs.readyState === WebSocket.OPEN) {
      globalWs.send(JSON.stringify({ command: 'ai_speaking_state', state: true }));
    }

    if (aiSpeakingTimer) {
      clearTimeout(aiSpeakingTimer);
    }
    const durationMs = (nextPlayTime - now) * 1000 + 200;
    aiSpeakingTimer = setTimeout(() => {
      updateState({
        levels: { ...currentState.levels, aiLevel: 0, isAiSpeaking: false },
      });
      if (globalWs && globalWs.readyState === WebSocket.OPEN) {
        globalWs.send(JSON.stringify({ command: 'ai_speaking_state', state: false }));
      }
    }, durationMs);
  } catch (err) {
    console.warn('[VoiceBridge Singleton] Audio notice:', err);
  }
}

function getWebSocketUrl(): string {
  // 1. Explicit env variables
  const envWs = (import.meta.env.VITE_BACKEND_WS_URL as string) || (import.meta.env.VITE_WS_URL as string);
  if (envWs && envWs.trim()) {
    return envWs.trim();
  }

  // 2. Runtime browser dynamic resolution
  if (typeof window !== 'undefined') {
    const isHttps = window.location.protocol === 'https:';
    const wsProto = isHttps ? 'wss:' : 'ws:';
    const host = window.location.host;
    const hostname = window.location.hostname;

    // Cloud Run deployment: alpha-ui-xxx.a.run.app -> alpha-backend-xxx.a.run.app
    if (hostname.includes('alpha-ui')) {
      const backendHost = host.replace('alpha-ui', 'alpha-backend');
      return `${wsProto}//${backendHost}/ws`;
    }

    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'ws://127.0.0.1:8765';
    }

    return `${wsProto}//${host}/ws`;
  }

  return 'ws://127.0.0.1:8765';
}

function initWebSocket() {
  if (globalWs && (globalWs.readyState === WebSocket.OPEN || globalWs.readyState === WebSocket.CONNECTING)) {
    return;
  }

  try {
    const wsUrl = getWebSocketUrl();
    console.log(`[VoiceBridge] Connecting to WebSocket: ${wsUrl}`);
    const ws = new WebSocket(wsUrl);
    globalWs = ws;

    ws.onopen = () => {
      console.log(`[VoiceBridge] Connected to backend gateway at: ${wsUrl}`);
      updateState({ isConnected: true });
    };

    ws.onclose = () => {
      updateState({ isConnected: false });
      globalWs = null;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        initWebSocket();
      }, 2000);
    };

    ws.onerror = (e) => {
      console.warn('[VoiceBridge] WebSocket error:', e);
      ws.close();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Python Audio Bridge & Node Gateway compatibility
        const eventType = data.event || data.type;

        if (eventType === 'audio_output') {
          // Play once through the single AudioContext
          if (data.pcm) {
            playPcmChunk(data.pcm, data.rate || 24000);
          }
        } else if (eventType === 'audio_wave') {
          updateState({
            levels: {
              ...currentState.levels,
              micLevel: data.mic_level ?? currentState.levels.micLevel,
              aiLevel: currentState.levels.isAiSpeaking
                ? currentState.levels.aiLevel
                : (data.ai_level ?? 0),
              isAiSpeaking: currentState.levels.isAiSpeaking || Boolean(data.is_ai_speaking),
            },
          });
        } else if (eventType === 'transcript' || eventType === 'ai_response') {
          const text = data.text || data.transcript;
          if (text) {
            updateState({
              transcripts: [
                ...currentState.transcripts,
                {
                  speaker: data.speaker || data.speakerId || 'AI',
                  text,
                  translation: data.translation,
                },
              ],
            });
          }
        } else if (eventType === 'translate_result') {
          if (data.translated) {
            updateState({
              lastTranslation: {
                original: data.original,
                translated: data.translated,
                target_lang: data.target_lang || 'English',
              },
            });
          }
        } else if (eventType === 'barge_in') {
          stopBrowserAudio();
          updateState({ isBargeIn: true });
          setTimeout(() => updateState({ isBargeIn: false }), 500);
        } else if (eventType === 'system_action' || eventType === 'action_completed') {
          updateState({
            systemActions: [
              ...currentState.systemActions,
              {
                action: data.action || data.intent || 'Action Executed',
                target: data.target || (data.entities ? JSON.stringify(data.entities) : ''),
              },
            ],
          });
        } else if (eventType === 'session_started' || eventType === 'session_restored') {
          console.log(`[VoiceBridge] Active session: ${data.sessionId}`);
        }
      } catch (err) {
        console.error('[VoiceBridge Singleton] Parse error:', err);
      }
    };
  } catch (e) {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
      initWebSocket();
    }, 2000);
  }
}

// Unlock Web Audio context on user interaction
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    getAudioContext();
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('click', unlockAudio);
  window.addEventListener('keydown', unlockAudio);
}

// Native Browser Speech & Audio Capture
let localMediaStream: MediaStream | null = null;
let localAnalyser: AnalyserNode | null = null;
let speechRecognizer: any = null;
let micAnimFrame: number | null = null;

function stopBrowserMic() {
  if (speechRecognizer) {
    try {
      speechRecognizer.stop();
    } catch (e) {}
    speechRecognizer = null;
  }
  if (micAnimFrame) {
    cancelAnimationFrame(micAnimFrame);
    micAnimFrame = null;
  }
  if (localMediaStream) {
    localMediaStream.getTracks().forEach((track) => track.stop());
    localMediaStream = null;
  }
  localAnalyser = null;
  updateState({
    levels: { ...currentState.levels, micLevel: 0 },
  });
}

async function startBrowserMic() {
  stopBrowserMic();

  try {
    const audioCtx = getAudioContext();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    localMediaStream = stream;

    if (audioCtx) {
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);
      localAnalyser = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const sampleMic = () => {
        if (!localAnalyser) return;
        localAnalyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(1, avg / 128);

        // Barge-in detection: user speaks while AI is talking
        if (normalized > 0.25 && currentState.levels.isAiSpeaking) {
          stopBrowserAudio();
          updateState({ isBargeIn: true });
          if (globalWs && globalWs.readyState === WebSocket.OPEN) {
            globalWs.send(JSON.stringify({ command: 'interrupt', type: 'interruption' }));
          }
          setTimeout(() => updateState({ isBargeIn: false }), 500);
        }

        updateState({
          levels: {
            ...currentState.levels,
            micLevel: normalized,
          },
        });

        micAnimFrame = requestAnimationFrame(sampleMic);
      };
      sampleMic();
    }

    // Initialize Web Speech Recognition for real-time speech catching
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += text;
          } else {
            interimTranscript += text;
          }
        }

        const currentText = (finalTranscript || interimTranscript).trim();
        if (currentText) {
          // Send to backend via WebSocket
          if (globalWs && globalWs.readyState === WebSocket.OPEN) {
            globalWs.send(
              JSON.stringify({
                command: 'send_text',
                text: currentText,
                isFinal: Boolean(finalTranscript),
              })
            );
          }

          if (finalTranscript) {
            updateState({
              transcripts: [
                ...currentState.transcripts,
                { speaker: 'You (Speaker)', text: finalTranscript },
              ],
            });
          }
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('[VoiceBridge] Speech recognition warning:', err.error);
      };

      recognition.onend = () => {
        // Auto-restart if mic is still active
        if (localMediaStream && speechRecognizer) {
          try {
            recognition.start();
          } catch (e) {}
        }
      };

      recognition.start();
      speechRecognizer = recognition;
    }
  } catch (err) {
    console.warn('[VoiceBridge] Microphone access error:', err);
  }
}

export function useVoiceBridge() {
  const [state, setState] = useState<VoiceBridgeState>(currentState);

  useEffect(() => {
    listeners.add(setState);
    initWebSocket();

    return () => {
      listeners.delete(setState);
    };
  }, []);

  const sendCommand = useCallback((cmd: any) => {
    if (globalWs && globalWs.readyState === WebSocket.OPEN) {
      globalWs.send(JSON.stringify(cmd));
    }
  }, []);

  const toggleMic = useCallback(
    (active: boolean) => {
      sendCommand({ command: 'toggle_mic', active });
      if (active) {
        startBrowserMic();
      } else {
        stopBrowserMic();
      }
    },
    [sendCommand]
  );

  const interrupt = useCallback(() => {
    stopBrowserAudio();
    sendCommand({ command: 'interrupt', type: 'interruption' });
  }, [sendCommand]);

  const sendText = useCallback(
    (text: string) => {
      getAudioContext();
      sendCommand({ command: 'send_text', text });
    },
    [sendCommand]
  );

  const sendTranslate = useCallback(
    (text: string, target_lang: string) => {
      sendCommand({ command: 'translate', text, target_lang });
    },
    [sendCommand]
  );

  return {
    isConnected: state.isConnected,
    levels: state.levels,
    transcripts: state.transcripts,
    isBargeIn: state.isBargeIn,
    systemActions: state.systemActions,
    lastTranslation: state.lastTranslation,
    toggleMic,
    interrupt,
    sendText,
    sendTranslate,
  };
}
