import { Link } from 'react-router-dom';
import { HUB_PATH, getLoginPath } from '../../app/paths';
import { paCard, paPrimaryBtn } from './platformAdminTheme';

export function PlatformAdminForbidden({ reason }: { reason: 'auth' | 'role' }) {
  const isAuth = reason === 'auth';
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f6f7fb] p-6">
      <section className={`${paCard} max-w-md px-8 py-10 text-center`}>
        <h1 className="text-[22px] font-bold text-[#111827]">
          {isAuth ? 'Требуется вход' : 'Нет доступа'}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#6B7280]">
          {isAuth
            ? 'Войдите в аккаунт администратора платформы.'
            : 'Эта страница доступна только администратору платформы.'}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          {isAuth ? (
            <Link to={getLoginPath('/platform-admin')} className={paPrimaryBtn}>
              Войти
            </Link>
          ) : (
            <Link to={HUB_PATH} className={paPrimaryBtn}>
              На главную
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
