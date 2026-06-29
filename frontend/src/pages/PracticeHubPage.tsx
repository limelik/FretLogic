import { Link, Navigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { useAuth } from '../lib/auth';

const tools = [
  {
    key: 'dashboard',
    title: 'Dashboard',
    detail: 'Stats, activity, streaks, and saved progress overview.',
    to: '/dashboard',
    authOnly: true,
  },
  {
    key: 'note-machine',
    title: 'Note Machine',
    detail: 'Timed fretboard note drills with instant hit feedback.',
    to: '/note-machine',
    authOnly: false,
  },
  {
    key: 'scale-machine',
    title: 'Scale Machine',
    detail: 'Root, formula, intervals, patterns, and favorite scale maps.',
    to: '/scale-machine',
    authOnly: false,
  },
];

export function PracticeHubPage() {
  const { token, isGuest } = useAuth();

  if (!token && !isGuest) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-[34px] p-7">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">Practice Hub</p>
        <h1 className="mt-4 font-display text-4xl font-bold">Pick tool. Stay focused.</h1>
        <p className="mt-4 max-w-2xl text-white/68">
          Start from note drill, scale map, or full dashboard. Guest mode gets practice tools now. Signed-in mode unlocks saved dashboard too.
        </p>
      </Card>

      <div className="grid gap-5 md:grid-cols-3">
        {tools.map((tool) => {
          const locked = tool.authOnly && isGuest;

          if (locked) {
            return (
              <Card key={tool.key} className="rounded-[30px] p-6 opacity-70">
                <p className="text-xs uppercase tracking-[0.28em] text-white/38">Locked in Guest</p>
                <h2 className="mt-4 text-3xl font-semibold">{tool.title}</h2>
                <p className="mt-3 text-sm leading-7 text-white/58">{tool.detail}</p>
                <div className="mt-8 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/55">
                  Sign in to unlock
                </div>
              </Card>
            );
          }

          return (
            <Link key={tool.key} to={tool.to} className="block">
              <Card className="rounded-[30px] p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/14 hover:bg-white/[0.09]">
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/62">Available</p>
                <h2 className="mt-4 text-3xl font-semibold">{tool.title}</h2>
                <p className="mt-3 text-sm leading-7 text-white/58">{tool.detail}</p>
                <div className="mt-8 text-sm font-semibold text-cyan-100">Open</div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
