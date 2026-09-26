/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface LeaveSessionModalProps {
  isOpen: boolean;
  onStay: () => void;
  onLeave: () => void;
  title?: string;
  description?: string;
}

export const LeaveSessionModal: React.FC<LeaveSessionModalProps> = ({
  isOpen,
  onStay,
  onLeave,
  title = 'Leave this session?',
  description = 'Your current session will be stopped.',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0C0E]/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-2xl bg-[#141619] border border-[#26292F] p-5 shadow-2xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#EF4B52]/10 border border-[#EF4B52]/30 flex items-center justify-center shrink-0 text-[#EF4B52]">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#EDEFF2]">{title}</h3>
            <p className="text-xs text-[#A3AAB5] leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            onClick={onStay}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#A3AAB5] hover:text-[#EDEFF2] hover:bg-[#1C1F24] transition-colors cursor-pointer"
          >
            Stay
          </button>
          <button
            onClick={onLeave}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#EF4B52] hover:bg-[#ff5c63] transition-colors cursor-pointer shadow-sm"
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
};
