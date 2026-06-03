import type { FC } from 'react';
import { PaymentLogoImage } from './PaymentLogoImage';
import { PAYMENT_METHODS } from './paymentLogosConfig';

const BEPAID_METHOD = PAYMENT_METHODS.find((m) => m.id === 'bepaid')!;

type Props = {
  className?: string;
};

/** Логотип bePaid для экранов оплаты Pro (без рамок и доп. брендов). */
export const PaymentPartnersStrip: FC<Props> = ({ className = '' }) => {
  return (
    <div className={`flex justify-center ${className}`}>
      <PaymentLogoImage
        method={BEPAID_METHOD}
        logoHeightClass="h-9 w-auto max-w-[9rem] object-contain sm:h-10 sm:max-w-[10rem]"
      />
    </div>
  );
};
