import { useCallback, useMemo } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { BECOME_MASTER_PATH, HUB_PATH } from '../../app/paths';
import { useAuth } from '../../features/auth/AuthProvider';
import { LoginAccountHint } from '../../features/auth/components/LoginAccountHint';
import { LoginMethodsPanel } from '../../features/auth/components/LoginMethodsPanel';
import { getPostMasterLoginPath } from '../../features/auth/lib/postLoginRedirect';
import { LoadingScreen } from '../../shared/ui/LoadingVideo';

export function MasterLoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, profile } = useAuth();

  const afterLoginPath = useMemo(
    () => getPostMasterLoginPath(profile?.role),
    [profile?.role],
  );

  const onLinked = useCallback(
    (loggedInProfile?: { role?: string }) => {
      navigate(getPostMasterLoginPath(loggedInProfile?.role), { replace: true });
    },
    [navigate],
  );

  if (isLoading) {
    return <LoadingScreen className="bg-[#FFFCFC]" />;
  }

  if (isAuthenticated) {
    return <Navigate to={afterLoginPath} replace />;
  }

  return (
    <div className="min-h-dvh bg-[#FFFCFC] py-10">
      <div className="mx-auto w-full max-w-md px-4">
        <Link to={HUB_PATH} className="text-[14px] font-semibold text-[#6B7280]">
          ← На главную
        </Link>
        <h1 className="mt-6 text-[26px] font-bold tracking-[-0.04em] text-[#111827]">
          Войдите в кабинет мастера
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[#6B7280]">
          Google, Telegram или email — выберите удобный способ.
        </p>

        <div className="mt-4">
          <LoginAccountHint />
        </div>

        <div className="mt-6 rounded-[28px] border border-[#F3F4F6] bg-white p-5 shadow-[0_12px_40px_rgba(17,24,39,0.06)]">
          <LoginMethodsPanel mode="login" onLinked={onLinked} />
        </div>

        <p className="mt-6 text-center text-[14px] text-[#6B7280]">
          Ещё не мастер?{' '}
          <Link to={BECOME_MASTER_PATH} className="font-semibold text-[#F47C8C]">
            Стать мастером
          </Link>
        </p>
      </div>
    </div>
  );
}
