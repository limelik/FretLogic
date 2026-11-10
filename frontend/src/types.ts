export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
export type ExerciseType = 'NOTE_MACHINE' | 'SCALE_MACHINE' | 'THEORY_REVIEW';

export interface UserSummary {
  id: number;
  displayName: string;
  email: string;
  profileHeadline: string;
  avatarGradient: string;
}

export interface AuthResponse {
  token: string;
  user: UserSummary;
}

export interface SavedProgress {
  id?: number;
  lastVisitedExercise: string;
  noteMachineStateJson: string;
  scaleMachineStateJson: string;
  savedSettingsJson: string;
  activeTuning: string;
  showNoteLabels: boolean;
  selectedScaleType: string;
  selectedRootNote: string;
  updatedAt?: string;
}

export interface StatCard {
  label: string;
  value: string;
  helper: string;
}

export interface DashboardActivity {
  title: string;
  detail: string;
  timestamp: string;
}

export interface NoteMasteryItem {
  noteName: string;
  label: string;
  learned: boolean;
  learnedAt?: string;
}

export interface LearnedScaleShape {
  id?: number;
  rootNote: string;
  scaleType: string;
  shapeId: string;
  learnedAt: string;
}

export interface LearningQueueItem {
  title: string;
  detail: string;
  href: string;
}

export interface Milestone {
  title: string;
  detail: string;
  unlocked: boolean;
}

export interface DashboardResponse {
  stats: StatCard[];
  noteMastery: NoteMasteryItem[];
  learnedScaleShapes: LearnedScaleShape[];
  learningQueue: LearningQueueItem[];
  recentWins: DashboardActivity[];
  milestones: Milestone[];
  lastVisitedExercise: string;
}

export interface PracticeSession {
  id: number;
  exerciseType: ExerciseType;
  startedAt: string;
  endedAt: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  accuracy: number;
  settingsSnapshotJson?: string;
}

export interface ExerciseResult {
  id: number;
  exerciseType: ExerciseType;
  promptLabel: string;
  expectedAnswer: string;
  submittedAnswer: string;
  correct: boolean;
  responseTimeMs: number;
  scoreDelta: number;
  metadataJson?: string;
  createdAt: string;
}

export interface FavoriteScale {
  id: number;
  nickname: string;
  rootNote: string;
  scaleType: string;
  notes: string[];
  intervals: string[];
  tuningId: string;
  fretRange: number;
  shapeId?: string;
  createdAt: string;
  lastPracticedAt?: string;
}

export interface Tuning {
  id: string;
  label: string;
  notes: string[];
}

export interface FretPosition {
  stringIndex: number;
  fret: number;
  note: string;
  inScale?: boolean;
  root?: boolean;
}

export interface FretboardResponse {
  tuningId: string;
  tuningLabel: string;
  fretCount: number;
  openNotes: string[];
  positions: FretPosition[];
}

export interface ScaleResponse {
  rootNote: string;
  scaleType: string;
  notes: string[];
  intervals: string[];
  tuningId: string;
  fretCount: number;
  highlightedPositions: FretPosition[];
  positionsByString: FretPosition[][];
}

export interface ScaleShape {
  id: string;
  label: string;
  cagedName: 'C' | 'A' | 'G' | 'E' | 'D';
  anchorStringIndex: number;
  anchorFret: number;
  stringRanges: Array<{
    stringIndex: number;
    minFret: number;
    maxFret: number;
  }>;
}

export interface NoteExercise {
  prompt: string;
  targetNote: string;
  acceptedAnswers: string[];
  timeLimitSeconds: number;
  targetStringIndex: number;
  targetFret: number;
}

export interface GuestSnapshot {
  dashboard: DashboardResponse;
  savedProgress: SavedProgress;
  practiceSessions: PracticeSession[];
  exerciseResults: ExerciseResult[];
  favoriteScales: FavoriteScale[];
  learnedNotes: LearnedNote[];
  learnedScaleShapes: LearnedScaleShape[];
}

export interface LearnedNote {
  id?: number;
  noteName: string;
  learnedAt: string;
}
