import { Redirect } from 'expo-router';

// No public home page yet (the portfolio is not ported); `/` opens the dashboard,
// which asks for sign-in when Supabase is configured.
export default function Index() {
  return <Redirect href="/dashboard" />;
}
