/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { SessionTimeline } from './SessionTimeline';
import { TimelineEvent, DecisionItem, TaskItem, QuestionItem } from '../../mock/mockSession';
import {
  Sparkles,
  Play,
  Square,
  RotateCcw,
  Clock,
  Users,
  Globe2,
  CheckCircle2,
  ListTodo,
  HelpCircle,
  Download,
} from 'lucide-react';

interface SessionSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  onStartNewSession: () => void;
  duration: string;
  participantCount: number;
  languageCount: number;
  decisions: DecisionItem[];
  tasks: TaskItem[];
  questions: QuestionItem[];
  timelineEvents: TimelineEvent[];
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({
  isOpen,
  onClose,
  onStartNewSession,
  duration,
  participantCount,
  languageCount,
  decisions,
  tasks,
  questions,
  timelineEvents,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const fullSummaryText = `Session recap for ${duration} discussion with ${participantCount} participants across ${languageCount} languages. Key results: ${
    decisions.length
  } decisions confirmed, ${tasks.length} action items assigned, and ${
    questions.filter((q) => q.status === 'unresolved').length
  } questions remain open for follow up.`;

  const handleToggleSpeech = () => {
    if (isPlayingAudio) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAudio(false);
    } else {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(fullSummaryText);
        utterance.rate = 1.05;
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

  const handleExportJSON = () => {
    const data = {
      duration,
      participantCount,
      languageCount,
      decisions,
      tasks,
      questions,
      timelineEvents,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wow-session-summary-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Session Debrief & Intelligence Summary"
      subtitle={`Total duration ${duration} · Completed successfully`}
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button
            variant="ghost"
            size="md"
            onClick={handleExportJSON}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export JSON
          </Button>
          <Button
            variant={isPlayingAudio ? 'danger' : 'primary'}
            size="md"
            onClick={handleToggleSpeech}
            icon={isPlayingAudio ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          >
            {isPlayingAudio ? 'Stop Recap' : 'Play AI Summary'}
          </Button>
          <Button
            variant="success"
            size="md"
            onClick={onStartNewSession}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Start New Session
          </Button>
        </>
      }
    >
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-lg bg-[#0A0A0A] border border-[#26292F]">
          <span className="text-[11px] text-[#A3AAB5] flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-[#7FFFD4]" />
            Duration
          </span>
          <span className="text-base font-bold font-mono text-[#EDEFF2] tabular-nums">
            {duration}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-[#0A0A0A] border border-[#26292F]">
          <span className="text-[11px] text-[#A3AAB5] flex items-center gap-1.5 mb-1">
            <Users className="w-3.5 h-3.5 text-[#3ECF8E]" />
            Speakers
          </span>
          <span className="text-base font-bold text-[#EDEFF2]">
            {participantCount} team
          </span>
        </div>

        <div className="p-3 rounded-lg bg-[#0A0A0A] border border-[#26292F]">
          <span className="text-[11px] text-[#A3AAB5] flex items-center gap-1.5 mb-1">
            <Globe2 className="w-3.5 h-3.5 text-[#E3A54A]" />
            Languages
          </span>
          <span className="text-base font-bold text-[#EDEFF2]">
            {languageCount} active
          </span>
        </div>

        <div className="p-3 rounded-lg bg-[#0A0A0A] border border-[#26292F]">
          <span className="text-[11px] text-[#A3AAB5] flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#3ECF8E]" />
            Decisions
          </span>
          <span className="text-base font-bold text-[#3ECF8E]">
            {decisions.length} committed
          </span>
        </div>
      </div>

      {/* Intelligence Counts Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 rounded-lg bg-[#0A0A0A] border border-[#7FFFD4]/20">
          <span className="text-[11px] text-[#7FFFD4] font-bold flex items-center gap-1.5 mb-1">
            <ListTodo className="w-3.5 h-3.5" />
            Action Items Logged
          </span>
          <span className="text-sm font-semibold text-[#EDEFF2]">
            {tasks.length} tasks ({tasks.filter((t) => t.status === 'confirmed').length} confirmed)
          </span>
        </div>

        <div className="p-3 rounded-lg bg-[#0A0A0A] border border-[#E3A54A]/20">
          <span className="text-[11px] text-[#E3A54A] font-bold flex items-center gap-1.5 mb-1">
            <HelpCircle className="w-3.5 h-3.5" />
            Questions Captured
          </span>
          <span className="text-sm font-semibold text-[#EDEFF2]">
            {questions.length} questions ({questions.filter((q) => q.status === 'unresolved').length} unresolved)
          </span>
        </div>
      </div>

      {/* Event Timeline */}
      <div className="space-y-2 pt-2 border-t border-[#26292F]">
        <h4 className="text-xs font-bold text-[#EDEFF2] uppercase tracking-wider">
          Intelligence Timeline
        </h4>
        <div className="max-h-48 overflow-y-auto pr-2 py-1">
          <SessionTimeline events={timelineEvents} />
        </div>
      </div>
    </Modal>
  );
};
