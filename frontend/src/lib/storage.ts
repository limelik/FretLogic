import type { GuestSnapshot, SavedProgress } from '../types';

const AUTH_KEY = 'fretlogic.auth';
const GUEST_KEY = 'fretlogic.guest';
const GUEST_SNAPSHOT_KEY = 'fretlogic.guest.snapshot';

export interface StoredAuth {
  token: string;
}

const defaultProgress: SavedProgress = {
  lastVisitedExercise: 'dashboard',
  noteMachineStateJson: JSON.stringify({ score: 0, streak: 0, attempts: 0, correct: 0, bpm: 72, pacePreset: 'MEDIUM', fretCount: 15, autoAdvance: true }),
  scaleMachineStateJson: JSON.stringify({ rootNote: 'E', scaleType: 'major', showLabels: true }),
  savedSettingsJson: JSON.stringify({ bpm: 72, pacePreset: 'MEDIUM', fretCount: 15, autoAdvance: true, preferSharps: true }),
  activeTuning: 'standard',
  showNoteLabels: true,
  selectedScaleType: 'major',
  selectedRootNote: 'E',
};

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
        { label: 'Completed Exercises', value: '0', helper: 'Guest progress stored on this device' },
        { label: 'Accuracy', value: '0%', helper: 'Starts building after first drill' },
        { label: 'Streak', value: '0 days', helper: 'Come back tomorrow to build run' },
        { label: 'Favorite Scales', value: '0', helper: 'Save scale maps locally' },
      ],
      recentActivity: [
        { title: 'Guest Mode Ready', detail: 'Local practice tracking enabled', timestamp: now },
      ],
      accuracyTrend: [],
      practiceVolume: [],
      streak: 0,
      lastVisitedExercise: 'dashboard',
    },
    savedProgress: defaultProgress,
    practiceSessions: [],
    exerciseResults: [],
    favoriteScales: [],
  };
}

export function readGuestSnapshot(): GuestSnapshot {
  return readJson<GuestSnapshot>(GUEST_SNAPSHOT_KEY, defaultGuestSnapshot());
}

export function writeGuestSnapshot(snapshot: GuestSnapshot) {
  writeJson(GUEST_SNAPSHOT_KEY, snapshot);
}

export function defaultSavedProgress() {
  return structuredClone(defaultProgress);
}
