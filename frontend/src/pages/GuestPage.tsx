import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuth } from '../lib/auth';

export function GuestPage() {
  const { continueAsGuest } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-night px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <Card className="rounded-[36px] p-8 md:p-10">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">Guest Mode</p>
          <h1 className="mt-5 font-display text-4xl font-bold md:text-5xl">Jump straight into drills.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/70">
            Guest mode keeps note practice, scale favorites, and settings on this device. Make account later to sync everything into database.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              onClick={() => {
                continueAsGuest();
                navigate('/hub');
              }}
            >
              Open Practice Hub
            </Button>
            <Button variant="ghost" onClick={() => navigate('/register')}>
              Create Account Instead
            </Button>
          </div>
        </Card>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            ['Local memory', 'Sessions, favorites, and last page save in local storage.'],
            ['Same practice tools', 'Note Machine and Scale Machine stay fully interactive.'],
            ['Upgrade path', 'Register later to preserve future progress in PostgreSQL backend.'],
          ].map(([title, detail]) => (
            <Card key={title} className="rounded-[28px] p-6">
              <h2 className="text-2xl font-semibold">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-white/65">{detail}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
