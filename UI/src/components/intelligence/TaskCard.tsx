/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TaskStatus } from '../../mock/mockSession';
import { Button } from '../common/Button';
import { Check, X, Edit3, Calendar, User, CheckCircle2 } from 'lucide-react';

interface TaskCardProps {
  id?: string;
  title: string;
  owner: string;
  deadline: string;
  status: TaskStatus;
  onStatusChange?: (newStatus: TaskStatus) => void;
  onEdit?: (newTitle: string, newOwner: string, newDeadline: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  title,
  owner,
  deadline,
  status,
  onStatusChange,
  onEdit,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editOwner, setEditOwner] = useState(owner);
  const [editDeadline, setEditDeadline] = useState(deadline);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onEdit) {
      onEdit(editTitle, editOwner, editDeadline);
    }
    if (onStatusChange) {
      onStatusChange('edited');
    }
    setIsEditing(false);
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#3ECF8E] bg-[#3ECF8E]/10 px-1.5 py-0.5 rounded">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Confirmed
          </span>
        );
      case 'edited':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#7FFFD4] bg-[#7FFFD4]/10 px-1.5 py-0.5 rounded">
            Edited
          </span>
        );
      case 'ignored':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#5F6773] bg-[#26292F] px-1.5 py-0.5 rounded">
            Ignored
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#E3A54A] bg-[#E3A54A]/10 px-1.5 py-0.5 rounded">
            Pending
          </span>
        );
    }
  };

  if (isEditing) {
    return (
      <form
        onSubmit={handleSaveEdit}
        className="p-3 rounded-lg border border-[#7FFFD4]/40 bg-[#0A0A0A] space-y-2.5"
      >
        <span className="text-[11px] font-bold text-[#7FFFD4] uppercase tracking-wider block">
          Edit Task
        </span>
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="w-full px-2.5 py-1 text-xs bg-[#050505] border border-[#26292F] rounded text-[#EDEFF2] focus:border-[#7FFFD4] focus:outline-none"
          placeholder="Task title"
          required
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={editOwner}
            onChange={(e) => setEditOwner(e.target.value)}
            className="px-2.5 py-1 text-xs bg-[#050505] border border-[#26292F] rounded text-[#EDEFF2] focus:border-[#7FFFD4] focus:outline-none"
            placeholder="Owner"
            required
          />
          <input
            type="text"
            value={editDeadline}
            onChange={(e) => setEditDeadline(e.target.value)}
            className="px-2.5 py-1 text-xs bg-[#050505] border border-[#26292F] rounded text-[#EDEFF2] focus:border-[#7FFFD4] focus:outline-none"
            placeholder="Deadline"
            required
          />
        </div>
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            size="sm"
            variant="ghost"
            type="button"
            onClick={() => setIsEditing(false)}
          >
            Cancel
          </Button>
          <Button size="sm" variant="primary" type="submit">
            Save Task
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div
      className={`p-3 rounded-lg border transition-all ${
        status === 'ignored'
          ? 'opacity-50 border-[#26292F] bg-[#050505]'
          : status === 'confirmed'
          ? 'border-[#3ECF8E]/30 bg-[#3ECF8E]/5'
          : 'border-[#26292F] bg-[#050505] hover:border-[#383C44]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-[#EDEFF2] leading-snug flex-1">
          {title}
        </p>
        {getStatusBadge()}
      </div>

      {/* Owner and Deadline metadata */}
      <div className="flex items-center gap-3 mt-2 text-[11px] text-[#A3AAB5]">
        <div className="flex items-center gap-1">
          <User className="w-3 h-3 text-[#7FFFD4]" />
          <span>{owner}</span>
        </div>
        <span className="text-[#5F6773]">·</span>
        <div className="flex items-center gap-1 font-mono text-[10px] text-[#A3AAB5]">
          <Calendar className="w-3 h-3 text-[#E3A54A]" />
          <span>{deadline}</span>
        </div>
      </div>

      {/* Actions row */}
      {status !== 'confirmed' && status !== 'ignored' && (
        <div className="flex items-center justify-end gap-1.5 mt-2.5 pt-2 border-t border-[#26292F]">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            icon={<Edit3 className="w-3 h-3" />}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onStatusChange && onStatusChange('ignored')}
            icon={<X className="w-3 h-3 text-[#EF4B52]" />}
          >
            Ignore
          </Button>
          <Button
            size="sm"
            variant="success"
            onClick={() => onStatusChange && onStatusChange('confirmed')}
            icon={<Check className="w-3 h-3" />}
          >
            Confirm
          </Button>
        </div>
      )}
    </div>
  );
};
