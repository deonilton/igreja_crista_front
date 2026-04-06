import { ReactNode, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import type { PermissionResource } from './permissions/accessControl';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/ResetPassword/ResetPassword';
import Dashboard from './pages/Dashboard/Dashboard';
import Members from './pages/Members/Members';
import MemberForm from './pages/MemberForm/MemberForm';
import Users from './pages/Users/Users';
import PequenasFamilias from './pages/PequenasFamilias/PequenasFamilias';
import Evangelismo from './pages/Evangelismo/Evangelismo';
import Diaconia from './pages/Diaconia/Diaconia';
import Louvor from './pages/Louvor/Louvor';
import MinisterioInfantil from './pages/MinisterioInfantil/MinisterioInfantil';
import RelatorioCulto from './pages/RelatorioCulto/RelatorioCulto';
import SalaPastoral from './pages/SalaPastoral/SalaPastoral';
import Forbidden from './pages/Forbidden/Forbidden';

interface RouteGuardProps {
  children: ReactNode;
  resource?: PermissionResource;
  ministry?: string;
}

function PrivateRoute({ children, resource, ministry }: RouteGuardProps) {
  const { signed, loading, hasPermission, refreshUser } = useAuth();
  const [refreshed, setRefreshed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const accessDenied = !loading && signed && !!resource && !hasPermission(resource, ministry);

  useEffect(() => {
    if (accessDenied && !refreshed && !refreshing) {
      setRefreshing(true);
      refreshUser().finally(() => {
        setRefreshed(true);
        setRefreshing(false);
      });
    }
  }, [accessDenied, refreshed, refreshing]);

  if (loading || refreshing) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--surface-bg)',
        color: 'var(--text-secondary)',
        gap: '10px',
      }}>
        <div className="spinner"></div>
        Carregando...
      </div>
    );
  }

  if (!signed) {
    return <Navigate to="/login" replace />;
  }

  if (resource && !hasPermission(resource, ministry)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: RouteGuardProps) {
  const { signed, loading } = useAuth();

  if (loading) return null;

  if (signed) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleUnauthorized = () => {
      navigate('/login', { replace: true });
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [navigate]);

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/cadastro"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />

      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        }
      />

      <Route
        path="/403"
        element={
          <PrivateRoute>
            <Forbidden />
          </PrivateRoute>
        }
      />

      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="/" element={<PrivateRoute resource="dashboard"><Dashboard /></PrivateRoute>} />
        <Route path="/membros" element={<PrivateRoute resource="membros"><Members /></PrivateRoute>} />
        <Route path="/membros/novo" element={<PrivateRoute resource="membros"><MemberForm /></PrivateRoute>} />
        <Route path="/membros/:id/editar" element={<PrivateRoute resource="membros"><MemberForm /></PrivateRoute>} />
        <Route path="/usuarios" element={<PrivateRoute resource="usuarios"><Users /></PrivateRoute>} />
        <Route path="/pequenas-familias" element={<PrivateRoute resource="ministerios" ministry="pequenas_familias"><PequenasFamilias /></PrivateRoute>} />
        <Route path="/evangelismo" element={<PrivateRoute resource="ministerios" ministry="evangelismo"><Evangelismo /></PrivateRoute>} />
        <Route path="/diaconia" element={<PrivateRoute resource="ministerios" ministry="diaconia"><Diaconia /></PrivateRoute>} />
        <Route path="/louvor" element={<PrivateRoute resource="ministerios" ministry="louvor"><Louvor /></PrivateRoute>} />
        <Route path="/ministerio-infantil" element={<PrivateRoute resource="ministerios" ministry="ministerio_infantil"><MinisterioInfantil /></PrivateRoute>} />
        <Route path="/relatorio-culto" element={<PrivateRoute resource="ministerios" ministry="diaconia"><RelatorioCulto /></PrivateRoute>} />
        <Route path="/sala-pastoral" element={<PrivateRoute resource="pastoral_room"><SalaPastoral /></PrivateRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}