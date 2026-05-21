import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FORGOT_PASSWORD_PATH, LOGIN_PATH } from '../../app/paths';
import { resetPasswordWithToken } from '../../features/auth/api/authApi';
import { AuthEmailPageShell } from './AuthEmailPageShell';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token')?.trim() ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (password.length < 8) {
      setError('Пароль минимум 8 символов');
      return;
    }
    if (password !== confirm) {
      setError('Пароли не совпадают');
      return;
    }
    if (!token) {
      setError('Ссылка недействительна. Запросите сброс пароля снова.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await resetPasswordWithToken(token, password);
      setDone(true);
      setTimeout(() => navigate(LOGIN_PATH, { replace: true }), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сменить пароль');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthEmailPageShell title="Новый пароль" subtitle="Придумайте пароль не короче 8 символов.">
      {done ? (
        <p className="text-[14px] font-medium text-[#15803D]">
          Пароль обновлён. Сейчас откроется страница входа…
        </p>
      ) : !token ? (
        <p className="text-[14px] text-[#6B7280]">
          Откройте ссылку из письма или{' '}
          <Link to={FORGOT_PASSWORD_PATH} className="font-semibold text-[#F47C8C]">
            запросите сброс снова
          </Link>
          .
        </p>
      ) : (
        <div className="space-y-4">
          {error ? (
            <p className="rounded-2xl bg-[#FFF0F0] px-4 py-3 text-[13px] font-semibold text-[#9B2C2C]">{error}</p>
          ) : null}
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Новый пароль"
            className="w-full rounded-full border border-[#E5E7EB] bg-[#F7F7F8] px-4 py-3.5 text-[15px] outline-none focus:border-[#F47C8C]"
          />
          <input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Повторите пароль"
            className="w-full rounded-full border border-[#E5E7EB] bg-[#F7F7F8] px-4 py-3.5 text-[15px] outline-none focus:border-[#F47C8C]"
          />
          <button
            type="button"
            disabled={busy || password.length < 8}
            onClick={() => void handleSubmit()}
            className="w-full rounded-full bg-gradient-to-r from-[#F47C8C] to-[#F26D83] px-4 py-3.5 text-[15px] font-semibold text-white disabled:opacity-50"
          >
            Сохранить пароль
          </button>
        </div>
      )}
    </AuthEmailPageShell>
  );
}
