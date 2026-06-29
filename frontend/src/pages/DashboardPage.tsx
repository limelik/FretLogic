import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { readGuestSnapshot, writeGuestSnapshot } from '../lib/storage';
import type { DashboardResponse } from '../types';

function miniBarColor(index: number) {
  return index % 3 === 0 ? 'bg-cyan-300' : index % 3 === 1 ? 'bg-sky-400' : 'bg-fuchsia-400';
}

export function DashboardPage() {
  const { token, isGuest } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardResponse>(readGuestSnapshot().dashboard);

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
      setDashboard(guest.dashboard);
      return;
    }

    api.dashboard(token).then(setDashboard).catch(() => setDashboard(readGuestSnapshot().dashboard));
  }, [isGuest, token]);

  return (
    <div className="space-y-6">
      <Card className="rounded-[34px] p-7">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">Dashboard</p>
        <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-4xl font-bold">Read practice clearly.</h1>
            <p className="mt-4 max-w-2xl text-white/70">
              Accuracy, streaks, recent work, and saved progress without extra noise.
            </p>
          </div>
          <div className="flex gap-3">
            <Link className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm transition hover:bg-white/10" to="/hub">
              Back to Hub
            </Link>
            <Link className="rounded-2xl border border-cyan-400/24 bg-cyan-400/[0.07] px-4 py-3 text-sm text-cyan-100 transition hover:bg-cyan-400/[0.1]" to="/note-machine">
              Open Note Machine
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

      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <Card className="rounded-[30px] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Accuracy Trend</p>
              <h2 className="mt-2 text-2xl font-semibold">Recent response quality</h2>
            </div>
            <div className="rounded-full border border-cyan-400/18 bg-cyan-400/[0.07] px-4 py-2 text-sm text-cyan-100">
              {dashboard.streak} day streak
            </div>
          </div>
          <div className="mt-6 flex h-56 items-end gap-3">
            {(dashboard.accuracyTrend.length ? dashboard.accuracyTrend : [{ label: 'Now', value: 10 }]).map((point, index) => (
              <div key={`${point.label}-${index}`} className="flex flex-1 flex-col items-center gap-3">
                <div className="flex h-full w-full items-end rounded-[24px] bg-white/[0.04] p-2">
                  <div
                    className={`w-full rounded-[18px] ${miniBarColor(index)}`}
                    style={{ height: `${Math.max(10, point.value)}%` }}
                  />
                </div>
                <span className="text-xs text-white/45">{point.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-[30px] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Recent Activity</p>
          <div className="mt-5 space-y-4">
            {dashboard.recentActivity.map((activity) => (
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
    </div>
  );
}
