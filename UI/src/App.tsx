/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HeroScreen } from './components/layout/HeroScreen';
import { AssistantHomeScreen } from './components/layout/AssistantHomeScreen';
import { AppShell } from './components/layout/AppShell';
import { Header } from './components/layout/Header';
import { AudioStatusBar } from './components/audio/AudioStatusBar';
import { ParticipantList } from './components/participants/ParticipantList';
import { HumanAvatar, AvatarGender } from './components/avatar/HumanAvatar';
import { AvatarSwitcher } from './components/avatar/AvatarSwitcher';
import { TranscriptPanel } from './components/transcript/TranscriptPanel';
import { IntelligencePanel } from './components/intelligence/IntelligencePanel';
import { CatchMeUpModal } from './components/session/CatchMeUpModal';
import { SessionSummary } from './components/session/SessionSummary';
import { LeaveSessionModal } from './components/common/LeaveSessionModal';
import { useAudioVisualization } from './hooks/useAudioVisualization';
import { useSpeechActivity } from './hooks/useSpeechActivity';
import { useVoiceBridge } from './hooks/useVoiceBridge';
import {
  MOCK_SCRIPT_STEPS,
  INITIAL_PARTICIPANTS,
  INITIAL_LANGUAGES,
  CoreState,
  TaskItem,
  DecisionItem,
  QuestionItem,
  TranscriptItemData,
  TimelineEvent,
  TaskStatus,
  Participant,
} from './mock/mockSession';

