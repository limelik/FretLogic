import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { readGuestSnapshot, writeGuestSnapshot } from '../lib/storage';
import type { DashboardResponse } from '../types';

const rootOptions = [
  { value: 'C', label: 'C' },
  { value: 'C#', label: 'C#/Db' },
  { value: 'D', label: 'D' },
  { value: 'D#', label: 'D#/Eb' },
  { value: 'E', label: 'E' },
  { value: 'F', label: 'F' },
  { value: 'F#', label: 'F#/Gb' },
  { value: 'G', label: 'G' },
  { value: 'G#', label: 'G#/Ab' },
  { value: 'A', label: 'A' },
  { value: 'A#', label: 'A#/Bb' },
  { value: 'B', label: 'B' },
];
const scaleTypeOptions = [
  { id: 'major', label: 'Major' },
  { id: 'minor', label: 'Minor' },
  { id: 'pentatonic', label: 'Pentatonic' },
  { id: 'blues', label: 'Blues' },
  { id: 'dorian', label: 'Dorian' },
  { id: 'mixolydian', label: 'Mixolydian' },
  { id: 'harmonic_minor', label: 'Harmonic Minor' },
];
const shapeOrder = ['c-shape', 'a-shape', 'g-shape', 'e-shape', 'd-shape'];

function normalizeDashboard(raw?: Partial<DashboardResponse> | null): DashboardResponse {
  return {
    stats: Array.isArray(raw?.stats) ? raw.stats : [],
    noteMastery: Array.isArray(raw?.noteMastery) ? raw.noteMastery : [],
    learnedScaleShapes: Array.isArray(raw?.learnedScaleShapes) ? raw.learnedScaleShapes : [],
    learningQueue: Array.isArray(raw?.learningQueue) ? raw.learningQueue : [],
    recentWins: Array.isArray(raw?.recentWins) ? raw.recentWins : [],
    milestones: Array.isArray(raw?.milestones) ? raw.milestones : [],
    lastVisitedExercise: raw?.lastVisitedExercise ?? 'dashboard',
  };
}

function defaultDashboard(): DashboardResponse {
  return normalizeDashboard(readGuestSnapshot().dashboard);
}

function shapeLabel(shapeId: string) {
  return shapeId.replace('-shape', '').toUpperCase();
}

function noteLabel(note: string) {
  return rootOptions.find((option) => option.value === note)?.label ?? note;
}

