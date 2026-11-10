import type { GuestSnapshot, SavedProgress } from '../types';

const AUTH_KEY = 'fretlogic.auth';
const GUEST_KEY = 'fretlogic.guest';
const GUEST_SNAPSHOT_KEY = 'fretlogic.guest.snapshot';

export interface StoredAuth {
  token: string;
}

const defaultProgress: SavedProgress = {
  lastVisitedExercise: 'dashboard',
  noteMachineStateJson: JSON.stringify({ bpm: 90, pacePreset: 'MEDIUM', fretCount: 15, targetNote: 'C', pathIndex: 0, selectedPromptNote: 'ALL', sequenceIndex: 0, preferSharps: true, includeAccidentals: true }),
  scaleMachineStateJson: JSON.stringify({ rootNote: 'E', scaleType: 'major', showLabels: true }),
  savedSettingsJson: JSON.stringify({ bpm: 90, pacePreset: 'MEDIUM', fretCount: 15, preferSharps: true, includeAccidentals: true }),
  activeTuning: 'standard',
  showNoteLabels: true,
  selectedScaleType: 'major',
  selectedRootNote: 'E',
};

function normalizeSavedProgress(progress?: Partial<SavedProgress> | null): SavedProgress {
  return {
    ...structuredClone(defaultProgress),
    ...(progress ?? {}),
  };
}

export function readJson<T>(key: string, fallback: T): T {
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function readAuth(): StoredAuth | null {
  return readJson<StoredAuth | null>(AUTH_KEY, null);
}

export function writeAuth(value: StoredAuth | null) {
  if (!value) {
    window.localStorage.removeItem(AUTH_KEY);
    return;
  }
  writeJson(AUTH_KEY, value);
}

export function readGuestMode() {
  return window.localStorage.getItem(GUEST_KEY) === 'true';
}

export function writeGuestMode(enabled: boolean) {
  if (enabled) {
    window.localStorage.setItem(GUEST_KEY, 'true');
    return;
  }
  window.localStorage.removeItem(GUEST_KEY);
}

export function defaultGuestSnapshot(): GuestSnapshot {
  const now = new Date().toISOString();
  return {
    dashboard: {
      stats: [
        { label: 'Notes Learned', value: '0/12', helper: 'Guest progress stored on this device' },
        { label: 'Scale Shapes Learned', value: '0', helper: 'Manual mastery checkoffs' },
        { label: 'Scales Completed', value: '0', helper: 'All 5 shapes learned in one scale' },
        { label: 'Favorite Scales', value: '0', helper: 'Saved scale snapshots' },
      ],
      noteMastery: [],
      learnedScaleShapes: [],
      learningQueue: [],
      recentWins: [
        { title: 'Guest Mode Ready', detail: 'Local practice tracking enabled', timestamp: now },
      ],
      milestones: [],
      lastVisitedExercise: 'dashboard',
    },
    savedProgress: defaultProgress,
    practiceSessions: [],
    exerciseResults: [],
    favoriteScales: [],
    learnedNotes: [],
    learnedScaleShapes: [],
  };
}

export function readGuestSnapshot(): GuestSnapshot {
  const fallback = defaultGuestSnapshot();
  const raw = readJson<GuestSnapshot>(GUEST_SNAPSHOT_KEY, fallback);
  return {
    ...fallback,
    ...raw,
    dashboard: {
      ...fallback.dashboard,
      ...(raw.dashboard ?? {}),
      stats: Array.isArray(raw.dashboard?.stats) ? raw.dashboard.stats : fallback.dashboard.stats,
      noteMastery: Array.isArray(raw.dashboard?.noteMastery) ? raw.dashboard.noteMastery : fallback.dashboard.noteMastery,
      learnedScaleShapes: Array.isArray(raw.dashboard?.learnedScaleShapes) ? raw.dashboard.learnedScaleShapes : fallback.dashboard.learnedScaleShapes,
      learningQueue: Array.isArray(raw.dashboard?.learningQueue) ? raw.dashboard.learningQueue : fallback.dashboard.learningQueue,
      recentWins: Array.isArray(raw.dashboard?.recentWins) ? raw.dashboard.recentWins : fallback.dashboard.recentWins,
      milestones: Array.isArray(raw.dashboard?.milestones) ? raw.dashboard.milestones : fallback.dashboard.milestones,
    },
    savedProgress: normalizeSavedProgress(raw.savedProgress),
    practiceSessions: Array.isArray(raw.practiceSessions) ? raw.practiceSessions : [],
    exerciseResults: Array.isArray(raw.exerciseResults) ? raw.exerciseResults : [],
    favoriteScales: Array.isArray(raw.favoriteScales) ? raw.favoriteScales : [],
    learnedNotes: Array.isArray(raw.learnedNotes) ? raw.learnedNotes : [],
    learnedScaleShapes: Array.isArray(raw.learnedScaleShapes) ? raw.learnedScaleShapes : [],
  };
}

export function writeGuestSnapshot(snapshot: GuestSnapshot) {
  writeJson(GUEST_SNAPSHOT_KEY, snapshot);
}

export function defaultSavedProgress() {
  return structuredClone(defaultProgress);
}
