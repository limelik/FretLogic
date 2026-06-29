import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { useAuth } from './lib/auth';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { GuestPage } from './pages/GuestPage';
import { HomePage } from './pages/HomePage';
import { NoteMachinePage } from './pages/NoteMachinePage';
import { PracticeHubPage } from './pages/PracticeHubPage';
import { ProfilePage } from './pages/ProfilePage';
import { ScaleMachinePage } from './pages/ScaleMachinePage';

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-night text-white">
        <div className="rounded-full border border-cyan-400/30 px-5 py-3 text-sm text-cyan-100">Booting fretboard engine...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/guest" element={<GuestPage />} />
      <Route element={<AppShell />}>
        <Route path="/hub" element={<PracticeHubPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/note-machine" element={<NoteMachinePage />} />
        <Route path="/scale-machine" element={<ScaleMachinePage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
