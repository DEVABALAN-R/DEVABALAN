import React from 'react';
import { LogOut, TimerReset } from 'lucide-react';
import '@/shared/styles/session-timeout.css';

type Props = { secondsRemaining: number; onStaySignedIn: () => void; onLogout: () => void };

export default function SessionTimeoutPrompt({ secondsRemaining, onStaySignedIn, onLogout }: Props) {
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const stayButton = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => { stayButton.current?.focus(); }, []);
  function trapFocus(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') { event.preventDefault(); onStaySignedIn(); return; }
    if (event.key !== 'Tab') return;
    const buttons = [...(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not([disabled])'))];
    const first = buttons[0]; const last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  return <div className="session-timeout-backdrop">
    <section className="session-timeout-dialog" role="alertdialog" aria-modal="true" aria-labelledby="sessionTimeoutTitle" aria-describedby="sessionTimeoutDescription" onKeyDown={trapFocus}>
      <span className="session-timeout-icon"><TimerReset size={18}/></span>
      <h2 id="sessionTimeoutTitle">Still there?</h2>
      <p id="sessionTimeoutDescription">You’ll be logged out in <span aria-live="off">{minutes}:{String(seconds).padStart(2, '0')}</span> due to inactivity.</p>
      <div className="session-timeout-actions">
        <button ref={stayButton} type="button" className="session-timeout-stay" onClick={onStaySignedIn}>Stay signed in</button>
        <button type="button" className="session-timeout-logout" onClick={onLogout}><LogOut size={15}/> Log out</button>
      </div>
    </section>
  </div>;
}
