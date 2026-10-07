import type { Session } from '@supabase/auth-js';
import * as Linking from 'expo-linking';
import { getAuth } from './supabaseClient';

/**
 * Every Supabase Auth call the app makes. Screens get plain results with
 * user-safe messages; raw errors (which can name the account state) and tokens
 * never reach the UI or the logs.
 */
export type AuthResult = { ok: true } | { ok: false; message: string };

const NOT_CONFIGURED: AuthResult = {
  ok: false,
  message: 'Sign-in is not set up for this deployment yet.',
};
const GENERIC = 'Something went wrong. Check your connection and try again.';

/** Maps an Auth error to a message that does not reveal whether an account exists. */
export function signInMessage(status: number | undefined, code: string | undefined): string {
  if (code === 'over_request_rate_limit' || status === 429) {
    return 'Too many attempts. Wait a few minutes and try again.';
  }
  if (status === 400 || status === 401 || code === 'invalid_credentials') {
    return 'That email and password do not match.';
  }
  return GENERIC;
}

export async function signInWithPassword(email: string, password: string): Promise<AuthResult> {
  const auth = getAuth();
  if (!auth) return NOT_CONFIGURED;
  try {
    const { error } = await auth.signInWithPassword({ email: email.trim(), password });
    return error ? { ok: false, message: signInMessage(error.status, error.code) } : { ok: true };
  } catch {
    return { ok: false, message: GENERIC };
  }
}

/** Where the reset link lands: the reset screen of this same app. */
export function passwordResetUrl(): string {
  return Linking.createURL('/reset-password');
}

/** Always reports success when the request was sent, so it never reveals which emails exist. */
export async function requestPasswordReset(email: string): Promise<AuthResult> {
  const auth = getAuth();
  if (!auth) return NOT_CONFIGURED;
  try {
    const { error } = await auth.resetPasswordForEmail(email.trim(), {
      redirectTo: passwordResetUrl(),
    });
    if (error?.status === 429) {
      return { ok: false, message: 'Too many requests. Wait a few minutes and try again.' };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: GENERIC };
  }
}

/** Sets a new password for the session opened by the reset link. */
export async function updatePassword(password: string): Promise<AuthResult> {
  const auth = getAuth();
  if (!auth) return NOT_CONFIGURED;
  try {
    const { error } = await auth.updateUser({ password });
    if (!error) return { ok: true };
    if (error.code === 'weak_password') {
      return { ok: false, message: 'Choose a stronger password.' };
    }
    if (error.code === 'same_password') {
      return { ok: false, message: 'Choose a password you have not used here before.' };
    }
    return { ok: false, message: 'The reset link has expired. Request a new one.' };
  } catch {
    return { ok: false, message: GENERIC };
  }
}

/** Ends the session on this device only. */
export async function signOut(): Promise<void> {
  try {
    await getAuth()?.signOut({ scope: 'local' });
  } catch {
    // The local session is cleared by the caller regardless.
  }
}

export async function currentSession(): Promise<Session | null> {
  const auth = getAuth();
  if (!auth) return null;
  try {
    const { data } = await auth.getSession();
    return data.session;
  } catch {
    return null;
  }
}

/** Subscribes to sign-in, sign-out, token refresh and password-recovery events. */
export function onAuthChange(
  listener: (event: string, session: Session | null) => void,
): () => void {
  const auth = getAuth();
  if (!auth) return () => undefined;
  const { data } = auth.onAuthStateChange((event, session) => listener(event, session));
  return () => data.subscription.unsubscribe();
}

/** Native only: refresh tokens while the app is in the foreground (Supabase's RN guidance). */
export function setAutoRefresh(active: boolean): void {
  const auth = getAuth();
  if (!auth) return;
  if (active) void auth.startAutoRefresh();
  else void auth.stopAutoRefresh();
}
