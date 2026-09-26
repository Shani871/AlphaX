/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CheckCircle2, ListTodo, HelpCircle, Globe2, AlertTriangle } from 'lucide-react';

interface EventInlineProps {
  type: 'decision' | 'task' | 'question' | 'language' | 'interruption';
  title: string;
  detail?: string;
}

export const EventInline: React.FC<EventInlineProps> = ({ type, title, detail }) => {
  const configs = {
    decision: {
      tag: 'DECISION DETECTED',
      tagColor: 'text-[#3ECF8E]',
      border: 'border-[#3ECF8E]/25',
      bg: 'bg-[#3ECF8E]/5',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#3ECF8E]" />,
    },
    task: {
      tag: 'TASK DETECTED',
      tagColor: 'text-[#5B7FFF]',
      border: 'border-[#5B7FFF]/25',
      bg: 'bg-[#5B7FFF]/5',
      icon: <ListTodo className="w-3.5 h-3.5 text-[#5B7FFF]" />,
    },
    question: {
      tag: 'QUESTION DETECTED',
      tagColor: 'text-[#E3A54A]',
      border: 'border-[#E3A54A]/25',
      bg: 'bg-[#E3A54A]/5',
      icon: <HelpCircle className="w-3.5 h-3.5 text-[#E3A54A]" />,
    },
    language: {
      tag: 'LANGUAGE DETECTED',
      tagColor: 'text-[#E3A54A]',
      border: 'border-[#E3A54A]/25',
      bg: 'bg-[#E3A54A]/5',
      icon: <Globe2 className="w-3.5 h-3.5 text-[#E3A54A]" />,
    },
    interruption: {
      tag: 'INTERRUPTION DETECTED',
      tagColor: 'text-[#EF4B52]',
      border: 'border-[#EF4B52]/30',
      bg: 'bg-[#EF4B52]/5',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-[#EF4B52]" />,
    },
  }[type];

  return (
    <div className={`my-4 py-2.5 px-3.5 rounded border ${configs.border} ${configs.bg} transition-all`}>
      <div className="flex items-center gap-2 mb-1">
        {configs.icon}
        <span className={`text-[10px] font-extrabold tracking-wider uppercase ${configs.tagColor}`}>
          {configs.tag}
        </span>
      </div>
      <div className="text-xs font-semibold text-[#EDEFF2]">{title}</div>
      {detail && <div className="text-[11px] text-[#A3AAB5] mt-0.5">{detail}</div>}
    </div>
  );
};
