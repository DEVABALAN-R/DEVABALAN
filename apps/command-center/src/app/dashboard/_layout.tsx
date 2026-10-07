import { AppShell } from '@/features/shell/AppShell';

// Phase 2 wraps this in Stack.Protected (session + MFA). Until then the shell
// renders placeholders and labelled sample data only; it reads no user data.
export default function DashboardLayout() {
  return <AppShell />;
}
