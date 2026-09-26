/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MicButton } from './MicButton';
import { Button } from '../common/Button';
import { Sparkles, PhoneOff, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface AudioLevels {
  bass: number;
  mid: number;
  treble: number;
}

interface AudioStatusBarProps {
  status: 'listening' | 'muted' | 'error' | 'speaking' | 'reconnecting';
  statusLabel: string;
  statusSublabel: string;
  audioLevels: AudioLevels;
  isMuted: boolean;
  onToggleMute: () => void;
  onCatchMeUp: () => void;
  onEndSession: () => void;
  onRetryConnection?: () => void;
}

export const AudioStatusBar: React.FC<AudioStatusBarProps> = ({
  status,
  statusLabel,
  audioLevels,
  isMuted,
  onToggleMute,
  onCatchMeUp,
  onEndSession,
  onRetryConnection,
}) => {
  const avgLevel = isMuted ? 0 : ((audioLevels.bass || 0) + (audioLevels.mid || 0) + (audioLevels.treble || 0)) / 3;
  const barHeights = isMuted
    ? [4, 4, 4, 4, 4, 4, 4]
    : [
        Math.max(4, Math.min(18, (audioLevels.bass || 0) * 18 + 2)),
        Math.max(4, Math.min(22, (audioLevels.bass || 0) * 22 + 3)),
        Math.max(4, Math.min(24, (audioLevels.mid || 0) * 24 + 2)),
        Math.max(4, Math.min(26, avgLevel * 26 + 3)),
        Math.max(4, Math.min(20, (audioLevels.mid || 0) * 20 + 2)),
        Math.max(4, Math.min(16, (audioLevels.treble || 0) * 16 + 2)),
        Math.max(4, Math.min(12, (audioLevels.treble || 0) * 12 + 1)),
      ];

  const getMeterColor = () => {
    if (status === 'error') return 'bg-[#EF4B52]';
    if (status === 'speaking') return 'bg-[#3ECF8E]';
    if (isMuted) return 'bg-[#5F6773]';
    return 'bg-[#7FFFD4]';
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-20 bg-[#000000]/95 backdrop-blur-md border-t border-[#26292F] px-6 lg:px-8 flex items-center justify-between z-30 select-none pb-[env(safe-area-inset-bottom)]">
      {/* Left: ● State Indicator */}
      <div className="flex items-center gap-3 min-w-[160px]">
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            status === 'error'
              ? 'bg-[#EF4B52]'
              : status === 'speaking'
              ? 'bg-[#3ECF8E] animate-pulse'
              : isMuted
              ? 'bg-[#5F6773]'
              : 'bg-[#7FFFD4]'
          }`}
        />
        <span className="text-xs font-semibold text-[#A3AAB5]">
          {isMuted ? 'Muted' : statusLabel}
        </span>

        {status === 'error' && onRetryConnection && (
          <Button
            size="sm"
            variant="danger"
            onClick={onRetryConnection}
            icon={<RotateCcw className="w-3 h-3" />}
          >
            Retry
          </Button>
        )}
      </div>

      {/* Center: Waveform + Central Mic Button + Mute Button */}
      <div className="flex items-center gap-6">
        {/* Subtle Waveform */}
        <div className="hidden sm:flex items-center gap-1 h-6 px-1" title="Voice Activity">
          {barHeights.map((h, i) => (
            <div
              key={i}
              className={`w-0.5 rounded-full transition-all duration-75 ${getMeterColor()}`}
              style={{ height: `${h}px` }}
            />
          ))}
        </div>

        {/* Central Circular Mic Control (Hero button of the dock) */}
        <MicButton
          status={status === 'error' ? 'error' : isMuted ? 'muted' : status === 'speaking' ? 'speaking' : 'listening'}
          onClick={onToggleMute}
        />

        {/* Mute action toggle */}
        <button
          onClick={onToggleMute}
          className="text-xs font-semibold text-[#A3AAB5] hover:text-[#EDEFF2] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-[#EF4B52]" /> : <Volume2 className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>
      </div>

      {/* Right: Secondary Actions (Catch Up & End Session) */}
      <div className="flex items-center gap-3 min-w-[160px] justify-end">
        <Button
          size="md"
          variant="secondary"
          onClick={onCatchMeUp}
          icon={<Sparkles className="w-3.5 h-3.5 text-[#7FFFD4]" />}
          className="border-[#26292F] hover:border-[#7FFFD4]/40 text-[#EDEFF2] text-xs"
        >
          Catch Up
        </Button>

        <Button
          size="md"
          variant="danger"
          onClick={onEndSession}
          icon={<PhoneOff className="w-3.5 h-3.5" />}
          className="text-xs"
        >
          End
        </Button>
      </div>
    </footer>
  );
};
