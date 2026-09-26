/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { HumanAIAvatar, AvatarState } from '../avatar/HumanAIAvatar';
import { Mic, MicOff, Send, ArrowLeft } from 'lucide-react';
import { CoreState } from '../../mock/mockSession';
import { LeaveSessionModal } from '../common/LeaveSessionModal';
import { useVoiceBridge } from '../../hooks/useVoiceBridge';

interface GeminiLiveViewProps {
  onBackToHome: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const GeminiLiveView: React.FC<GeminiLiveViewProps> = ({ onBackToHome }) => {
  const [coreState, setCoreState] = useState<CoreState>('LISTENING');
  const [isMicActive, setIsMicActive] = useState(true);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: "Hello! I'm AuraLife. I'm listening—feel free to speak or ask me anything.",
      timestamp: 'Just now',
    },
  ]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    isConnected,
    levels,
    transcripts,
    isBargeIn,
    toggleMic: sendToggleMic,
    interrupt: sendInterrupt,
    sendText
  } = useVoiceBridge();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isBargeIn) {
      setCoreState('AI_INTERRUPTED');
      setTimeout(() => setCoreState('LISTENING'), 1500);
    } else if (levels.isAiSpeaking) {
      setCoreState('AI_SPEAKING');
    } else if (levels.micLevel > 0.05) {
      setCoreState('USER_SPEAKING');
    } else {
      setCoreState('LISTENING');
    }
  }, [levels, isBargeIn]);

  const processedTranscriptsCount = useRef(0);

  useEffect(() => {
    if (transcripts.length > processedTranscriptsCount.current) {
      const newTranscripts = transcripts.slice(processedTranscriptsCount.current);
      processedTranscriptsCount.current = transcripts.length;
      
      const newMessages = newTranscripts.map((t, idx) => ({
        id: `t-${Date.now()}-${idx}`,
        sender: (t.speaker.toLowerCase().includes('user') || t.speaker.toLowerCase().includes('speaker')) ? 'user' : 'ai',
        text: t.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));

      setMessages(prev => [...prev, ...newMessages as Message[]]);
    }
  }, [transcripts]);

  const audioLevel = levels.isAiSpeaking ? levels.aiLevel : Math.max(0.04, levels.micLevel);

  // Handle user requesting back
  const handleBackRequest = () => {
    // If active conversation (user or AI speaking or user interacted), ask confirmation per Section 17 & 22
    const hasActiveSession = isMicActive && (coreState === 'USER_SPEAKING' || coreState === 'AI_SPEAKING' || messages.length > 2);
    if (hasActiveSession) {
      setShowLeaveModal(true);
    } else {
      performExit();
    }
  };

  const performExit = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsMicActive(false);
    onBackToHome();
  };

  // Handle user sending an utterance/prompt
  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: 'Now',
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    sendText(text);
  };

  const handleInterrupt = () => {
    sendInterrupt();
    setCoreState('AI_INTERRUPTED');
  };

  const toggleMic = () => {
    const nextState = !isMicActive;
    setIsMicActive(nextState);
    sendToggleMic(nextState);
    if (!nextState) {
      setCoreState('IDLE');
    } else {
      setCoreState('LISTENING');
    }
  };

  const getStateBadge = () => {
    switch (coreState) {
      case 'USER_SPEAKING':
        return { label: 'User Speaking', dot: 'bg-[#3ECF8E] animate-pulse', text: 'text-[#3ECF8E]' };
      case 'AI_SPEAKING':
        return { label: 'AI Speaking', dot: 'bg-[#7FFFD4] animate-pulse', text: 'text-[#7FFFD4]' };
      case 'AI_INTERRUPTED':
        return { label: 'Interrupted', dot: 'bg-[#EF4B52]', text: 'text-[#EF4B52]' };
      case 'TRANSLATING':
        return { label: 'Translating', dot: 'bg-[#E3A54A] animate-pulse', text: 'text-[#E3A54A]' };
      case 'IDLE':
        return { label: 'Paused', dot: 'bg-[#5F6773]', text: 'text-[#5F6773]' };
      default:
        return { label: 'Listening', dot: 'bg-[#7FFFD4]', text: 'text-[#7FFFD4]' };
    }
  };

  const badge = getStateBadge();

  return (
    <div className="flex flex-col h-full w-full bg-[#000000] text-[#EDEFF2] select-none">
      {/* Top Header bar with persistent Back navigation */}
      <div className="h-14 border-b border-[#26292F] px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {/* Back button */}
          <button
            onClick={handleBackRequest}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#A3AAB5] hover:text-[#EDEFF2] hover:bg-[#0A0A0A] transition-all cursor-pointer"
            title="Back to AuraLife AI Home"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <span className="text-[#26292F]">|</span>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#7FFFD4]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#EDEFF2]">
              Gemini Live · 1-on-1 Voice
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#050505] border border-[#26292F] text-xs font-medium">
            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
            <span className={badge.text}>{badge.label}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area: Centered Avatar + Audio Wave + Live Transcript */}
      <div className="flex-1 flex flex-col items-center justify-between p-6 max-w-2xl mx-auto w-full overflow-hidden">
        {/* Upper: Interactive Human Avatar */}
        <div className="w-full flex flex-col items-center pt-1 shrink-0">
          <HumanAIAvatar
            state={
              coreState === 'USER_SPEAKING'
                ? 'listening'
                : coreState === 'AI_SPEAKING'
                ? 'speaking'
                : coreState === 'AI_INTERRUPTED'
                ? 'thinking'
                : 'idle'
            }
            size="md"
            amplitude={audioLevel}
          />

          {/* State & Interruption affordance */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-medium text-[#A3AAB5]">
              {coreState === 'AI_SPEAKING' ? 'AuraLife is speaking...' : coreState === 'USER_SPEAKING' ? 'Listening to you...' : 'Listening... speak anytime'}
            </span>
            {coreState === 'AI_SPEAKING' && (
              <button
                onClick={handleInterrupt}
                className="text-[10px] font-bold text-[#EF4B52] bg-[#EF4B52]/10 hover:bg-[#EF4B52]/20 px-2 py-0.5 rounded border border-[#EF4B52]/30 transition-colors cursor-pointer"
              >
                Interrupt AI
              </button>
            )}
          </div>
        </div>

        {/* Middle: Transcript Dialogue (Human <-> AI only) */}
        <div className="flex-1 w-full my-4 overflow-y-auto pr-2 space-y-3 min-h-[140px] max-h-[260px] border-t border-b border-[#26292F]/50 py-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="text-[10px] font-mono text-[#5F6773] mb-0.5 px-1">
                {m.sender === 'user' ? 'You' : 'AuraLife'} · {m.timestamp}
              </div>
              <div
                className={`max-w-[85%] px-3.5 py-2 rounded-xl text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-[#7FFFD4] text-[#000000] font-medium rounded-tr-none'
                    : 'bg-[#050505] border border-[#26292F] text-[#EDEFF2] rounded-tl-none'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Lower: Microphone Button + Prompt bar */}
        <div className="w-full shrink-0 space-y-3">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={toggleMic}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg cursor-pointer ${
                isMicActive
                  ? 'bg-[#7FFFD4] hover:bg-[#7292FF] text-[#000000] ring-4 ring-[#7FFFD4]/20 scale-105'
                  : 'bg-[#0A0A0A] hover:bg-[#26292F] text-[#EF4B52] border border-[#26292F]'
              }`}
              title={isMicActive ? 'Mute Mic' : 'Unmute Mic'}
            >
              {isMicActive ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 bg-[#050505] border border-[#26292F] rounded-xl px-3 py-1.5 focus-within:border-[#7FFFD4]/50"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Or type what you want to say to AuraLife..."
              className="flex-1 bg-transparent text-xs text-[#EDEFF2] placeholder-[#5F6773] outline-none"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-1.5 rounded-lg bg-[#7FFFD4] disabled:opacity-30 text-[#000000] transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Confirmation modal before leaving active session */}
      <LeaveSessionModal
        isOpen={showLeaveModal}
        onStay={() => setShowLeaveModal(false)}
        onLeave={() => {
          setShowLeaveModal(false);
          performExit();
        }}
        title="Leave voice session?"
        description="Your active Gemini Live conversation will be ended."
      />
    </div>
  );
};
