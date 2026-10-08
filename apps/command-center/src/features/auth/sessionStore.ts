import { create } from 'zustand';

/**
 * The signed-in state the screens need, without the tokens themselves (those stay in
 * Supabase's storage adapter). `preview` means no Supabase project is configured for
 * this build: the app runs on labelled sample data and asks for no sign-in.
 * `needsCode` means the password was right but two-step sign-in is on and the
 * 6-digit code has not been entered yet; the dashboard stays closed until it is.
 */
export type SessionStatus = 'loading' | 'preview' | 'signedOut' | 'needsCode' | 'signedIn';

type SessionState = {
  status: SessionStatus;
  email: string | null;
  /** Opened from a password-reset link: the reset screen may set a new password. */
  recovery: boolean;
  setSignedIn: (email: string | null) => void;
  setNeedsCode: (email: string | null) => void;
  setSignedOut: () => void;
  setPreview: () => void;
  setRecovery: (recovery: boolean) => void;
};

export const useSession = create<SessionState>()((set) => ({
  status: 'loading',
  email: null,
  recovery: false,
  setSignedIn: (email) => set({ status: 'signedIn', email }),
  setNeedsCode: (email) => set({ status: 'needsCode', email }),
  setSignedOut: () => set({ status: 'signedOut', email: null, recovery: false }),
  setPreview: () => set({ status: 'preview', email: null, recovery: false }),
  setRecovery: (recovery) => set({ recovery }),
}));
