import { supabase } from '@/shared/lib/supabaseClient';

export async function signIn(email: string, password: string): Promise<string> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error('Authentication did not return a user session.');
  return data.user.id;
}

export async function signOut(): Promise<void> {
  // Clear this tab's session immediately so a failed network request cannot
  // leave the private UI signed in locally.
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
}

export async function getSessionUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id ?? null;
}

export function subscribeToAuthChanges(onUserChange: (userId: string | null, event: string) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    onUserChange(session?.user.id ?? null, event);
  });
  return () => subscription.unsubscribe();
}
