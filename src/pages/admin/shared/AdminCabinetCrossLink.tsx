import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Props = {
  to: string;
  children: ReactNode;
  className?: string;
};

/** Ссылка на связанный раздел кабинета (из пустых состояний и подсказок). */
export function AdminCabinetCrossLink({ to, children, className = '' }: Props) {
  return (
    <Link
      to={to}
      className={`inline-flex min-h-11 w-full items-center justify-center rounded-[10px] border border-[#F47C8C]/30 bg-white px-4 text-[14px] font-semibold text-[#F47C8C] transition hover:bg-[#FFF1F4] active:scale-[0.99] ${className}`.trim()}
    >
      {children}
    </Link>
  );
}
