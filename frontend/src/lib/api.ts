import type {
  AuthResponse,
  DashboardResponse,
  ExerciseResult,
  FavoriteScale,
  FretboardResponse,
  NoteExercise,
  PracticeSession,
  SavedProgress,
  ScaleResponse,
  Tuning,
  UserSummary,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1';

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const raw = await response.text();
    let message = raw;
    try {
      const parsed = JSON.parse(raw) as { message?: string; error?: string };
      message = parsed.message || parsed.error || raw;
    } catch {
      message = raw;
    }
    throw new Error(message || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  register(payload: { displayName: string; email: string; password: string }) {
    return request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
  },
  login(payload: { email: string; password: string }) {
    return request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(payload) });
  },
  me(token: string) {
    return request<UserSummary>('/auth/me', { method: 'GET' }, token);
  },
  dashboard(token: string) {
    return request<DashboardResponse>('/progress/dashboard', { method: 'GET' }, token);
  },
  progress(token: string) {
    return request<SavedProgress>('/progress/state', { method: 'GET' }, token);
  },
  saveProgress(payload: SavedProgress, token: string) {
    return request<SavedProgress>('/progress/state', { method: 'PUT', body: JSON.stringify(payload) }, token);
  },
  sessions(token: string) {
    return request<PracticeSession[]>('/progress/sessions', { method: 'GET' }, token);
  },
  saveSession(payload: Omit<PracticeSession, 'id' | 'accuracy'> & { accuracy?: number }, token: string) {
    return request<PracticeSession>('/progress/sessions', { method: 'POST', body: JSON.stringify(payload) }, token);
  },
  exerciseResults(token: string) {
    return request<ExerciseResult[]>('/progress/exercise-results', { method: 'GET' }, token);
  },
  saveExerciseResult(payload: Omit<ExerciseResult, 'id' | 'createdAt'>, token: string) {
    return request<ExerciseResult>('/progress/exercise-results', { method: 'POST', body: JSON.stringify(payload) }, token);
  },
  favoriteScales(token: string) {
    return request<FavoriteScale[]>('/progress/favorite-scales', { method: 'GET' }, token);
  },
  saveFavoriteScale(
    payload: { rootNote: string; scaleType: string; tuningId: string; fretCount: number; nickname: string; preferSharps: boolean; shapeId?: string },
    token: string,
  ) {
    return request<FavoriteScale>('/progress/favorite-scales', { method: 'POST', body: JSON.stringify(payload) }, token);
  },
  deleteFavoriteScale(id: number, token: string) {
    return request<void>(`/progress/favorite-scales/${id}`, { method: 'DELETE' }, token);
  },
  tunings(token: string) {
    return request<Tuning[]>('/music/tunings', { method: 'GET' }, token);
  },
  fretboard(payload: { tuningId: string; fretCount: number; preferSharps: boolean }, token: string) {
    return request<FretboardResponse>('/music/fretboard', { method: 'POST', body: JSON.stringify(payload) }, token);
  },
  scale(payload: { rootNote: string; scaleType: string; tuningId: string; fretCount: number; preferSharps: boolean }, token: string) {
    return request<ScaleResponse>('/music/scales', { method: 'POST', body: JSON.stringify(payload) }, token);
  },
  noteExercise(payload: { difficulty: string; tuningId: string }, token: string) {
    return request<NoteExercise>('/music/note-exercise', { method: 'POST', body: JSON.stringify(payload) }, token);
  },
};
