import { Navigate, useNavigate } from 'react-router-dom';
import { ADMIN_PATH, MASTER_LOGIN_PATH } from '../../../app/paths';
import { useAuth } from '../../../features/auth/AuthProvider';
import { LoginMethodsSheet } from '../../../features/auth/components/LoginMethodsSheet';

export function AdminLoginMethodsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  if (!isLoading && !isAuthenticated) {
    return <Navigate to={MASTER_LOGIN_PATH} replace />;
  }

  return <LoginMethodsSheet open onClose={() => navigate(ADMIN_PATH)} mode="settings" />;
}
