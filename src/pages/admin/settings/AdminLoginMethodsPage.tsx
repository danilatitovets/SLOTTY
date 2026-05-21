import { Link, Navigate } from 'react-router-dom';
import { ADMIN_PATH, MASTER_LOGIN_PATH } from '../../../app/paths';
import { useAuth } from '../../../features/auth/AuthProvider';
import { LoginMethodsPanel } from '../../../features/auth/components/LoginMethodsPanel';

export function AdminLoginMethodsPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (!isLoading && !isAuthenticated) {
    return <Navigate to={MASTER_LOGIN_PATH} replace />;
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-lg">
      <Link
        to={ADMIN_PATH}
        className="mb-4 inline-flex min-h-10 items-center text-[14px] font-semibold text-neutral-500 transition hover:text-neutral-800"
      >
        ← Профиль мастера
      </Link>
      <h1 className="text-[26px] font-semibold tracking-[-0.055em] text-neutral-950">Способы входа</h1>
      <div className="mt-6">
        <LoginMethodsPanel mode="settings" />
      </div>
    </div>
  );
}
