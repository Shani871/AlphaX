import { useState, useEffect, useCallback, useRef } from 'react';

export function useVoiceBridge() {
  const [isConnected, setIsConnected] = useState(false);
  const [levels, setLevels] = useState({ micLevel: 0, aiLevel: 0, isAiSpeaking: false });
  const [transcripts, setTranscripts] = useState<{speaker: string, text: string}[]>([]);
  const [isBargeIn, setIsBargeIn] = useState(false);
  const [systemActions, setSystemActions] = useState<{action: string, target: string}[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://127.0.0.1:8765');
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'audio_wave') {
          setLevels({
            micLevel: data.mic_level,
            aiLevel: data.ai_level,
            isAiSpeaking: data.is_ai_speaking
          });
        } else if (data.event === 'transcript') {
          setTranscripts(prev => [...prev, { speaker: data.speaker, text: data.text }]);
        } else if (data.event === 'barge_in') {
          setIsBargeIn(true);
          setTimeout(() => setIsBargeIn(false), 500);
        } else if (data.event === 'system_action') {
          setSystemActions(prev => [...prev, { action: data.action, target: data.target }]);
        }
      } catch (err) {
        console.error('WebSocket parse error:', err);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const sendCommand = useCallback((cmd: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(cmd));
    }
  }, []);

  const toggleMic = useCallback((active: boolean) => {
    sendCommand({ command: 'toggle_mic', active });
  }, [sendCommand]);

  const interrupt = useCallback(() => {
    sendCommand({ command: 'interrupt' });
  }, [sendCommand]);

  const sendText = useCallback((text: string) => {
    sendCommand({ command: 'send_text', text });
  }, [sendCommand]);

  return {
    isConnected,
    levels,
    transcripts,
    isBargeIn,
    systemActions,
    toggleMic,
    interrupt,
    sendText
  };
}
