/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DecisionItem, TaskItem, QuestionItem, TaskStatus } from '../../mock/mockSession';
import { Sparkles, Check, CheckCircle2 } from 'lucide-react';

interface IntelligencePanelProps {
  decisions: DecisionItem[];
  tasks: TaskItem[];
  questions: QuestionItem[];
  onTaskStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onTaskEdit: (taskId: string, title: string, owner: string, deadline: string) => void;
  onResolveQuestion: (questionId: string, resolution: string) => void;
  onCatchMeUp: () => void;
}

export const IntelligencePanel: React.FC<IntelligencePanelProps> = ({
  decisions,
  tasks,
  questions,
  onTaskStatusChange,
  onResolveQuestion,
  onCatchMeUp,
}) => {
  return (
    <div className="flex flex-col h-full overflow-hidden select-none justify-between space-y-6">
      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-6 divide-y divide-[#26292F]/50">
        {/* Top Header Label */}
        <div className="pb-1">
          <div className="text-[11px] font-bold text-[#5F6773] tracking-widest uppercase mb-1">
            INTELLIGENCE
          </div>
        </div>

        {/* DECISIONS Section */}
        <div className="pt-4 space-y-2.5">
          <div className="text-[11px] font-bold text-[#3ECF8E] tracking-wider uppercase flex items-center justify-between">
            <span>DECISIONS</span>
            <span className="text-[10px] font-mono text-[#5F6773]">{decisions.length}</span>
          </div>

          {decisions.length === 0 ? (
            <div className="text-xs text-[#5F6773] py-2 leading-relaxed">
              No decisions detected yet.<br />
              <span className="text-[11px] text-[#5F6773]/80">I'll surface consensus items here.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {decisions.map((d) => (
                <div key={d.id} className="text-xs">
                  <div className="text-[#EDEFF2] font-semibold leading-snug">
                    {d.text}
                  </div>
                  <div className="text-[11px] text-[#5F6773] mt-0.5">
                    {d.actor} · {d.timestamp}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TASKS Section */}
        <div className="pt-4 space-y-2.5">
          <div className="text-[11px] font-bold text-[#7FFFD4] tracking-wider uppercase flex items-center justify-between">
            <span>TASKS</span>
            <span className="text-[10px] font-mono text-[#5F6773]">{tasks.length}</span>
          </div>

          {tasks.length === 0 ? (
            <div className="text-xs text-[#5F6773] py-2 leading-relaxed">
              No tasks detected yet.<br />
              <span className="text-[11px] text-[#5F6773]/80">Action items with owners will appear here.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((t) => (
                <div key={t.id} className="text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[#EDEFF2] font-semibold leading-snug flex-1">
                      {t.title}
                    </span>
                    {t.status === 'confirmed' ? (
                      <span className="text-[10px] font-bold text-[#3ECF8E] inline-flex items-center gap-1 shrink-0">
                        <Check className="w-2.5 h-2.5" /> Confirmed
                      </span>
                    ) : (
                      <button
                        onClick={() => onTaskStatusChange(t.id, 'confirmed')}
                        className="text-[10px] font-semibold text-[#7FFFD4] hover:text-[#7292FF] hover:underline shrink-0 cursor-pointer"
                      >
                        Confirm
                      </button>
                    )}
                  </div>
                  <div className="text-[11px] text-[#5F6773] mt-0.5">
                    {t.owner} · {t.deadline}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* QUESTIONS Section */}
        <div className="pt-4 space-y-2.5">
          <div className="text-[11px] font-bold text-[#E3A54A] tracking-wider uppercase flex items-center justify-between">
            <span>QUESTIONS</span>
            <span className="text-[10px] font-mono text-[#5F6773]">{questions.length}</span>
          </div>

          {questions.length === 0 ? (
            <div className="text-xs text-[#5F6773] py-2 leading-relaxed">
              No unresolved questions.<br />
              <span className="text-[11px] text-[#5F6773]/80">Open inquiries will be logged here.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q) => (
                <div key={q.id} className="text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[#EDEFF2] font-semibold leading-snug flex-1">
                      {q.text}
                    </span>
                    {q.status === 'resolved' ? (
                      <span className="text-[10px] font-bold text-[#3ECF8E] shrink-0">
                        Resolved
                      </span>
                    ) : (
                      <button
                        onClick={() => onResolveQuestion(q.id, 'Resolved in session')}
                        className="text-[10px] font-semibold text-[#E3A54A] hover:text-[#f4b862] hover:underline shrink-0 cursor-pointer"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                  <div className="text-[11px] text-[#5F6773] mt-0.5">
                    Asked by {q.asker}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Catch Me Up Action Bar at the bottom of the rail (Section 11) */}
      <div className="pt-4 border-t border-[#26292F]">
        <button
          onClick={onCatchMeUp}
          className="w-full p-3 rounded-lg bg-[#050505] hover:bg-[#0A0A0A] border border-[#7FFFD4]/30 hover:border-[#7FFFD4]/60 text-left transition-all cursor-pointer group shadow-sm flex items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#EDEFF2] group-hover:text-white">
              <Sparkles className="w-3.5 h-3.5 text-[#7FFFD4]" />
              <span>Catch Me Up</span>
            </div>
            <div className="text-[11px] text-[#5F6773] mt-0.5">
              Hear what you missed · AI spoken audio
            </div>
          </div>
          <span className="text-xs font-bold text-[#7FFFD4] group-hover:translate-x-0.5 transition-transform">
            →
          </span>
        </button>
      </div>
    </div>
  );
};
