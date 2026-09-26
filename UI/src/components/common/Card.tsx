/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  highlight?: 'none' | 'primary' | 'success' | 'warning' | 'danger';
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  elevated = false,
  highlight = 'none',
  onClick,
}) => {
  const highlightClasses = {
    none: 'border-[#26292F]',
    primary: 'border-[#7FFFD4]/40 bg-[#7FFFD4]/5',
    success: 'border-[#3ECF8E]/40 bg-[#3ECF8E]/5',
    warning: 'border-[#E3A54A]/40 bg-[#E3A54A]/5',
    danger: 'border-[#EF4B52]/40 bg-[#EF4B52]/5',
  }[highlight];

  return (
    <div
      onClick={onClick}
      className={`rounded-lg border p-3.5 transition-colors ${
        elevated ? 'bg-[#0A0A0A]' : 'bg-[#050505]'
      } ${highlightClasses} ${onClick ? 'cursor-pointer hover:border-[#383C44]' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
