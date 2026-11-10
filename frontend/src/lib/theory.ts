import type { FretPosition, FretboardResponse, NoteExercise, ScaleResponse, ScaleShape, Tuning } from '../types';

const CHROMATIC_SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const CHROMATIC_FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export const TUNINGS: Tuning[] = [
  { id: 'standard', label: 'Standard EADGBE', notes: ['E', 'A', 'D', 'G', 'B', 'E'] },
  { id: 'drop_d', label: 'Drop D DADGBE', notes: ['D', 'A', 'D', 'G', 'B', 'E'] },
  { id: 'open_g', label: 'Open G DGDGBD', notes: ['D', 'G', 'D', 'G', 'B', 'D'] },
  { id: 'd_standard', label: 'D Standard DGCFAD', notes: ['D', 'G', 'C', 'F', 'A', 'D'] },
];

export const SCALE_OPTIONS = [
  { id: 'major', label: 'Major' },
  { id: 'minor', label: 'Minor' },
  { id: 'pentatonic', label: 'Pentatonic' },
  { id: 'blues', label: 'Blues' },
  { id: 'dorian', label: 'Dorian' },
  { id: 'mixolydian', label: 'Mixolydian' },
  { id: 'harmonic_minor', label: 'Harmonic Minor' },
];

const SCALE_FORMULAS: Record<string, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  harmonic_minor: [0, 2, 3, 5, 7, 8, 11],
};

const SCALE_INTERVALS: Record<string, string[]> = {
  major: ['1', '2', '3', '4', '5', '6', '7'],
  minor: ['1', '2', 'b3', '4', '5', 'b6', 'b7'],
  pentatonic: ['1', 'b3', '4', '5', 'b7'],
  blues: ['1', 'b3', '4', 'b5', '5', 'b7'],
  dorian: ['1', '2', 'b3', '4', '5', '6', 'b7'],
  mixolydian: ['1', '2', '3', '4', '5', '6', 'b7'],
  harmonic_minor: ['1', '2', 'b3', '4', '5', 'b6', '7'],
};

const NOTE_ALIASES: Record<string, string> = {
  DB: 'C#',
  EB: 'D#',
  GB: 'F#',
  AB: 'G#',
  BB: 'A#',
  CB: 'B',
  FB: 'E',
  'E#': 'F',
  'B#': 'C',
};

const CAGED_SHAPE_META = [
  { id: 'c-shape', label: 'C Shape', cagedName: 'C' },
  { id: 'a-shape', label: 'A Shape', cagedName: 'A' },
  { id: 'g-shape', label: 'G Shape', cagedName: 'G' },
  { id: 'e-shape', label: 'E Shape', cagedName: 'E' },
  { id: 'd-shape', label: 'D Shape', cagedName: 'D' },
] as const;

export function normalizeNote(note: string) {
  const clean = note.trim().replace('♯', '#').replace('♭', 'b');
  const upper = clean.toUpperCase();
  if (NOTE_ALIASES[upper]) {
    return NOTE_ALIASES[upper];
  }
  if (upper.length === 1) {
    return upper;
  }
  return `${upper[0]}${upper.slice(1).replace(/B/g, 'b')}`;
}

export function enharmonic(note: string) {
  const normalized = normalizeNote(note);
  const sharpIndex = CHROMATIC_SHARPS.indexOf(normalized);
  if (sharpIndex >= 0) {
    return CHROMATIC_FLATS[sharpIndex];
  }
  const flatIndex = CHROMATIC_FLATS.indexOf(normalized);
  return flatIndex >= 0 ? CHROMATIC_SHARPS[flatIndex] : normalized;
}

export function getTuning(tuningId: string) {
  return TUNINGS.find((tuning) => tuning.id === tuningId) ?? TUNINGS[0];
}

