import React from 'react';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const WARNING_BEFORE_MS = 2 * 60 * 1000;

export function useSessionTimeout(userId: string, onExpire: () => void | Promise<void>) {
  const [secondsRemaining, setSecondsRemaining] = React.useState<number | null>(null);
  const expireRef = React.useRef(onExpire);
  React.useEffect(() => { expireRef.current = onExpire; }, [onExpire]);

  const resetTimer = React.useCallback(() => {
    window.dispatchEvent(new Event('dashboard-session-activity'));
  }, []);

  React.useEffect(() => {
    if (!userId) { setSecondsRemaining(null); return; }
    let warningTimer = 0;
    let countdownTimer = 0;
    let expiryTimer = 0;
    let deadline = 0;
    let expired = false;

    const clearTimers = () => {
      window.clearTimeout(warningTimer);
      window.clearTimeout(countdownTimer);
      window.clearTimeout(expiryTimer);
    };
    const beginCountdown = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      if (remaining <= 0) {
        if (!expired) { expired = true; void expireRef.current(); }
        return;
      }
      countdownTimer = window.setTimeout(beginCountdown, 1000);
    };
    const start = () => {
      if (expired) return;
      clearTimers();
      setSecondsRemaining(null);
      deadline = Date.now() + IDLE_TIMEOUT_MS;
      warningTimer = window.setTimeout(beginCountdown, IDLE_TIMEOUT_MS - WARNING_BEFORE_MS);
      expiryTimer = window.setTimeout(() => {
        if (!expired) { expired = true; setSecondsRemaining(0); void expireRef.current(); }
      }, IDLE_TIMEOUT_MS);
    };
    const onActivity = (event: Event) => {
      if (event.target instanceof Element && event.target.closest('.session-timeout-dialog')) return;
      start();
    };
    const onManualReset = () => start();
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((event) => window.addEventListener(event, onActivity, { passive: true }));
    window.addEventListener('dashboard-session-activity', onManualReset);
    start();
    return () => {
      clearTimers();
      events.forEach((event) => window.removeEventListener(event, onActivity));
      window.removeEventListener('dashboard-session-activity', onManualReset);
    };
  }, [userId]);

  return { secondsRemaining, staySignedIn: resetTimer };
}
