/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Users, ArrowLeft } from 'lucide-react';

interface AppShellProps {
  header: React.ReactNode;
  participantsColumn: React.ReactNode;
  centerColumn: React.ReactNode;
  intelligenceColumn: React.ReactNode;
  bottomBar: React.ReactNode;
  mobileActiveTab: 'conversation' | 'intelligence' | 'participants';
  onMobileTabChange: (tab: 'conversation' | 'intelligence' | 'participants') => void;
  isTabletDrawerOpen: boolean;
  onCloseTabletDrawer: () => void;
  onBackToPrevious?: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  header,
  participantsColumn,
  centerColumn,
  intelligenceColumn,
  bottomBar,
  mobileActiveTab,
  onMobileTabChange,
  isTabletDrawerOpen,
  onCloseTabletDrawer,
  onBackToPrevious,
}) => {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#000000] text-[#EDEFF2]">
      {/* Top Header (64px) */}
      {header}

      {/* Mobile Top Segmented Tab Switcher (< 768px) with mobile Back button per Section 14 */}
      <div className="md:hidden flex items-center bg-[#050505] border-b border-[#26292F] px-2.5 py-1.5 shrink-0 z-20 gap-2">
        {onBackToPrevious && (
          <button
            onClick={onBackToPrevious}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-[#A3AAB5] hover:text-[#EDEFF2] hover:bg-[#0A0A0A] shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        )}

        <div className="flex-1 flex items-center bg-[#000000] rounded-lg p-0.5 border border-[#26292F]">
          <button
            onClick={() => onMobileTabChange('conversation')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${
              mobileActiveTab === 'conversation'
                ? 'bg-[#0A0A0A] text-[#EDEFF2]'
                : 'text-[#5F6773] hover:text-[#A3AAB5]'
            }`}
          >
            Conversation
          </button>
          <button
            onClick={() => onMobileTabChange('intelligence')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${
              mobileActiveTab === 'intelligence'
                ? 'bg-[#0A0A0A] text-[#7FFFD4]'
                : 'text-[#5F6773] hover:text-[#A3AAB5]'
            }`}
          >
            Intelligence
          </button>
          <button
            onClick={() => onMobileTabChange('participants')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${
              mobileActiveTab === 'participants'
                ? 'bg-[#0A0A0A] text-[#3ECF8E]'
                : 'text-[#5F6773] hover:text-[#A3AAB5]'
            }`}
          >
            Participants
          </button>
        </div>
      </div>

      {/* Main Workspace with exact 19% | 53% | 28% proportions */}
      <main className="flex-1 flex overflow-hidden pb-20 relative">
        {/* LEFT SIDEBAR: Participants (18–20% on desktop) */}
        <aside
          className={`
            lg:w-[19%] md:w-[22%] lg:flex lg:static border-r border-[#26292F]/60 bg-[#000000] p-6 lg:p-7 flex-col overflow-y-auto shrink-0
            ${
              isTabletDrawerOpen
                ? 'fixed inset-y-0 left-0 w-72 bg-[#000000] border-r border-[#26292F] p-6 flex flex-col z-50 shadow-2xl overflow-y-auto'
                : 'hidden md:flex'
            }
            ${
              mobileActiveTab === 'participants' ? '!flex w-full p-6' : ''
            }
          `}
        >
          {/* Drawer Close Button for Tablet */}
          <div className="md:hidden flex items-center justify-between pb-3 mb-2 border-b border-[#26292F]">
            <span className="text-xs font-bold text-[#EDEFF2] uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-[#3ECF8E]" />
              Participants
            </span>
            <button
              onClick={onCloseTabletDrawer}
              className="p-1.5 rounded-lg text-[#A3AAB5] hover:text-[#EDEFF2]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {participantsColumn}
        </aside>

        {/* Backdrop for Tablet Drawer */}
        {isTabletDrawerOpen && (
          <div
            onClick={onCloseTabletDrawer}
            className="fixed inset-0 bg-[#000000]/80 backdrop-blur-sm z-40 lg:hidden"
          />
        )}

        {/* CENTER: Main Conversational Environment (50–55% on desktop, dominant) */}
        <section
          className={`flex-1 md:w-[53%] flex flex-col min-w-0 md:border-r border-[#26292F]/60 bg-[#000000] px-6 lg:px-10 py-6 overflow-hidden ${
            mobileActiveTab !== 'conversation' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {centerColumn}
        </section>

        {/* RIGHT SIDEBAR: Intelligence Rail (27–30% on desktop) */}
        <aside
          className={`w-full md:w-[28%] lg:w-[28%] bg-[#000000] p-6 lg:p-7 flex flex-col overflow-y-auto shrink-0 ${
            mobileActiveTab !== 'intelligence' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {intelligenceColumn}
        </aside>
      </main>

      {/* Fixed Bottom Audio Bar (72-84px) */}
      {bottomBar}
    </div>
  );
};
