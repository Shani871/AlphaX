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
      className={`inline-flex items-center gap-1 p-1 rounded-full bg-[#141619]/90 backdrop-blur-md border border-[#26292F] shadow-lg ${className}`}
    >
      <button
        onClick={() => onGenderChange('male')}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
          gender === 'male'
            ? 'bg-[#5B7FFF]/20 text-[#5B7FFF] border border-[#5B7FFF]/40 shadow-[0_0_12px_rgba(91,127,255,0.25)]'
            : 'text-[#A3AAB5] hover:text-[#EDEFF2] hover:bg-[#1C1F24]'
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
            ? 'bg-[#5B7FFF]/20 text-[#5B7FFF] border border-[#5B7FFF]/40 shadow-[0_0_12px_rgba(91,127,255,0.25)]'
            : 'text-[#A3AAB5] hover:text-[#EDEFF2] hover:bg-[#1C1F24]'
        }`}
        title="Select Female Virtual Assistant (Mid-20s)"
      >
        <Sparkles className="w-3 h-3 text-[#3ECF8E]" />
        <span>Female</span>
      </button>
    </div>
  );
};
