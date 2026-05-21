import { Link } from 'react-router-dom';
import { HUB_PATH, LOGIN_PATH } from '../../app/paths';
import type { ReactNode } from 'react';

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function AuthEmailPageShell({ title, subtitle, children }: Props) {
  return (
    <div className="min-h-dvh bg-[#FFFCFC] py-10">
      <div className="mx-auto w-full max-w-md px-4">
        <Link to={HUB_PATH} className="text-[14px] font-semibold text-[#6B7280]">
          ← На главную
        </Link>
        <h1 className="mt-6 text-[26px] font-bold tracking-[-0.04em] text-[#111827]">{title}</h1>
        {subtitle ? (
          <p className="mt-2 text-[15px] leading-relaxed text-[#6B7280]">{subtitle}</p>
        ) : null}
        <div className="mt-8 rounded-[28px] border border-[#F3F4F6] bg-white p-5 shadow-[0_12px_40px_rgba(17,24,39,0.06)]">
          {children}
        </div>
        <p className="mt-6 text-center text-[14px] text-[#6B7280]">
          <Link to={LOGIN_PATH} className="font-semibold text-[#F47C8C]">
            Вернуться ко входу
          </Link>
        </p>
      </div>
    </div>
  );
}
