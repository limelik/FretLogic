import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Fretboard } from '../components/fretboard/Fretboard';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { buildFretboard, buildNotePracticePath, buildNoteStepPositionKeys, randomNoteExercise, TUNINGS } from '../lib/theory';
import { defaultSavedProgress, readGuestSnapshot, writeGuestSnapshot } from '../lib/storage';
import type { Difficulty, NoteExercise } from '../types';

type HitState = 'idle' | 'correct' | 'wrong';

const paceOptions: Array<{ label: Difficulty; bpm: number }> = [
  { label: 'EASY', bpm: 32 },
  { label: 'MEDIUM', bpm: 48 },
  { label: 'HARD', bpm: 72 },
  { label: 'EXPERT', bpm: 96 },
];

const NATURAL_NOTES: string[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const SHARP_NOTES: string[] = ['C#', 'D#', 'F#', 'G#', 'A#'];
const FLAT_NOTES: string[] = ['Db', 'Eb', 'Gb', 'Ab', 'Bb'];

function serializeState(payload: Record<string, unknown>) {
  return JSON.stringify(payload);
}

function bpmWindowMs(bpm: number) {
  return Math.max(1800, Math.round((240000 / Math.max(30, bpm))));
}

export function NoteMachinePage() {
  const { token, isGuest } = useAuth();
  const [tuningId, setTuningId] = useState('standard');
  const [fretCount, setFretCount] = useState(15);
  const [pacePreset, setPacePreset] = useState<Difficulty>('MEDIUM');
  const [bpm, setBpm] = useState(48);
  const [showLabels, setShowLabels] = useState(true);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [allowSharps, setAllowSharps] = useState(false);
  const [allowFlats, setAllowFlats] = useState(false);
  const [selectedPromptNote, setSelectedPromptNote] = useState('ALL');
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [pathIndex, setPathIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(bpmWindowMs(48) / 1000);
  const [exercise, setExercise] = useState<NoteExercise>(() => randomNoteExercise('standard', 15));
  const runningStartedAt = useRef<number | null>(null);
  const elapsedBeforePauseMs = useRef(0);
  const initialExercise = useRef<NoteExercise>(exercise);

  const board = useMemo(() => buildFretboard(tuningId, fretCount, true), [fretCount, tuningId]);
  const promptPool = useMemo(() => {
    const pool = [...NATURAL_NOTES];
    if (allowSharps) {
      pool.push(...SHARP_NOTES);
    }
    if (allowFlats) {
      pool.push(...FLAT_NOTES);
    }
    return pool;
  }, [allowFlats, allowSharps]);
  const notePath = useMemo(() => buildNotePracticePath(exercise.targetNote, tuningId, fretCount, true), [exercise.targetNote, fretCount, tuningId]);
  const activePosition = notePath[pathIndex] ?? null;
  const activePositionKeys = useMemo(() => {
    if (!isRunning && selectedPromptNote !== 'ALL') {
      return notePath.map((position) => `${position.stringIndex}-${position.fret}`);
    }
    return buildNoteStepPositionKeys(notePath, pathIndex);
  }, [isRunning, notePath, pathIndex, selectedPromptNote]);
  const windowMs = bpmWindowMs(bpm);
  const [feedback, setFeedback] = useState<HitState>('idle');

  const pushProgress = useEffectEvent(async () => {
    const progressPayload = {
      lastVisitedExercise: 'note-machine',
      activeTuning: tuningId,
      showNoteLabels: showLabels,
      selectedScaleType: 'major',
      selectedRootNote: 'E',
      noteMachineStateJson: serializeState({
        pacePreset,
        bpm,
        fretCount,
        autoAdvance,
        targetNote: exercise.targetNote,
        pathIndex,
        allowSharps,
        allowFlats,
        selectedPromptNote,
        sequenceIndex,
      }),
      scaleMachineStateJson: defaultSavedProgress().scaleMachineStateJson,
      savedSettingsJson: serializeState({ bpm, pacePreset, fretCount, autoAdvance, tuningId, allowSharps, allowFlats, selectedPromptNote }),
    };

    if (!token || isGuest) {
      const guest = readGuestSnapshot();
      guest.savedProgress = {
        ...guest.savedProgress,
        ...progressPayload,
      };
      guest.dashboard.lastVisitedExercise = 'note-machine';
      writeGuestSnapshot(guest);
      return;
    }

    await api.saveProgress(progressPayload, token).catch(() => undefined);
  });

  function buildExerciseForNote(targetNote: string) {
    return {
      ...randomNoteExercise(tuningId, fretCount),
      targetNote,
      prompt: `Find ${targetNote} across fretboard`,
      acceptedAnswers: [targetNote],
    } satisfies NoteExercise;
  }

  function resetCycleClock() {
    elapsedBeforePauseMs.current = 0;
    runningStartedAt.current = isRunning ? Date.now() : null;
    setTimeLeft(windowMs / 1000);
  }

  function nextExercise(resetOrder = false) {
    const nextNote =
      selectedPromptNote === 'ALL'
        ? promptPool[(resetOrder ? 0 : (sequenceIndex + 1) % Math.max(promptPool.length, 1))] ?? 'C'
        : selectedPromptNote;
    const nextIndex = selectedPromptNote === 'ALL' ? (resetOrder ? 0 : (sequenceIndex + 1) % Math.max(promptPool.length, 1)) : 0;
    setSequenceIndex(nextIndex);
    const fresh = buildExerciseForNote(nextNote);
    setExercise(fresh);
    initialExercise.current = fresh;
    setPathIndex(0);
    resetCycleClock();
    setFeedback('idle');
  }

  useEffect(() => {
    nextExercise(true);
  }, [bpm, fretCount, tuningId, selectedPromptNote, allowSharps, allowFlats]);

  useEffect(() => {
    async function hydrate() {
      const snapshot = !token || isGuest ? readGuestSnapshot().savedProgress : await api.progress(token).catch(() => null);
      if (!snapshot) {
        return;
      }

      setTuningId(snapshot.activeTuning || 'standard');
      setShowLabels(snapshot.showNoteLabels ?? true);

      try {
        const savedSettings = JSON.parse(snapshot.savedSettingsJson || '{}') as {
          bpm?: number;
          pacePreset?: Difficulty;
          fretCount?: number;
          autoAdvance?: boolean;
          allowSharps?: boolean;
          allowFlats?: boolean;
          selectedPromptNote?: string;
        };
        const state = JSON.parse(snapshot.noteMachineStateJson || '{}') as {
          pacePreset?: Difficulty;
          bpm?: number;
          fretCount?: number;
          autoAdvance?: boolean;
          difficulty?: Difficulty;
          targetNote?: string;
          pathIndex?: number;
          allowSharps?: boolean;
          allowFlats?: boolean;
          selectedPromptNote?: string;
          sequenceIndex?: number;
        };
        if (savedSettings.bpm !== undefined) setBpm(savedSettings.bpm);
        if (savedSettings.pacePreset) setPacePreset(savedSettings.pacePreset);
        if (savedSettings.fretCount !== undefined) setFretCount(savedSettings.fretCount);
        if (savedSettings.autoAdvance !== undefined) setAutoAdvance(savedSettings.autoAdvance);
        if (savedSettings.allowSharps !== undefined) setAllowSharps(savedSettings.allowSharps);
        if (savedSettings.allowFlats !== undefined) setAllowFlats(savedSettings.allowFlats);
        if (savedSettings.selectedPromptNote) setSelectedPromptNote(savedSettings.selectedPromptNote);
        if (state.pacePreset) setPacePreset(state.pacePreset);
        if (state.bpm !== undefined) setBpm(state.bpm);
        if (state.fretCount !== undefined) setFretCount(state.fretCount);
        if (state.autoAdvance !== undefined) setAutoAdvance(state.autoAdvance);
        if (state.pathIndex !== undefined) setPathIndex(state.pathIndex);
        if (state.allowSharps !== undefined) setAllowSharps(state.allowSharps);
        if (state.allowFlats !== undefined) setAllowFlats(state.allowFlats);
        if (state.selectedPromptNote) setSelectedPromptNote(state.selectedPromptNote);
        if (state.sequenceIndex !== undefined) setSequenceIndex(state.sequenceIndex);
        if (state.difficulty && !state.pacePreset) {
          const fallback = paceOptions.find((option) => option.label === state.difficulty);
          if (fallback) {
            setPacePreset(fallback.label);
            setBpm(fallback.bpm);
          }
        }
      } catch {
        // Keep defaults when snapshot payload is absent or malformed.
      }
    }

    hydrate();
  }, [isGuest, token]);

  useEffect(() => {
    if (selectedPromptNote !== 'ALL' && !promptPool.includes(selectedPromptNote)) {
      setSelectedPromptNote('ALL');
      setSequenceIndex(0);
    }
  }, [promptPool, selectedPromptNote]);

  useEffect(() => {
    pushProgress();
  }, [allowFlats, allowSharps, autoAdvance, bpm, exercise.targetNote, fretCount, pacePreset, pathIndex, pushProgress, selectedPromptNote, sequenceIndex, showLabels, tuningId]);

  useEffect(() => {
    if (!autoAdvance || !isRunning) {
      return;
    }

    const timer = window.setInterval(() => {
      const elapsedMs = elapsedBeforePauseMs.current + (runningStartedAt.current ? Date.now() - runningStartedAt.current : 0);
      const remainingMs = windowMs - elapsedMs;
      const remainingSeconds = Math.max(0, remainingMs / 1000);
      setTimeLeft(remainingSeconds);
      const stepDuration = notePath.length > 0 ? windowMs / notePath.length : windowMs;
      const nextIndex = Math.min(notePath.length - 1, Math.max(0, Math.floor(elapsedMs / Math.max(1, stepDuration))));
      setPathIndex(nextIndex);

      if (remainingMs <= 0) {
        setFeedback('idle');
        advancePath();
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, [autoAdvance, isRunning, notePath.length, windowMs]);

  function applyPreset(option: { label: Difficulty; bpm: number }) {
    setPacePreset(option.label);
    setBpm(option.bpm);
  }

  function startTrainer() {
    runningStartedAt.current = Date.now();
    setIsRunning(true);
    setFeedback('idle');
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
    elapsedBeforePauseMs.current = 0;
    runningStartedAt.current = null;
    setExercise(initialExercise.current);
    setPathIndex(0);
    setFeedback('idle');
    setTimeLeft(windowMs / 1000);
  }

  function advancePath() {
    elapsedBeforePauseMs.current = 0;
    runningStartedAt.current = isRunning ? Date.now() : null;
    nextExercise();
  }

  function stepNextPrompt() {
    setFeedback('idle');
    advancePath();
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-[34px] p-7">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">Note Machine</p>
              <h1 className="mt-4 font-display text-4xl font-bold">Lock on. Play on beat.</h1>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-cyan-400/24 bg-cyan-400/[0.07] px-4 py-3 text-sm text-cyan-100">
                BPM {bpm}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm">
                Status <span className="ml-2 font-semibold text-cyan-100">{isRunning ? 'Running' : 'Paused'}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr]">
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.3em] text-cyan-200/68">Pace Presets</p>
              <div className="grid grid-cols-2 gap-2">
                {paceOptions.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => applyPreset(option)}
                    className={`rounded-2xl px-4 py-3 text-sm transition ${
                      pacePreset === option.label ? 'bg-cyan-400/12 text-cyan-100' : 'bg-white/6 text-white/65 hover:bg-white/10'
                    }`}
                  >
                    {option.label} • {option.bpm}
                  </button>
                ))}
              </div>
            </div>

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
              Tuning
              <select value={tuningId} onChange={(event) => setTuningId(event.target.value)} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white">
                {TUNINGS.map((tuning) => (
                  <option key={tuning.id} value={tuning.id} className="bg-slate-950">
                    {tuning.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 xl:grid-cols-[auto_auto_1fr] xl:items-end">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setAllowSharps((value) => !value)}
                className={`rounded-2xl px-4 py-3 text-sm transition ${allowSharps ? 'bg-cyan-400/12 text-cyan-100' : 'border border-white/10 bg-white/6 text-white/70 hover:bg-white/10'}`}
              >
                Sharp Notes {allowSharps ? 'On' : 'Off'}
              </button>
              <button
                type="button"
                onClick={() => setAllowFlats((value) => !value)}
                className={`rounded-2xl px-4 py-3 text-sm transition ${allowFlats ? 'bg-cyan-400/12 text-cyan-100' : 'border border-white/10 bg-white/6 text-white/70 hover:bg-white/10'}`}
              >
                Flat Notes {allowFlats ? 'On' : 'Off'}
              </button>
            </div>

            <label className="grid gap-2 text-sm text-white/60">
              Practice Note
              <select value={selectedPromptNote} onChange={(event) => setSelectedPromptNote(event.target.value)} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white">
                <option value="ALL" className="bg-slate-950">All</option>
                {promptPool.map((note) => (
                  <option key={note} value={note} className="bg-slate-950">
                    {note}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto] xl:items-end">
            <label className="grid gap-2 text-sm text-white/60">
              Fret Count
              <input type="range" min="12" max="18" value={fretCount} onChange={(event) => setFretCount(Number(event.target.value))} />
              <span className="text-white">{fretCount} frets</span>
            </label>

            <button
              type="button"
              onClick={() => setShowLabels((value) => !value)}
              className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-left text-sm text-white/70 transition hover:bg-white/10"
            >
              Note labels: <span className="text-white">{showLabels ? 'Visible' : 'Hidden'}</span>
            </button>

            <button
              type="button"
              onClick={() => setAutoAdvance((value) => !value)}
              className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-left text-sm text-white/70 transition hover:bg-white/10"
            >
              Auto advance: <span className="text-white">{autoAdvance ? 'On' : 'Off'}</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={startTrainer}>Start</Button>
            <Button variant="ghost" onClick={pauseTrainer}>
              Pause
            </Button>
            <Button variant="outline" onClick={resetTrainer}>
              Reset
            </Button>
            <Button variant="outline" onClick={stepNextPrompt}>
              Next Prompt
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[.72fr_1.28fr]">
        <Card className="rounded-[30px] p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Prompt</p>
          <p className="mt-3 text-4xl font-bold">{exercise.targetNote}</p>
          <p className="mt-2 text-white/60">
            {activePosition ? `Play ${exercise.targetNote} on string ${6 - activePosition.stringIndex}, fret ${activePosition.fret}` : exercise.prompt}
          </p>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-cyan-300/80 transition-[width] duration-100"
              style={{ width: `${Math.max(0, Math.min(100, (timeLeft / (windowMs / 1000)) * 100))}%` }}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span
              className={`rounded-full px-3 py-1 ${
                feedback === 'correct' ? 'bg-emerald-400/15 text-emerald-100' : feedback === 'wrong' ? 'bg-rose-400/15 text-rose-100' : 'bg-white/8 text-white/60'
              }`}
            >
              {isRunning ? 'Play on guitar now' : 'Ready to start'}
            </span>
            <span className="text-white/45">
              {autoAdvance ? `${timeLeft.toFixed(1)}s window` : 'Manual next prompt'}
            </span>
          </div>
        </Card>

        <Card className="rounded-[30px] p-5">
          <Fretboard
            fretCount={fretCount}
            openNotes={board.openNotes}
            positions={board.positions}
            showLabels={showLabels}
            activePositionKey={activePosition ? `${activePosition.stringIndex}-${activePosition.fret}` : null}
            activePositionKeys={activePositionKeys}
          />
        </Card>
      </div>
    </div>
  );
}
