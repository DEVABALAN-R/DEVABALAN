import { Redirect } from 'expo-router';

// The public portfolio still lives in the Vite app until it is ported
// (see docs/architecture/MODERNIZATION_PLAN.md §21). Phase 2 adds sign-in.
export default function Index() {
  return <Redirect href="/dashboard" />;
}
