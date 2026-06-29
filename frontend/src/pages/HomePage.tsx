import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuth } from '../lib/auth';

export function HomePage() {
  const { continueAsGuest } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen overflow-hidden bg-night text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(251,113,133,.1),transparent_28%),linear-gradient(135deg,#030712,#081120_45%,#070d1a)]" />
      <div className="absolute inset-0 opacity-25">
        <div className="fretboard-hero" />
      </div>
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 md:px-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.38em] text-cyan-200/80">FretLogic</p>
            <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">Premium fretboard fluency for modern players.</h1>
          </div>
          <nav className="hidden gap-3 md:flex">
            <Link className="text-sm text-white/70 transition hover:text-white" to="/login">
              Login
            </Link>
            <Link className="text-sm text-white/70 transition hover:text-white" to="/register">
              Register
            </Link>
          </nav>
        </header>

        <section className="relative grid flex-1 items-center gap-12 py-14 lg:grid-cols-[1.1fr_.9fr]">
          <div className="animate-floatUp">
            <span className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/8 px-4 py-2 text-xs uppercase tracking-[0.3em] text-cyan-100">
              Guitar Practice Studio
            </span>
            <h2 className="mt-6 max-w-3xl font-display text-5xl font-bold leading-tight md:text-6xl">
              Sharpen note vision. Map every scale.
            </h2>
            <p className="mt-6 max-w-2xl text-lg text-white/70">
              Focused guitar workspace with clean note drills, scale mapping, guest mode, and saved practice for signed-in players.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={() => navigate('/login')}>Login</Button>
              <Button variant="ghost" onClick={() => navigate('/register')}>
                Register
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  continueAsGuest();
                  navigate('/hub');
                }}
              >
                Continue as Guest
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden rounded-[36px] border-white/12 bg-slate-950/60 p-8">
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/65">Inside</p>
            <h3 className="mt-3 text-2xl font-semibold">Choose lane. Start playing.</h3>
            <div className="mt-8 space-y-3">
              {[
                ['Login', 'Saved dashboard, progress, favorites'],
                ['Sign Up', 'Create account and sync sessions'],
                ['Guest', 'Use note and scale tools right away'],
              ].map(([title, detail]) => (
                <div key={title} className="rounded-[24px] border border-white/8 bg-white/[0.035] px-4 py-4">
                  <p className="font-semibold">{title}</p>
                  <p className="mt-1 text-sm text-white/58">{detail}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
