import { Navigate, useLocation } from 'react-router-dom';
import { getLoginPath, getMasterLoginPath } from '../../../app/paths';
import { useAuth } from '../../auth/AuthProvider';
import { LoadingScreen } from '../../../shared/ui/LoadingVideo';

type BookingAccessGateProps = {
  role: 'client' | 'master';
  children: React.ReactNode;
};

/** Редирект на вход с сохранением deep link (?from=). */
export function BookingAccessGate({ role, children }: BookingAccessGateProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const returnPath = `${location.pathname}${location.search}`;

  if (isLoading) {
    return <LoadingScreen className="bg-white" />;
  }

  if (!isAuthenticated) {
    const loginPath =
      role === 'master' ? getMasterLoginPath(returnPath) : getLoginPath(returnPath);
    return <Navigate to={loginPath} replace />;
  }

  return <>{children}</>;
}
