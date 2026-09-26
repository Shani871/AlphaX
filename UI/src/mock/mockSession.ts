/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CoreState =
  | 'IDLE'
  | 'LISTENING'
  | 'USER_SPEAKING'
  | 'AI_SPEAKING'
  | 'AI_INTERRUPTED'
  | 'TRANSLATING';

export type TaskStatus = 'pending' | 'confirmed' | 'edited' | 'ignored';

export interface TaskItem {
  id: string;
  title: string;
  owner: string;
  deadline: string;
  status: TaskStatus;
  timestamp: string;
}

export interface DecisionItem {
  id: string;
  text: string;
  actor: string;
  timestamp: string;
}

export interface QuestionItem {
  id: string;
  text: string;
  asker: string;
  status: 'unresolved' | 'resolved';
  resolution?: string;
  timestamp: string;
}

export interface Participant {
  id: string;
  name: string;
  role: string;
  isSpeaking: boolean;
  language: string;
  color: string;
}

export interface TranscriptItemData {
  id: string;
  speaker: string;
  text: string;
  language: string;
  translation?: string;
  timestamp: string;
  isAI?: boolean;
  inlineEvent?: {
    type: 'decision' | 'task' | 'question' | 'language' | 'interruption';
    title: string;
    detail?: string;
  };
}

export interface TimelineEvent {
  time: string;
  label: string;
  type: 'decision' | 'task' | 'question' | 'interruption' | 'system';
}

export interface ScriptStep {
  stepId: number;
  timeOffsetMs: number;
  displayTime: string;
  coreState: CoreState;
  activeSpeakerId: string | null;
  audioLevels: { bass: number; mid: number; treble: number };
  newTranscript?: TranscriptItemData;
  newDecision?: DecisionItem;
  newTask?: TaskItem;
  newQuestion?: QuestionItem;
  systemNotification?: string;
  timelineEvent?: TimelineEvent;
}

// Neutral speaker labels (Speaker 1, Speaker 2, Speaker 3) per user request Section 12
export const INITIAL_PARTICIPANTS: Participant[] = [
  { id: 'speaker-1', name: 'Speaker 1', role: 'Team Lead', isSpeaking: false, language: 'English', color: '#7FFFD4' },
  { id: 'speaker-2', name: 'Speaker 2', role: 'Engineering', isSpeaking: false, language: 'Hindi / English', color: '#3ECF8E' },
  { id: 'speaker-3', name: 'Speaker 3', role: 'Operations', isSpeaking: false, language: 'Telugu', color: '#E3A54A' },
];

export const INITIAL_LANGUAGES = [
  { code: 'en', name: 'English (US)', flag: '🇺🇸', speakerCount: 1, percent: 50 },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳', speakerCount: 1, percent: 25 },
  { code: 'te', name: 'Telugu', flag: '🇮🇳', speakerCount: 1, percent: 25 },
];

