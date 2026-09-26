/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface AuraLifeLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * Premium Futuristic "AuraLife" Vector Logo Component
 *
 * Characteristics:
 * - Geometric "A" monogram with integrated flowing voice/audio resonance wave
 * - Luminous electric blue & cyan gradient with soft ambient aura
 * - Crisp geometric typography: "Aura" (neutral pure light) + "Life" (vibrant cyan gradient)
 * - Scalable vector rendering that stays tack-sharp from 24px navbar to hero displays
 */
export const AuraLifeLogo: React.FC<AuraLifeLogoProps> = ({
  size = 'md',
  showWordmark = true,
  className = '',
  onClick,
}) => {
  const iconDimensions = {
    sm: { w: 26, h: 26 },
    md: { w: 32, h: 32 },
    lg: { w: 42, h: 42 },
  }[size];

  const textClasses = {
    sm: 'text-sm tracking-tight',
    md: 'text-base tracking-tight',
    lg: 'text-xl tracking-tight',
  }[size];

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${
        onClick ? 'cursor-pointer group' : ''
      } ${className}`}
      role="banner"
    >
      {/* 1. Distinctive Geometric "A" Icon with Sound-Wave / Aura Resonance */}
      <div
        className="relative shrink-0 flex items-center justify-center"
        style={{ width: iconDimensions.w, height: iconDimensions.h }}
      >
        {/* Soft Ambient Luminous Halo */}
        <div
          className="absolute inset-0 rounded-xl bg-gradient-to-tr from-[#5B7FFF]/25 to-[#3ECF8E]/25 blur-md pointer-events-none group-hover:from-[#5B7FFF]/40 group-hover:to-[#3ECF8E]/40 transition-all duration-300"
        />

        <svg
          viewBox="0 0 40 40"
          width={iconDimensions.w}
          height={iconDimensions.h}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 drop-shadow-[0_2px_8px_rgba(91,127,255,0.35)]"
        >
          <defs>
            {/* Primary Electric Blue to Luminous Cyan Gradient */}
            <linearGradient id="auraA_stroke" x1="4" y1="36" x2="36" y2="4" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4A6EFF" />
              <stop offset="55%" stopColor="#5B7FFF" />
              <stop offset="100%" stopColor="#3ECF8E" />
            </linearGradient>

            {/* Inner Resonance Audio Wave Gradient */}
            <linearGradient id="auraWave" x1="12" y1="20" x2="28" y2="20" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#3ECF8E" />
              <stop offset="50%" stopColor="#7292FF" />
              <stop offset="100%" stopColor="#3ECF8E" />
            </linearGradient>

            {/* Subtle Aura Glow Fill */}
            <radialGradient id="auraGlowFill" cx="20" cy="22" r="14" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#5B7FFF" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#3ECF8E" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Minimalist Dark Backing Pill */}
          <rect
            x="2"
            y="2"
            width="36"
            height="36"
            rx="9"
            fill="#0F1115"
            stroke="#262A33"
            strokeWidth="1.2"
          />

          {/* Ambient Inner Fill */}
          <rect
            x="2"
            y="2"
            width="36"
            height="36"
            rx="9"
            fill="url(#auraGlowFill)"
          />

          {/* Outer Symmetrical "A" Silhouette Apex */}
          <path
            d="M 20 7.5 L 31.5 31.5 H 26.2 L 23.5 25.8 H 16.5 L 13.8 31.5 H 8.5 L 20 7.5 Z"
            stroke="url(#auraA_stroke)"
            strokeWidth="2.2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Inner Voice Sound-Wave Resonance Bar (Horizontal Crossbar of the 'A') */}
          {/* Smooth audio frequency wave pulsing between the two pillars */}
          <path
            d="M 15 22.5 Q 17.5 19 20 22.5 T 25 22.5"
            stroke="url(#auraWave)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Luminous Core Apex Node */}
          <circle cx="20" cy="9" r="1.6" fill="#3ECF8E" />
        </svg>
      </div>

      {/* 2. Modern Geometric Sans-Serif Wordmark ("Aura" + "Life") */}
      {showWordmark && (
        <div className={`font-sans font-bold flex items-baseline leading-none ${textClasses}`}>
          <span className="text-[#F1F3F5] tracking-tight group-hover:text-white transition-colors">
            Aura
          </span>
          <span className="bg-gradient-to-r from-[#5B7FFF] via-[#4F94FF] to-[#3ECF8E] bg-clip-text text-transparent font-extrabold tracking-tight">
            Life
          </span>
        </div>
      )}
    </div>
  );
};
export default AuraLifeLogo;