export function noteAt(openNote: string, fret: number, preferSharps = true) {
  const startIndex = CHROMATIC_SHARPS.indexOf(normalizeNote(openNote));
  const chromatic = preferSharps ? CHROMATIC_SHARPS : CHROMATIC_FLATS;
  return chromatic[(startIndex + fret) % 12];
}

export function displayNote(note: string, preferSharps = true) {
  const startIndex = CHROMATIC_SHARPS.indexOf(normalizeNote(note));
  const chromatic = preferSharps ? CHROMATIC_SHARPS : CHROMATIC_FLATS;
  return chromatic[startIndex];
}

export function buildFretboard(tuningId: string, fretCount: number, preferSharps = true): FretboardResponse {
  const tuning = getTuning(tuningId);
  const positions: FretPosition[] = [];
  tuning.notes.forEach((openNote, stringIndex) => {
    for (let fret = 0; fret <= fretCount; fret += 1) {
      positions.push({
        stringIndex,
        fret,
        note: noteAt(openNote, fret, preferSharps),
      });
    }
  });

  return {
    tuningId,
    tuningLabel: tuning.label,
    fretCount,
    openNotes: tuning.notes,
    positions,
  };
}

export function buildScale(rootNote: string, scaleType: string, tuningId: string, fretCount: number, preferSharps = true): ScaleResponse {
  const normalizedRoot = normalizeNote(rootNote);
  const notes = buildScaleNotes(normalizedRoot, scaleType, preferSharps);
  const noteSet = new Set(notes.map(normalizeNote));
  const tuning = getTuning(tuningId);
  const highlightedPositions: FretPosition[] = [];
  const positionsByString: FretPosition[][] = [];

  tuning.notes.forEach((openNote, stringIndex) => {
    const stringHits: FretPosition[] = [];
    for (let fret = 0; fret <= fretCount; fret += 1) {
      const note = noteAt(openNote, fret, preferSharps);
      if (noteSet.has(normalizeNote(note))) {
        const point = {
          stringIndex,
          fret,
          note,
          inScale: true,
          root: normalizeNote(note) === normalizedRoot,
        };
        highlightedPositions.push(point);
        stringHits.push(point);
      }
    }
    positionsByString.push(stringHits);
  });

  return {
    rootNote: displayNote(normalizedRoot, preferSharps),
    scaleType,
    notes,
    intervals: SCALE_INTERVALS[scaleType] ?? SCALE_INTERVALS.major,
    tuningId,
    fretCount,
    highlightedPositions,
    positionsByString,
  };
}

export function buildScaleNotes(rootNote: string, scaleType: string, preferSharps = true) {
  const formula = SCALE_FORMULAS[scaleType] ?? SCALE_FORMULAS.major;
  const chromatic = preferSharps ? CHROMATIC_SHARPS : CHROMATIC_FLATS;
  const startIndex = CHROMATIC_SHARPS.indexOf(normalizeNote(rootNote));
  return formula.map((interval) => chromatic[(startIndex + interval) % 12]);
}

export function randomNoteExercise(tuningId: string, fretCount: number): NoteExercise {
  const tuning = getTuning(tuningId);
  const stringIndex = Math.floor(Math.random() * tuning.notes.length);
  const fret = Math.floor(Math.random() * (fretCount + 1));
  const targetNote = normalizeNote(noteAt(tuning.notes[stringIndex], fret));

  return {
    prompt: `Find ${targetNote} on string ${6 - stringIndex}`,
    targetNote,
    acceptedAnswers: [targetNote, enharmonic(targetNote)],
    timeLimitSeconds: 0,
    targetStringIndex: stringIndex,
    targetFret: fret,
  };
}

export function noteMarkerColor(position: FretPosition, activeNote?: string) {
  if (activeNote && normalizeNote(position.note) === normalizeNote(activeNote)) {
    return 'fill-emerald-300';
  }
  if (position.root) {
    return 'fill-amber-300';
  }
  if (position.inScale) {
    return 'fill-cyan-300';
  }
  return 'fill-slate-500/55';
}

