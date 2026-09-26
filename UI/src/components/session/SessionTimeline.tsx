/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TimelineEvent } from '../../mock/mockSession';
import { CheckCircle2, ListTodo, HelpCircle, AlertTriangle, Radio } from 'lucide-react';

interface SessionTimelineProps {
  events: TimelineEvent[];
}

export const SessionTimeline: React.FC<SessionTimelineProps> = ({ events }) => {
  const getIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'decision':
        return <CheckCircle2 className="w-3.5 h-3.5 text-[#3ECF8E]" />;
      case 'task':
        return <ListTodo className="w-3.5 h-3.5 text-[#7FFFD4]" />;
      case 'question':
        return <HelpCircle className="w-3.5 h-3.5 text-[#E3A54A]" />;
      case 'interruption':
        return <AlertTriangle className="w-3.5 h-3.5 text-[#EF4B52]" />;
      default:
        return <Radio className="w-3.5 h-3.5 text-[#A3AAB5]" />;
    }
  };

  return (
    <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-[#26292F]">
      {events.map((ev, idx) => (
        <div key={idx} className="relative flex items-start gap-3 text-xs">
          {/* Timeline node */}
          <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-[#050505] border border-[#26292F] flex items-center justify-center">
            {getIcon(ev.type)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-[#5F6773] tabular-nums">
                {ev.time}
              </span>
              <span className="text-[#EDEFF2] font-medium truncate">
                {ev.label}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
