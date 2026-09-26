/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Participant } from '../../mock/mockSession';

interface LanguageItem {
  code: string;
  name: string;
  flag: string;
  speakerCount: number;
  percent: number;
}

interface ParticipantListProps {
  participants: Participant[];
  languages: LanguageItem[];
  activeLanguageCode?: string;
}

export const ParticipantList: React.FC<ParticipantListProps> = ({
  participants,
  languages,
  activeLanguageCode,
}) => {
  return (
    <div className="flex flex-col h-full select-none justify-between">
      {/* Upper: Participants List */}
      <div>
        <div className="text-[11px] font-bold text-[#5F6773] tracking-widest uppercase mb-4 px-1">
          PARTICIPANTS
        </div>

        <div className="space-y-1">
          {participants.map((p) => {
            const isSpeaking = p.isSpeaking;
            return (
              <div
                key={p.id}
                className={`flex items-center justify-between py-2 px-2.5 rounded-md transition-all ${
                  isSpeaking
                    ? 'bg-[#3ECF8E]/10 border-l-2 border-[#3ECF8E]'
                    : 'hover:bg-[#050505]/40 border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isSpeaking
                        ? 'bg-[#3ECF8E] shadow-[0_0_8px_rgba(62,207,142,0.8)] animate-pulse'
                        : 'bg-[#5F6773]'
                    }`}
                  />
                  <div className="truncate">
                    <span
                      className={`text-xs font-semibold block truncate ${
                        isSpeaking ? 'text-[#EDEFF2]' : 'text-[#A3AAB5]'
                      }`}
                    >
                      {p.name}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[11px] font-medium shrink-0 ${
                    isSpeaking ? 'text-[#3ECF8E]' : 'text-[#5F6773]'
                  }`}
                >
                  {isSpeaking ? 'Speaking' : 'Listening'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lower: Languages List with clean small badges */}
      <div className="pt-6 border-t border-[#26292F]/60">
        <div className="text-[11px] font-bold text-[#5F6773] tracking-widest uppercase mb-3 px-1">
          LANGUAGES
        </div>

        <div className="flex flex-wrap gap-2 px-1">
          {languages.map((lang) => {
            const isTranslating = activeLanguageCode === lang.code;
            return (
              <div
                key={lang.code}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                  isTranslating
                    ? 'bg-[#E3A54A]/10 text-[#E3A54A] border border-[#E3A54A]/30'
                    : 'bg-[#050505] text-[#A3AAB5] border border-[#26292F]'
                }`}
              >
                <span className="text-sm">{lang.flag}</span>
                <span className="font-semibold text-[11px]">{lang.name.split(' ')[0]}</span>
                {isTranslating && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E3A54A] animate-ping" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
