/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, Sparkles } from 'lucide-react';
import { AvatarGender } from './HumanAvatar';

interface AvatarSwitcherProps {
  gender: AvatarGender;
  onGenderChange: (gender: AvatarGender) => void;
  className?: string;
}

export const AvatarSwitcher: React.FC<AvatarSwitcherProps> = ({
  gender,
  onGenderChange,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center gap-1 p-1 rounded-full bg-[#050505]/90 backdrop-blur-md border border-[#26292F] shadow-lg ${className}`}
    >
      <button
        onClick={() => onGenderChange('male')}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
          gender === 'male'
            ? 'bg-[#7FFFD4]/20 text-[#7FFFD4] border border-[#7FFFD4]/40 shadow-[0_0_12px_rgba(91,127,255,0.25)]'
            : 'text-[#A3AAB5] hover:text-[#EDEFF2] hover:bg-[#0A0A0A]'
        }`}
        title="Select Male Virtual Assistant (Mid-20s)"
      >
        <User className="w-3 h-3" />
        <span>Male</span>
      </button>

      <button
        onClick={() => onGenderChange('female')}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
          gender === 'female'
            ? 'bg-[#7FFFD4]/20 text-[#7FFFD4] border border-[#7FFFD4]/40 shadow-[0_0_12px_rgba(91,127,255,0.25)]'
            : 'text-[#A3AAB5] hover:text-[#EDEFF2] hover:bg-[#0A0A0A]'
        }`}
        title="Select Female Virtual Assistant (Mid-20s)"
      >
        <Sparkles className="w-3 h-3 text-[#3ECF8E]" />
        <span>Female</span>
      </button>
    </div>
  );
};
