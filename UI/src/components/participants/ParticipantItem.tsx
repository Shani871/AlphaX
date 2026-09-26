/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Participant } from '../../mock/mockSession';
import { Volume2 } from 'lucide-react';

interface ParticipantItemProps {
  participant: Participant;
}

export const ParticipantItem: React.FC<ParticipantItemProps> = ({ participant }) => {
  return (
    <div
      className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
        participant.isSpeaking
          ? 'bg-[#1C1F24] border-[#3ECF8E]/40 shadow-[0_0_12px_rgba(62,207,142,0.12)]'
          : 'bg-[#141619] border-[#26292F] hover:border-[#383C44]'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Speaking Status Dot or Soundwave */}
        <div className="relative flex items-center justify-center shrink-0 w-7 h-7 rounded-full bg-[#1C1F24] border border-[#26292F] text-xs font-bold text-[#EDEFF2]">
          {participant.name.slice(0, 2).toUpperCase()}
          {participant.isSpeaking && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#3ECF8E] ring-2 ring-[#141619] animate-pulse" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#EDEFF2] truncate">
              {participant.name}
            </span>
          </div>
          <span className="text-[11px] text-[#5F6773] truncate block">
            {participant.role}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {participant.isSpeaking ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#3ECF8E] bg-[#3ECF8E]/10 px-2 py-0.5 rounded">
            <Volume2 className="w-3 h-3 animate-pulse" />
            Speaking
          </span>
        ) : (
          <span className="text-[11px] text-[#5F6773]">
            Listening
          </span>
        )}
      </div>
    </div>
  );
};
