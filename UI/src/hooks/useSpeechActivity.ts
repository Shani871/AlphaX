/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';

export interface SpeechActivity {
  isSpeaking: boolean;
  amplitude: number;
  smoothedAmplitude: number;
}

interface UseSpeechActivityOptions {
  isLiveMic: boolean;
  isMuted?: boolean;
  fallbackAmplitude?: number; // Used during scripted demo or AI speaking
  isAiSpeaking?: boolean;
  threshold?: number;
}

/**
 * High-performance hook for real-time speech detection and audio amplitude smoothing.
 * Directly taps into getUserMedia / AnalyserNode without triggering heavy React re-renders.
 */
export function useSpeechActivity({
  isLiveMic,
  isMuted = false,
  fallbackAmplitude = 0,
  isAiSpeaking = false,
  threshold = 0.04,
}: UseSpeechActivityOptions) {
  const [speechState, setSpeechState] = useState<SpeechActivity>({
    isSpeaking: false,
    amplitude: 0,
    smoothedAmplitude: 0,
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Use refs for 60 FPS calculations without overhead
  const smoothedRef = useRef(0);
  const isSpeakingRef = useRef(false);
  const lastStateUpdateRef = useRef(0);

  // Initialize or cleanup microphone stream
  useEffect(() => {
    let active = true;

    async function initMic() {
      if (!isLiveMic) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
          audioCtxRef.current.close().catch(() => {});
          audioCtxRef.current = null;
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtxClass();
        audioCtxRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.3; // fast responsive analysis
        source.connect(analyser);
        analyserRef.current = analyser;
      } catch (err) {
        console.warn('Microphone access for speech activity unavailable:', err);
      }
    }

    initMic();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [isLiveMic]);

  // Main 60 FPS requestAnimationFrame animation loop
  useEffect(() => {
    let buffer: Uint8Array | null = null;

    const tick = () => {
      let currentAmp = 0;

      if (isLiveMic && analyserRef.current && !isMuted) {
        if (!buffer || buffer.length !== analyserRef.current.frequencyBinCount) {
          buffer = new Uint8Array(analyserRef.current.frequencyBinCount);
        }
        analyserRef.current.getByteTimeDomainData(buffer as any);

        // Compute RMS / peak audio volume
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          const val = (buffer[i] - 128) / 128;
          sum += val * val;
        }
        const rms = Math.sqrt(sum / buffer.length);
        // Boost raw speech amplitude for visual responsiveness
        currentAmp = Math.min(1, rms * 4.2);
      } else if (isAiSpeaking || fallbackAmplitude > 0) {
        // Fallback for AI Speaking or simulated session
        currentAmp = isMuted ? 0 : fallbackAmplitude;
      } else {
        currentAmp = 0;
      }

      // Smooth amplitude: 70% previous + 30% current per requirement
      const smoothed = smoothedRef.current * 0.7 + currentAmp * 0.3;
      smoothedRef.current = smoothed;

      const currentlySpeaking = smoothed > threshold;
      isSpeakingRef.current = currentlySpeaking;

      // Throttle React state updates to ~30-40 Hz for UI elements while keeping high frame rate
      const now = performance.now();
      if (now - lastStateUpdateRef.current > 33) {
        lastStateUpdateRef.current = now;
        setSpeechState({
          isSpeaking: currentlySpeaking,
          amplitude: currentAmp,
          smoothedAmplitude: smoothed,
        });
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isLiveMic, isMuted, fallbackAmplitude, isAiSpeaking, threshold]);

  return speechState;
}
