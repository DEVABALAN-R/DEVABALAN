import { AppShell } from '@/features/shell/AppShell';

// Phase 2 wraps this in Stack.Protected (session + MFA). Until then the shell
// renders placeholders only and reads no user data.
export default function DashboardLayout() {
  return <AppShell />;
}
