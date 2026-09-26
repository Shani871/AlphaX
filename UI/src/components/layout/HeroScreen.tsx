/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuraCore } from '../three/AuraCore';
import { Button } from '../common/Button';
import { AuraLifeLogo } from '../brand/AuraLifeLogo';
import { Sparkles, ArrowRight, RotateCcw, Volume2, ShieldCheck, Zap, Menu, X } from 'lucide-react';

interface HeroScreenProps {
  onEnterWorkspace: () => void;
}

export const HeroScreen: React.FC<HeroScreenProps> = ({ onEnterWorkspace }) => {
  const [coreRestartKey, setCoreRestartKey] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleRestartCore = () => {
    setCoreRestartKey((prev) => prev + 1);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#000000] text-[#EDEFF2] flex flex-col overflow-hidden select-none">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-[#050505]/90 backdrop-blur-md border-b border-[#26292F] px-4 md:px-8 flex items-center justify-between z-40">
        {/* Left: AuraLife Logo */}
        <AuraLifeLogo
          size="md"
          onClick={onEnterWorkspace}
        />

        {/* Center-right nav links (Desktop) */}
        <div className="hidden md:flex items-center gap-7 text-xs font-semibold text-[#A3AAB5]">
          <a
            href="#product"
            onClick={(e) => {
              e.preventDefault();
              onEnterWorkspace();
            }}
            className="hover:text-[#EDEFF2] transition-colors"
          >
            Product
          </a>
          <a
            href="#how-it-works"
            onClick={(e) => {
              e.preventDefault();
              onEnterWorkspace();
            }}
            className="hover:text-[#EDEFF2] transition-colors"
          >
            How it works
          </a>
          <a
            href="#live-demo"
            onClick={(e) => {
              e.preventDefault();
              onEnterWorkspace();
            }}
            className="text-[#7FFFD4] hover:text-[#7292FF] transition-colors flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#7FFFD4] animate-pulse" />
            Live Demo
          </a>
          <a
            href="#intelligence"
            onClick={(e) => {
              e.preventDefault();
              onEnterWorkspace();
            }}
            className="hover:text-[#EDEFF2] transition-colors"
          >
            Intelligence
          </a>
        </div>

        {/* Far Right: Log in + Pill CTA (Desktop) */}
        <div className="hidden sm:flex items-center gap-3">
          <Button
            size="md"
            variant="ghost"
            onClick={onEnterWorkspace}
            className="text-xs font-semibold text-[#A3AAB5] hover:text-[#EDEFF2]"
          >
            Log in
          </Button>

          <button
            onClick={onEnterWorkspace}
            className="px-5 py-2 text-xs font-bold rounded-full bg-[#7FFFD4] text-[#000000] hover:bg-[#7292FF] active:scale-95 shadow-[0_0_20px_rgba(91,127,255,0.35)] transition-all cursor-pointer flex items-center gap-2"
          >
            <span>Try AuraLife</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen((p) => !p)}
            className="p-2 rounded-lg bg-[#0A0A0A] border border-[#26292F] text-[#EDEFF2]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-16 bg-[#050505] border-b border-[#26292F] p-4 flex flex-col gap-3 z-30 sm:hidden">
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onEnterWorkspace();
            }}
            className="text-left py-2 px-3 rounded-lg text-sm font-semibold text-[#EDEFF2] hover:bg-[#0A0A0A]"
          >
            Live Demo
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onEnterWorkspace();
            }}
            className="text-left py-2 px-3 rounded-lg text-sm font-semibold text-[#A3AAB5] hover:bg-[#0A0A0A]"
          >
            How it works
          </button>
          <div className="pt-2 border-t border-[#26292F] flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onEnterWorkspace();
              }}
              className="w-full py-2.5 rounded-full bg-[#7FFFD4] text-[#000000] font-bold text-xs flex items-center justify-center gap-2"
            >
              <span>Try AuraLife</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Hero Body */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pt-20 pb-16 min-h-[calc(100vh-4rem)]">
        {/* Aura Core (3D Background Visualization) */}
        <div
          key={coreRestartKey}
          className="absolute inset-0 z-0 pointer-events-auto opacity-75 sm:opacity-85"
        >
          <AuraCore
            state="IDLE"
            audioLevels={{ bass: 0.1, mid: 0.1, treble: 0.1 }}
            isHeroMode
          />
        </div>

        {/* Subtle radial vignette gradient behind headline to preserve 3D while ensuring 100% typography contrast */}
        <div className="absolute inset-0 bg-radial from-transparent via-[#000000]/40 to-[#000000]/90 pointer-events-none z-1" />

        {/* Hero Content Stack */}
        <div className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center space-y-6">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#050505]/90 border border-[#7FFFD4]/30 text-xs font-semibold text-[#7FFFD4] shadow-[0_0_20px_rgba(91,127,255,0.15)]">
            <span className="w-2 h-2 rounded-full bg-[#3ECF8E] animate-pulse" />
            <span>Real-Time Voice Intelligence Workspace</span>
          </div>

          {/* Large Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#EDEFF2] leading-[1.12]">
            AuraLife turns{' '}
            <span className="bg-gradient-to-r from-[#EDEFF2] via-[#7FFFD4] to-[#3ECF8E] bg-clip-text text-transparent">
              conversations
            </span>{' '}
            into action.
          </h1>

          {/* Tagline & Core Interaction Loop */}
          <p className="text-sm sm:text-base md:text-lg text-[#A3AAB5] max-w-xl font-normal leading-relaxed">
            Listen to multi-speaker discussions with live transcription, instant cross-lingual translation, automatic decision tracking, task extraction, and spoken catch-up recaps.
          </p>

          {/* Interaction Loop Chain */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#050505]/80 border border-[#26292F] text-[11px] font-mono text-[#EDEFF2]">
            <span className="text-[#3ECF8E] font-bold">LIVE AUDIO</span>
            <span className="text-[#5F6773]">→</span>
            <span className="text-[#7FFFD4] font-bold">UNDERSTANDING</span>
            <span className="text-[#5F6773]">→</span>
            <span className="text-[#E3A54A] font-bold">INTELLIGENCE</span>
            <span className="text-[#5F6773]">→</span>
            <span className="text-[#EDEFF2] font-bold">ACTION</span>
          </div>

          {/* Primary CTA */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={onEnterWorkspace}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#7FFFD4] text-[#000000] hover:bg-[#7292FF] active:scale-95 text-sm font-bold shadow-[0_0_30px_rgba(91,127,255,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2.5 min-h-[44px]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Enter Live Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onEnterWorkspace}
              className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-[#0A0A0A] hover:bg-[#26292F] border border-[#26292F] text-xs font-semibold text-[#EDEFF2] transition-colors cursor-pointer min-h-[44px]"
            >
              View 2-Minute Demo
            </button>
          </div>

          {/* Feature Highlights Minimalist Badges */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left w-full max-w-2xl">
            <div className="p-3 rounded-lg bg-[#050505]/85 border border-[#26292F]">
              <Volume2 className="w-4 h-4 text-[#3ECF8E] mb-1.5" />
              <div className="text-xs font-bold text-[#EDEFF2]">Multi-Speaker</div>
              <div className="text-[11px] text-[#5F6773]">Real-time diarization</div>
            </div>

            <div className="p-3 rounded-lg bg-[#050505]/85 border border-[#26292F]">
              <Sparkles className="w-4 h-4 text-[#7FFFD4] mb-1.5" />
              <div className="text-xs font-bold text-[#EDEFF2]">Live Translation</div>
              <div className="text-[11px] text-[#5F6773]">English + Hindi stream</div>
            </div>

            <div className="p-3 rounded-lg bg-[#050505]/85 border border-[#26292F]">
              <Zap className="w-4 h-4 text-[#E3A54A] mb-1.5" />
              <div className="text-xs font-bold text-[#EDEFF2]">Auto Tasks</div>
              <div className="text-[11px] text-[#5F6773]">Owner + deadline sync</div>
            </div>

            <div className="p-3 rounded-lg bg-[#050505]/85 border border-[#26292F]">
              <ShieldCheck className="w-4 h-4 text-[#3ECF8E] mb-1.5" />
              <div className="text-xs font-bold text-[#EDEFF2]">Catch Me Up</div>
              <div className="text-[11px] text-[#5F6773]">Spoken executive audio</div>
            </div>
          </div>
        </div>

        {/* Small circular replay affordance in bottom-right corner (Section 7) */}
        <div className="absolute bottom-5 right-5 z-20">
          <button
            onClick={handleRestartCore}
            title="Replay / restart Aura Core animation"
            className="w-10 h-10 rounded-full bg-[#050505]/90 border border-[#26292F] hover:border-[#7FFFD4] text-[#A3AAB5] hover:text-[#EDEFF2] flex items-center justify-center transition-all shadow-lg active:scale-90 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
