import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Home from '@/pages/Home';
import Studio from '@/pages/Studio';
import Knowledge from '@/pages/Knowledge';
import Spark from '@/pages/Spark';
import Origin from '@/pages/Origin';
import Library from '@/pages/Library';
import Watch from '@/pages/Watch';
import DirectorLab from '@/pages/DirectorLab';
import ArgonEngine from '@/pages/ArgonEngine';
import LooseScrew from '@/pages/LooseScrew';
import AiWorkshopOs from '@/pages/AiWorkshopOs';
import OpenClawHub from '@/pages/OpenClawHub';
import OrificeRelay from '@/pages/OrificeRelay';
import HermesHub from '@/pages/HermesHub';
import ProductionFactory from '@/pages/ProductionFactory';
import Connect from '@/pages/Connect';
import LiveSharedFeed from '@/pages/LiveSharedFeed';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import OAuthConsent from '@/pages/OAuthConsent';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Navigate } from 'react-router-dom';
import { FraymusProvider } from '@/lib/FraymusContext';
import AgentMonitor from '@/pages/AgentMonitor';
import FraymusArchitecture from '@/pages/FraymusArchitecture';
import FraymusPartner from '@/pages/FraymusPartner';
import Workflows from '@/pages/Workflows';
import StudioTools from '@/pages/StudioTools';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  const isPublicShareRoute =
    typeof window !== 'undefined' &&
    (window.location.pathname.startsWith('/live-feed') ||
      window.location.pathname.startsWith('/docs'));

  // Handle authentication errors (allow public share routes /live-feed and /docs without login)
  if (authError && !isPublicShareRoute) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/oauth/consent" element={<OAuthConsent />} />
      <Route path="/live-feed" element={<LiveSharedFeed />} />
      <Route path="/docs" element={<LiveSharedFeed />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}><Route path="/" element={<FraymusPartner />} /><Route path="/dashboard" element={<Home />} /><Route path="/workflows" element={<Workflows />} /><Route path="/studio-tools" element={<StudioTools />} /><Route path="/studio" element={<Studio />} /><Route path="/origin" element={<Origin />} /><Route path="/knowledge" element={<Knowledge />} /><Route path="/spark" element={<Spark />} /><Route path="/library" element={<Library />} /><Route path="/watch/:jobId" element={<Watch />} /><Route path="/director-lab" element={<DirectorLab />} /><Route path="/argon" element={<ArgonEngine />} /><Route path="/loose-screw" element={<LooseScrew />} /><Route path="/ai-workshop" element={<AiWorkshopOs />} /><Route path="/openclaw" element={<OpenClawHub />} /><Route path="/orifice-relay" element={<OrificeRelay />} /><Route path="/hermes" element={<HermesHub />} /><Route path="/factory" element={<ProductionFactory />} /><Route path="/connect" element={<Connect />} /><Route path="/admin/agent-monitor" element={<AgentMonitor />} /><Route path="/fraymus-architecture" element={<FraymusArchitecture />} /></Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <FraymusProvider>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </FraymusProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App