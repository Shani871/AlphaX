/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';

interface MicButtonProps {
  status: 'listening' | 'muted' | 'error' | 'speaking';
  onClick: () => void;
  disabled?: boolean;
}

export const MicButton: React.FC<MicButtonProps> = ({
  status,
  onClick,
  disabled = false,
}) => {
  const getStyles = () => {
    switch (status) {
      case 'speaking':
        return 'bg-[#3ECF8E] text-[#0B0C0E] shadow-[0_0_20px_rgba(62,207,142,0.35)] ring-4 ring-[#3ECF8E]/20 scale-105';
      case 'listening':
        return 'bg-[#5B7FFF] text-[#0B0C0E] shadow-[0_0_16px_rgba(91,127,255,0.3)] hover:bg-[#7292FF] active:scale-95';
      case 'muted':
        return 'bg-[#1C1F24] text-[#A3AAB5] border border-[#26292F] hover:text-[#EDEFF2] hover:border-[#383C44]';
      case 'error':
        return 'bg-[#EF4B52] text-[#0B0C0E] shadow-[0_0_16px_rgba(239,75,82,0.4)]';
      default:
        return 'bg-[#1C1F24] text-[#EDEFF2]';
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={
        status === 'muted'
          ? 'Unmute microphone'
          : status === 'error'
          ? 'Microphone error - tap to retry'
          : 'Mute microphone'
      }
      className={`relative w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${getStyles()} ${
        disabled ? 'opacity-40 cursor-not-allowed' : ''
      }`}
    >
      {status === 'error' ? (
        <AlertCircle className="w-5 h-5 animate-pulse" />
      ) : status === 'muted' ? (
        <MicOff className="w-5 h-5" />
      ) : (
        <Mic className="w-5 h-5" />
      )}

      {/* Ripple ring for active voice states */}
      {(status === 'speaking' || status === 'listening') && (
        <span
          className={`absolute inset-0 rounded-full animate-ping opacity-25 pointer-events-none ${
            status === 'speaking' ? 'bg-[#3ECF8E]' : 'bg-[#5B7FFF]'
          }`}
          style={{ animationDuration: '2s' }}
        />
      )}
    </button>
  );
};
