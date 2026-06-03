import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { LEGAL_PAYMENT_PATH, LEGAL_REFUND_PATH } from '../../../app/paths';
import { PaymentLogos } from './PaymentLogos';

type Props = {
  className?: string;
  showLogos?: boolean;
};

export const PaymentLegalTrustBlock: FC<Props> = ({ className = '', showLogos = false }) => {
  return (
    <aside
      className={`rounded-[20px] border border-black/[0.06] bg-white px-4 py-5 sm:px-5 ${className}`}
    >
      <h2 className="text-[17px] font-semibold text-neutral-950">Оплата и возвраты</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-neutral-700">
        Правила оплаты и возврата описаны на отдельных страницах. После подключения онлайн-оплаты
        доступные способы будут отображаться при оформлении.
      </p>
      <ul className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6">
        <li>
          <Link
            to={LEGAL_PAYMENT_PATH}
            className="text-[14px] font-semibold text-[#E29595] underline-offset-2 hover:underline"
          >
            Оплата и безопасность
          </Link>
        </li>
        <li>
          <Link
            to={LEGAL_REFUND_PATH}
            className="text-[14px] font-semibold text-[#E29595] underline-offset-2 hover:underline"
          >
            Возвраты
          </Link>
        </li>
      </ul>
      {showLogos ? (
        <PaymentLogos variant="compact" showDisclaimer className="mt-5" title="Планируемые способы оплаты" />
      ) : null}
    </aside>
  );
};
