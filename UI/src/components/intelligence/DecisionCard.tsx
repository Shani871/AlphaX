/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import { DecisionItem } from '../../mock/mockSession';

interface DecisionCardProps {
  decision: DecisionItem;
}

export const DecisionCard: React.FC<DecisionCardProps> = ({ decision }) => {
  return (
    <div className="p-3 rounded-lg border border-[#3ECF8E]/30 bg-[#3ECF8E]/5 hover:border-[#3ECF8E]/50 transition-colors">
      <div className="flex items-start gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-[#3ECF8E] shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[#EDEFF2] leading-snug">
            {decision.text}
          </p>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-[#A3AAB5]">
            <span className="font-medium text-[#3ECF8E]">{decision.actor}</span>
            <span className="text-[#5F6773]">·</span>
            <span className="flex items-center gap-1 font-mono text-[10px] text-[#5F6773] tabular-nums">
              <Clock className="w-2.5 h-2.5" />
              {decision.timestamp}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
