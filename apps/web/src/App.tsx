import { useEffect } from 'react';
import { Provider } from 'react-redux';
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
import { useProfileQuery } from '@/api/passtoreApi';
import { getJwt } from '@/lib/webSecureStorage';
import { store } from '@/store';
import { useAuthStore } from '@/store/authStore';
import { WelcomePage } from '@/pages/WelcomePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ForgotPage } from '@/pages/ForgotPage';
import { HomePage } from '@/pages/HomePage';
import { CredentialFormPage } from '@/pages/CredentialFormPage';
import { CredentialDetailPage } from '@/pages/CredentialDetailPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { TauriDeepLinkBridge } from '@/components/TauriDeepLinkBridge';
import { TempAuthDeliveryPage } from '@/pages/TempAuthDeliveryPage';
import { TempAuthPairPage } from '@/pages/TempAuthPairPage';
import { TempAuthSessionsPage } from '@/pages/TempAuthSessionsPage';
import { SyncCoordinator } from '@/services/sync/SyncCoordinator';

function ProtectedLayout() {
  const token = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);
  if (!hydrated) {
    return <div className="boot-screen">Cargando…</div>;
  }
  if (!token) {
    return <Navigate to="/welcome" replace />;
  }
  return <Outlet />;
}

function RootRedirect() {
  const token = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);
  if (!hydrated) {
    return <div className="boot-screen">Cargando…</div>;
  }
  return <Navigate to={token ? '/home' : '/welcome'} replace />;
}

function AppRoutes() {
  const navigate = useNavigate();
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.accessToken);
  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);
  const setHydrated = useAuthStore((s) => s.setHydrated);

  useEffect(() => {
    const jwt = getJwt();
    if (jwt) {
      setToken(jwt);
    }
    setHydrated(true);
  }, [setHydrated, setToken]);

  const { data: profile } = useProfileQuery(undefined, {
    skip: !hydrated || !token,
  });

  useEffect(() => {
    if (profile) {
      setUser(profile);
    }
  }, [profile, setUser]);

  return (
    <>
      <TauriDeepLinkBridge navigate={navigate} />
      <SyncCoordinator />
      <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot" element={<ForgotPage />} />
      <Route path="/temp-auth/pair" element={<TempAuthPairPage />} />
      <Route path="/temp-auth/delivery" element={<TempAuthDeliveryPage />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route
          path="/security/temp-sessions"
          element={<TempAuthSessionsPage />}
        />
        <Route path="/vault/new" element={<CredentialFormPage />} />
        <Route path="/vault/:id/edit" element={<CredentialFormPage />} />
        <Route path="/vault/:id" element={<CredentialDetailPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Provider>
  );
}
