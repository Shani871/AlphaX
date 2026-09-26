/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import avatarPhoto from '../../assets/images/cute_robot_avatar.jpg';

export type AvatarState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface HumanAIAvatarProps {
  state?: AvatarState;
  size?: 'sm' | 'md' | 'lg' | 'responsive';
  amplitude?: number; // 0 to 1 speech amplitude for dynamic response
  className?: string;
}

/**
 * Photorealistic Cinematic Digital Human AI Representative for AuraLife.
 *
 * Characteristics per Master Specifications:
 * - Highly realistic cinematic digital human head-and-shoulders portrait
 * - Eye-level, medium close-up, calm and attentive neutral gaze
 * - Realistic skin, eyes, pores, hair strands, and cinematic lighting
 * - Subtle cyan/blue rim light on shoulders and hair
 * - Circular futuristic AI interface viewport (320px–420px diameter on desktop)
 * - Thin technical markers and segmented cyan accents
 * - Responsive to states: 'idle', 'listening', 'thinking', 'speaking'
 * - Completely free of galaxy/cosmic particle effects
 */
export const HumanAIAvatar: React.FC<HumanAIAvatarProps> = ({
  state = 'idle',
  size = 'responsive',
  amplitude = 0.15,
  className = '',
}) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [pulsePhase, setPulsePhase] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener?.('change', listener);
      return () => mediaQuery.removeEventListener?.('change', listener);
    }
  }, []);

  // Subtle breathing / idle micro-pulse
  useEffect(() => {
    if (prefersReducedMotion) return;
    const interval = setInterval(() => {
      setPulsePhase((p) => (p + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  const isSpeaking = state === 'speaking';
  const isListening = state === 'listening';
  const isThinking = state === 'thinking';

  // Responsive circular viewport diameter per Section 9: 320–420px on desktop
  const sizeClasses = useMemo(() => {
    if (size === 'sm') return 'w-52 h-52 sm:w-60 sm:h-60';
    if (size === 'md') return 'w-64 h-64 sm:w-72 sm:h-72';
    if (size === 'lg') return 'w-80 h-80 sm:w-96 sm:h-96 md:w-[400px] md:h-[400px]';
    // responsive default: 280px mobile -> 340px tablet -> 380px-410px desktop
    return 'w-[280px] h-[280px] sm:w-[330px] sm:h-[330px] md:w-[370px] md:h-[370px] lg:w-[400px] lg:h-[400px]';
  }, [size]);

  // Subtle natural camera micro-motion
  const avatarTransform = useMemo(() => {
    if (prefersReducedMotion) return 'none';
    if (isSpeaking) {
      const pitch = Math.sin((pulsePhase * Math.PI) / 30) * (0.8 + amplitude * 1.5);
      const scale = 1.01 + amplitude * 0.015;
      return `translateY(${pitch.toFixed(2)}px) scale(${scale.toFixed(3)})`;
    }
    if (isListening) {
      // Attentive slight lean-in
      return 'scale(1.02) translateY(-2px)';
    }
    if (isThinking) {
      const wobble = Math.sin((pulsePhase * Math.PI) / 45) * 0.5;
      return `translateX(${wobble.toFixed(2)}px)`;
    }
    // Idle gentle breathing
    const breath = Math.sin((pulsePhase * Math.PI) / 90) * 1.2;
    return `translateY(${breath.toFixed(2)}px) scale(1.002)`;
  }, [prefersReducedMotion, isSpeaking, isListening, isThinking, amplitude, pulsePhase]);

  // Viewport rim lighting color based on AI state
  const rimGlow = useMemo(() => {
    if (isListening) return 'rgba(62, 207, 142, 0.45)'; // Vibrant responsive Mint/Cyan
    if (isSpeaking) return 'rgba(91, 127, 255, 0.55)'; // Deep Electric Cyan/Blue
    if (isThinking) return 'rgba(227, 165, 74, 0.45)'; // Amber/Gold
    return 'rgba(91, 127, 255, 0.22)'; // Idle Soft Cyan
  }, [isListening, isSpeaking, isThinking]);

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      aria-label="AuraLife Digital Human AI Representative"
    >
      {/* 1. Very subtle ambient halo (Section 8: soft, restrained, elegant, low intensity, NO galaxy) */}
      <div
        className="absolute rounded-full pointer-events-none transition-all duration-700 ease-out"
        style={{
          width: '105%',
          height: '105%',
          boxShadow: `0 0 70px 10px ${rimGlow}`,
          opacity: isSpeaking || isListening ? 0.9 : 0.45,
        }}
      />

      {/* 2. Outer Technical Segmentation Ring & Interface Markers (Section 8) */}
      <div className={`absolute ${sizeClasses} rounded-full pointer-events-none p-1.5`}>
        {/* Fine Technical Circular SVG Overlay */}
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full absolute inset-0 pointer-events-none transition-transform duration-1000"
          style={{
            transform: isListening
              ? 'rotate(20deg)'
              : isThinking
              ? `rotate(${pulsePhase * 2}deg)`
              : 'rotate(0deg)',
          }}
        >
          {/* Subtle segmented technical notches around perimeter */}
          <circle
            cx="200"
            cy="200"
            r="196"
            fill="none"
            stroke={rimGlow}
            strokeWidth="1.2"
            strokeDasharray="4 8"
            opacity={isSpeaking || isListening ? '0.7' : '0.35'}
          />

          {/* 4 Cardinal Axis Accent Markers */}
          <line x1="200" y1="0" x2="200" y2="10" stroke="#7FFFD4" strokeWidth="2" opacity="0.6" />
          <line x1="200" y1="390" x2="200" y2="400" stroke="#7FFFD4" strokeWidth="2" opacity="0.6" />
          <line x1="0" y1="200" x2="10" y2="200" stroke="#7FFFD4" strokeWidth="2" opacity="0.6" />
          <line x1="390" y1="200" x2="400" y2="200" stroke="#7FFFD4" strokeWidth="2" opacity="0.6" />

          {/* Active Accent Corner Brackets */}
          <path
            d="M 60 40 A 196 196 0 0 1 100 20"
            fill="none"
            stroke="#3ECF8E"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity={isListening ? '0.9' : '0.2'}
          />
          <path
            d="M 300 20 A 196 196 0 0 1 340 40"
            fill="none"
            stroke="#7FFFD4"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity={isSpeaking ? '0.9' : '0.2'}
          />
        </svg>
      </div>

      {/* 3. The Circular AI Viewport with Photorealistic Cinematic Digital Human (Sections 1, 3, 6, 7, 8) */}
      <div
        className={`relative ${sizeClasses} rounded-full overflow-hidden border border-[#262A35]/80 bg-[#090B0E] shadow-[0_16px_50px_rgba(0,0,0,0.85)] flex items-center justify-center`}
      >
        {/* Photorealistic Digital Human Head-and-Shoulders Portrait */}
        <div
          className="w-full h-full relative transition-transform duration-300 ease-out overflow-hidden"
          style={{ transform: avatarTransform }}
        >
          <img
            src={avatarPhoto}
            alt="AuraLife Digital Human Representative"
            className="w-full h-full object-cover object-center scale-[1.08] filter contrast-[1.03] brightness-[1.01]"
            loading="eager"
            draggable={false}
          />

          {/* Cinematic Cyan/Blue Rim Lighting Edge Overlay (Section 13, 14) */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none transition-opacity duration-300"
            style={{
              boxShadow: `inset 0 0 35px 2px ${rimGlow}`,
              mixBlendMode: 'screen',
              opacity: isSpeaking || isListening ? 0.75 : 0.45,
            }}
          />

          {/* Soft Bottom Studio Vignette to blend neck/shoulders naturally */}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#090B0E] via-[#090B0E]/60 to-transparent pointer-events-none" />

          {/* Dynamic Mouth / Speech Resonance Lighting Layer (Simulating speaking state) */}
          {isSpeaking && (
            <div
              className="absolute inset-0 pointer-events-none mix-blend-soft-light transition-opacity duration-75"
              style={{
                background: `radial-gradient(circle at 50% 65%, rgba(91,127,255,${0.25 + amplitude * 0.35}) 0%, transparent 40%)`,
              }}
            />
          )}
        </div>

        {/* Minimal AI Status Badge on lower circular rim */}
        {(isListening || isSpeaking || isThinking) && (
          <div className="absolute bottom-4 z-20 px-3 py-0.5 rounded-full bg-[#000000]/85 backdrop-blur-md border border-[#26292F] flex items-center gap-1.5 shadow-md">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isListening ? 'bg-[#3ECF8E]' : isSpeaking ? 'bg-[#7FFFD4]' : 'bg-[#E3A54A]'
              } animate-pulse`}
            />
            <span className="text-[10px] font-semibold tracking-wider uppercase text-[#EDEFF2]">
              {isListening ? 'Listening' : isSpeaking ? 'Speaking' : 'Thinking'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default HumanAIAvatar;
