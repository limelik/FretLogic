import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Fretboard } from '../components/fretboard/Fretboard';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { buildScale, buildScalePracticePath, buildScaleShapePositionKeys, buildScaleShapes, buildScaleStepPositionKeys, SCALE_OPTIONS, TUNINGS } from '../lib/theory';
import { defaultSavedProgress, readGuestSnapshot, writeGuestSnapshot } from '../lib/storage';
import type { Difficulty, FavoriteScale, ScaleResponse } from '../types';

const rootNotes = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const paceOptions: Array<{ label: Difficulty; bpm: number }> = [
  { label: 'EASY', bpm: 32 },
  { label: 'MEDIUM', bpm: 48 },
  { label: 'HARD', bpm: 72 },
  { label: 'EXPERT', bpm: 96 },
];

function bpmWindowMs(bpm: number) {
  return Math.max(1800, Math.round((240000 / Math.max(30, bpm))));
}

export function ScaleMachinePage() {
  const { token, isGuest } = useAuth();
  const [rootNote, setRootNote] = useState('E');
  const [scaleType, setScaleType] = useState('major');
  const [tuningId, setTuningId] = useState('standard');
  const [fretCount, setFretCount] = useState(15);
  const [showLabels, setShowLabels] = useState(true);
  const [preferSharps, setPreferSharps] = useState(true);
  const [pacePreset, setPacePreset] = useState<Difficulty>('MEDIUM');
  const [bpm, setBpm] = useState(48);
  const [isRunning, setIsRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(bpmWindowMs(48) / 1000);
  const [shapeId, setShapeId] = useState('c-shape');
  const [favorites, setFavorites] = useState<FavoriteScale[]>([]);
  const [activeFavoriteId, setActiveFavoriteId] = useState<number | null>(null);
  const runningStartedAt = useRef<number | null>(null);
  const elapsedBeforePauseMs = useRef(0);

  const localScale = useMemo(
    () => buildScale(rootNote, scaleType, tuningId, fretCount, preferSharps),
    [fretCount, preferSharps, rootNote, scaleType, tuningId],
  );
  const [scale, setScale] = useState<ScaleResponse>(localScale);
  const windowMs = bpmWindowMs(bpm);
  const shapes = useMemo(() => buildScaleShapes(scale), [scale]);
  const activeShape = shapes.find((shape) => shape.id === shapeId) ?? shapes[0] ?? null;
  const scalePath = useMemo(() => buildScalePracticePath(scale, activeShape), [activeShape, scale]);
  const activePosition = scalePath[stepIndex % Math.max(scalePath.length, 1)] ?? null;
  const shapePositionKeys = useMemo(() => buildScaleShapePositionKeys(scale, activeShape), [activeShape, scale]);
  const activeStepKeys = useMemo(() => buildScaleStepPositionKeys(scalePath, stepIndex), [scalePath, stepIndex]);
  const dimPositionKeys = useMemo(
    () => scale.highlightedPositions.map((position) => `${position.stringIndex}-${position.fret}`).filter((key) => !shapePositionKeys.includes(key)),
    [scale, shapePositionKeys],
  );
  const currentPracticeNote = activePosition?.note ?? scale.notes[stepIndex % Math.max(scale.notes.length, 1)] ?? scale.rootNote;

  useEffect(() => {
    async function hydrate() {
      const snapshot = !token || isGuest ? readGuestSnapshot().savedProgress : await api.progress(token).catch(() => null);
      if (!snapshot) {
        return;
      }

      setRootNote(snapshot.selectedRootNote || 'E');
      setScaleType(snapshot.selectedScaleType || 'major');
      setTuningId(snapshot.activeTuning || 'standard');
      setShowLabels(snapshot.showNoteLabels ?? true);

      try {
        const savedSettings = JSON.parse(snapshot.savedSettingsJson || '{}') as {
          fretCount?: number;
          preferSharps?: boolean;
          bpm?: number;
          pacePreset?: Difficulty;
        };
        const state = JSON.parse(snapshot.scaleMachineStateJson || '{}') as {
          rootNote?: string;
          scaleType?: string;
          fretCount?: number;
          showLabels?: boolean;
          stepIndex?: number;
          shapeId?: string;
        };
        if (savedSettings.fretCount !== undefined) setFretCount(savedSettings.fretCount);
        if (savedSettings.preferSharps !== undefined) setPreferSharps(savedSettings.preferSharps);
        if (savedSettings.bpm !== undefined) setBpm(savedSettings.bpm);
        if (savedSettings.pacePreset) setPacePreset(savedSettings.pacePreset);
        if (state.rootNote) setRootNote(state.rootNote);
        if (state.scaleType) setScaleType(state.scaleType);
        if (state.fretCount !== undefined) setFretCount(state.fretCount);
        if (state.showLabels !== undefined) setShowLabels(state.showLabels);
        if (state.stepIndex !== undefined) setStepIndex(state.stepIndex);
        if (state.shapeId) setShapeId(state.shapeId);
      } catch {
        // Keep defaults when snapshot payload is absent or malformed.
      }
    }

    hydrate();
  }, [isGuest, token]);

  useEffect(() => {
    const progressPayload = {
      lastVisitedExercise: 'scale-machine',
      activeTuning: tuningId,
      showNoteLabels: showLabels,
      selectedScaleType: scaleType,
      selectedRootNote: rootNote,
      noteMachineStateJson: defaultSavedProgress().noteMachineStateJson,
      scaleMachineStateJson: JSON.stringify({ rootNote, scaleType, fretCount, showLabels, stepIndex, shapeId }),
      savedSettingsJson: JSON.stringify({ fretCount, tuningId, preferSharps, bpm, pacePreset }),
    };

    if (!token || isGuest) {
      const guest = readGuestSnapshot();
      guest.savedProgress = { ...guest.savedProgress, ...progressPayload };
      guest.dashboard.lastVisitedExercise = 'scale-machine';
      writeGuestSnapshot(guest);
      setFavorites(guest.favoriteScales);
      return;
    }

    api.saveProgress(progressPayload, token).catch(() => undefined);
    api.favoriteScales(token).then(setFavorites).catch(() => setFavorites([]));
  }, [bpm, fretCount, isGuest, pacePreset, preferSharps, rootNote, scaleType, shapeId, showLabels, stepIndex, token, tuningId]);

  useEffect(() => {
    if (!token || isGuest) {
      setScale(localScale);
      return;
    }

    api
      .scale({ rootNote, scaleType, tuningId, fretCount, preferSharps }, token)
      .then(setScale)
      .catch(() => setScale(localScale));
  }, [fretCount, isGuest, localScale, preferSharps, rootNote, scaleType, token, tuningId]);

  useEffect(() => {
    setStepIndex(0);
    setTimeLeft(windowMs / 1000);
    elapsedBeforePauseMs.current = 0;
    runningStartedAt.current = isRunning ? Date.now() : null;
  }, [bpm, rootNote, scaleType, tuningId, fretCount, preferSharps, shapeId]);

  useEffect(() => {
    if (!activeShape && shapes.length > 0) {
      setShapeId(shapes[0].id);
    }
  }, [activeShape, shapes]);

  useEffect(() => {
    if (!isRunning || scalePath.length === 0) {
      return;
    }

    const timer = window.setInterval(() => {
      const elapsedMs = elapsedBeforePauseMs.current + (runningStartedAt.current ? Date.now() - runningStartedAt.current : 0);
      const remainingMs = windowMs - elapsedMs;
      const remainingSeconds = Math.max(0, remainingMs / 1000);
      setTimeLeft(remainingSeconds);
      const stepDuration = scalePath.length > 0 ? windowMs / scalePath.length : windowMs;
      const nextIndex = Math.min(scalePath.length - 1, Math.max(0, Math.floor(elapsedMs / Math.max(1, stepDuration))));
      setStepIndex(nextIndex);

      if (remainingMs <= 0) {
        elapsedBeforePauseMs.current = 0;
        runningStartedAt.current = Date.now();
        setStepIndex(0);
        setTimeLeft(windowMs / 1000);
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, [isRunning, scalePath.length, windowMs]);

  function applyPreset(option: { label: Difficulty; bpm: number }) {
    setPacePreset(option.label);
    setBpm(option.bpm);
  }

  async function saveFavorite() {
    const nickname = `${rootNote} ${scaleType.replace('_', ' ')} • ${activeShape?.cagedName ?? 'C'} shape`;
    if (!token || isGuest) {
      const guest = readGuestSnapshot();
      const favorite: FavoriteScale = {
        id: Date.now(),
        nickname,
        rootNote: scale.rootNote,
        scaleType: scale.scaleType,
        notes: scale.notes,
        intervals: scale.intervals,
        tuningId,
        fretRange: fretCount,
        shapeId: activeShape?.id,
        createdAt: new Date().toISOString(),
        lastPracticedAt: new Date().toISOString(),
      };
      guest.favoriteScales = [favorite, ...guest.favoriteScales];
      writeGuestSnapshot(guest);
      setFavorites(guest.favoriteScales);
      setActiveFavoriteId(favorite.id);
      return;
    }

    const favorite = await api.saveFavoriteScale({ rootNote, scaleType, tuningId, fretCount, nickname, preferSharps, shapeId: activeShape?.id }, token);
    setFavorites((current) => [favorite, ...current]);
    setActiveFavoriteId(favorite.id);
  }

  function loadFavorite(favorite: FavoriteScale) {
    setRootNote(favorite.rootNote);
    setScaleType(favorite.scaleType);
    setTuningId(favorite.tuningId);
    setFretCount(favorite.fretRange);
    setPreferSharps(!favorite.rootNote.includes('b'));
    setShapeId(favorite.shapeId ?? 'c-shape');
    setActiveFavoriteId(favorite.id);
    setStepIndex(0);
    elapsedBeforePauseMs.current = 0;
    runningStartedAt.current = isRunning ? Date.now() : null;
  }

  function startTrainer() {
    runningStartedAt.current = Date.now();
    setIsRunning(true);
  }

  function pauseTrainer() {
    if (runningStartedAt.current !== null) {
      elapsedBeforePauseMs.current += Date.now() - runningStartedAt.current;
      runningStartedAt.current = null;
    }
    setIsRunning(false);
  }

  function resetTrainer() {
    setIsRunning(false);
    setStepIndex(0);
    elapsedBeforePauseMs.current = 0;
    runningStartedAt.current = null;
    setTimeLeft(windowMs / 1000);
  }

  function nextShape() {
    if (shapes.length === 0) {
      return;
    }
    const currentIndex = Math.max(
      0,
      shapes.findIndex((shape) => shape.id === (activeShape?.id ?? shapeId)),
    );
    const next = shapes[(currentIndex + 1) % shapes.length];
    setShapeId(next.id);
    setStepIndex(0);
    elapsedBeforePauseMs.current = 0;
    runningStartedAt.current = isRunning ? Date.now() : null;
    setTimeLeft(windowMs / 1000);
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-[34px] p-7">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">Scale Machine</p>
              <h1 className="mt-4 font-display text-4xl font-bold">Shape scale map fast.</h1>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-cyan-400/24 bg-cyan-400/[0.07] px-4 py-3 text-sm text-cyan-100">BPM {bpm}</div>
              <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm">Status <span className="ml-2 font-semibold text-cyan-100">{isRunning ? 'Running' : 'Paused'}</span></div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-4">
            {paceOptions.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => applyPreset(option)}
                className={`rounded-2xl px-4 py-3 text-sm text-left transition ${
                  pacePreset === option.label ? 'bg-cyan-400/12 text-cyan-100' : 'bg-white/6 text-white/65 hover:bg-white/10'
                }`}
              >
                {option.label} • {option.bpm}
              </button>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-4">
            <label className="grid gap-2 text-sm text-white/60">
              Custom BPM
              <input
                type="number"
                min="30"
                max="200"
                value={bpm}
                onChange={(event) => {
                  setPacePreset('MEDIUM');
                  setBpm(Number(event.target.value));
                }}
                className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none"
              />
            </label>

            <label className="grid gap-2 text-sm text-white/60">
              Root Note
              <select value={rootNote} onChange={(event) => setRootNote(event.target.value)} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white">
                {rootNotes.map((note) => (
                  <option key={note} value={note} className="bg-slate-950">
                    {note}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm text-white/60">
              Scale Type
              <select value={scaleType} onChange={(event) => setScaleType(event.target.value)} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white">
                {SCALE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id} className="bg-slate-950">
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm text-white/60">
              Shape
              <select value={activeShape?.id ?? shapeId} onChange={(event) => setShapeId(event.target.value)} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white">
                {shapes.map((shape) => (
                  <option key={shape.id} value={shape.id} className="bg-slate-950">
                    {shape.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm text-white/60">
              Tuning
              <select value={tuningId} onChange={(event) => setTuningId(event.target.value)} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white">
                {TUNINGS.map((tuning) => (
                  <option key={tuning.id} value={tuning.id} className="bg-slate-950">
                    {tuning.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm text-white/60">
              Fret Range
              <input type="range" min="12" max="18" value={fretCount} onChange={(event) => setFretCount(Number(event.target.value))} />
              <span className="text-white">{fretCount} frets</span>
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowLabels((value) => !value)}
              className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-left text-sm text-white/70 transition hover:bg-white/10"
            >
              Note names: <span className="text-white">{showLabels ? 'Visible' : 'Hidden'}</span>
            </button>
            <button
              type="button"
              onClick={() => setPreferSharps((value) => !value)}
              className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-left text-sm text-white/70 transition hover:bg-white/10"
            >
              Spelling: <span className="text-white">{preferSharps ? 'Sharps' : 'Flats'}</span>
            </button>
            <Button onClick={saveFavorite}>Save Favorite</Button>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={startTrainer}>Start</Button>
            <Button variant="ghost" onClick={pauseTrainer}>
              Pause
            </Button>
            <Button variant="outline" onClick={resetTrainer}>
              Reset
            </Button>
            <Button variant="outline" onClick={nextShape}>
              Next Shape
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <div className="space-y-5">
          <Card className="rounded-[30px] p-5">
            <Fretboard
              fretCount={fretCount}
              openNotes={TUNINGS.find((tuning) => tuning.id === tuningId)?.notes ?? TUNINGS[0].notes}
            positions={scale.highlightedPositions}
            mode="scale"
            showLabels={showLabels}
            activePositionKey={activePosition ? `${activePosition.stringIndex}-${activePosition.fret}` : null}
            activePositionKeys={activeStepKeys}
            shapePositionKeys={shapePositionKeys}
            dimPositionKeys={dimPositionKeys}
          />
        </Card>

          <Card className="rounded-[30px] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Favorites</p>
                <h2 className="mt-2 text-2xl font-semibold">Saved scale snapshots</h2>
              </div>
              <span className="text-sm text-white/45">{favorites.length} stored</span>
            </div>
            <div className="mt-5 grid gap-3">
              {favorites.length === 0 && <p className="text-sm text-white/55">Save scales to build quick-launch library.</p>}
              {favorites.map((favorite) => (
                <button
                  key={favorite.id}
                  type="button"
                  onClick={() => loadFavorite(favorite)}
                  className={`rounded-[24px] border p-4 text-left transition ${
                    activeFavoriteId === favorite.id
                      ? 'border-cyan-300/24 bg-cyan-400/[0.07]'
                      : 'border-white/10 bg-white/[0.04] hover:border-white/14 hover:bg-white/[0.055]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">{favorite.nickname}</h3>
                      <p className="mt-1 text-sm text-white/60">{favorite.notes.join(' • ')}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/40">
                        {favorite.shapeId ? `${favorite.shapeId.replace('-shape', '').toUpperCase()} shape` : 'Saved shape'} • click to load
                      </p>
                    </div>
                    <span className="rounded-full bg-white/8 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/45">
                      {favorite.scaleType.replace('_', ' ')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="rounded-[30px] p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Current Practice Note</p>
            <p className="mt-3 text-4xl font-bold">{currentPracticeNote}</p>
            <p className="mt-2 text-white/60">
              {scale.rootNote} {scale.scaleType.replace('_', ' ')} • {activeShape?.label ?? 'Shape'} • note {(stepIndex % Math.max(scalePath.length, 1)) + 1} of {Math.max(scalePath.length, 1)}
            </p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-cyan-300/80 transition-[width] duration-100"
                style={{ width: `${Math.max(0, Math.min(100, (timeLeft / (windowMs / 1000)) * 100))}%` }}
              />
            </div>
            <p className="mt-4 text-sm text-white/55">{timeLeft.toFixed(1)}s shape cycle</p>
          </Card>

          <Card className="rounded-[30px] p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Intervals</p>
            <h2 className="mt-3 text-2xl font-semibold">
              {scale.rootNote} {scale.scaleType.replace('_', ' ')}
            </h2>
            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">Scale Notes</p>
                <p className="mt-2 text-sm text-white/80">{scale.notes.join(' • ')}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">Intervals / Degrees</p>
                <p className="mt-2 text-sm text-white/80">{scale.intervals.join(' • ')}</p>
              </div>
              <div className="grid gap-2">
                {scale.notes.map((note, index) => (
                  <div key={`${note}-${index}`} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">
                    <span className="text-white/60">Note {index + 1}</span>
                    <span className="font-semibold text-white">{note}</span>
                    <span className="text-cyan-100">{scale.intervals[index] ?? '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
