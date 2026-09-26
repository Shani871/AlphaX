/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HelpCircle, Check, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button';

interface QuestionCardProps {
  id?: string;
  text: string;
  asker: string;
  status: 'unresolved' | 'resolved';
  resolution?: string;
  onResolve?: (resolutionNote: string) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  text,
  asker,
  status,
  resolution,
  onResolve,
}) => {
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionInput, setResolutionInput] = useState('');

  const handleConfirmResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (onResolve) {
      onResolve(resolutionInput.trim() || 'Resolved during alignment');
    }
    setIsResolving(false);
  };

  return (
    <div
      className={`p-3 rounded-lg border transition-all ${
        status === 'resolved'
          ? 'border-[#3ECF8E]/30 bg-[#3ECF8E]/5'
          : 'border-[#E3A54A]/30 bg-[#E3A54A]/5 hover:border-[#E3A54A]/50'
      }`}
    >
      <div className="flex items-start gap-2">
        <HelpCircle
          className={`w-4 h-4 shrink-0 mt-0.5 ${
            status === 'resolved' ? 'text-[#3ECF8E]' : 'text-[#E3A54A]'
          }`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[#EDEFF2] leading-snug">
            {text}
          </p>

          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[#A3AAB5]">
            <span>Asked by <strong className="text-[#EDEFF2]">{asker}</strong></span>
            <span className="text-[#5F6773]">·</span>
            {status === 'resolved' ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#3ECF8E]">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Resolved
              </span>
            ) : (
              <span className="text-[10px] font-bold text-[#E3A54A]">
                Unresolved
              </span>
            )}
          </div>

          {resolution && (
            <p className="mt-2 text-[11px] text-[#3ECF8E] bg-[#3ECF8E]/10 p-1.5 rounded">
              Resolution: {resolution}
            </p>
          )}

          {/* Resolve prompt form or button */}
          {status === 'unresolved' && (
            <div className="mt-2.5 pt-2 border-t border-[#26292F]">
              {isResolving ? (
                <form onSubmit={handleConfirmResolve} className="space-y-2">
                  <input
                    type="text"
                    value={resolutionInput}
                    onChange={(e) => setResolutionInput(e.target.value)}
                    placeholder="Enter answer / resolution notes..."
                    className="w-full px-2.5 py-1 text-xs bg-[#141619] border border-[#26292F] rounded text-[#EDEFF2] focus:border-[#3ECF8E] focus:outline-none"
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      onClick={() => setIsResolving(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="success"
                      type="submit"
                      icon={<Check className="w-3 h-3" />}
                    >
                      Mark Resolved
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setIsResolving(true)}
                    icon={<Check className="w-3 h-3 text-[#3ECF8E]" />}
                  >
                    Resolve
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
