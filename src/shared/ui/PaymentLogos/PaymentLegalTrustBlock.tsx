import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { LEGAL_PAYMENT_PATH, LEGAL_REFUND_PATH } from '../../../app/paths';
import { PAYMENT_LEGAL_TRUST_BLOCK_BG } from '../../../pages/legal/legalSiteInfo';
import { PaymentLogos } from './PaymentLogos';

type Props = {
  className?: string;
  showLogos?: boolean;
};

const trustLinkClass =
  'inline-flex min-h-10 items-center rounded-full bg-white px-4 text-[14px] font-semibold text-[#111827] shadow-[0_2px_14px_rgba(17,24,39,0.1)] ring-1 ring-black/[0.08] transition hover:bg-white/95 active:opacity-90';

export const PaymentLegalTrustBlock: FC<Props> = ({ className = '', showLogos = false }) => {
  return (
    <aside
      className={`relative w-full overflow-hidden rounded-[20px] border border-black/[0.06] ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-right bg-no-repeat"
        style={{ backgroundImage: `url(${PAYMENT_LEGAL_TRUST_BLOCK_BG})` }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white from-45% via-white/95 via-65% to-white/25 sm:from-40% sm:via-58%"
        aria-hidden
      />
      <div className="relative z-10 px-5 py-6 sm:px-7 sm:py-7">
        <div className="max-w-[34rem]">
          <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-[#111827] sm:text-[20px]">
            Оплата и возвраты
          </h2>
          <p className="mt-3 text-[15px] font-medium leading-relaxed text-[#374151] sm:text-[16px]">
            Правила оплаты и возврата описаны на отдельных страницах. После подключения онлайн-оплаты
            доступные способы будут отображаться при оформлении.
          </p>
          <ul className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
            <li>
              <Link to={LEGAL_PAYMENT_PATH} className={trustLinkClass}>
                Оплата и безопасность
              </Link>
            </li>
            <li>
              <Link to={LEGAL_REFUND_PATH} className={trustLinkClass}>
                Возвраты
              </Link>
            </li>
          </ul>
        </div>
        {showLogos ? (
          <PaymentLogos
            variant="compact"
            showDisclaimer
            className="mt-6 border-white/60 bg-white/90 shadow-[0_4px_24px_rgba(17,24,39,0.06)] backdrop-blur-sm"
            title="Планируемые способы оплаты"
          />
        ) : null}
      </div>
    </aside>
  );
};
