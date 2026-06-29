import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { readGuestSnapshot } from '../lib/storage';
import type { ExerciseResult, FavoriteScale, PracticeSession, SavedProgress } from '../types';

export function ProfilePage() {
  const { user, token, isGuest } = useAuth();
  const [progress, setProgress] = useState<SavedProgress>(readGuestSnapshot().savedProgress);
  const [sessions, setSessions] = useState<PracticeSession[]>(readGuestSnapshot().practiceSessions);
  const [results, setResults] = useState<ExerciseResult[]>(readGuestSnapshot().exerciseResults);
  const [favorites, setFavorites] = useState<FavoriteScale[]>(readGuestSnapshot().favoriteScales);

  useEffect(() => {
    if (!token || isGuest) {
      const guest = readGuestSnapshot();
      setProgress(guest.savedProgress);
      setSessions(guest.practiceSessions);
      setResults(guest.exerciseResults);
      setFavorites(guest.favoriteScales);
      return;
    }

    Promise.all([api.progress(token), api.sessions(token), api.exerciseResults(token), api.favoriteScales(token)])
      .then(([savedProgress, fetchedSessions, fetchedResults, fetchedFavorites]) => {
        setProgress(savedProgress);
        setSessions(fetchedSessions);
        setResults(fetchedResults);
        setFavorites(fetchedFavorites);
      })
      .catch(() => undefined);
  }, [isGuest, token]);

  return (
    <div className="space-y-6">
      <Card className="rounded-[34px] p-7">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">Progress Profile</p>
            <h1 className="mt-4 font-display text-4xl font-bold">{isGuest ? 'Guest practice vault' : user?.displayName ?? 'Player profile'}</h1>
            <p className="mt-4 max-w-3xl text-white/70">
              View last saved exercise, recent results, session history, and favorite scale patterns in one place.
            </p>
          </div>
          {!isGuest && <Button variant="outline">Synced with JWT session</Button>}
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[.85fr_1.15fr]">
        <Card className="rounded-[30px] p-6">
          <h2 className="text-2xl font-semibold">Saved State</h2>
          <div className="mt-5 space-y-3 text-sm text-white/65">
            <p>
              Last visited: <span className="text-white">{progress.lastVisitedExercise}</span>
            </p>
            <p>
              Active tuning: <span className="text-white">{progress.activeTuning}</span>
            </p>
            <p>
              Preferred scale: <span className="text-white">{progress.selectedRootNote} {progress.selectedScaleType}</span>
            </p>
            <p>
              Labels: <span className="text-white">{progress.showNoteLabels ? 'Visible' : 'Hidden'}</span>
            </p>
          </div>

          <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Saved Settings JSON</p>
            <pre className="mt-3 overflow-auto text-xs leading-6 text-white/60">{progress.savedSettingsJson}</pre>
          </div>
        </Card>

        <Card className="rounded-[30px] p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Favorite Scales</h2>
            <span className="text-sm text-white/45">{favorites.length} total</span>
          </div>
          <div className="mt-5 grid gap-3">
            {favorites.length === 0 && <p className="text-sm text-white/55">No favorites yet. Save patterns from Scale Machine.</p>}
            {favorites.map((favorite) => (
              <div key={favorite.id} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{favorite.nickname}</h3>
                    <p className="mt-1 text-sm text-white/60">{favorite.rootNote} {favorite.scaleType.replace('_', ' ')} • {favorite.notes.join(' • ')}</p>
                  </div>
                  <span className="text-xs uppercase tracking-[0.22em] text-white/35">{favorite.tuningId}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="rounded-[30px] p-6">
          <h2 className="text-2xl font-semibold">Practice History</h2>
          <div className="mt-5 space-y-3">
            {sessions.length === 0 && <p className="text-sm text-white/55">No sessions logged yet.</p>}
            {sessions.slice(0, 6).map((session) => (
              <div key={session.id} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">{session.exerciseType.replace('_', ' ')}</p>
                    <p className="mt-1 text-sm text-white/60">
                      {session.correctAnswers}/{session.totalQuestions} correct • {Math.round(session.accuracy * 100)}% • {session.score} pts
                    </p>
                  </div>
                  <span className="text-xs uppercase tracking-[0.22em] text-white/35">
                    {new Date(session.endedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-[30px] p-6">
          <h2 className="text-2xl font-semibold">Recent Exercise Results</h2>
          <div className="mt-5 space-y-3">
            {results.length === 0 && <p className="text-sm text-white/55">No drill results yet.</p>}
            {results.slice(0, 8).map((result) => (
              <div key={result.id} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">{result.promptLabel}</p>
                    <p className="mt-1 text-sm text-white/60">
                      Answer {result.submittedAnswer} • {result.correct ? 'correct' : 'wrong'} • {result.responseTimeMs}ms
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs ${result.correct ? 'bg-emerald-400/15 text-emerald-100' : 'bg-rose-400/15 text-rose-100'}`}>
                    {result.scoreDelta > 0 ? `+${result.scoreDelta}` : result.scoreDelta}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
