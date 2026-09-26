/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface StatusBadgeProps {
  status: 'live' | 'speaking' | 'listening' | 'translating' | 'interrupted' | 'confirmed' | 'pending' | 'resolved' | 'unresolved' | 'error';
  label?: string;
  dotOnly?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  dotOnly = false,
  className = '',
}) => {
  const configs = {
    live: { dot: 'bg-[#EF4B52] animate-pulse', text: 'text-[#EF4B52]', defaultLabel: 'LIVE' },
    speaking: { dot: 'bg-[#3ECF8E] animate-pulse', text: 'text-[#3ECF8E]', defaultLabel: 'Speaking' },
    listening: { dot: 'bg-[#5B7FFF]', text: 'text-[#5B7FFF]', defaultLabel: 'Listening' },
    translating: { dot: 'bg-[#E3A54A] animate-pulse', text: 'text-[#E3A54A]', defaultLabel: 'Translating' },
    interrupted: { dot: 'bg-[#EF4B52]', text: 'text-[#EF4B52]', defaultLabel: 'Interrupted' },
    confirmed: { dot: 'bg-[#3ECF8E]', text: 'text-[#3ECF8E]', defaultLabel: 'Confirmed' },
    pending: { dot: 'bg-[#E3A54A]', text: 'text-[#E3A54A]', defaultLabel: 'Pending' },
    resolved: { dot: 'bg-[#3ECF8E]', text: 'text-[#3ECF8E]', defaultLabel: 'Resolved' },
    unresolved: { dot: 'bg-[#EF4B52]', text: 'text-[#EF4B52]', defaultLabel: 'Unresolved' },
    error: { dot: 'bg-[#EF4B52]', text: 'text-[#EF4B52]', defaultLabel: 'Disconnected' },
  }[status];

  const displayLabel = label || configs.defaultLabel;

  if (dotOnly) {
    return (
      <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${configs.dot} ${className}`} />
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${configs.text} ${className}`}>
      <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${configs.dot}`} />
      <span className="whitespace-nowrap">{displayLabel}</span>
    </span>
  );
};
