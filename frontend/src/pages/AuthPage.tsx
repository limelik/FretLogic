import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuth } from '../lib/auth';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'register') {
        await register({ displayName, email, password });
      } else {
        await login({ email, password });
      }
      navigate('/hub');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Auth failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(34,211,238,.2),transparent_28%),linear-gradient(180deg,#050816,#04070f_58%,#060b17)] px-4 py-10 text-white">
      <Card className="w-full max-w-md rounded-[36px] p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">FretLogic Access</p>
        <h1 className="mt-4 font-display text-4xl font-bold">{mode === 'login' ? 'Welcome back.' : 'Create studio account.'}</h1>
        <p className="mt-4 text-sm leading-7 text-white/65">
          {mode === 'login'
            ? 'Resume saved drills, streaks, favorites, and dashboard history.'
            : 'Unlock synced progress, persistent settings, and saved scale patterns.'}
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label className="block">
              <span className="mb-2 block text-sm text-white/60">Display Name</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 outline-none transition focus:border-cyan-300/40 focus:bg-white/10"
                placeholder="Demo Player"
                required
              />
            </label>
          )}
          <label className="block">
            <span className="mb-2 block text-sm text-white/60">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 outline-none transition focus:border-cyan-300/40 focus:bg-white/10"
              placeholder="demo@fretlogic.app"
              required
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-white/60">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 outline-none transition focus:border-cyan-300/40 focus:bg-white/10"
              placeholder="••••••••"
              required
            />
          </label>

          {error && <p className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</p>}

          <Button className="w-full" disabled={loading} type="submit">
            {loading ? 'Syncing...' : mode === 'login' ? 'Login' : 'Register'}
          </Button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm text-white/55">
          <Link className="transition hover:text-white" to={mode === 'login' ? '/register' : '/login'}>
            {mode === 'login' ? 'Need account?' : 'Already registered?'}
          </Link>
          <Link className="transition hover:text-white" to="/">
            Back Home
          </Link>
        </div>
      </Card>
    </div>
  );
}
