/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  compact = false,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center rounded-lg border border-dashed border-[#26292F] bg-[#050505]/40 ${
        compact ? 'py-4 px-3' : 'py-6 px-4'
      }`}
    >
      {icon && <div className="text-[#5F6773] mb-2">{icon}</div>}
      <p className="text-xs font-semibold text-[#A3AAB5]">{title}</p>
      <p className="text-[11px] text-[#5F6773] mt-0.5 max-w-[240px] leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
};