export default function App() {
  // Screen mode: 'hero', 'assistant_home', or 'workspace' (Three-Screen Experience)
  const [currentScreen, setCurrentScreen] = useState<'hero' | 'assistant_home' | 'workspace'>('hero');
  const [workspaceMode, setWorkspaceMode] = useState<'demo' | 'live'>('demo');
  const [homeFeature, setHomeFeature] = useState<'home' | 'gemini_live' | 'translate'>('home');

  // Human Avatar Selection: Male or Female (Young professional mid-20s digital human)
  const [avatarGender, setAvatarGender] = useState<AvatarGender>('male');

  // Mobile & Tablet Responsive Layout State
  const [mobileActiveTab, setMobileActiveTab] = useState<'conversation' | 'intelligence' | 'participants'>('conversation');
  const [isTabletDrawerOpen, setIsTabletDrawerOpen] = useState(false);

  // Session Mode & Status
  const [isLiveMic, setIsLiveMic] = useState(false);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [sessionTimeSeconds, setSessionTimeSeconds] = useState(14 * 60 + 2); // starts at 00:14:02

  // Intelligence & Transcript Data
  const [participants, setParticipants] = useState<Participant[]>(INITIAL_PARTICIPANTS);
  const [languages, setLanguages] = useState(INITIAL_LANGUAGES);
  const [transcriptItems, setTranscriptItems] = useState<TranscriptItemData[]>([]);
  const [decisions, setDecisions] = useState<DecisionItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([
    { time: '00:14:02', label: 'Session connected · Intelligence live', type: 'system' },
  ]);

  // Current Core state & Audio levels
  const [coreState, setCoreState] = useState<CoreState>('LISTENING');
  const [demoAudioLevels, setDemoAudioLevels] = useState({ bass: 0.15, mid: 0.1, treble: 0.1 });
  const [stateLabel, setStateLabel] = useState('Listening');

  // Modals
  const [isCatchMeUpOpen, setIsCatchMeUpOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [showWorkspaceLeaveModal, setShowWorkspaceLeaveModal] = useState(false);

  // Voice Bridge for Real-time Backend connection
  const voiceBridge = useVoiceBridge();

  // Audio visualization hook for status bar spectrum (Fallback for demo)
  const { frequencies: liveFrequencies, micError, retryLiveMic } = useAudioVisualization(isLiveMic, isMuted);

  // Sync Voice Bridge to Core State
  useEffect(() => {
    if (isLiveMic) {
      if (voiceBridge.isBargeIn) {
        setCoreState('AI_INTERRUPTED');
      } else if (voiceBridge.levels.isAiSpeaking) {
        setCoreState('AI_SPEAKING');
      } else if (voiceBridge.levels.micLevel > 0.05) {
        setCoreState('USER_SPEAKING');
      } else {
        setCoreState('LISTENING');
      }
    }
  }, [isLiveMic, voiceBridge.levels, voiceBridge.isBargeIn]);

  const processedAppTranscriptsCount = useRef(0);

  // Sync Voice Bridge Transcripts & Translations
  useEffect(() => {
    if (voiceBridge.transcripts.length > processedAppTranscriptsCount.current) {
      const newTranscripts = voiceBridge.transcripts.slice(processedAppTranscriptsCount.current);
      processedAppTranscriptsCount.current = voiceBridge.transcripts.length;
      
      setTranscriptItems((prev) => {
        const newItems: TranscriptItemData[] = newTranscripts.map((t, idx) => {
          const isUser = t.speaker.toLowerCase().includes('user') || t.speaker.toLowerCase().includes('speaker');
          return {
            id: `t-${Date.now()}-${idx}`,
            speaker: isUser ? 'You (Speaker)' : 'AuraLive AI',
            text: t.text,
            language: 'en',
            translation: t.translation,
            timestamp: new Date().toLocaleTimeString([], { hour12: false }),
            isAI: !isUser,
          };
        });
        
        // Deduplicate exactly identical sequential messages (prevent edge cases)
        const combined = [...prev];
        for (const item of newItems) {
          const last = combined[combined.length - 1];
          if (!last || last.text.trim() !== item.text.trim()) {
            combined.push(item);
          }
        }
        return combined;
      });
    }
  }, [voiceBridge.transcripts]);

  // Sync Live Backend Tasks & Decisions from Context Engine
  useEffect(() => {
    if (voiceBridge.sessionState) {
      const { tasks: backendTasks, decisions: backendDecisions } = voiceBridge.sessionState;
      if (Array.isArray(backendTasks) && backendTasks.length > 0) {
        setTasks((prev) => {
          const newTasks = [...prev];
          backendTasks.forEach((bt: any, idx: number) => {
            const taskTitle = bt.task || bt.title || bt.taskDesc;
            if (taskTitle && !newTasks.some((t) => t.title.toLowerCase() === taskTitle.toLowerCase())) {
              newTasks.push({
                id: `bt-${idx}-${Date.now()}`,
                title: taskTitle,
                owner: bt.owner || 'AI Co-pilot',
                deadline: bt.deadline || 'Pending',
                status: 'confirmed',
              });
            }
          });
          return newTasks;
        });
      }
      if (Array.isArray(backendDecisions) && backendDecisions.length > 0) {
        setDecisions((prev) => {
          const newDecisions = [...prev];
          backendDecisions.forEach((bd: any, idx: number) => {
            const decText = typeof bd === 'string' ? bd : bd.text || bd.decision;
            if (decText && !newDecisions.some((d) => d.text.toLowerCase() === decText.toLowerCase())) {
              newDecisions.push({
                id: `bd-${idx}-${Date.now()}`,
                text: decText,
                actor: bd.actor || 'AuraLive AI',
                timestamp: new Date().toLocaleTimeString([], { hour12: false }),
              });
            }
          });
          return newDecisions;
        });
      }
    }
  }, [voiceBridge.sessionState]);

  // Sync Live System Actions
  useEffect(() => {
    if (voiceBridge.systemActions.length > 0) {
      const lastAction = voiceBridge.systemActions[voiceBridge.systemActions.length - 1];
      if (lastAction) {
        setTimelineEvents((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour12: false }),
            type: 'agent_action',
            description: `${lastAction.action}: ${lastAction.target}`,
          },
        ]);
      }
    }
  }, [voiceBridge.systemActions]);

  const isAiSpeaking = coreState === 'AI_SPEAKING';
  const isVoiceSpeaking = coreState === 'USER_SPEAKING';
  
  const smoothedAmplitude = isLiveMic 
    ? (isAiSpeaking ? voiceBridge.levels.aiLevel : voiceBridge.levels.micLevel)
    : (demoAudioLevels.bass + demoAudioLevels.mid + demoAudioLevels.treble) / 3;

  // Timer reference for demo playback
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const clockTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Format seconds to HH:MM:SS
  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `00:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formattedSessionTime = formatTimer(sessionTimeSeconds);

  // Clock progression
  useEffect(() => {
    clockTimerRef.current = setInterval(() => {
      setSessionTimeSeconds((prev) => prev + 1);
    }, 1000);
    return () => {
      if (clockTimerRef.current) clearInterval(clockTimerRef.current);
    };
  }, []);

  // Apply a scripted step to state
  const applyScriptStep = useCallback((stepIdx: number) => {
    const step = MOCK_SCRIPT_STEPS[stepIdx];
    if (!step) return;

    setCoreState(step.coreState);
    setDemoAudioLevels(step.audioLevels);

    // Update active speaking participant
    setParticipants((prev) =>
      prev.map((p) => ({
        ...p,
        isSpeaking: p.id === step.activeSpeakerId,
      }))
    );

    // Dynamic State Label underneath Avatar
    if (step.coreState === 'USER_SPEAKING' && step.activeSpeakerId) {
      const spk = INITIAL_PARTICIPANTS.find((p) => p.id === step.activeSpeakerId)?.name;
      setStateLabel(`${spk} is speaking`);
    } else if (step.coreState === 'TRANSLATING') {
      setStateLabel('Translating');
    } else if (step.coreState === 'AI_SPEAKING') {
      setStateLabel('AI speaking');
    } else if (step.coreState === 'AI_INTERRUPTED') {
      setStateLabel('Interrupted');
    } else {
      setStateLabel('Listening');
    }

    // Add new transcript
    if (step.newTranscript) {
      setTranscriptItems((prev) => {
        if (prev.some((t) => t.id === step.newTranscript!.id)) return prev;
        return [...prev, step.newTranscript!];
      });
    }

    // Add new decision
    if (step.newDecision) {
      setDecisions((prev) => {
        if (prev.some((d) => d.id === step.newDecision!.id)) return prev;
        return [...prev, step.newDecision!];
      });
    }

    // Add new task
    if (step.newTask) {
      setTasks((prev) => {
        if (prev.some((t) => t.id === step.newTask!.id)) return prev;
        return [...prev, step.newTask!];
      });
    }

    // Add new question
    if (step.newQuestion) {
      setQuestions((prev) => {
        if (prev.some((q) => q.id === step.newQuestion!.id)) return prev;
        return [...prev, step.newQuestion!];
      });
    }

    // Add timeline event
    if (step.timelineEvent) {
      setTimelineEvents((prev) => [...prev, step.timelineEvent!]);
    }
  }, []);

  // Demo playback loop
  useEffect(() => {
    if (isLiveMic || !isPlayingDemo) {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
      return;
    }

    if (currentStepIndex < MOCK_SCRIPT_STEPS.length - 1) {
      const nextIdx = currentStepIndex + 1;
      const currentOffset = MOCK_SCRIPT_STEPS[currentStepIndex].timeOffsetMs;
      const nextOffset = MOCK_SCRIPT_STEPS[nextIdx].timeOffsetMs;
      const delay = Math.max(1200, nextOffset - currentOffset);

      stepTimerRef.current = setTimeout(() => {
        setCurrentStepIndex(nextIdx);
        applyScriptStep(nextIdx);
      }, delay);
    } else {
      setIsPlayingDemo(false);
    }

    return () => {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    };
  }, [currentStepIndex, isPlayingDemo, isLiveMic, applyScriptStep]);

  // Initial step setup on mount
  useEffect(() => {
    applyScriptStep(0);
  }, [applyScriptStep]);

  // Toggle Live Mic Mode vs Demo Playback
  const handleToggleLiveMic = () => {
    setIsLiveMic((prev) => {
      const nextVal = !prev;
      if (nextVal) {
        setIsPlayingDemo(false);
        setCoreState('LISTENING');
        setStateLabel('Listening');
        setParticipants((p) => p.map((item) => ({ ...item, isSpeaking: false })));
      } else {
        setIsPlayingDemo(true);
      }
      return nextVal;
    });
  };

  // Step forward manually in demo
  const handleStepForwardDemo = () => {
    if (currentStepIndex < MOCK_SCRIPT_STEPS.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      applyScriptStep(nextIdx);
    }
  };

  // Reset demo to beginning
  const handleResetDemo = () => {
    setCurrentStepIndex(0);
    setTranscriptItems([]);
    setDecisions([]);
    setTasks([]);
    setQuestions([]);
    setTimelineEvents([{ time: '00:14:02', label: 'Session connected · Intelligence live', type: 'system' }]);
    setSessionTimeSeconds(14 * 60 + 2);
    applyScriptStep(0);
    setIsPlayingDemo(true);
  };

  // Task actions
  const handleTaskStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  const handleTaskEdit = (
    taskId: string,
    newTitle: string,
    newOwner: string,
    newDeadline: string
  ) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, title: newTitle, owner: newOwner, deadline: newDeadline, status: 'edited' }
          : t
      )
    );
  };

  // Question resolve action
  const handleResolveQuestion = (questionId: string, resolution: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId ? { ...q, status: 'resolved', resolution } : q
      )
    );
    setTimelineEvents((prev) => [
      ...prev,
      { time: formattedSessionTime, label: `Question resolved: ${resolution}`, type: 'question' },
    ]);
  };

  // Back Navigation from Workspace
  const handleWorkspaceBackRequest = () => {
    if (isLiveMic) {
      setShowWorkspaceLeaveModal(true);
    } else {
      performLeaveWorkspace();
    }
  };

  const performLeaveWorkspace = () => {
    setIsLiveMic(false);
    setIsPlayingDemo(false);
    setHomeFeature('home');
    setCurrentScreen('assistant_home');
  };

  // Active audio levels for status bar
  const activeAudioLevels = isLiveMic
    ? {
        bass: isMuted ? 0.05 : liveFrequencies.bass,
        mid: isMuted ? 0.05 : liveFrequencies.mid,
        treble: isMuted ? 0.05 : liveFrequencies.treble,
      }
    : isMuted
    ? { bass: 0.05, mid: 0.05, treble: 0.05 }
    : demoAudioLevels;

  // Active audio status string for bar
  const audioStatusBarStatus = micError
    ? 'error'
    : isMuted
    ? 'muted'
    : isLiveMic
    ? isVoiceSpeaking
      ? 'speaking'
      : 'listening'
    : coreState === 'USER_SPEAKING' || coreState === 'AI_SPEAKING'
    ? 'speaking'
    : 'listening';

  // Dynamic Avatar status label
  const avatarStatusLabel = isLiveMic
    ? isVoiceSpeaking
      ? 'User speaking'
      : isAiSpeaking
      ? 'AI speaking'
      : 'Listening...'
    : stateLabel;

  // If on hero screen, show the landing hero
  if (currentScreen === 'hero') {
    return <HeroScreen onEnterWorkspace={() => setCurrentScreen('assistant_home')} />;
  }

  // If on assistant_home screen (Screen 2), show the conversational AI Assistant Home Screen
  if (currentScreen === 'assistant_home') {
    return (
      <AssistantHomeScreen
        initialFeature={homeFeature}
        onStartSession={(mode) => {
          setWorkspaceMode(mode);
          if (mode === 'live') {
            setIsLiveMic(true);
            setIsPlayingDemo(false);
          } else {
            setIsLiveMic(false);
            handleResetDemo();
          }
          setCurrentScreen('workspace');
        }}
        onReturnToLanding={() => {
          setHomeFeature('home');
          setCurrentScreen('hero');
        }}
      />
    );
  }

  // Get color for Core status indicator dot
  const getStatusDotColor = () => {
    if (isVoiceSpeaking) return 'bg-[#3ECF8E]';
    if (isAiSpeaking) return 'bg-[#7FFFD4]';
    if (coreState === 'AI_INTERRUPTED') return 'bg-[#EF4B52]';
    if (coreState === 'TRANSLATING') return 'bg-[#E3A54A]';
    return 'bg-[#7FFFD4]';
  };

  return (
    <>
      <AppShell
        mobileActiveTab={mobileActiveTab}
        onMobileTabChange={setMobileActiveTab}
        isTabletDrawerOpen={isTabletDrawerOpen}
        onCloseTabletDrawer={() => setIsTabletDrawerOpen(false)}
        onBackToPrevious={handleWorkspaceBackRequest}
        header={
          <Header
            sessionTime={formattedSessionTime}
            isLiveMic={isLiveMic}
            isPlayingDemo={isPlayingDemo}
            onTogglePlayDemo={() => setIsPlayingDemo((p) => !p)}
            onStepForwardDemo={handleStepForwardDemo}
            onResetDemo={handleResetDemo}
            onToggleLiveMic={handleToggleLiveMic}
            onCatchMeUp={() => setIsCatchMeUpOpen(true)}
            onOpenMobileDrawer={() => setIsTabletDrawerOpen(true)}
            onReturnToHero={() => setCurrentScreen('assistant_home')}
            onBackToPrevious={handleWorkspaceBackRequest}
            backLabel={workspaceMode === 'live' ? 'Back' : 'Back to Transcript'}
          />
        }
        participantsColumn={
          <ParticipantList
            participants={participants}
            languages={languages}
            activeLanguageCode={coreState === 'TRANSLATING' ? 'hi' : undefined}
          />
        }
        centerColumn={
          <div className="flex flex-col h-full overflow-hidden select-none">
            {/* Upper-Middle Center Stage: Cute Robot Avatar with Real-time Speech Sync */}
            <div className="h-[48%] w-full flex flex-col items-center justify-center relative shrink-0">
              {/* Robot Persona Switcher */}
              <div className="absolute top-2 z-10">
                <AvatarSwitcher
                  gender={avatarGender}
                  onGenderChange={(g) => setAvatarGender(g)}
                />
              </div>

              {/* Cute 3D Animated Robot Companion */}
              <HumanAvatar
                gender={avatarGender}
                isSpeaking={isVoiceSpeaking || isAiSpeaking}
                amplitude={smoothedAmplitude}
                connectionState={coreState}
                isAiSpeaking={isAiSpeaking}
                isUserSpeaking={isVoiceSpeaking}
                className="mt-6"
              />

              {/* Status Label directly underneath Avatar */}
              <div className="absolute bottom-1 flex items-center gap-2 px-3 py-1 rounded-full bg-[#050505]/90 border border-[#26292F] text-xs font-medium text-[#EDEFF2] shadow-sm">
                <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor()} animate-pulse`} />
                <span>{avatarStatusLabel}</span>
              </div>
            </div>

            {/* Subtle Divider */}
            <div className="w-full my-2 border-b border-[#26292F]/50 shrink-0" />

            {/* Live Transcript Feed below Avatar */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <div className="text-[10px] font-bold text-[#5F6773] tracking-widest uppercase mb-2">
                LIVE TRANSCRIPT
              </div>
              <div className="flex-1 min-h-0">
                <TranscriptPanel
                  items={transcriptItems}
                  activeSpeaker={
                    participants.find((p) => p.isSpeaking)?.name ||
                    (isLiveMic && isVoiceSpeaking ? 'You (Microphone)' : null)
                  }
                  liveInterimText={
                    isLiveMic && isVoiceSpeaking
                      ? 'Transcribing your speech in real time...'
                      : undefined
                  }
                />
              </div>
            </div>
          </div>
        }
        intelligenceColumn={
          <IntelligencePanel
            decisions={decisions}
            tasks={tasks}
            questions={questions}
            onTaskStatusChange={handleTaskStatusChange}
            onTaskEdit={handleTaskEdit}
            onResolveQuestion={handleResolveQuestion}
            onCatchMeUp={() => setIsCatchMeUpOpen(true)}
          />
        }
        bottomBar={
          <AudioStatusBar
            status={audioStatusBarStatus}
            statusLabel={avatarStatusLabel}
            statusSublabel={micError || (workspaceMode === 'live' ? 'Live mic sync' : 'Demo simulation')}
            audioLevels={activeAudioLevels}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted((p) => !p)}
            onCatchMeUp={() => setIsCatchMeUpOpen(true)}
            onEndSession={() => setIsSummaryOpen(true)}
            onRetryConnection={retryLiveMic}
          />
        }
      />

      {/* Confirmation modal before leaving active live session */}
      <LeaveSessionModal
        isOpen={showWorkspaceLeaveModal}
        onStay={() => setShowWorkspaceLeaveModal(false)}
        onLeave={() => {
          setShowWorkspaceLeaveModal(false);
          performLeaveWorkspace();
        }}
        title="Leave live session?"
        description="Your active microphone capture and transcription session will be stopped."
      />

      {/* Catch Me Up Modal */}
      <CatchMeUpModal
        isOpen={isCatchMeUpOpen}
        onClose={() => setIsCatchMeUpOpen(false)}
        sessionTime={formattedSessionTime}
        decisions={decisions}
        tasks={tasks}
        questions={questions}
      />

      {/* Session Summary Modal */}
      <SessionSummary
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        onStartNewSession={() => {
          setIsSummaryOpen(false);
          handleResetDemo();
        }}
        duration={formattedSessionTime}
        participantCount={participants.length}
        languageCount={languages.length}
        decisions={decisions}
        tasks={tasks}
        questions={questions}
        timelineEvents={timelineEvents}
      />
    </>
  );
}
