/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Mic,
  FileText,
  Radio,
  Settings,
  Plus,
  Play,
  Users,
  ArrowLeft,
  Globe2
} from 'lucide-react';
import { HumanAIAvatar } from '../avatar/HumanAIAvatar';
import { AuraLifeLogo } from '../brand/AuraLifeLogo';
import { GeminiLiveView } from '../features/GeminiLiveView';
import { TranslateView } from '../features/TranslateView';

interface AssistantHomeScreenProps {
  onStartSession: (mode: 'demo' | 'live') => void;
  onReturnToLanding: () => void;
  initialFeature?: 'home' | 'gemini_live' | 'transcript_select' | 'translate';
}

export const AssistantHomeScreen: React.FC<AssistantHomeScreenProps> = ({
  onStartSession,
  onReturnToLanding,
  initialFeature = 'home',
}) => {
  const [activeFeature, setActiveFeature] = useState<'home' | 'gemini_live' | 'transcript_select' | 'translate'>(
    initialFeature
  );
  const [promptText, setPromptText] = useState('');

  // Synchronize when initialFeature prop changes (e.g. returning from transcript demo/live)
  useEffect(() => {
    if (initialFeature) {
      setActiveFeature(initialFeature);
    }
  }, [initialFeature]);

  // Intelligent Back navigation handling per Section 6, 7, 9, 21 & 22
  const handleBackNavigation = () => {
    if (activeFeature === 'transcript_select' || activeFeature === 'gemini_live' || activeFeature === 'translate') {
      // From any feature or feature selection -> Return to AuraLife AI Home
      setActiveFeature('home');
    } else {
      // From AuraLife AI Home -> Return to Landing Page
      onReturnToLanding();
    }
  };

  // Handle prompt submit from main input
  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) return;
    setActiveFeature('gemini_live');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B0C0E] text-[#EDEFF2] select-none">
      {/* 1. LEFT SIDEBAR: Permanent top-left Back button always visible with exact required hierarchy (Section 3, 4, 5, 13, 15) */}
      <aside className="w-60 lg:w-64 bg-[#141619] border-r border-[#26292F] flex flex-col justify-between p-4 shrink-0">
        <div className="space-y-4">
          {/* Top Permanent Back Button (Located directly above AuraLife logo/wordmark per Section 3 & 4) */}
          <div className="pb-1">
            <button
              onClick={handleBackNavigation}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#A3AAB5] hover:text-[#EDEFF2] hover:bg-[#1C1F24] transition-all duration-150 cursor-pointer group"
              title={activeFeature === 'home' ? 'Back to Landing Page' : 'Back to AuraLife AI Home'}
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back</span>
            </button>
          </div>

          {/* Official Product Name & Logo: AuraLife (Section 1 & 15) */}
          <div className="flex items-center justify-between px-2 pt-1 border-t border-[#26292F]/50">
            <AuraLifeLogo
              size="sm"
              onClick={() => setActiveFeature('home')}
            />
          </div>

          {/* New Chat action */}
          <button
            onClick={() => setActiveFeature('gemini_live')}
            className="w-full py-2 px-3 rounded-lg bg-[#1C1F24] hover:bg-[#26292F] border border-[#26292F] text-xs font-semibold text-[#EDEFF2] flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#5B7FFF]" />
            <span>New Conversation</span>
          </button>

          {/* Features Navigation List with active state indicators (Section 13) */}
          <div className="space-y-1 pt-2">
            <div className="text-[10px] font-bold text-[#5F6773] tracking-widest uppercase px-2 mb-2">
              FEATURES
            </div>

            {/* Gemini Live */}
            <button
              onClick={() => setActiveFeature('gemini_live')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFeature === 'gemini_live'
                  ? 'bg-[#5B7FFF]/15 text-[#5B7FFF] border border-[#5B7FFF]/30'
                  : 'text-[#A3AAB5] hover:text-[#EDEFF2] hover:bg-[#1C1F24]'
              }`}
            >
              <Radio className="w-4 h-4 text-[#5B7FFF]" />
              <span>Gemini Live</span>
            </button>

            {/* Transcript */}
            <button
              onClick={() => setActiveFeature('transcript_select')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFeature === 'transcript_select'
                  ? 'bg-[#3ECF8E]/15 text-[#3ECF8E] border border-[#3ECF8E]/30'
                  : 'text-[#A3AAB5] hover:text-[#EDEFF2] hover:bg-[#1C1F24]'
              }`}
            >
              <FileText className="w-4 h-4 text-[#3ECF8E]" />
              <span>Transcript</span>
            </button>

            {/* Translate */}
            <button
              onClick={() => setActiveFeature('translate')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFeature === 'translate'
                  ? 'bg-[#E3A54A]/15 text-[#E3A54A] border border-[#E3A54A]/30'
                  : 'text-[#A3AAB5] hover:text-[#EDEFF2] hover:bg-[#1C1F24]'
              }`}
            >
              <Globe2 className="w-4 h-4 text-[#E3A54A]" />
              <span>Translate</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer: Settings */}
        <div className="pt-3 border-t border-[#26292F]">
          <button
            onClick={() => {}}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#5F6773] hover:text-[#A3AAB5] hover:bg-[#1C1F24] transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA: Centered relative to this area (Section 4 & 19) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {activeFeature === 'gemini_live' ? (
          <GeminiLiveView onBackToHome={() => setActiveFeature('home')} />
        ) : activeFeature === 'translate' ? (
          <TranslateView onBackToHome={() => setActiveFeature('home')} />
        ) : (
          <main className="flex-1 flex flex-col justify-between items-center p-6 md:p-10 relative overflow-y-auto w-full">
            {/* Top subtle notification */}
            <div className="w-full flex items-center justify-between text-xs text-[#5F6773] shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E]" />
                <span>AuraLife AI Assistant Ready</span>
              </div>

              <button
                onClick={handleBackNavigation}
                className="flex items-center gap-1.5 text-[#5F6773] hover:text-[#EDEFF2] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{activeFeature === 'transcript_select' ? 'Back' : 'Back to Landing'}</span>
              </button>
            </div>

            {/* Center Stage: Human AI Avatar -> Greeting -> Microphone (Section 20) */}
            <div className="flex-1 flex flex-col items-center justify-center max-w-xl w-full my-auto text-center space-y-6">
              {/* Human AI Avatar (Prominently Centered, No Cards, No Galaxy) */}
              <div className="flex items-center justify-center pt-2">
                <HumanAIAvatar
                  state="idle"
                  size="responsive"
                  amplitude={0.15}
                />
              </div>

              {/* Large Elegant Greeting */}
              <div className="space-y-2 pt-1">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#EDEFF2]">
                  What can I help you with?
                </h1>
                <p className="text-xs sm:text-sm text-[#5F6773] font-normal">
                  Voice-first real-time intelligence. Speak or choose an action below.
                </p>
              </div>

              {/* Transcript Selection Dialog if user clicked "Transcript" in sidebar (Section 9, 12, 13) */}
              {activeFeature === 'transcript_select' ? (
                <div className="p-5 rounded-2xl bg-[#141619] border border-[#26292F] shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                  <div className="text-xs font-bold text-[#EDEFF2] uppercase tracking-wider mb-1">
                    Choose Transcript Experience
                  </div>
                  <p className="text-xs text-[#5F6773] mb-4">
                    Select between a simulated showcase or live microphone capture room.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {/* [ Demo ] */}
                    <button
                      onClick={() => onStartSession('demo')}
                      className="p-3.5 rounded-xl bg-[#1C1F24] hover:bg-[#26292F] border border-[#26292F] hover:border-[#5B7FFF]/40 text-left transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Play className="w-4 h-4 text-[#5B7FFF]" />
                        <span className="text-[10px] font-bold text-[#5B7FFF] bg-[#5B7FFF]/10 px-1.5 py-0.5 rounded">
                          Demo
                        </span>
                      </div>
                      <div className="text-xs font-bold text-[#EDEFF2] group-hover:text-white">
                        Simulated Meeting
                      </div>
                      <div className="text-[11px] text-[#5F6773] mt-1 leading-snug">
                        Speaker 1, 2 & 3 with task extraction & decisions.
                      </div>
                    </button>

                    {/* [ Live ] */}
                    <button
                      onClick={() => onStartSession('live')}
                      className="p-3.5 rounded-xl bg-[#1C1F24] hover:bg-[#26292F] border border-[#26292F] hover:border-[#3ECF8E]/40 text-left transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Users className="w-4 h-4 text-[#3ECF8E]" />
                        <span className="text-[10px] font-bold text-[#3ECF8E] bg-[#3ECF8E]/10 px-1.5 py-0.5 rounded">
                          Live
                        </span>
                      </div>
                      <div className="text-xs font-bold text-[#EDEFF2] group-hover:text-white">
                        Live Room
                      </div>
                      <div className="text-[11px] text-[#5F6773] mt-1 leading-snug">
                        Real mic capture with diarization & intelligence.
                      </div>
                    </button>
                  </div>

                  <button
                    onClick={() => setActiveFeature('home')}
                    className="mt-3 text-xs text-[#5F6773] hover:text-[#A3AAB5] underline cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                /* Elevated Microphone Hero Button below greeting */
                <div className="flex flex-col items-center gap-2 pt-1">
                  <button
                    onClick={() => setActiveFeature('gemini_live')}
                    className="w-14 h-14 rounded-full bg-[#5B7FFF] hover:bg-[#7292FF] text-[#0B0C0E] flex items-center justify-center transition-all shadow-[0_0_24px_rgba(91,127,255,0.4)] cursor-pointer active:scale-95"
                    title="Speak to AuraLife (Gemini Live)"
                  >
                    <Mic className="w-6 h-6" />
                  </button>
                  <span className="text-[11px] text-[#5F6773] font-medium">
                    Tap to speak
                  </span>
                </div>
              )}
            </div>

            {/* Voice + Text Input Bar */}
            <div className="w-full max-w-xl shrink-0">
              <form
                onSubmit={handlePromptSubmit}
                className="flex items-center bg-[#141619] border border-[#26292F] rounded-2xl px-4 py-2.5 shadow-lg focus-within:border-[#5B7FFF]/50 transition-colors"
              >
                <input
                  type="text"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Ask AuraLife anything..."
                  className="flex-1 bg-transparent text-xs sm:text-sm text-[#EDEFF2] placeholder-[#5F6773] outline-none pr-3"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveFeature('gemini_live')}
                    className="p-1.5 text-[#5B7FFF] hover:text-[#7292FF] transition-colors cursor-pointer"
                    title="Start Voice Session"
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  <button
                    type="submit"
                    disabled={!promptText.trim()}
                    className="px-3 py-1 rounded-lg bg-[#5B7FFF] disabled:opacity-20 text-[#0B0C0E] font-semibold text-xs transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </main>
        )}
      </div>
    </div>
  );
};
