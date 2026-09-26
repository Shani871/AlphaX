/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { TranscriptItemData } from '../../mock/mockSession';
import { TranscriptItem } from './TranscriptItem';

interface TranscriptPanelProps {
  items: TranscriptItemData[];
  liveInterimText?: string;
  activeSpeaker?: string | null;
}

export const TranscriptPanel: React.FC<TranscriptPanelProps> = ({
  items,
  liveInterimText,
  activeSpeaker,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [items, liveInterimText]);

  return (
    <div className="flex flex-col h-full overflow-hidden select-text">
      {/* Transcript List without excessive card boundaries */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto pr-2 divide-y divide-[#26292F]/30"
      >
        {items.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-8">
            <p className="text-xs text-[#5F6773] max-w-xs leading-relaxed">
              Waiting for voice audio. Live transcription, translation, and intelligence events will stream here.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <TranscriptItem
              key={item.id}
              speaker={item.speaker}
              timestamp={item.timestamp}
              text={item.text}
              language={item.language}
              translation={item.translation}
              isAI={item.isAI}
              inlineEvent={item.inlineEvent}
            />
          ))
        )}

        {/* Live Interim Streaming Utterance preview if speaking */}
        {liveInterimText && (
          <div className="py-3 text-xs border-t border-[#3ECF8E]/20 text-[#3ECF8E]">
            <div className="flex items-center gap-2 mb-1 font-semibold text-[11px]">
              <span>{activeSpeaker || 'Speaker'}</span>
              <span className="text-[#5F6773]">·</span>
              <span className="text-[10px] text-[#A3AAB5] uppercase font-mono">Live stream</span>
            </div>
            <p className="italic text-[#EDEFF2] animate-pulse">
              "{liveInterimText}"
            </p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
};
