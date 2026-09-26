/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1.5 rounded-md h-7',
    md: 'px-3.5 py-1.5 text-xs font-semibold gap-2 rounded-lg h-8',
    lg: 'px-4 py-2 text-sm font-semibold gap-2.5 rounded-lg h-10',
  }[size];

  const variantClasses = {
    primary:
      'bg-[#5B7FFF] text-[#0B0C0E] hover:bg-[#7292FF] active:bg-[#4E6EE6] font-semibold shadow-sm transition-all',
    secondary:
      'bg-[#1C1F24] hover:bg-[#26292F] active:bg-[#141619] text-[#EDEFF2] border border-[#26292F] hover:border-[#383C44] transition-all',
    ghost:
      'bg-transparent hover:bg-[#1C1F24] active:bg-[#141619] text-[#A3AAB5] hover:text-[#EDEFF2] transition-colors',
    danger:
      'bg-[#EF4B52]/15 text-[#EF4B52] border border-[#EF4B52]/30 hover:bg-[#EF4B52]/25 active:bg-[#EF4B52]/35 transition-all',
    success:
      'bg-[#3ECF8E]/15 text-[#3ECF8E] border border-[#3ECF8E]/30 hover:bg-[#3ECF8E]/25 transition-all',
  }[variant];

  const disabledClass = disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer';

  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap select-none font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5B7FFF] ${sizeClasses} ${variantClasses} ${disabledClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
};
