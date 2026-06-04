import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { MASTER_SETTINGS_SUPPORT_PATH } from '../../../../../app/paths';

export type SupportTicketsTab = 'active' | 'closed';

export function SupportTicketsPageHeader() {
  return (
    <header className="min-w-0">
      <nav className="text-[13px] text-[#9CA3AF]" aria-label="Хлебные крошки">
        <Link to={MASTER_SETTINGS_SUPPORT_PATH} className="transition hover:text-[#6B7280]">
          Центр поддержки
        </Link>
        <span className="mx-1.5" aria-hidden>
          &gt;
        </span>
        <span className="text-[#6B7280]">Мои запросы</span>
      </nav>
      <h1 className="mt-4 text-[26px] font-bold tracking-[-0.04em] text-[#111827] lg:text-[28px]">
        Мои запросы
      </h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#6B7280]">
        Проверяйте обновления по текущим запросам и историю предыдущих обращений.
      </p>
    </header>
  );
}

export function SupportTicketsTabs({
  active,
  onChange,
  activeCount,
  closedCount,
}: {
  active: SupportTicketsTab;
  onChange: (tab: SupportTicketsTab) => void;
  activeCount: number;
  closedCount: number;
}) {
  const tabs: { id: SupportTicketsTab; label: string; count: number }[] = [
    { id: 'active', label: 'Активные', count: activeCount },
    { id: 'closed', label: 'Закрытые', count: closedCount },
  ];

  return (
    <nav className="mt-8 flex gap-8 border-b border-[#EBEBEB]" aria-label="Фильтр запросов">
      {tabs.map((tab) => {
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative -mb-px pb-3 text-[15px] transition ${
              selected ? 'font-bold text-[#111827]' : 'font-medium text-[#9CA3AF] hover:text-[#6B7280]'
            }`}
          >
            {tab.label} {tab.count}
            {selected ? (
              <span className="absolute inset-x-0 bottom-0 h-[2px] bg-[#111827]" aria-hidden />
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

export function SupportTicketsEmptyIllustration() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto"
      aria-hidden
    >
      <circle cx="60" cy="44" r="28" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1.5" />
      <path
        d="M60 34v12M60 58h.01"
        stroke="#9CA3AF"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect x="38" y="78" width="44" height="28" rx="6" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1.5" />
      <circle cx="48" cy="90" r="2.5" fill="#D1D5DB" />
      <circle cx="60" cy="90" r="2.5" fill="#D1D5DB" />
      <circle cx="72" cy="90" r="2.5" fill="#D1D5DB" />
      <path d="M88 52l8-6 6 8-8 6-6-8z" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1" />
      <rect x="22" y="62" width="14" height="14" rx="3" fill="#F3F4F6" stroke="#E5E7EB" />
    </svg>
  );
}

export function SupportTicketsEmptyState({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-4 py-16 text-center sm:py-20">
      <SupportTicketsEmptyIllustration />
      <p className="mt-8 text-[16px] font-bold text-[#111827]">{title}</p>
      <p className="mt-2 max-w-md text-[14px] leading-relaxed text-[#6B7280]">{children}</p>
    </div>
  );
}

export const supportTicketsLinkClass =
  'font-semibold text-[#111827] underline decoration-[#111827]/30 underline-offset-2 transition hover:decoration-[#111827]';
