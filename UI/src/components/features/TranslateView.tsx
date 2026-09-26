/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Globe2, Mic, Play, Square, Languages, ArrowLeft } from 'lucide-react';
import { LeaveSessionModal } from '../common/LeaveSessionModal';

interface TranslateViewProps {
  onBackToHome: () => void;
}

export const TranslateView: React.FC<TranslateViewProps> = ({ onBackToHome }) => {
  // Step in Translate flow: 'language_selection' -> 'session' (Section 10, 14, 21, 22)
  const [step, setStep] = useState<'language_selection' | 'session'>('language_selection');
  const [targetLanguage, setTargetLanguage] = useState<'English' | 'Hindi' | 'French' | 'Japanese'>('English');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [originalText, setOriginalText] = useState('नमस्ते, क्या हम आज शाम की मीटिंग को कल सुबह शिफ्ट कर सकते हैं?');
  const [translatedText, setTranslatedText] = useState("Hello, can we shift this evening's meeting to tomorrow morning?");
  const [manualInput, setManualInput] = useState('');
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const sampleTranslations: Record<string, { original: string; translated: string }> = {
    English: {
      original: 'नमस्ते, क्या हम आज शाम की मीटिंग को कल सुबह शिफ्ट कर सकते हैं?',
      translated: "Hello, can we shift this evening's meeting to tomorrow morning?",
    },
    Hindi: {
      original: "Let's review the new architecture and confirm our deployment deadline.",
      translated: 'आइए नए आर्किटेक्चर की समीक्षा करें और अपनी डिप्लॉयमेंट समय सीमा की पुष्टि करें।',
    },
    French: {
      original: 'All systems are operational and ready for product launch.',
      translated: 'Tous les systèmes sont opérationnels et prêts pour le lancement du produit.',
    },
    Japanese: {
      original: 'The team confirmed the Monday release schedule.',
      translated: 'チームは月曜日のリリーススケジュールを確認しました。',
    },
  };

  const handleSelectLanguage = (lang: 'English' | 'Hindi' | 'French' | 'Japanese') => {
    setTargetLanguage(lang);
    if (sampleTranslations[lang]) {
      setOriginalText(sampleTranslations[lang].original);
      setTranslatedText(sampleTranslations[lang].translated);
    }
    // Transition to Translation Session (Step 2 per Section 10 & 14)
    setStep('session');
  };

  const handleBackRequest = () => {
    if (step === 'session') {
      if (isRecording || isPlayingAudio) {
        setShowLeaveModal(true);
      } else {
        // Return to Language Selection step per Section 10 & 22
        setStep('language_selection');
      }
    } else {
      // From Language Selection -> Return to AuraLife AI Home per Section 10 & 22
      onBackToHome();
    }
  };

  const performLeaveSession = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsRecording(false);
    setIsPlayingAudio(false);
    setStep('language_selection');
  };

  const handleSpeakTranslation = () => {
    if (isPlayingAudio) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAudio(false);
    } else {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(translatedText);
        utterance.rate = 1.0;
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        setIsPlayingAudio(true);
        window.speechSynthesis.speak(utterance);
      } else {
        setIsPlayingAudio(true);
        setTimeout(() => setIsPlayingAudio(false), 2500);
      }
    }
  };

  const handleCustomTranslate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;

    setOriginalText(manualInput);
    if (targetLanguage === 'Hindi') {
      setTranslatedText(`अनुवाद: "${manualInput}" (सफलतापूर्वक अनुवादित)`);
    } else if (targetLanguage === 'French') {
      setTranslatedText(`Traduction: "${manualInput}" (traduit avec succès)`);
    } else if (targetLanguage === 'Japanese') {
      setTranslatedText(`翻訳: 「${manualInput}」 (翻訳完了)`);
    } else {
      setTranslatedText(`Translation: "${manualInput}" (translated into English)`);
    }
    setManualInput('');
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0B0C0E] text-[#EDEFF2] select-none">
      {/* Top Header with Back button */}
      <div className="h-14 border-b border-[#26292F] px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackRequest}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#A3AAB5] hover:text-[#EDEFF2] hover:bg-[#1C1F24] transition-all cursor-pointer"
            title={step === 'session' ? 'Back to Language Selection' : 'Back to AuraLife AI Home'}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <span className="text-[#26292F]">|</span>

          <div className="flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-[#E3A54A]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#EDEFF2]">
              AuraLife Translate {step === 'session' ? `· ${targetLanguage}` : '· Select Language'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content: Step 1 Language Selection or Step 2 Translation Session */}
      {step === 'language_selection' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-lg mx-auto w-full text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-[#E3A54A]/10 border border-[#E3A54A]/30 flex items-center justify-center text-[#E3A54A] mx-auto shadow-md">
            <Languages className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight text-[#EDEFF2]">
              Choose Target Language
            </h2>
            <p className="text-xs sm:text-sm text-[#A3AAB5]">
              Select the language you want AuraLife to translate spoken conversation into.
            </p>
          </div>

          {/* Language Selection Grid per Section 10 & 14 */}
          <div className="grid grid-cols-2 gap-3 w-full pt-2">
            {[
              { code: 'English', native: 'English', flag: '🇺🇸', desc: 'Realtime English transcription' },
              { code: 'Hindi', native: 'हिन्दी', flag: '🇮🇳', desc: 'लाइव अनुवाद और संवाद' },
              { code: 'French', native: 'Français', flag: '🇫🇷', desc: 'Traduction instantanée' },
              { code: 'Japanese', native: '日本語', flag: '🇯🇵', desc: 'リアルタイム音声翻訳' },
            ].map((item) => (
              <button
                key={item.code}
                onClick={() => handleSelectLanguage(item.code as any)}
                className="p-4 rounded-xl bg-[#141619] hover:bg-[#1C1F24] border border-[#26292F] hover:border-[#E3A54A]/40 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">{item.flag}</span>
                  <span className="text-xs font-mono text-[#5F6773] group-hover:text-[#E3A54A]">Select →</span>
                </div>
                <div className="text-sm font-bold text-[#EDEFF2] group-hover:text-white">
                  {item.code}
                </div>
                <div className="text-xs text-[#A3AAB5] font-medium">{item.native}</div>
                <div className="text-[10px] text-[#5F6773] mt-1">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Step 2: Translation Session UI (Section 15) */
        <div className="flex-1 flex flex-col items-center justify-between p-6 max-w-xl mx-auto w-full">
          {/* Active target language pill */}
          <div className="w-full flex items-center justify-between p-3 rounded-xl bg-[#141619] border border-[#26292F] shrink-0">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-[#E3A54A]" />
              <span className="text-xs font-semibold text-[#A3AAB5]">Translating into:</span>
              <span className="text-xs font-bold text-[#E3A54A]">{targetLanguage}</span>
            </div>

            <button
              onClick={() => setStep('language_selection')}
              className="text-xs text-[#A3AAB5] hover:text-[#EDEFF2] px-2 py-1 rounded bg-[#1C1F24] hover:bg-[#26292F] transition-colors cursor-pointer"
            >
              Change Language
            </button>
          </div>

          {/* Translation Card: Original -> Translated */}
          <div className="w-full my-6 flex-1 flex flex-col justify-center space-y-5">
            {/* Original Speech Box */}
            <div className="p-4 rounded-xl bg-[#141619] border border-[#26292F]">
              <div className="text-[10px] font-bold text-[#5F6773] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Original Spoken Audio</span>
                <span className="text-[#3ECF8E] font-normal">Source Detected</span>
              </div>
              <p className="text-sm text-[#EDEFF2] font-medium leading-relaxed">
                "{originalText}"
              </p>
            </div>

            {/* Direction Indicator */}
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-[#1C1F24] border border-[#26292F] flex items-center justify-center text-[#E3A54A]">
                ↓
              </div>
            </div>

            {/* Translated Result Box */}
            <div className="p-4 rounded-xl bg-[#1C1F24] border border-[#E3A54A]/30 shadow-[0_0_20px_rgba(227,165,74,0.06)]">
              <div className="text-[10px] font-bold text-[#E3A54A] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Translated to {targetLanguage}</span>
                <button
                  onClick={handleSpeakTranslation}
                  className="flex items-center gap-1 text-[11px] text-[#E3A54A] hover:underline cursor-pointer"
                >
                  {isPlayingAudio ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                  <span>{isPlayingAudio ? 'Stop Audio' : 'Play Spoken'}</span>
                </button>
              </div>
              <p className="text-base text-[#EDEFF2] font-semibold leading-relaxed">
                "{translatedText}"
              </p>
            </div>
          </div>

          {/* Voice Input & Typing Bar */}
          <div className="w-full shrink-0 space-y-3">
            <div className="flex items-center justify-center">
              <button
                onClick={() => setIsRecording((p) => !p)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg cursor-pointer ${
                  isRecording
                    ? 'bg-[#E3A54A] text-[#0B0C0E] ring-4 ring-[#E3A54A]/25 scale-105 animate-pulse'
                    : 'bg-[#1C1F24] hover:bg-[#26292F] text-[#E3A54A] border border-[#26292F]'
                }`}
                title={isRecording ? 'Listening for speech...' : 'Press to speak translation'}
              >
                <Mic className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCustomTranslate} className="flex items-center gap-2 bg-[#141619] border border-[#26292F] rounded-xl px-3 py-1.5">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder={`Type in any language to translate into ${targetLanguage}...`}
                className="flex-1 bg-transparent text-xs text-[#EDEFF2] placeholder-[#5F6773] outline-none"
              />
              <button
                type="submit"
                disabled={!manualInput.trim()}
                className="px-3 py-1 rounded-lg bg-[#E3A54A] disabled:opacity-30 text-[#0B0C0E] text-xs font-bold transition-all cursor-pointer"
              >
                Translate
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation modal before leaving active translation session */}
      <LeaveSessionModal
        isOpen={showLeaveModal}
        onStay={() => setShowLeaveModal(false)}
        onLeave={() => {
          setShowLeaveModal(false);
          performLeaveSession();
        }}
        title="Leave translation session?"
        description="Your ongoing speech translation session will be stopped."
      />
    </div>
  );
};