export function buildNotePracticePath(targetNote: string, tuningId: string, fretCount: number, preferSharps = true) {
  const board = buildFretboard(tuningId, fretCount, preferSharps);
  const normalizedTarget = normalizeNote(targetNote);
  return board.positions
    .filter((position) => normalizeNote(position.note) === normalizedTarget)
    .sort((left, right) => {
      if (left.stringIndex !== right.stringIndex) {
        return left.stringIndex - right.stringIndex;
      }
      return left.fret - right.fret;
    });
}

export function buildScaleShapes(scale: ScaleResponse) {
  const rootWindows = scale.highlightedPositions
    .filter((position) => position.root)
    .sort((left, right) => {
      if (left.fret !== right.fret) {
        return left.fret - right.fret;
      }
      return left.stringIndex - right.stringIndex;
    })
    .map((position) => {
      const windowStart = Math.max(0, position.fret - 1);
      const windowEnd = Math.min(scale.fretCount, windowStart + 4);
      return {
        anchorStringIndex: position.stringIndex,
        anchorFret: position.fret,
        windowStart,
        windowEnd,
      };
    })
    .filter((window, index, windows) => windows.findIndex((entry) => entry.windowStart === window.windowStart && entry.windowEnd === window.windowEnd) === index)
    .slice(0, CAGED_SHAPE_META.length);

  const completedWindows = [...rootWindows];
  while (completedWindows.length < CAGED_SHAPE_META.length) {
    const previous = completedWindows[completedWindows.length - 1] ?? { anchorStringIndex: 0, anchorFret: 0, windowStart: 0, windowEnd: Math.min(scale.fretCount, 4) };
    const windowStart = Math.min(scale.fretCount, previous.windowStart + 2);
    const windowEnd = Math.min(scale.fretCount, windowStart + 4);
    completedWindows.push({
      anchorStringIndex: previous.anchorStringIndex,
      anchorFret: windowStart,
      windowStart,
      windowEnd,
    });
  }

  return CAGED_SHAPE_META.map((meta, index) => {
    const window = completedWindows[index];
    return {
      id: meta.id,
      label: meta.label,
      cagedName: meta.cagedName,
      anchorStringIndex: window.anchorStringIndex,
      anchorFret: window.anchorFret,
      stringRanges: Array.from({ length: 6 }, (_, stringIndex) => ({
        stringIndex,
        minFret: window.windowStart,
        maxFret: window.windowEnd,
      })),
    } satisfies ScaleShape;
  });
}

export function buildScalePracticePath(scale: ScaleResponse, shape: ScaleShape | null) {
  if (!shape) {
    return [];
  }

  return scale.highlightedPositions
    .filter((position) =>
      shape.stringRanges.some(
        (range) => range.stringIndex === position.stringIndex && position.fret >= range.minFret && position.fret <= range.maxFret,
      ),
    )
    .sort((left, right) => {
      if (left.stringIndex !== right.stringIndex) {
        return left.stringIndex - right.stringIndex;
      }
      return left.fret - right.fret;
    });
}

export function buildScaleShapePositionKeys(scale: ScaleResponse, shape: ScaleShape | null) {
  if (!shape) {
    return [];
  }

  return scale.highlightedPositions
    .filter((position) =>
      shape.stringRanges.some(
        (range) => range.stringIndex === position.stringIndex && position.fret >= range.minFret && position.fret <= range.maxFret,
      ),
    )
    .map((position) => `${position.stringIndex}-${position.fret}`);
}

export function buildNoteStepPositionKeys(path: FretPosition[], index: number) {
  const active = path[index];
  if (!active) {
    return [];
  }

  return [`${active.stringIndex}-${active.fret}`];
}

export function buildScaleStepPositionKeys(path: FretPosition[], index: number) {
  const active = path[index];
  if (!active) {
    return [];
  }

  return [`${active.stringIndex}-${active.fret}`];
}
