import { Link } from 'react-router-dom';
import { HUB_PATH, SERVICES_PATH } from '../app/paths';
import { HEADER_LOGO_SRC } from '../app/headerLogo';
import { clientOutlineBtn, clientPinkBtn } from './client/clientTheme';

export function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#F8F6F6] px-4 py-10 text-[#111827]">
      <div className="w-full max-w-md rounded-[28px] bg-white px-6 py-10 text-center shadow-[0_12px_40px_rgba(17,24,39,0.06)] ring-1 ring-[#F3F4F6]">
        <img
          src={HEADER_LOGO_SRC}
          alt="SLOTTY"
          width={120}
          height={40}
          decoding="async"
          className="mx-auto h-10 w-auto object-contain"
        />
        <h1 className="mt-6 text-[22px] font-semibold tracking-[-0.04em] text-neutral-950">
          Страница не найдена
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[#6B7280]">
          Возможно, ссылка устарела или была введена с ошибкой.
        </p>
        <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link to={HUB_PATH} className={clientPinkBtn}>
            На главную
          </Link>
          <Link to={SERVICES_PATH} className={clientOutlineBtn}>
            В каталог
          </Link>
        </div>
      </div>
    </div>
  );
}
