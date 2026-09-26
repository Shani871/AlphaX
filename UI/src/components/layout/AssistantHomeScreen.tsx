/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Mic,
  Radio,
  Settings,
  Plus,
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
  initialFeature?: 'home' | 'gemini_live' | 'translate';
}

export const AssistantHomeScreen: React.FC<AssistantHomeScreenProps> = ({
  onStartSession,
  onReturnToLanding,
  initialFeature = 'home',
}) => {
  const [activeFeature, setActiveFeature] = useState<'home' | 'gemini_live' | 'translate'>(
    initialFeature === 'home' || initialFeature === 'gemini_live' || initialFeature === 'translate' ? initialFeature : 'home'
  );
  const [promptText, setPromptText] = useState('');

  useEffect(() => {
    if (initialFeature === 'home' || initialFeature === 'gemini_live' || initialFeature === 'translate') {
      setActiveFeature(initialFeature);
    }
  }, [initialFeature]);

  const handleBackNavigation = () => {
    if (activeFeature === 'gemini_live' || activeFeature === 'translate') {
      setActiveFeature('home');
    } else {
      onReturnToLanding();
    }
  };

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) return;
    setActiveFeature('gemini_live');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#000000] text-[#EDEFF2] select-none">
      {/* 1. LEFT SIDEBAR */}
      <aside className="w-60 lg:w-64 bg-[#000000] border-r border-[#26292F] flex flex-col justify-between p-4 shrink-0">
        <div className="space-y-4">
          {/* Top Permanent Back Button */}
          <div className="pb-1">
            <button
              onClick={handleBackNavigation}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#A3AAB5] hover:text-[#EDEFF2] hover:bg-[#0A0A0A] transition-all duration-150 cursor-pointer group"
              title={activeFeature === 'home' ? 'Back to Landing Page' : 'Back to AuraLife AI Home'}
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back</span>
            </button>
          </div>

          {/* Official Product Name & Logo: AuraLife */}
          <div className="flex items-center justify-between px-2 pt-1 border-t border-[#26292F]/50">
            <AuraLifeLogo
              size="sm"
              onClick={() => setActiveFeature('home')}
            />
          </div>

          {/* New Conversation action */}
          <button
            onClick={() => setActiveFeature('gemini_live')}
            className="w-full py-2 px-3 rounded-lg bg-[#050505] hover:bg-[#0A0A0A] border border-[#26292F] text-xs font-semibold text-[#EDEFF2] flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#7FFFD4]" />
            <span>New Conversation</span>
          </button>

          {/* Features Navigation List */}
          <div className="space-y-1 pt-2">
            <div className="text-[10px] font-bold text-[#5F6773] tracking-widest uppercase px-2 mb-2">
              FEATURES
            </div>

            {/* 1. Gemini Live */}
            <button
              onClick={() => setActiveFeature('gemini_live')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFeature === 'gemini_live'
                  ? 'bg-[#7FFFD4]/15 text-[#7FFFD4] border border-[#7FFFD4]/30'
                  : 'text-[#A3AAB5] hover:text-[#EDEFF2] hover:bg-[#0A0A0A]'
              }`}
            >
              <Radio className="w-4 h-4 text-[#7FFFD4]" />
              <span>Gemini Live</span>
            </button>

            {/* 2. Translate */}
            <button
              onClick={() => setActiveFeature('translate')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFeature === 'translate'
                  ? 'bg-[#E3A54A]/15 text-[#E3A54A] border border-[#E3A54A]/30'
                  : 'text-[#A3AAB5] hover:text-[#EDEFF2] hover:bg-[#0A0A0A]'
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
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#5F6773] hover:text-[#A3AAB5] hover:bg-[#0A0A0A] transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
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
                <span>Back to Landing</span>
              </button>
            </div>

            {/* Center Stage: Cute Robot Avatar -> Greeting -> Microphone */}
            <div className="flex-1 flex flex-col items-center justify-center max-w-xl w-full my-auto text-center space-y-6">
              <div className="flex items-center justify-center pt-2">
                <HumanAIAvatar
                  state="idle"
                  size="responsive"
                  amplitude={0.15}
                />
              </div>

              <div className="space-y-2 pt-1">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#EDEFF2]">
                  What can I help you with?
                </h1>
                <p className="text-xs sm:text-sm text-[#5F6773] font-normal">
                  Voice-first real-time intelligence. Speak or choose an action below.
                </p>
              </div>

              {/* Elevated Microphone Hero Button */}
              <div className="flex flex-col items-center gap-2 pt-1">
                <button
                  onClick={() => setActiveFeature('gemini_live')}
                  className="w-14 h-14 rounded-full bg-[#7FFFD4] hover:bg-[#7292FF] text-[#000000] flex items-center justify-center transition-all shadow-[0_0_24px_rgba(91,127,255,0.4)] cursor-pointer active:scale-95"
                  title="Speak to AuraLife (Gemini Live)"
                >
                  <Mic className="w-6 h-6" />
                </button>
                <span className="text-[11px] text-[#5F6773] font-medium">
                  Tap to speak
                </span>
              </div>
            </div>

            {/* Voice + Text Input Bar */}
            <div className="w-full max-w-xl shrink-0">
              <form
                onSubmit={handlePromptSubmit}
                className="flex items-center bg-[#050505] border border-[#26292F] rounded-2xl px-4 py-2.5 shadow-lg focus-within:border-[#7FFFD4]/50 transition-colors"
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
                    className="p-1.5 text-[#7FFFD4] hover:text-[#7292FF] transition-colors cursor-pointer"
                    title="Start Voice Session"
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  <button
                    type="submit"
                    disabled={!promptText.trim()}
                    className="px-3 py-1 rounded-lg bg-[#7FFFD4] disabled:opacity-20 text-[#000000] font-semibold text-xs transition-all cursor-pointer disabled:cursor-not-allowed"
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
