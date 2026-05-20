import type { FC } from 'react';
import { Link } from 'react-router-dom';
import {
  BECOME_MASTER_PATH,
  BOOKING_PATH,
  HUB_PATH,
  LEGAL_PD_CONSENT_PATH,
  LEGAL_PRIVACY_PATH,
  LEGAL_TERMS_PATH,
} from '../app/paths';
import { TIVONIX_SITE_URL } from './legal/legalSiteInfo';

const FOOTER_NAV = [
  { key: 'booking', label: 'Запись', to: BOOKING_PATH },
  { key: 'tarify', label: 'Тарифы', to: `${HUB_PATH}#tarify` },
  { key: 'faq', label: 'FAQ', to: `${HUB_PATH}#faq` },
  { key: 'master', label: 'Кабинет мастера', to: BECOME_MASTER_PATH },
] as const;

const LEGAL_LINKS = [
  { key: 'privacy', label: 'Политика ПД', to: LEGAL_PRIVACY_PATH },
  { key: 'consent', label: 'Согласие на обработку ПД', to: LEGAL_PD_CONSENT_PATH },
  { key: 'terms', label: 'Пользовательское соглашение', to: LEGAL_TERMS_PATH },
] as const;

export const HomeFooter: FC = () => {
  return (
    <footer className="mt-14 pb-[max(2rem,env(safe-area-inset-bottom))] sm:mt-16">
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
        <div className="rounded-[28px] bg-[#F1EFEF] p-4 shadow-[0_12px_40px_rgba(17,17,17,0.05)] sm:rounded-[32px] sm:p-5">
          <div className="rounded-[22px] bg-white px-5 py-6 ring-1 ring-[#F3F4F6] sm:px-7 sm:py-8">
            <p className="text-[20px] font-bold tracking-tight text-[#111827]">SLOTTY</p>
            <p className="mt-1 max-w-sm text-[14px] leading-relaxed text-[#6B7280]">
              Онлайн-запись к мастерам прямо в Telegram.
            </p>

            <nav aria-label="Навигация" className="mt-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">Навигация</p>
              <ul className="mt-2 flex flex-col gap-2">
                {FOOTER_NAV.map((item) => (
                  <li key={item.key}>
                    <Link
                      to={item.to}
                      className="text-[15px] font-semibold text-[#374151] transition hover:text-[#111827] active:opacity-80"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-6 border-t border-[#F1EFEF] pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">Документы</p>
              <nav aria-label="Юридические документы" className="mt-2 flex flex-col gap-2">
                {LEGAL_LINKS.map((item) => (
                  <Link
                    key={item.key}
                    to={item.to}
                    className="text-[14px] font-semibold text-[#6B7280] underline-offset-2 transition hover:text-[#111827] hover:underline"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <p className="mt-8 text-center text-[13px] font-medium text-[#9CA3AF]">
              Разработка и сопровождение —{' '}
              <a
                href={TIVONIX_SITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#F47C8C] underline decoration-[#F47C8C]/35 underline-offset-2"
              >
                tivonix.tech
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
