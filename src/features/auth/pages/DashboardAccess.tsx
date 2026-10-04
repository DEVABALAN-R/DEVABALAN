import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { signIn } from '@/features/auth/services/authService';
import '@/shared/styles/dashboard-access.css';

type Props = { onBack: () => void; onSuccess: (userId: string) => void; timedOut?: boolean };

export default function DashboardAccess({ onBack, onSuccess, timedOut = false }: Props) {
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');
    try {
      onSuccess(await signIn(email, password));
    } catch {
      setError('Sign-in failed. Check your email and password, then try again.');
    } finally { setBusy(false); }
  }

  return <main className="access-page">
    <header className="access-nav"><button className="access-back" onClick={onBack}><ArrowLeft size={15}/> Back to portfolio</button><span className="access-brand"><span className="portfolio-brand-mark">D<span>.</span></span>Devabalan R</span></header>
    <section className="access-layout">
      <section className="access-card" aria-labelledby="signInTitle"><span className="portfolio-section-index">PERSONAL DASHBOARD</span><h2 id="signInTitle">Sign in</h2><p>Enter your email and password to continue.</p>
        {timedOut && <p className="access-session-notice" role="status">Your session expired. Please sign in again.</p>}
        <form onSubmit={submit}><label>Email<input name="email" required type="email" autoComplete="username" inputMode="email" placeholder="you@example.com"/></label><label>Password<input name="password" required type="password" autoComplete="current-password" placeholder="Password"/></label>{error && <p className="access-error" role="alert">{error}</p>}<button className="access-submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'} <ArrowRight size={16}/></button></form>
      </section>
    </section>
    <footer className="access-footer">DEVABALAN R <span>·</span> PERSONAL DASHBOARD</footer>
  </main>;
}
