import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LOGIN_PATH } from '../../app/paths';
import { requestForgotPassword } from '../../features/auth/api/authApi';
import { AuthEmailPageShell } from './AuthEmailPageShell';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      await requestForgotPassword(email.trim());
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthEmailPageShell
      title="Забыли пароль?"
      subtitle="Отправим ссылку для сброса на email, если аккаунт существует и почта подтверждена."
    >
      {done ? (
        <p className="text-[14px] leading-relaxed text-[#6B7280]">
          Если аккаунт с этим email существует, мы отправили ссылку для сброса пароля. Проверьте почту и
          папку «Спам».
        </p>
      ) : (
        <div className="space-y-4">
          {error ? (
            <p className="rounded-2xl bg-[#FFF0F0] px-4 py-3 text-[13px] font-semibold text-[#9B2C2C]">{error}</p>
          ) : null}
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="w-full rounded-full border border-[#E5E7EB] bg-[#F7F7F8] px-4 py-3.5 text-[15px] outline-none focus:border-[#F47C8C]"
          />
          <button
            type="button"
            disabled={busy || !email.trim()}
            onClick={() => void handleSubmit()}
            className="w-full rounded-full bg-gradient-to-r from-[#F47C8C] to-[#F26D83] px-4 py-3.5 text-[15px] font-semibold text-white disabled:opacity-50"
          >
            Отправить ссылку
          </button>
        </div>
      )}
      <p className="mt-4 text-center text-[13px] text-[#6B7280]">
        <Link to={LOGIN_PATH} className="font-semibold text-[#F47C8C]">
          Назад ко входу
        </Link>
      </p>
    </AuthEmailPageShell>
  );
}
