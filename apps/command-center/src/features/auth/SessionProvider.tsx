import { useEffect, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import { currentSession, onAuthChange, setAutoRefresh } from '@/lib/data/authRepository';
import { needsSecondStep } from '@/lib/data/mfaRepository';
import { isSupabaseConfigured } from '@/lib/data/supabaseClient';
import { useExpenseStore } from '@/features/expenses/state/expenseStore';
import { useNotesStore } from '@/features/notes/state/notesStore';
import { useSession } from './sessionStore';

/** Keeps `useSession` in step with Supabase Auth for the whole app. */
export function SessionProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const session = useSession.getState();
    if (!isSupabaseConfigured()) {
      session.setPreview();
      return undefined;
    }
    let active = true;
    let latest = 0;
    // A password-only session of an account with two-step sign-in still owes its code.
    const signedIn = (email: string | null) => {
      const run = ++latest;
      void needsSecondStep().then((needsCode) => {
        if (!active || run !== latest) return;
        if (needsCode) session.setNeedsCode(email);
        else session.setSignedIn(email);
      });
    };
    void currentSession().then((current) => {
      if (!active) return;
      if (current) signedIn(current.user.email ?? null);
      else session.setSignedOut();
    });
    const unsubscribe = onAuthChange((event, next) => {
      if (event === 'PASSWORD_RECOVERY') session.setRecovery(true);
      if (next) {
        signedIn(next.user.email ?? null);
      } else {
        latest += 1;
        // Signed out (here, elsewhere, or the session expired): drop anything entered.
        useExpenseStore.getState().resetPreview();
        useNotesStore.getState().resetPreview();
        session.setSignedOut();
      }
    });
    // Native apps refresh tokens only while in the foreground (Supabase guidance for RN).
    const appState =
      Platform.OS === 'web'
        ? null
        : AppState.addEventListener('change', (state) => setAutoRefresh(state === 'active'));
    return () => {
      active = false;
      unsubscribe();
      appState?.remove();
    };
  }, []);
  return <>{children}</>;
}
