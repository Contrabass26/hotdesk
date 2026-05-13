import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api } from '../services/api.ts';
import { useUser } from '../contexts/useUser';
import type { User } from '../types';
import { Icon } from '../components/ui/Icons';

export function LoginPage() {
  const { currentUser, setCurrentUser } = useUser();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getDemoUsers()
      .then(setDemoUsers)
      .catch(() => setDemoUsers([]));
  }, []);

  if (currentUser) {
    return <Navigate to="/book" replace />;
  }

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Enter your email and password to continue.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await api.login({ email, password });
      setCurrentUser(response.user);
      navigate('/book');
    } catch {
      setError('We could not sign you in with those details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async (userId: number) => {
    setSubmitting(true);
    setError('');

    try {
      const response = await api.demoLogin({ userId });
      setCurrentUser(response.user);
      navigate('/book');
    } catch {
      setError('Demo access is not available right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="kn-app-bg min-h-screen">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,0.98fr)_minmax(420px,0.72fr)]">
        <section className="relative flex min-h-[420px] items-center px-6 py-10 md:px-12 lg:min-h-screen lg:px-16">
          <div className="absolute inset-y-0 left-0 w-full bg-[linear-gradient(135deg,#003369_0%,#061e38_62%,#0b3d63_100%)]" />
          <div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(90deg,white_1px,transparent_1px),linear-gradient(180deg,white_1px,transparent_1px)] [background-size:52px_52px]" />
          <div className="absolute bottom-0 left-0 h-1 w-full bg-[var(--kn-green)]" />

          <div className="relative z-10 max-w-2xl text-white">
            <div className="kn-brand mb-12 text-white">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-white text-[var(--kn-blue)] shadow-xl shadow-black/10">
                <div className="h-5 w-5 rotate-45 rounded-[4px] border-2 border-current border-r-transparent" />
              </div>
              <div>
                <span className="block text-lg font-black leading-none">Hotdesk</span>
              </div>
            </div>

            <h1 className="max-w-[640px] text-[clamp(2.5rem,6.2vw,5.2rem)] font-black leading-[0.94] tracking-normal">
              Plan your desk day.
            </h1>
            <p className="mt-6 max-w-md text-base font-medium leading-7 text-blue-50 md:text-lg">
              Reserve a seat in seconds.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-10 md:px-10">
          <div className="kn-panel kn-fade-in w-full max-w-[460px] p-6 md:p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-black tracking-normal text-[var(--kn-ink)]">Sign in</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-[var(--kn-muted)]">
                Access your desk plan.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="kn-label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="kn-input"
                />
              </div>

              <div>
                <label className="kn-label" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      void handleLogin();
                    }
                  }}
                  className="kn-input"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-[var(--kn-red-soft)] px-3 py-2 text-sm font-semibold text-[var(--kn-red)]">
                  <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                className="kn-button kn-button-primary w-full"
                onClick={handleLogin}
                disabled={submitting}
              >
                {submitting ? 'Signing in...' : 'Continue'}
                <Icon name="arrowRight" />
              </button>
            </div>

            {demoUsers.length > 0 && (
              <div className="mt-8 border-t border-[var(--kn-line)] pt-6">
                <div className="kn-label">Demo access</div>
                <div className="grid gap-2">
                  {demoUsers.slice(0, 3).map((user) => (
                    <button
                      key={user.id}
                      className="kn-button kn-button-secondary w-full justify-between"
                      onClick={() => handleDemoLogin(user.id)}
                      disabled={submitting}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[var(--kn-green-soft)] text-xs font-black text-[var(--kn-blue)]">
                          {user.name.slice(0, 1).toUpperCase()}
                        </span>
                        <span className="truncate text-left">{user.name}</span>
                      </span>
                      <span className="kn-badge kn-badge-blue">{user.isAdmin ? 'Admin' : 'User'}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
