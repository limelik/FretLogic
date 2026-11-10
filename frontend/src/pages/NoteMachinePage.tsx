import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Fretboard } from '../components/fretboard/Fretboard';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { buildFretboard, buildNotePracticePath, buildNoteStepPositionKeys, displayNote, normalizeNote, randomNoteExercise, TUNINGS } from '../lib/theory';
import { defaultSavedProgress, readGuestSnapshot, writeGuestSnapshot } from '../lib/storage';
import type { Difficulty, LearnedNote, NoteExercise } from '../types';

const paceOptions: Array<{ label: Difficulty; bpm: number }> = [
  { label: 'EASY', bpm: 60 },
  { label: 'MEDIUM', bpm: 90 },
  { label: 'HARD', bpm: 120 },
  { label: 'EXPERT', bpm: 150 },
];

const NATURAL_NOTES: string[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const CHROMATIC_NOTES: string[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const PREVIEW_FILL_CLASSES = [
  'fill-emerald-300',
  'fill-cyan-300',
  'fill-amber-300',
  'fill-violet-300',
  'fill-rose-300',
  'fill-sky-300',
  'fill-lime-300',
  'fill-orange-300',
  'fill-fuchsia-300',
  'fill-teal-300',
  'fill-pink-300',
  'fill-yellow-300',
];

function serializeState(payload: Record<string, unknown>) {
  return JSON.stringify(payload);
}

function beatDurationMs(bpm: number) {
  return Math.round(60000 / Math.max(1, bpm));
}

export function NoteMachinePage() {
  const { token, isGuest } = useAuth();
  const [tuningId, setTuningId] = useState('standard');
  const [fretCount, setFretCount] = useState(15);
  const [pacePreset, setPacePreset] = useState<Difficulty>('MEDIUM');
  const [bpm, setBpm] = useState(90);
  const [preferSharps, setPreferSharps] = useState(true);
  const [includeAccidentals, setIncludeAccidentals] = useState(true);
  const [selectedPromptNote, setSelectedPromptNote] = useState('ALL');
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [pathIndex, setPathIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(beatDurationMs(90) / 1000);
  const [exercise, setExercise] = useState<NoteExercise>(() => randomNoteExercise('standard', 15));
  const [learnedNotes, setLearnedNotes] = useState<LearnedNote[]>([]);
  const runningStartedAt = useRef<number | null>(null);
  const elapsedBeforePauseMs = useRef(0);
  const sessionStartExercise = useRef<NoteExercise>(exercise);
  const promptPoolRef = useRef<string[]>([]);
  const selectedPromptNoteRef = useRef(selectedPromptNote);
  const sequenceIndexRef = useRef(sequenceIndex);

  const board = useMemo(() => buildFretboard(tuningId, fretCount, preferSharps), [fretCount, preferSharps, tuningId]);
  const promptPool = useMemo(() => (includeAccidentals ? CHROMATIC_NOTES : NATURAL_NOTES), [includeAccidentals]);
  const promptOptions = useMemo(
    () =>
      promptPool.map((note) => ({
        value: note,
        label: displayNote(note, preferSharps),
      })),
    [preferSharps, promptPool],
  );
  const notePath = useMemo(() => buildNotePracticePath(exercise.targetNote, tuningId, fretCount, preferSharps), [exercise.targetNote, fretCount, preferSharps, tuningId]);
  const activePosition = notePath[pathIndex] ?? null;
  const activePositionKeys = useMemo(() => {
    if (!isRunning) {
      if (selectedPromptNote === 'ALL') {
        return [];
      }
      return notePath.map((position) => `${position.stringIndex}-${position.fret}`);
    }
    return buildNoteStepPositionKeys(notePath, pathIndex);
  }, [isRunning, notePath, pathIndex, selectedPromptNote]);
  const previewNoteColors = useMemo(() => {
    if (isRunning) {
      return {};
    }
    if (selectedPromptNote !== 'ALL') {
      return {
        [normalizeNote(exercise.targetNote)]: 'fill-emerald-300',
      };
    }

    const uniqueNotes = Array.from(new Set(promptPool.map((note) => normalizeNote(note))));
    return uniqueNotes.reduce<Record<string, string>>((colors, note, index) => {
      colors[note] = PREVIEW_FILL_CLASSES[index % PREVIEW_FILL_CLASSES.length];
      return colors;
    }, {});
  }, [exercise.targetNote, isRunning, promptPool, selectedPromptNote]);
  const beatMs = beatDurationMs(bpm);
  const windowMs = beatMs * Math.max(notePath.length, 1);
  const isCurrentNoteLearned = useMemo(
    () => learnedNotes.some((item) => normalizeNote(item.noteName) === normalizeNote(exercise.targetNote)),
    [exercise.targetNote, learnedNotes],
  );
  promptPoolRef.current = promptPool;
  selectedPromptNoteRef.current = selectedPromptNote;
  sequenceIndexRef.current = sequenceIndex;

  const pushProgress = useEffectEvent(async () => {
    const progressPayload = {
      lastVisitedExercise: 'note-machine',
      activeTuning: tuningId,
      showNoteLabels: false,
      selectedScaleType: 'major',
      selectedRootNote: 'E',
      noteMachineStateJson: serializeState({
        pacePreset,
        bpm,
        fretCount,
        targetNote: exercise.targetNote,
        pathIndex,
        preferSharps,
        includeAccidentals,
        selectedPromptNote,
        sequenceIndex,
      }),
      scaleMachineStateJson: defaultSavedProgress().scaleMachineStateJson,
      savedSettingsJson: serializeState({ bpm, pacePreset, fretCount, tuningId, preferSharps, includeAccidentals, selectedPromptNote }),
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
    const shownTarget = displayNote(targetNote, preferSharps);
    return {
      ...randomNoteExercise(tuningId, fretCount),
      targetNote: shownTarget,
      prompt: `Find ${shownTarget} across fretboard`,
      acceptedAnswers: [shownTarget],
    } satisfies NoteExercise;
  }

  function resetCycleClock(resumeRunning = isRunning) {
    elapsedBeforePauseMs.current = 0;
    runningStartedAt.current = resumeRunning ? Date.now() : null;
    setTimeLeft(windowMs / 1000);
  }

  function nextExercise(resetOrder = false, resumeRunning = isRunning) {
    const selectedNote = selectedPromptNoteRef.current;
    const pool = promptPoolRef.current;
    const nextIndex = selectedNote === 'ALL' ? (resetOrder ? 0 : (sequenceIndexRef.current + 1) % Math.max(pool.length, 1)) : 0;
    const nextNote = selectedNote === 'ALL' ? pool[nextIndex] ?? 'C' : selectedNote;
    sequenceIndexRef.current = nextIndex;
    setSequenceIndex(nextIndex);
    const fresh = buildExerciseForNote(nextNote);
    setExercise(fresh);
    if (resetOrder) {
      sessionStartExercise.current = fresh;
    }
    setPathIndex(0);
    resetCycleClock(resumeRunning);
  }

  useEffect(() => {
    setIsRunning(false);
    nextExercise(true, false);
  }, [bpm, fretCount, tuningId, selectedPromptNote, preferSharps, includeAccidentals]);

  useEffect(() => {
    async function hydrate() {
      const guestSnapshot = !token || isGuest ? readGuestSnapshot() : null;
      const snapshot = guestSnapshot ? guestSnapshot.savedProgress : await api.progress(token!).catch(() => null);
      if (guestSnapshot) {
        setLearnedNotes(guestSnapshot.learnedNotes ?? []);
      } else if (token) {
        api.learnedNotes(token).then(setLearnedNotes).catch(() => setLearnedNotes([]));
      }
      if (!snapshot) {
        return;
      }

      setTuningId(snapshot.activeTuning || 'standard');

      try {
        const savedSettings = JSON.parse(snapshot.savedSettingsJson || '{}') as {
          bpm?: number;
          pacePreset?: Difficulty;
          fretCount?: number;
          preferSharps?: boolean;
          includeAccidentals?: boolean;
          allowSharps?: boolean;
          allowFlats?: boolean;
          selectedPromptNote?: string;
        };
        const state = JSON.parse(snapshot.noteMachineStateJson || '{}') as {
          pacePreset?: Difficulty;
          bpm?: number;
          fretCount?: number;
          difficulty?: Difficulty;
          targetNote?: string;
          pathIndex?: number;
          preferSharps?: boolean;
          includeAccidentals?: boolean;
          allowSharps?: boolean;
          allowFlats?: boolean;
          selectedPromptNote?: string;
          sequenceIndex?: number;
        };
        if (savedSettings.bpm !== undefined) setBpm(savedSettings.bpm);
        if (savedSettings.pacePreset) setPacePreset(savedSettings.pacePreset);
        if (savedSettings.fretCount !== undefined) setFretCount(savedSettings.fretCount);
        if (savedSettings.preferSharps !== undefined) {
          setPreferSharps(savedSettings.preferSharps);
        } else if (savedSettings.allowFlats !== undefined) {
          setPreferSharps(!savedSettings.allowFlats);
        }
        if (savedSettings.includeAccidentals !== undefined) setIncludeAccidentals(savedSettings.includeAccidentals);
        if (savedSettings.selectedPromptNote) setSelectedPromptNote(normalizeNote(savedSettings.selectedPromptNote));
        if (state.pacePreset) setPacePreset(state.pacePreset);
        if (state.bpm !== undefined) setBpm(state.bpm);
        if (state.fretCount !== undefined) setFretCount(state.fretCount);
        if (state.pathIndex !== undefined) setPathIndex(state.pathIndex);
        if (state.preferSharps !== undefined) {
          setPreferSharps(state.preferSharps);
        } else if (state.allowFlats !== undefined) {
          setPreferSharps(!state.allowFlats);
        }
        if (state.includeAccidentals !== undefined) setIncludeAccidentals(state.includeAccidentals);
        if (state.selectedPromptNote) setSelectedPromptNote(normalizeNote(state.selectedPromptNote));
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
  }, [bpm, exercise.targetNote, fretCount, includeAccidentals, pacePreset, pathIndex, preferSharps, pushProgress, selectedPromptNote, sequenceIndex, tuningId]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const timer = window.setInterval(() => {
      const elapsedMs = elapsedBeforePauseMs.current + (runningStartedAt.current ? Date.now() - runningStartedAt.current : 0);
      const remainingMs = windowMs - elapsedMs;
      const remainingSeconds = Math.max(0, remainingMs / 1000);
      setTimeLeft(remainingSeconds);
      const nextIndex = Math.min(notePath.length - 1, Math.max(0, Math.floor(elapsedMs / Math.max(1, beatMs))));
      setPathIndex(nextIndex);

      if (remainingMs <= 0) {
        advancePath();
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, [beatMs, isRunning, notePath.length, windowMs]);

  function applyPreset(option: { label: Difficulty; bpm: number }) {
    setPacePreset(option.label);
    setBpm(option.bpm);
  }

  function startTrainer() {
    setTimeLeft(Math.max(0, (windowMs - elapsedBeforePauseMs.current) / 1000));
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
    elapsedBeforePauseMs.current = 0;
    runningStartedAt.current = null;
    sequenceIndexRef.current = 0;
    setSequenceIndex(0);
    setExercise(sessionStartExercise.current);
    setPathIndex(0);
    setTimeLeft(windowMs / 1000);
  }

  function advancePath() {
    nextExercise();
  }

  function stepNextPrompt() {
    setIsRunning(false);
    runningStartedAt.current = null;
    elapsedBeforePauseMs.current = 0;
    advancePath();
  }

  async function markCurrentNoteLearned() {
    if (isCurrentNoteLearned) {
      return;
    }

    if (!token || isGuest) {
      const guest = readGuestSnapshot();
      const learned = {
        id: Date.now(),
        noteName: normalizeNote(exercise.targetNote),
        learnedAt: new Date().toISOString(),
      } satisfies LearnedNote;
      guest.learnedNotes = [learned, ...guest.learnedNotes.filter((item) => normalizeNote(item.noteName) !== normalizeNote(exercise.targetNote))];
      writeGuestSnapshot(guest);
      setLearnedNotes(guest.learnedNotes);
      return;
    }

    const learned = await api.saveLearnedNote({ noteName: exercise.targetNote }, token);
    setLearnedNotes((current) => [learned, ...current.filter((item) => normalizeNote(item.noteName) !== normalizeNote(learned.noteName))]);
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
                onClick={() => setPreferSharps((value) => !value)}
                className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/70 transition hover:bg-white/10"
              >
                Spelling: <span className="text-white">{preferSharps ? 'Sharps' : 'Flats'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIncludeAccidentals((value) => !value)}
                className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/70 transition hover:bg-white/10"
              >
                Accidentals: <span className="text-white">{includeAccidentals ? 'On' : 'Off'}</span>
              </button>
            </div>

            <label className="grid gap-2 text-sm text-white/60">
              Practice Note
              <select value={selectedPromptNote} onChange={(event) => setSelectedPromptNote(event.target.value)} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white">
                <option value="ALL" className="bg-slate-950">All</option>
                {promptOptions.map((note) => (
                  <option key={note.value} value={note.value} className="bg-slate-950">
                    {note.label}
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
              Next Note
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(260px,.46fr)_minmax(0,1.54fr)]">
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

          <p className="mt-4 text-sm text-white/45">{timeLeft.toFixed(1)}s window</p>

          <div className="mt-5">
            <Button variant={isCurrentNoteLearned ? 'outline' : 'ghost'} onClick={markCurrentNoteLearned}>
              {isCurrentNoteLearned ? `${exercise.targetNote} Learned` : `Mark ${exercise.targetNote} Learned`}
            </Button>
          </div>
        </Card>

        <Card className="rounded-[30px] p-5">
          <Fretboard
            fretCount={fretCount}
            openNotes={board.openNotes}
            positions={board.positions}
            showLabels
            activePositionKey={isRunning && activePosition ? `${activePosition.stringIndex}-${activePosition.fret}` : null}
            activePositionKeys={activePositionKeys}
            previewNoteColors={previewNoteColors}
          />
        </Card>
      </div>
    </div>
  );
}
