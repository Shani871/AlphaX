/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { EventInline } from './EventInline';

interface TranscriptItemProps {
  speaker: string;
  timestamp: string;
  language: string;
  text: string;
  translation?: string;
  isAI?: boolean;
  inlineEvent?: {
    type: 'decision' | 'task' | 'question' | 'language' | 'interruption';
    title: string;
    detail?: string;
  };
}

export const TranscriptItem: React.FC<TranscriptItemProps> = ({
  speaker,
  timestamp,
  language,
  text,
  translation,
  isAI = false,
  inlineEvent,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="py-3 border-b border-[#26292F]/40 last:border-b-0"
    >
      {/* Inline Detected Event if present */}
      {inlineEvent && (
        <EventInline
          type={inlineEvent.type}
          title={inlineEvent.title}
          detail={inlineEvent.detail}
        />
      )}

      {/* Speaker + Timestamp line */}
      <div className="flex items-center justify-between text-xs mb-1">
        <div className="flex items-center gap-2">
          <span
            className={`font-bold ${
              isAI ? 'text-[#7FFFD4]' : 'text-[#EDEFF2]'
            }`}
          >
            {speaker}
          </span>
          <span className="text-[#5F6773] text-[10px] uppercase font-mono tracking-wider">
            {language === 'en' ? 'English' : language === 'hi' ? 'Hindi' : language}
          </span>
        </div>
        <span className="text-[11px] font-mono text-[#5F6773] tabular-nums">
          {timestamp}
        </span>
      </div>

      {/* Primary utterance text */}
      <p className="text-xs sm:text-sm text-[#EDEFF2] leading-relaxed select-text font-normal">
        "{text}"
      </p>

      {/* Clean inline translation block if present (Section 20) */}
      {translation && (
        <div className="mt-2 pl-3 border-l-2 border-[#E3A54A]/60 text-xs py-0.5">
          <div className="text-[10px] font-semibold text-[#E3A54A] tracking-wider uppercase mb-0.5">
            Hindi → English
          </div>
          <p className="text-[#A3AAB5] italic leading-relaxed">
            "{translation}"
          </p>
        </div>
      )}
    </motion.div>
  );
};
