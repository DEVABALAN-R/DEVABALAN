import React from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { readPortfolio, savePortfolio } from '@/features/portfolio/data/portfolioStorage';
import type { PortfolioData } from '@/features/portfolio/model/portfolio';
import { getSessionUserId, signOut, subscribeToAuthChanges } from '@/features/auth/services/authService';
import ProtectedRoute from '@/features/auth/components/ProtectedRoute';
import SessionTimeoutPrompt from '@/features/auth/components/SessionTimeoutPrompt';
import { useSessionTimeout } from '@/features/auth/hooks/useSessionTimeout';
import { clearObsoleteLocalCredentials } from '@/shared/lib/preferencesStorage';
import { loadPublicPortfolio, savePublicPortfolio } from '@/features/portfolio/data/publicPortfolioRepository';
import { dashboardViewFromPath } from './dashboardRouting';

const Portfolio = React.lazy(() => import('@/features/portfolio/pages/Portfolio'));
const DashboardAccess = React.lazy(() => import('@/features/auth/pages/DashboardAccess'));
const DashboardShell = React.lazy(() => import('./DashboardShell').then(({ DashboardApp }) => ({ default: DashboardApp })));
const RouteLoading = () => <main className="access-page" role="status" aria-live="polite">Loading…</main>;

function LoginRoute({ userId, authReady, onSuccess, onBack }: { userId: string | null; authReady: boolean; onSuccess: (id: string) => void; onBack: () => void }) {
  const location = useLocation();
  const from = typeof location.state?.from === 'string' && dashboardViewFromPath(location.state.from)
    ? location.state.from
    : '/dashboard';
  if (!authReady) return <RouteLoading/>;
  if (userId) return <Navigate to={from} replace/>;
  return <DashboardAccess onBack={onBack} onSuccess={onSuccess} timedOut={location.state?.timedOut === true}/>;
}

function AppRoutes() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userId, setUserId] = React.useState<string | null>(null);
  const [authReady, setAuthReady] = React.useState(false);
  const [portfolioData, setPortfolioData] = React.useState<PortfolioData>(readPortfolio);
  const [portfolioRevision, setPortfolioRevision] = React.useState(0);
  const [portfolioLoaded, setPortfolioLoaded] = React.useState(false);
  const authVersion = React.useRef(0);
  const expireSession = React.useCallback(async () => {
    try { await signOut(); } catch { /* The local sign-out still clears this browser session. */ }
    setUserId(null);
    setAuthReady(true);
    navigate('/login', { replace: true, state: { timedOut: true } });
  }, [navigate]);
  const { secondsRemaining, staySignedIn } = useSessionTimeout(userId || '', expireSession);

  React.useEffect(() => { savePortfolio(portfolioData); }, [portfolioData]);
  React.useEffect(() => { clearObsoleteLocalCredentials(); }, []);

  React.useEffect(() => {
    let active = true;
    setPortfolioLoaded(false);
    loadPublicPortfolio().then((saved) => {
      if (!active) return;
      if (saved) { setPortfolioData(saved.profile); setPortfolioRevision(saved.revision); }
      else { setPortfolioData(readPortfolio()); setPortfolioRevision(0); }
    }).catch(() => {
      if (active) { setPortfolioData(readPortfolio()); setPortfolioRevision(0); }
    }).finally(() => { if (active) setPortfolioLoaded(true); });
    return () => { active = false; };
  }, []);

  React.useEffect(() => {
    let active = true;
    const unsubscribe = subscribeToAuthChanges((eventUserId, event) => {
      if (event === 'INITIAL_SESSION') return;
      const version = ++authVersion.current;
      if (!eventUserId) {
        setUserId(null);
        setAuthReady(true);
        return;
      }
      // Validate every newly observed session against Supabase before allowing
      // a private route to render. Do not trust a cached browser session alone.
      void getSessionUserId().then((verifiedId) => {
        if (active && authVersion.current === version) setUserId(verifiedId);
      }).catch(() => {
        if (active && authVersion.current === version) setUserId(null);
      }).finally(() => {
        if (active && authVersion.current === version) setAuthReady(true);
      });
    });
    const initialVersion = authVersion.current;
    void getSessionUserId().then((id) => {
      if (active && authVersion.current === initialVersion) setUserId(id);
    }).catch(() => {
      if (active && authVersion.current === initialVersion) setUserId(null);
    }).finally(() => {
      if (active && authVersion.current === initialVersion) setAuthReady(true);
    });
    return () => { active = false; unsubscribe(); };
  }, []);

  async function persistPortfolio(next: PortfolioData) {
    if (!userId) throw new Error('Sign in to publish portfolio changes.');
    const revision = await savePublicPortfolio(userId, portfolioRevision, next);
    setPortfolioRevision(revision);
    setPortfolioData(next);
  }

  const completeSignIn = (id: string) => {
    setUserId(id);
    setAuthReady(true);
    const from = typeof location.state?.from === 'string' && dashboardViewFromPath(location.state.from)
      ? location.state.from
      : '/dashboard';
    navigate(from, { replace: true });
  };

  return <>
    <React.Suspense fallback={<RouteLoading/>}>
      <Routes>
        <Route path="/" element={<Portfolio data={portfolioData} onOpenDashboard={() => navigate('/login', { state: { from: '/dashboard' } })}/>}/>
        <Route path="/login" element={<LoginRoute userId={userId} authReady={authReady} onSuccess={completeSignIn} onBack={() => navigate('/')}/>}/>
        <Route path="/dashboard/*" element={<ProtectedRoute authReady={authReady} userId={userId}><DashboardShell
          key={userId || 'signed-out'}
          userId={userId || ''}
          portfolioData={portfolioData}
          portfolioReady={portfolioLoaded}
          onSavePortfolio={persistPortfolio}
          onPreviewPortfolio={() => navigate('/')}
          onLogout={async () => { await signOut(); setUserId(null); navigate('/', { replace: true }); }}
        /></ProtectedRoute>}/>
        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes>
    </React.Suspense>
    {userId && secondsRemaining !== null && <SessionTimeoutPrompt secondsRemaining={secondsRemaining} onStaySignedIn={staySignedIn} onLogout={() => void expireSession()}/>}
  </>;
}

export default function App() { return <AppRoutes/>; }
