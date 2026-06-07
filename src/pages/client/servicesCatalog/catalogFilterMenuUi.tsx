import type { ReactNode } from 'react';
import { HiChevronRight } from 'react-icons/hi2';

export function FilterMenuRow({
  label,
  value,
  onClick,
}: {
  label: string;
  value?: string | null;
  onClick: () => void;
}) {
  const display = value?.trim() || 'Все';

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition active:bg-[#FAFAFA]"
    >
      <span className="shrink-0 text-[15px] font-medium text-[#111827]">{label}</span>
      <span className="flex min-w-0 items-center gap-1">
        <span
          className={`truncate text-[14px] ${value ? 'font-medium text-[#F47C8C]' : 'text-[#8E8E93]'}`}
        >
          {display}
        </span>
        <HiChevronRight className="h-4 w-4 shrink-0 text-[#C7C7CC]" aria-hidden />
      </span>
    </button>
  );
}

export function FilterMenuSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-[#F0F0F0] px-4 py-4 first:border-t-0">
      <p className="mb-3 text-[15px] font-bold text-[#111827]">{title}</p>
      {children}
    </section>
  );
}

export function FilterMenuCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-[16px] bg-white ${className}`.trim()}>
      {children}
    </div>
  );
}
