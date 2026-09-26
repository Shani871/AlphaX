/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import { CoreState } from '../../mock/mockSession';

export type AvatarGender = 'male' | 'female';

export interface HumanAvatarProps {
  gender: AvatarGender;
  isSpeaking: boolean;
  amplitude: number; // 0 to 1 smoothed amplitude
  connectionState?: CoreState;
  isAiSpeaking?: boolean;
  isUserSpeaking?: boolean;
  className?: string;
}

export const HumanAvatar: React.FC<HumanAvatarProps> = ({
  gender,
  isSpeaking,
  amplitude,
  connectionState = 'LISTENING',
  isAiSpeaking = false,
  isUserSpeaking = false,
  className = '',
}) => {
  // Eye blinking state (natural interval 3-5 seconds)
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    let blinkTimeout: NodeJS.Timeout;
    const scheduleBlink = () => {
      const delay = 2800 + Math.random() * 2500;
      blinkTimeout = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 140);
      }, delay);
    };

    scheduleBlink();
    return () => clearTimeout(blinkTimeout);
  }, []);

  /**
   * 5 Smooth Mouth States (Section requirement: 0 to 4):
   * 0 = completely closed
   * 1 = slightly open (low amplitude)
   * 2 = normal speaking (mid amplitude)
   * 3 = wide open (high amplitude)
   * 4 = very open (peak amplitude)
   */
  const mouthState = useMemo(() => {
    if (!isSpeaking || amplitude < 0.05) return 0;
    if (amplitude < 0.22) return 1;
    if (amplitude < 0.48) return 2;
    if (amplitude < 0.75) return 3;
    return 4;
  }, [isSpeaking, amplitude]);

  // Dynamic mouth dimensions based on mouthState (smooth SVG morphing)
  const mouthParams = useMemo(() => {
    switch (mouthState) {
      case 0:
        return { height: 1.5, width: 28, rx: 1, openY: 0, innerDarkness: 'opacity-0' };
      case 1:
        return { height: 5, width: 29, rx: 2.5, openY: 1, innerDarkness: 'opacity-70' };
      case 2:
        return { height: 9, width: 31, rx: 4.5, openY: 2, innerDarkness: 'opacity-90' };
      case 3:
        return { height: 14, width: 33, rx: 7, openY: 3.5, innerDarkness: 'opacity-95' };
      case 4:
        return { height: 19, width: 34, rx: 9, openY: 5, innerDarkness: 'opacity-100' };
    }
  }, [mouthState]);

  // Subtle head / eye micro-movements
  const headTransform = useMemo(() => {
    if (isSpeaking) {
      const pitch = Math.sin(Date.now() / 240) * (1.2 + amplitude * 2.5);
      const yaw = Math.cos(Date.now() / 320) * (0.8 + amplitude * 1.5);
      return `translate(${yaw.toFixed(2)}px, ${pitch.toFixed(2)}px)`;
    }
    // Idle breathing/subtle float
    return 'translate(0px, 0px)';
  }, [isSpeaking, amplitude]);

  // Aura lighting glow reactive to speech and mode (Cyan / Blue / Green)
  const auraGlowColor = useMemo(() => {
    if (isUserSpeaking) return 'rgba(62, 207, 142, 0.45)'; // Soft vibrant Emerald / Mint
    if (isAiSpeaking) return 'rgba(91, 127, 255, 0.55)'; // Electric Cyan / Sapphire
    if (connectionState === 'TRANSLATING') return 'rgba(227, 165, 74, 0.5)'; // Amber
    return 'rgba(91, 127, 255, 0.25)'; // Idle Cyan
  }, [isUserSpeaking, isAiSpeaking, connectionState]);

  const auraRadius = 140 + amplitude * 60;

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Outer reactive soundwave rings */}
      <div
        className="absolute rounded-full transition-all duration-150 pointer-events-none"
        style={{
          width: `${auraRadius * 2}px`,
          height: `${auraRadius * 2}px`,
          boxShadow: `0 0 ${40 + amplitude * 50}px ${auraGlowColor}, inset 0 0 30px ${auraGlowColor}`,
          border: `1px solid ${isSpeaking ? auraGlowColor : 'rgba(91, 127, 255, 0.12)'}`,
          opacity: isSpeaking ? 0.9 : 0.4,
          transform: `scale(${1 + amplitude * 0.12})`,
        }}
      />

      {/* Futuristic Glass Container */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden border border-[#26292F]/80 bg-gradient-to-b from-[#050505] via-[#0D0E12] to-[#07080A] shadow-[0_12px_48px_rgba(0,0,0,0.8)] flex items-center justify-center">
        {/* Subtle futuristic cyan circular grid backdrop */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at center, #7FFFD4 1px, transparent 1px), linear-gradient(to right, #26292F 1px, transparent 1px)',
            backgroundSize: '24px 24px, 100% 100%',
          }}
        />

        {/* Ambient Top Light */}
        <div
          className="absolute -top-12 inset-x-12 h-32 rounded-full blur-2xl pointer-events-none"
          style={{ background: auraGlowColor, opacity: 0.35 + amplitude * 0.3 }}
        />

        {/* Digital Human SVG Avatar */}
        <div
          className="w-full h-full relative transition-transform duration-100 ease-out"
          style={{ transform: headTransform }}
        >
          <svg
            viewBox="0 0 280 280"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Skin Gradient - Male (Natural Warm Sand & Cyan Rim) */}
              <linearGradient id="maleSkin" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#DFB293" />
                <stop offset="50%" stopColor="#CE9E7D" />
                <stop offset="100%" stopColor="#B37D5C" />
              </linearGradient>

              {/* Skin Gradient - Female (Polished Radiant Neutral) */}
              <linearGradient id="femaleSkin" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EAD0BE" />
                <stop offset="50%" stopColor="#DDBB9F" />
                <stop offset="100%" stopColor="#C49B7E" />
              </linearGradient>

              {/* Cyan Rim Lighting */}
              <linearGradient id="cyanRim" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7FFFD4" stopOpacity="0.8" />
                <stop offset="15%" stopColor="#3ECF8E" stopOpacity="0.4" />
                <stop offset="85%" stopColor="transparent" />
                <stop offset="100%" stopColor="#7FFFD4" stopOpacity="0.6" />
              </linearGradient>

              {/* Jacket / Suit Gradient */}
              <linearGradient id="suitDark" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1E222A" />
                <stop offset="100%" stopColor="#0F1115" />
              </linearGradient>

              <linearGradient id="hairMale" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2D2825" />
                <stop offset="100%" stopColor="#171412" />
              </linearGradient>

              <linearGradient id="hairFemale" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B2A22" />
                <stop offset="70%" stopColor="#251913" />
                <stop offset="100%" stopColor="#17100D" />
              </linearGradient>
            </defs>

            {/* Futuristic Collar / Smart Collar Suit */}
            <g id="body">
              {/* Shoulders */}
              <path
                d="M 60 270 Q 140 230 220 270 L 230 280 L 50 280 Z"
                fill="url(#suitDark)"
              />
              {/* Collar Accent */}
              <path
                d="M 105 235 L 140 255 L 175 235 L 165 220 L 140 228 L 115 220 Z"
                fill="#16181D"
                stroke="#2B303C"
                strokeWidth="1.5"
              />
              {/* Cyber/Assistant light strip on chest */}
              <line
                x1="140"
                y1="230"
                x2="140"
                y2="275"
                stroke={isSpeaking ? '#7FFFD4' : '#323742'}
                strokeWidth="2"
                strokeLinecap="round"
                opacity={isSpeaking ? 0.9 : 0.4}
              />
            </g>

            {/* Neck */}
            <g id="neck">
              <path
                d="M 116 170 Q 116 225 118 230 L 162 230 Q 164 225 164 170 Z"
                fill={gender === 'male' ? 'url(#maleSkin)' : 'url(#femaleSkin)'}
              />
              {/* Neck shadow */}
              <path
                d="M 118 170 Q 140 185 162 170 L 164 185 Q 140 200 116 185 Z"
                fill="#000000"
                opacity="0.18"
              />
            </g>

            {/* Head / Face structure */}
            <g id="head">
              {gender === 'male' ? (
                // Male mid-20s facial geometry (chiseled jaw, refined athletic virtual assistant)
                <path
                  d="M 88 105 C 88 65 192 65 192 105 C 192 135 186 168 165 186 C 152 196 128 196 115 186 C 94 168 88 135 88 105 Z"
                  fill="url(#maleSkin)"
                />
              ) : (
                // Female mid-20s facial geometry (soft elegant jaw, delicate cheekbones)
                <path
                  d="M 90 108 C 90 70 190 70 190 108 C 190 138 182 165 162 184 C 150 194 130 194 118 184 C 98 165 90 138 90 108 Z"
                  fill="url(#femaleSkin)"
                />
              )}

              {/* Subtle Cheek blush / tone depth */}
              <circle cx="108" cy="142" r="14" fill="#C46F60" opacity="0.12" />
              <circle cx="172" cy="142" r="14" fill="#C46F60" opacity="0.12" />

              {/* Ears */}
              <path
                d="M 86 120 C 80 120 80 145 88 150 Z"
                fill={gender === 'male' ? '#C99372' : '#D0A285'}
              />
              <path
                d="M 194 120 C 200 120 200 145 192 150 Z"
                fill={gender === 'male' ? '#C99372' : '#D0A285'}
              />
              {/* Virtual Assistant Earbud / Audio Sensor */}
              <circle cx="85" cy="135" r="3.5" fill="#0A0A0A" stroke="#7FFFD4" strokeWidth="1" />
              <circle cx="195" cy="135" r="3.5" fill="#0A0A0A" stroke="#7FFFD4" strokeWidth="1" />
            </g>

            {/* Hairstyles (Natural, modern, professional digital assistant) */}
            <g id="hair">
              {gender === 'male' ? (
                // Male Modern Mid-20s Textured Quiff / Fade
                <path
                  d="M 82 110 C 80 75 105 48 140 45 C 175 48 198 75 198 110 C 198 116 190 110 188 100 C 182 72 170 65 140 65 C 110 65 98 72 92 100 C 90 110 82 116 82 110 Z"
                  fill="url(#hairMale)"
                />
              ) : (
                // Female Modern Mid-20s Layered Bob / Parted
                <path
                  d="M 80 120 C 76 65 110 46 140 45 C 172 46 204 65 200 120 C 204 150 196 175 188 185 C 184 175 192 145 190 110 C 188 78 168 62 140 62 C 112 62 92 78 90 110 C 88 145 96 175 92 185 C 84 175 76 150 80 120 Z"
                  fill="url(#hairFemale)"
                />
              )}
            </g>

            {/* Eyes & Eyebrows */}
            <g id="eyes">
              {/* Eyebrows */}
              {gender === 'male' ? (
                <>
                  <path
                    d="M 100 110 Q 115 105 128 110"
                    stroke="#2D2825"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M 152 110 Q 165 105 180 110"
                    stroke="#2D2825"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    fill="none"
                  />
                </>
              ) : (
                <>
                  <path
                    d="M 102 112 Q 116 106 128 111"
                    stroke="#3B2A22"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M 152 111 Q 164 106 178 112"
                    stroke="#3B2A22"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </>
              )}

              {/* Eye sockets & Eyelids */}
              {isBlinking ? (
                // Closed eyelid during natural blink
                <>
                  <path
                    d="M 104 125 Q 116 128 126 125"
                    stroke="#4A342B"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M 154 125 Q 164 128 176 125"
                    stroke="#4A342B"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </>
              ) : (
                // Open, Intelligent Attentive Eyes
                <>
                  {/* Sclera (Whites of eyes) */}
                  <ellipse cx="115" cy="124" rx="10.5" ry="6.2" fill="#F4F7FB" />
                  <ellipse cx="165" cy="124" rx="10.5" ry="6.2" fill="#F4F7FB" />

                  {/* Iris (Futuristic Deep Hazel / Cyan Catchlight) */}
                  <circle cx="115" cy="124" r="5.2" fill="#2E4057" />
                  <circle cx="165" cy="124" r="5.2" fill="#2E4057" />

                  {/* Pupil */}
                  <circle cx="115" cy="124" r="2.8" fill="#0D1117" />
                  <circle cx="165" cy="124" r="2.8" fill="#0D1117" />

                  {/* Smart Assistant Catchlight */}
                  <circle cx="113.8" cy="122.5" r="1.3" fill="#FFFFFF" />
                  <circle cx="163.8" cy="122.5" r="1.3" fill="#FFFFFF" />
                  <circle
                    cx="116.5"
                    cy="125.5"
                    r="0.8"
                    fill="#7FFFD4"
                    opacity={isSpeaking ? 0.9 : 0.4}
                  />
                  <circle
                    cx="166.5"
                    cy="125.5"
                    r="0.8"
                    fill="#7FFFD4"
                    opacity={isSpeaking ? 0.9 : 0.4}
                  />

                  {/* Eyelash line */}
                  <path
                    d="M 104 123 Q 115 118 126 123"
                    stroke="#2D2825"
                    strokeWidth={gender === 'female' ? '2.2' : '1.5'}
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M 154 123 Q 165 118 176 123"
                    stroke="#2D2825"
                    strokeWidth={gender === 'female' ? '2.2' : '1.5'}
                    strokeLinecap="round"
                    fill="none"
                  />
                </>
              )}
            </g>

            {/* Nose */}
            <g id="nose">
              <path
                d="M 138 128 L 136 148 Q 140 152 144 148 L 142 128"
                stroke="#A87253"
                strokeWidth="1.2"
                strokeLinecap="round"
                fill="none"
                opacity="0.45"
              />
              {/* Soft Nostril shadows */}
              <circle cx="135" cy="149" r="1.4" fill="#6A432F" opacity="0.3" />
              <circle cx="145" cy="149" r="1.4" fill="#6A432F" opacity="0.3" />
            </g>

            {/* REAL-TIME SPEECH-DRIVEN MOUTH (Section Requirement: 5 Smooth States 0-4) */}
            <g id="mouth" transform={`translate(0, ${mouthParams.openY})`}>
              {mouthState === 0 ? (
                // State 0: Completely closed, gentle friendly resting smile
                <g>
                  <path
                    d="M 125 166 Q 140 168.5 155 166"
                    stroke="#8B4D43"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Subtle lower lip shadow */}
                  <path
                    d="M 130 171 Q 140 173 150 171"
                    stroke="#8B4D43"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.3"
                  />
                </g>
              ) : (
                // States 1 - 4: Open mouth synchronized to user / AI audio amplitude
                <g>
                  {/* Inner Mouth Cavity */}
                  <rect
                    x={140 - mouthParams.width / 2}
                    y={166 - mouthParams.height / 2}
                    width={mouthParams.width}
                    height={mouthParams.height}
                    rx={mouthParams.rx}
                    fill="#3F1918"
                    stroke="#7D3B32"
                    strokeWidth="1.5"
                    className="transition-all duration-75"
                  />

                  {/* Teeth Bar (visible when opening) */}
                  {mouthState >= 2 && (
                    <rect
                      x={140 - (mouthParams.width - 8) / 2}
                      y={166 - mouthParams.height / 2 + 1}
                      width={mouthParams.width - 8}
                      height={mouthState >= 3 ? 3.5 : 2}
                      rx="1"
                      fill="#FFFFFF"
                      opacity="0.92"
                    />
                  )}

                  {/* Tongue (visible on wide open) */}
                  {mouthState >= 3 && (
                    <ellipse
                      cx="140"
                      cy={166 + mouthParams.height / 2 - 1.5}
                      rx={mouthParams.width / 3.8}
                      ry={mouthParams.height / 3.8}
                      fill="#C05C54"
                    />
                  )}

                  {/* Upper & Lower Lip Contour */}
                  <path
                    d={`M ${140 - mouthParams.width / 2} 165 Q 140 ${
                      163 - mouthParams.height / 4
                    } ${140 + mouthParams.width / 2} 165`}
                    stroke="#945248"
                    strokeWidth="1.6"
                    fill="none"
                  />
                </g>
              )}
            </g>

            {/* Subtle Futuristic Rim Lighting Highlight */}
            <path
              d="M 90 100 C 90 70 190 70 190 100"
              stroke="url(#cyanRim)"
              strokeWidth="2.5"
              fill="none"
              opacity={isSpeaking ? 0.75 : 0.3}
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
