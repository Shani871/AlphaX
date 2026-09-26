/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Sparkles, Play, Square, Check, AlertCircle, Volume2, Copy } from 'lucide-react';
import { DecisionItem, TaskItem, QuestionItem } from '../../mock/mockSession';

interface CatchMeUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionTime: string;
  decisions: DecisionItem[];
  tasks: TaskItem[];
  questions: QuestionItem[];
}

export const CatchMeUpModal: React.FC<CatchMeUpModalProps> = ({
  isOpen,
  onClose,
  sessionTime,
  decisions,
  tasks,
  questions,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate dynamic synthesized summary based on current state
  const confirmedTasks = tasks.filter((t) => t.status === 'confirmed');
  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const unresolvedQuestions = questions.filter((q) => q.status === 'unresolved');

  const summaryParagraph = `Here's what you missed up to ${sessionTime}: The team has logged ${
    decisions.length
  } key decisions, including "${decisions[0]?.text || 'schedule alignment'}". ${
    tasks.length
  } action items were created (${pendingTasks.length} pending sign-off), and there ${
    unresolvedQuestions.length === 1 ? 'is 1 open question' : `are ${unresolvedQuestions.length} open questions`
  } regarding ${unresolvedQuestions[0]?.text || 'operational next steps'}.`;

  const handleToggleSpeech = () => {
    if (isPlayingAudio) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAudio(false);
    } else {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();

        const utterance = new SpeechSynthesisUtterance(summaryParagraph);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const preferredVoice =
          voices.find(
            (v) =>
              v.lang.startsWith('en') &&
              (v.name.includes('Natural') ||
                v.name.includes('Google') ||
                v.name.includes('Samantha') ||
                v.name.includes('Ava') ||
                v.name.includes('Daniel') ||
                v.name.includes('Karen'))
          ) || voices.find((v) => v.lang.startsWith('en'));

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.onstart = () => setIsPlayingAudio(true);
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);

        setIsPlayingAudio(true);
        window.speechSynthesis.speak(utterance);
      } else {
        setIsPlayingAudio(true);
        setTimeout(() => setIsPlayingAudio(false), 5000);
      }
    }
  };

  useEffect(() => {
    if (!isOpen && isPlayingAudio) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAudio(false);
    }
  }, [isOpen]);

  const handleCopySummary = () => {
    navigator.clipboard.writeText(summaryParagraph);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Catch Me Up"
      subtitle={`Spoken & structured briefing at ${sessionTime}`}
      footer={
        <>
          <Button
            variant="ghost"
            size="md"
            onClick={handleCopySummary}
            icon={copied ? <Check className="w-3.5 h-3.5 text-[#3ECF8E]" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copied ? 'Copied' : 'Copy Briefing'}
          </Button>
          <Button
            variant={isPlayingAudio ? 'danger' : 'primary'}
            size="md"
            onClick={handleToggleSpeech}
            icon={isPlayingAudio ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          >
            {isPlayingAudio ? 'Stop Spoken Recap' : 'Play Spoken Summary'}
          </Button>
          <Button variant="secondary" size="md" onClick={onClose}>
            Back to Live
          </Button>
        </>
      }
    >
      {/* Audio Player Card Banner */}
      <div className="p-3.5 rounded-lg bg-[#0A0A0A] border border-[#7FFFD4]/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
              isPlayingAudio
                ? 'bg-[#7FFFD4] text-[#000000] animate-pulse ring-4 ring-[#7FFFD4]/20'
                : 'bg-[#26292F] text-[#7FFFD4]'
            }`}
          >
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#EDEFF2]">
                WOW Audio Host Briefing
              </span>
              {isPlayingAudio && (
                <span className="text-[10px] font-bold text-[#7FFFD4] animate-pulse">
                  Speaking...
                </span>
              )}
            </div>
            <span className="text-[11px] text-[#A3AAB5]">
              Instant text-to-speech catch-up synthesized from room state
            </span>
          </div>
        </div>

        <Button
          size="sm"
          variant={isPlayingAudio ? 'danger' : 'secondary'}
          onClick={handleToggleSpeech}
          icon={isPlayingAudio ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
        >
          {isPlayingAudio ? 'Stop' : 'Play'}
        </Button>
      </div>

      {/* Spoken Paragraph Text */}
      <div className="p-3 rounded-lg bg-[#050505] border border-[#26292F] text-xs text-[#EDEFF2] leading-relaxed">
        <span className="text-[10px] font-bold text-[#7FFFD4] uppercase tracking-wider block mb-1">
          Executive Synthesis
        </span>
        {summaryParagraph}
      </div>

      {/* Resolved Items Section (✓) */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-[#3ECF8E] flex items-center gap-1.5 uppercase tracking-wider">
          <Check className="w-3.5 h-3.5" />
          Resolved & Confirmed Items ({decisions.length + confirmedTasks.length})
        </span>

        <div className="space-y-1.5">
          {decisions.map((d) => (
            <div
              key={d.id}
              className="p-2.5 rounded-md bg-[#0A0A0A] border border-[#3ECF8E]/20 text-xs flex items-start gap-2 text-[#EDEFF2]"
            >
              <span className="text-[#3ECF8E] font-bold mt-0.5">✓</span>
              <div className="flex-1">
                <span>{d.text}</span>
                <span className="text-[#5F6773] text-[11px] ml-2">({d.actor})</span>
              </div>
            </div>
          ))}

          {confirmedTasks.map((t) => (
            <div
              key={t.id}
              className="p-2.5 rounded-md bg-[#0A0A0A] border border-[#3ECF8E]/20 text-xs flex items-start gap-2 text-[#EDEFF2]"
            >
              <span className="text-[#3ECF8E] font-bold mt-0.5">✓</span>
              <div className="flex-1">
                <span>{t.title}</span>
                <span className="text-[#5F6773] text-[11px] ml-2">({t.owner} · {t.deadline})</span>
              </div>
            </div>
          ))}

          {decisions.length === 0 && confirmedTasks.length === 0 && (
            <p className="text-xs text-[#5F6773] italic py-1">
              No confirmed items yet in this conversation window.
            </p>
          )}
        </div>
      </div>

      {/* Unresolved Items Section (!) */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-[#E3A54A] flex items-center gap-1.5 uppercase tracking-wider">
          <AlertCircle className="w-3.5 h-3.5" />
          Unresolved & Open Action Items ({unresolvedQuestions.length + pendingTasks.length})
        </span>

        <div className="space-y-1.5">
          {unresolvedQuestions.map((q) => (
            <div
              key={q.id}
              className="p-2.5 rounded-md bg-[#0A0A0A] border border-[#EF4B52]/20 text-xs flex items-start gap-2 text-[#EDEFF2]"
            >
              <span className="text-[#EF4B52] font-bold mt-0.5">!</span>
              <div className="flex-1">
                <span className="font-semibold text-[#EF4B52]">Open Question:</span> {q.text}
                <span className="text-[#5F6773] text-[11px] ml-2">(Raised by {q.asker})</span>
              </div>
            </div>
          ))}

          {pendingTasks.map((t) => (
            <div
              key={t.id}
              className="p-2.5 rounded-md bg-[#0A0A0A] border border-[#E3A54A]/20 text-xs flex items-start gap-2 text-[#EDEFF2]"
            >
              <span className="text-[#E3A54A] font-bold mt-0.5">!</span>
              <div className="flex-1">
                <span className="font-semibold text-[#E3A54A]">Pending Task:</span> {t.title}
                <span className="text-[#5F6773] text-[11px] ml-2">({t.owner} · due {t.deadline})</span>
              </div>
            </div>
          ))}

          {unresolvedQuestions.length === 0 && pendingTasks.length === 0 && (
            <p className="text-xs text-[#5F6773] italic py-1">
              All questions and tasks have been addressed.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};
