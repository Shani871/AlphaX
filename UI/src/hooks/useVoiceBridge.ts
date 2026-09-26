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

function initWebSocket() {
  if (globalWs && (globalWs.readyState === WebSocket.OPEN || globalWs.readyState === WebSocket.CONNECTING)) {
    return;
  }

  try {
    const ws = new WebSocket('ws://127.0.0.1:8765');
    globalWs = ws;

    ws.onopen = () => {
      console.log('[VoiceBridge Singleton] Connected to AuraLive AI backend ws://127.0.0.1:8765');
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

    ws.onerror = () => {
      ws.close();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.event === 'audio_output') {
          // Play once through the single AudioContext
          if (data.pcm) {
            playPcmChunk(data.pcm, data.rate || 24000);
          }
        } else if (data.event === 'audio_wave') {
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
        } else if (data.event === 'transcript') {
          if (data.text) {
            updateState({
              transcripts: [
                ...currentState.transcripts,
                {
                  speaker: data.speaker || 'AI',
                  text: data.text,
                  translation: data.translation,
                },
              ],
            });
          }
        } else if (data.event === 'translate_result') {
          if (data.translated) {
            updateState({
              lastTranslation: {
                original: data.original,
                translated: data.translated,
                target_lang: data.target_lang || 'English',
              },
            });
          }
        } else if (data.event === 'barge_in') {
          stopBrowserAudio();
          updateState({ isBargeIn: true });
          setTimeout(() => updateState({ isBargeIn: false }), 500);
        } else if (data.event === 'system_action') {
          updateState({
            systemActions: [
              ...currentState.systemActions,
              { action: data.action, target: data.target },
            ],
          });
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
    },
    [sendCommand]
  );

  const interrupt = useCallback(() => {
    stopBrowserAudio();
    sendCommand({ command: 'interrupt' });
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
