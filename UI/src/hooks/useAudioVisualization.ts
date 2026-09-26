/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface AudioFrequencyData {
  bass: number;
  mid: number;
  treble: number;
  overall: number;
}

export function useAudioVisualization(isLiveActive: boolean, isMuted: boolean) {
  const [frequencies, setFrequencies] = useState<AudioFrequencyData>({
    bass: 0,
    mid: 0,
    treble: 0,
    overall: 0,
  });
  const [micError, setMicError] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const startLiveMic = useCallback(async () => {
    try {
      setMicError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLoop = () => {
        if (!analyserRef.current || isMuted) {
          setFrequencies({ bass: 0.05, mid: 0.05, treble: 0.05, overall: 0.05 });
          animFrameRef.current = requestAnimationFrame(updateLoop);
          return;
        }

        analyserRef.current.getByteFrequencyData(dataArray);

        // Split into bass (indices 1-8), mid (indices 9-64), treble (indices 65-180)
        let bassSum = 0;
        let bassCount = 0;
        for (let i = 1; i <= 8; i++) {
          bassSum += dataArray[i] || 0;
          bassCount++;
        }

        let midSum = 0;
        let midCount = 0;
        for (let i = 9; i <= 64; i++) {
          midSum += dataArray[i] || 0;
          midCount++;
        }

        let trebleSum = 0;
        let trebleCount = 0;
        for (let i = 65; i <= 180; i++) {
          trebleSum += dataArray[i] || 0;
          trebleCount++;
        }

        const bass = Math.min(1, (bassSum / (bassCount * 255)) * 1.5);
        const mid = Math.min(1, (midSum / (midCount * 255)) * 1.8);
        const treble = Math.min(1, (trebleSum / (trebleCount * 255)) * 2.2);
        const overall = (bass * 0.4 + mid * 0.4 + treble * 0.2);

        setFrequencies({ bass, mid, treble, overall });
        animFrameRef.current = requestAnimationFrame(updateLoop);
      };

      updateLoop();
    } catch (err) {
      console.warn('Microphone access denied or unavailable:', err);
      setMicError('Microphone unavailable. Please grant permission or use Demo Mode.');
    }
  }, [isMuted]);

  const stopLiveMic = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  useEffect(() => {
    if (isLiveActive) {
      startLiveMic();
    } else {
      stopLiveMic();
    }
    return () => {
      stopLiveMic();
    };
  }, [isLiveActive, startLiveMic, stopLiveMic]);

  return {
    frequencies,
    micError,
    retryLiveMic: startLiveMic,
  };
}
