/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Radio, Settings, ArrowLeft } from 'lucide-react';
import { AuraLifeLogo } from '../brand/AuraLifeLogo';

interface HeaderProps {
  sessionTime: string;
  isLiveMic: boolean;
  isPlayingDemo: boolean;
  onTogglePlayDemo: () => void;
  onStepForwardDemo: () => void;
  onResetDemo: () => void;
  onToggleLiveMic: () => void;
  onCatchMeUp: () => void;
  onOpenMobileDrawer?: () => void;
  onReturnToHero?: () => void;
  onBackToPrevious?: () => void;
  backLabel?: string;
}

export const Header: React.FC<HeaderProps> = ({
  sessionTime,
  isLiveMic,
  isPlayingDemo,
  onTogglePlayDemo,
  onStepForwardDemo,
  onResetDemo,
  onToggleLiveMic,
  onCatchMeUp,
  onOpenMobileDrawer,
  onReturnToHero,
  onBackToPrevious,
  backLabel = 'Back',
}) => {
  return (
    <header className="h-16 border-b border-[#26292F] bg-[#0B0C0E]/95 px-4 sm:px-6 lg:px-8 flex items-center justify-between select-none z-30 shrink-0">
      {/* Left: Back button + AuraLife Wordmark */}
      <div className="flex items-center gap-3">
        {onBackToPrevious && (
          <button
            onClick={onBackToPrevious}
            title={backLabel}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#A3AAB5] hover:text-[#EDEFF2] hover:bg-[#1C1F24] transition-all cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>{backLabel}</span>
          </button>
        )}

        <span className="text-[#26292F]">|</span>

        {/* AuraLife Wordmark returns to AuraLife AI Home */}
        {onReturnToHero && (
          <AuraLifeLogo
            size="sm"
            onClick={onReturnToHero}
          />
        )}
      </div>

      {/* Center: ● LIVE / DEMO + Session Timer */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#141619] border border-[#26292F]">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                isLiveMic ? 'bg-[#EF4B52]' : 'bg-[#5B7FFF]'
              } opacity-75`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isLiveMic ? 'bg-[#EF4B52]' : 'bg-[#5B7FFF]'
              }`}
            />
          </span>
          <span className="text-xs font-bold text-[#EDEFF2] tracking-wider uppercase">
            {isLiveMic ? 'LIVE MIC' : 'DEMO'}
          </span>
          <span className="text-[#26292F] select-none">|</span>
          <span className="text-xs font-mono text-[#EDEFF2] tabular-nums tracking-widest">
            {sessionTime}
          </span>
        </div>
      </div>

      {/* Right: Small connection indicator + Controls/Settings/Avatar */}
      <div className="flex items-center gap-3">
        {/* Toggle Real Mic / Demo mode switch (minimal icon pill) */}
        <button
          onClick={onToggleLiveMic}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
            isLiveMic
              ? 'bg-[#3ECF8E]/10 border-[#3ECF8E]/30 text-[#3ECF8E]'
              : 'bg-[#141619] border-[#26292F] text-[#A3AAB5] hover:text-[#EDEFF2]'
          }`}
          title={isLiveMic ? 'Switching to Demo Playback' : 'Switching to Live Microphone'}
        >
          <Radio className={`w-3 h-3 ${isLiveMic ? 'text-[#3ECF8E] animate-pulse' : 'text-[#A3AAB5]'}`} />
          <span className="hidden sm:inline">{isLiveMic ? 'Mic Live' : 'Demo Script'}</span>
        </button>

        {/* Connection status dot */}
        <div className="flex items-center gap-1.5 px-2 py-1 text-xs text-[#3ECF8E]" title="Connection Healthy">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E]" />
          <span className="text-[11px] text-[#A3AAB5] hidden md:inline">Synced</span>
        </div>

        {/* Minimal Settings Icon */}
        <button
          onClick={() => {}}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5F6773] hover:text-[#A3AAB5] hover:bg-[#141619] transition-colors cursor-pointer"
          title="Session Configuration"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Workspace Avatar */}
        <div className="w-7 h-7 rounded-full bg-[#1C1F24] border border-[#26292F] flex items-center justify-center text-[11px] font-bold text-[#EDEFF2] select-none">
          AL
        </div>
      </div>
    </header>
  );
};