export const MOCK_SCRIPT_STEPS: ScriptStep[] = [
  {
    stepId: 0,
    timeOffsetMs: 0,
    displayTime: '00:14:02',
    coreState: 'LISTENING',
    activeSpeakerId: null,
    audioLevels: { bass: 0.15, mid: 0.1, treble: 0.1 },
    systemNotification: 'AuraLife workspace synced. Multi-speaker voice intelligence active.',
    timelineEvent: { time: '00:14:02', label: 'Session connected', type: 'system' }
  },
  {
    stepId: 1,
    timeOffsetMs: 2200,
    displayTime: '00:14:05',
    coreState: 'USER_SPEAKING',
    activeSpeakerId: 'speaker-1',
    audioLevels: { bass: 0.72, mid: 0.65, treble: 0.58 },
    newTranscript: {
      id: 't-1',
      speaker: 'Speaker 1',
      text: "Morning everyone. Let's do a quick alignment on the release schedule.",
      language: 'en',
      timestamp: '10:42:05'
    }
  },
  {
    stepId: 2,
    timeOffsetMs: 5000,
    displayTime: '00:14:10',
    coreState: 'TRANSLATING',
    activeSpeakerId: 'speaker-2',
    audioLevels: { bass: 0.68, mid: 0.74, treble: 0.45 },
    newTranscript: {
      id: 't-2',
      speaker: 'Speaker 2',
      text: "Haan, database migration abhi chal raha hai, par Friday tak ready hona thoda tight hai.",
      language: 'hi',
      translation: "Yes, database migration is in progress right now, but being ready by Friday is a bit tight.",
      timestamp: '10:42:10',
      inlineEvent: {
        type: 'language',
        title: 'Hindi detected',
        detail: 'Live translation stream enabled'
      }
    },
    timelineEvent: { time: '00:14:10', label: 'Hindi detected with live translation', type: 'system' }
  },
  {
    stepId: 3,
    timeOffsetMs: 8200,
    displayTime: '00:14:16',
    coreState: 'USER_SPEAKING',
    activeSpeakerId: 'speaker-1',
    audioLevels: { bass: 0.62, mid: 0.58, treble: 0.49 },
    newTranscript: {
      id: 't-3',
      speaker: 'Speaker 1',
      text: "Understood. Can we realistically push it to next Monday without impacting the frontend launch?",
      language: 'en',
      timestamp: '10:42:16',
      inlineEvent: {
        type: 'question',
        title: 'Unresolved Question Detected',
        detail: 'Frontend launch dependency on Monday release'
      }
    },
    newQuestion: {
      id: 'q-1',
      text: 'Can we realistically push database migration to next Monday without impacting the frontend launch?',
      asker: 'Speaker 1',
      status: 'unresolved',
      timestamp: '10:42:16'
    },
    timelineEvent: { time: '00:14:16', label: 'Question detected: Frontend launch dependency', type: 'question' }
  },
  {
    stepId: 4,
    timeOffsetMs: 11400,
    displayTime: '00:14:22',
    coreState: 'USER_SPEAKING',
    activeSpeakerId: 'speaker-2',
    audioLevels: { bass: 0.55, mid: 0.69, treble: 0.52 },
    newTranscript: {
      id: 't-4',
      speaker: 'Speaker 2',
      text: "Yes, if we push database migration to Monday, frontend can cut their release on Tuesday without downtime.",
      language: 'en',
      timestamp: '10:42:22'
    }
  },
  {
    stepId: 5,
    timeOffsetMs: 14500,
    displayTime: '00:14:28',
    coreState: 'USER_SPEAKING',
    activeSpeakerId: 'speaker-1',
    audioLevels: { bass: 0.78, mid: 0.64, treble: 0.61 },
    newTranscript: {
      id: 't-5',
      speaker: 'Speaker 1',
      text: "Great, let's lock that in: release deadline is officially moved from Friday to Monday.",
      language: 'en',
      timestamp: '10:42:28',
      inlineEvent: {
        type: 'decision',
        title: 'Decision Detected',
        detail: 'Release deadline moved from Friday to Monday'
      }
    },
    newDecision: {
      id: 'd-1',
      text: 'Release deadline moved from Friday to Monday',
      actor: 'Speaker 1',
      timestamp: '10:42:28'
    },
    timelineEvent: { time: '00:14:28', label: 'Decision: Deadline moved from Friday to Monday', type: 'decision' }
  },
  {
    stepId: 6,
    timeOffsetMs: 17800,
    displayTime: '00:14:35',
    coreState: 'USER_SPEAKING',
    activeSpeakerId: 'speaker-1',
    audioLevels: { bass: 0.7, mid: 0.62, treble: 0.55 },
    newTranscript: {
      id: 't-6',
      speaker: 'Speaker 1',
      text: "Speaker 2, can you finalize the migration script and notify the team by 5 PM today?",
      language: 'en',
      timestamp: '10:42:35',
      inlineEvent: {
        type: 'task',
        title: 'Task Detected',
        detail: 'Finalize migration script · Speaker 2 · Today, 5:00 PM'
      }
    },
    newTask: {
      id: 'task-1',
      title: 'Finalize database migration script & notify team',
      owner: 'Speaker 2',
      deadline: 'Today, 5:00 PM',
      status: 'pending',
      timestamp: '10:42:35'
    },
    timelineEvent: { time: '00:14:35', label: 'Task extracted: Migration script for Speaker 2', type: 'task' }
  },
  {
    stepId: 7,
    timeOffsetMs: 21000,
    displayTime: '00:14:41',
    coreState: 'AI_SPEAKING',
    activeSpeakerId: null,
    audioLevels: { bass: 0.65, mid: 0.55, treble: 0.45 },
    newTranscript: {
      id: 't-7',
      speaker: 'Aura AI',
      text: "I've noted the deadline change to Monday and logged the migration task for Speaker 2 by 5 PM. Should I update the project board...",
      language: 'en',
      timestamp: '10:42:41',
      isAI: true
    }
  },
  {
    stepId: 8,
    timeOffsetMs: 23200,
    displayTime: '00:14:45',
    coreState: 'AI_INTERRUPTED',
    activeSpeakerId: 'speaker-1',
    audioLevels: { bass: 0.88, mid: 0.82, treble: 0.75 },
    newTranscript: {
      id: 't-8',
      speaker: 'Speaker 1',
      text: "Wait, actually make sure the staging replica is backed up first!",
      language: 'en',
      timestamp: '10:42:45',
      inlineEvent: {
        type: 'interruption',
        title: 'AI Interrupted by Speaker 1',
        detail: 'Halted project automation to prioritize backup'
      }
    },
    timelineEvent: { time: '00:14:45', label: 'AI interrupted by Speaker 1: Prioritize staging backup', type: 'interruption' }
  },
  {
    stepId: 9,
    timeOffsetMs: 26000,
    displayTime: '00:14:51',
    coreState: 'USER_SPEAKING',
    activeSpeakerId: 'speaker-3',
    audioLevels: { bass: 0.6, mid: 0.72, treble: 0.65 },
    newTranscript: {
      id: 't-9',
      speaker: 'Speaker 3',
      text: "నేను ఈ ఉదయం 9 గంటలకు స్టేజింగ్ పూర్తి స్నాప్‌షాట్ తీసుకున్నాను, కాబట్టి ప్రతిరూపం సురక్షితం.",
      language: 'te',
      translation: "I took a full snapshot of staging this morning at 9 AM, so the replica is already covered.",
      timestamp: '10:42:51',
      inlineEvent: {
        type: 'decision',
        title: 'Decision Confirmed',
        detail: 'Staging replica snapshot verified and safe'
      }
    },
    newDecision: {
      id: 'd-2',
      text: 'Staging replica snapshot verified (9:00 AM snapshot safe)',
      actor: 'Speaker 3',
      timestamp: '10:42:51'
    },
    timelineEvent: { time: '00:14:51', label: 'Decision: Staging snapshot verified by Speaker 3', type: 'decision' }
  },
  {
    stepId: 10,
    timeOffsetMs: 29500,
    displayTime: '00:14:58',
    coreState: 'USER_SPEAKING',
    activeSpeakerId: 'speaker-3',
    audioLevels: { bass: 0.58, mid: 0.66, treble: 0.5 },
    newTranscript: {
      id: 't-10',
      speaker: 'Speaker 3',
      text: "మైగ్రేషన్ పూర్తయిన తర్వాత పనితీరు బెంచ్‌మార్క్ పరీక్షకు ఎవరు బాధ్యత వహిస్తారు?",
      language: 'te',
      translation: "Who is on point for the performance benchmark testing once the migration completes?",
      timestamp: '10:42:58',
      inlineEvent: {
        type: 'question',
        title: 'Unresolved Question Detected',
        detail: 'Owner needed for performance benchmark testing'
      }
    },
    newQuestion: {
      id: 'q-2',
      text: 'Who is on point for performance benchmark testing post-migration?',
      asker: 'Speaker 3',
      status: 'unresolved',
      timestamp: '10:42:58'
    },
    timelineEvent: { time: '00:14:58', label: 'Question detected: Performance benchmark owner', type: 'question' }
  },
  {
    stepId: 11,
    timeOffsetMs: 33000,
    displayTime: '00:15:04',
    coreState: 'USER_SPEAKING',
    activeSpeakerId: 'speaker-1',
    audioLevels: { bass: 0.65, mid: 0.6, treble: 0.52 },
    newTranscript: {
      id: 't-11',
      speaker: 'Speaker 1',
      text: "I can run the benchmarks on Tuesday morning once Speaker 2 deploys the staging build.",
      language: 'en',
      timestamp: '10:43:04'
    },
    newTask: {
      id: 'task-2',
      title: 'Run performance benchmark tests on staging build',
      owner: 'Speaker 1',
      deadline: 'Tuesday morning',
      status: 'pending',
      timestamp: '10:43:04'
    },
    timelineEvent: { time: '00:15:04', label: 'Task extracted: Benchmarks on Tuesday for Speaker 1', type: 'task' }
  },
  {
    stepId: 12,
    timeOffsetMs: 36000,
    displayTime: '00:15:10',
    coreState: 'LISTENING',
    activeSpeakerId: null,
    audioLevels: { bass: 0.18, mid: 0.12, treble: 0.08 },
    systemNotification: 'Discussion converged. 2 decisions logged, 2 tasks pending confirmation, 1 question unresolved.',
  }
];