export function DashboardPage() {
  const { token, isGuest } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardResponse>(defaultDashboard());
  const [selectedRoot, setSelectedRoot] = useState('E');
  const [selectedScaleType, setSelectedScaleType] = useState('major');

  if (isGuest) {
    return <Navigate to="/hub" replace />;
  }

  if (!token) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    if (!token) {
      const guest = readGuestSnapshot();
      guest.savedProgress.lastVisitedExercise = 'dashboard';
      guest.dashboard.lastVisitedExercise = 'dashboard';
      writeGuestSnapshot(guest);
      setDashboard(normalizeDashboard(guest.dashboard));
      return;
    }

    api.dashboard(token).then((data) => setDashboard(normalizeDashboard(data))).catch(() => setDashboard(defaultDashboard()));
  }, [isGuest, token]);

  useEffect(() => {
    const firstLearnedScale = dashboard.learnedScaleShapes[0];
    if (firstLearnedScale) {
      setSelectedRoot(firstLearnedScale.rootNote);
      setSelectedScaleType(firstLearnedScale.scaleType);
    }
  }, [dashboard.learnedScaleShapes]);

  const selectedScaleShapes = useMemo(
    () =>
      dashboard.learnedScaleShapes.filter(
        (shape) => shape.rootNote === selectedRoot && shape.scaleType === selectedScaleType,
      ),
    [dashboard.learnedScaleShapes, selectedRoot, selectedScaleType],
  );
  const learnedShapeIds = new Set(selectedScaleShapes.map((shape) => shape.shapeId));
  const selectedScaleProgress = (selectedScaleShapes.length / shapeOrder.length) * 100;

  return (
    <div className="space-y-6">
      <Card className="rounded-[34px] p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">Dashboard</p>
            <h1 className="mt-4 font-display text-4xl font-bold">See what learned for real.</h1>
            <p className="mt-4 max-w-2xl text-white/70">
              Notes, shapes, wins, queue, and milestones. No fake stats.
            </p>
          </div>
          <div className="flex gap-3">
            <Link className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm transition hover:bg-white/10" to="/note-machine">
              Note Machine
            </Link>
            <Link className="rounded-2xl border border-cyan-400/24 bg-cyan-400/[0.07] px-4 py-3 text-sm text-cyan-100 transition hover:bg-cyan-400/[0.1]" to="/scale-machine">
              Scale Machine
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {dashboard.stats.map((stat) => (
          <Card key={stat.label} className="rounded-[28px] p-5">
            <p className="text-sm text-white/50">{stat.label}</p>
            <p className="mt-4 text-4xl font-bold">{stat.value}</p>
            <p className="mt-3 text-sm text-white/55">{stat.helper}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <Card className="rounded-[30px] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Note Mastery</p>
              <h2 className="mt-2 text-2xl font-semibold">Fretboard note coverage</h2>
            </div>
            <span className="rounded-full border border-cyan-400/18 bg-cyan-400/[0.07] px-4 py-2 text-sm text-cyan-100">
              {dashboard.noteMastery.filter((item) => item.learned).length}/12 learned
            </span>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3 md:grid-cols-4 xl:grid-cols-6">
            {dashboard.noteMastery.map((item) => (
              <div
                key={item.noteName}
                className={`rounded-[24px] border px-4 py-5 text-center ${
                  item.learned ? 'border-cyan-300/24 bg-cyan-400/[0.07] text-cyan-100' : 'border-white/10 bg-white/[0.04] text-white/55'
                }`}
              >
                <p className="text-lg font-semibold">{item.label}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.22em]">{item.learned ? 'Learned' : 'Open'}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-[30px] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Learning Queue</p>
          <h2 className="mt-2 text-2xl font-semibold">Fixed simple order</h2>
          <div className="mt-5 space-y-3">
            {dashboard.learningQueue.map((item, index) => (
              <Link
                key={`${item.title}-${index}`}
                to={item.href}
                className="block rounded-[24px] border border-white/10 bg-white/[0.04] p-4 transition hover:border-white/14 hover:bg-white/[0.055]"
              >
                <p className="font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-white/60">{item.detail}</p>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <Card className="rounded-[30px] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Scale Library Progress</p>
              <h2 className="mt-2 text-2xl font-semibold">Track one scale at time</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-white/60">
                Root
                <select value={selectedRoot} onChange={(event) => setSelectedRoot(event.target.value)} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white">
                  {rootOptions.map((rootNote) => (
                    <option key={rootNote.value} value={rootNote.value} className="bg-slate-950">
                      {rootNote.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm text-white/60">
                Scale
                <select value={selectedScaleType} onChange={(event) => setSelectedScaleType(event.target.value)} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white">
                  {scaleTypeOptions.map((option) => (
                    <option key={option.id} value={option.id} className="bg-slate-950">
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-semibold">
                  {noteLabel(selectedRoot)} {selectedScaleType.replace('_', ' ')}
                </p>
                <p className="mt-1 text-sm text-white/55">{selectedScaleShapes.length}/5 shapes learned</p>
              </div>
              <Link className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm transition hover:bg-white/10" to="/scale-machine">
                Open Scale Machine
              </Link>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/8">
              <div className="h-full rounded-full bg-cyan-300/80 transition-[width] duration-300" style={{ width: `${selectedScaleProgress}%` }} />
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-5">
              {shapeOrder.map((shapeId) => (
                <div
                  key={shapeId}
                  className={`rounded-[22px] border px-4 py-4 text-center ${
                    learnedShapeIds.has(shapeId) ? 'border-cyan-300/24 bg-cyan-400/[0.07] text-cyan-100' : 'border-white/10 bg-white/[0.04] text-white/55'
                  }`}
                >
                  <p className="text-lg font-semibold">{shapeLabel(shapeId)}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.22em]">{learnedShapeIds.has(shapeId) ? 'Learned' : 'Open'}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="rounded-[30px] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Recent Wins</p>
          <h2 className="mt-2 text-2xl font-semibold">What clicked lately</h2>
          <div className="mt-5 space-y-3">
            {dashboard.recentWins.map((activity) => (
              <div key={`${activity.title}-${activity.timestamp}`} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{activity.title}</h3>
                    <p className="mt-1 text-sm text-white/60">{activity.detail}</p>
                  </div>
                  <span className="text-xs uppercase tracking-[0.22em] text-white/35">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="rounded-[30px] p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Milestones</p>
        <h2 className="mt-2 text-2xl font-semibold">Unlocks worth chasing</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {dashboard.milestones.map((milestone) => (
            <div
              key={milestone.title}
              className={`rounded-[24px] border p-4 ${
                milestone.unlocked ? 'border-cyan-300/24 bg-cyan-400/[0.07]' : 'border-white/10 bg-white/[0.04]'
              }`}
            >
              <p className="font-semibold">{milestone.title}</p>
              <p className="mt-2 text-sm text-white/60">{milestone.detail}</p>
              <p className={`mt-4 text-xs uppercase tracking-[0.22em] ${milestone.unlocked ? 'text-cyan-100' : 'text-white/35'}`}>
                {milestone.unlocked ? 'Unlocked' : 'Locked'}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
