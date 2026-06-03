import type { FC } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PaymentResultLayout } from './PaymentResultLayout';

export const PaymentSuccessPage: FC = () => {
  const [params] = useSearchParams();
  const paymentId = params.get('payment_id') ?? params.get('paymentId');

  return (
    <PaymentResultLayout title="Оплата принята" tone="success">
      <p>
        Спасибо! Если вы завершили оплату на стороне платёжного провайдера, мы обработаем платёж в
        ближайшее время.
      </p>
      <p className="text-[13px] text-neutral-500">
        Финальный статус подтверждается автоматически через защищённое уведомление (webhook), а не
        только по факту открытия этой страницы. Обновите профиль или кабинет мастера через несколько
        минут.
      </p>
      {paymentId ? (
        <p className="text-[12px] text-neutral-400">
          Номер платежа: <span className="font-mono">{paymentId}</span>
        </p>
      ) : null}
    </PaymentResultLayout>
  );
};
