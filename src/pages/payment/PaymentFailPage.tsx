import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { LEGAL_PAYMENT_PATH } from '../../app/paths';
import { SITE_SUPPORT_EMAIL } from '../legal/legalSiteInfo';
import { PaymentResultLayout } from './PaymentResultLayout';

export const PaymentFailPage: FC = () => {
  return (
    <PaymentResultLayout title="Оплата не завершена" tone="fail">
      <p>Платёж не был завершён или был отклонён банком / платёжной системой.</p>
      <ul className="list-disc space-y-1 pl-5 text-[14px] text-neutral-600">
        <li>недостаточно средств или лимит карты;</li>
        <li>отмена на странице оплаты;</li>
        <li>ошибка 3-D Secure;</li>
        <li>временная недоступность провайдера.</li>
      </ul>
      <p className="text-[13px] text-neutral-500">
        Вы можете повторить оплату из кабинета мастера. Подробнее —{' '}
        <Link to={LEGAL_PAYMENT_PATH} className="font-semibold text-[#E29595] hover:underline">
          оплата и безопасность
        </Link>
        .
      </p>
      <p className="text-[13px]">
        Поддержка:{' '}
        <a className="font-semibold text-[#E29595] hover:underline" href={`mailto:${SITE_SUPPORT_EMAIL}`}>
          {SITE_SUPPORT_EMAIL}
        </a>
      </p>
    </PaymentResultLayout>
  );
};
