import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

type Props = { authReady: boolean; userId: string | null; children: React.ReactNode };

export default function ProtectedRoute({ authReady, userId, children }: Props) {
  const location = useLocation();
  if (!authReady) return <main className="access-page" role="status" aria-live="polite">Checking your session…</main>;
  if (!userId) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }}/>;
  }
  return <>{children}</>;
}
