import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LOGIN_PATH } from '../../app/paths';
import { sendEmailVerification, verifyEmailToken } from '../../features/auth/api/authApi';
import { AuthEmailPageShell } from './AuthEmailPageShell';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token')?.trim() ?? '';

  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendBusy, setResendBusy] = useState(false);
  const [resendOk, setResendOk] = useState(false);

  useEffect(() => {
    if (!token) return;
    setStatus('loading');
    void verifyEmailToken(token)
      .then(() => {
        setStatus('ok');
        setMessage('Email подтверждён. Теперь можно входить и восстанавливать пароль.');
      })
      .catch((e) => {
        setStatus('error');
        setMessage(e instanceof Error ? e.message : 'Не удалось подтвердить email');
      });
  }, [token]);

  const handleResend = async () => {
    if (!resendEmail.trim()) return;
    setResendBusy(true);
    setResendOk(false);
    try {
      await sendEmailVerification(resendEmail.trim());
      setResendOk(true);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Не удалось отправить письмо');
      setStatus('error');
    } finally {
      setResendBusy(false);
    }
  };

  return (
    <AuthEmailPageShell
      title="Подтверждение email"
      subtitle="Перейдите по ссылке из письма или запросите новую."
    >
      {!token ? (
        <div className="space-y-4">
          <p className="text-[14px] text-[#6B7280]">
            В письме должна быть кнопка «Подтвердить email». Если ссылки нет — введите email и запросите
            повторно.
          </p>
          <input
            type="email"
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            placeholder="email@example.com"
            className="w-full rounded-full border border-[#E5E7EB] bg-[#F7F7F8] px-4 py-3 text-[15px] outline-none focus:border-[#F47C8C]"
          />
          <button
            type="button"
            disabled={resendBusy || !resendEmail.trim()}
            onClick={() => void handleResend()}
            className="w-full rounded-full bg-gradient-to-r from-[#F47C8C] to-[#F26D83] px-4 py-3 text-[15px] font-semibold text-white disabled:opacity-50"
          >
            Отправить письмо снова
          </button>
          {resendOk ? (
            <p className="text-[13px] font-medium text-[#15803D]">
              Если аккаунт с этим email есть, письмо отправлено. Проверьте почту и папку «Спам».
            </p>
          ) : null}
        </div>
      ) : status === 'loading' ? (
        <p className="text-[14px] text-[#6B7280]">Подтверждаем…</p>
      ) : status === 'ok' ? (
        <div className="space-y-4">
          <p className="text-[14px] font-medium text-[#15803D]">{message}</p>
          <Link
            to={LOGIN_PATH}
            className="flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#F47C8C] to-[#F26D83] px-4 py-3 text-[15px] font-semibold text-white no-underline"
          >
            Войти
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="rounded-2xl bg-[#FFF0F0] px-4 py-3 text-[13px] font-semibold text-[#9B2C2C]">{message}</p>
          <input
            type="email"
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            placeholder="email@example.com"
            className="w-full rounded-full border border-[#E5E7EB] bg-[#F7F7F8] px-4 py-3 text-[15px] outline-none focus:border-[#F47C8C]"
          />
          <button
            type="button"
            disabled={resendBusy || !resendEmail.trim()}
            onClick={() => void handleResend()}
            className="w-full rounded-full bg-[#E29595] px-4 py-3 text-[14px] font-semibold text-white disabled:opacity-50"
          >
            Отправить письмо снова
          </button>
        </div>
      )}
    </AuthEmailPageShell>
  );
}
