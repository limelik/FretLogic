import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useAuth } from '../../lib/auth';

const links = [
  { to: '/hub', label: 'Hub', guest: true },
  { to: '/dashboard', label: 'Dashboard', guest: false },
  { to: '/note-machine', label: 'Note Machine' },
  { to: '/scale-machine', label: 'Scale Machine' },
  { to: '/profile', label: 'Progress' },
];

export function AppShell() {
  const { user, token, isGuest, logout } = useAuth();
  const navigate = useNavigate();

  if (!token && !isGuest) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-night text-white">
      <div className="pointer-events-none fixed inset-0 bg-grain opacity-75" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(94,234,212,.11),transparent_24%),radial-gradient(circle_at_80%_20%,rgba(96,165,250,.09),transparent_22%),radial-gradient(circle_at_80%_80%,rgba(251,113,133,.08),transparent_20%)]" />
      <div className="relative mx-auto min-h-screen max-w-7xl px-4 py-5 md:px-6 lg:px-8">
        <header className="sticky top-4 z-20 mb-6 rounded-[28px] border border-white/10 bg-slate-950/70 px-4 py-4 shadow-glow backdrop-blur-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">FretLogic</p>
              <h1 className="mt-1 font-display text-2xl font-bold">Practice in tune with intent.</h1>
            </div>

            <nav className="flex flex-wrap gap-2">
              {links
                .filter((link) => link.guest !== false || !isGuest)
                .map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `rounded-2xl px-4 py-3 text-sm transition ${
                        isActive ? 'bg-cyan-400/12 text-cyan-100' : 'text-white/68 hover:bg-white/8 hover:text-white'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
            </nav>

            <div className="flex flex-wrap items-center gap-3">
              <div className={`rounded-2xl bg-gradient-to-br ${user?.avatarGradient ?? 'from-slate-700 to-slate-900'} p-[1px]`}>
                <div className="rounded-[15px] bg-slate-950/88 px-4 py-3">
                  <p className="text-sm text-white/75">{isGuest ? 'Guest Session' : user?.displayName}</p>
                  <p className="text-xs text-white/42">{isGuest ? 'Practice tools unlocked' : 'Signed in'}</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => navigate('/')}>
                Home
              </Button>
              <Button variant="ghost" onClick={logout}>
                {isGuest ? 'Exit Guest' : 'Log Out'}
              </Button>
            </div>
          </div>
        </header>

        <main className="relative pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
