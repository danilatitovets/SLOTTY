import { useState, type FC } from 'react';
import {
  paymentLogoImageClass,
  paymentLogoOffsetClass,
  type PaymentMethodConfig,
} from './paymentLogosConfig';

type Props = {
  method: PaymentMethodConfig;
  logoHeightClass: string;
  className?: string;
};

export const PaymentLogoImage: FC<Props> = ({ method, logoHeightClass, className = '' }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-lg bg-neutral-100 px-2 text-[11px] font-semibold text-neutral-600 ${logoHeightClass} ${className}`}
        title={method.label}
      >
        {method.label}
      </span>
    );
  }

  return (
    <img
      src={method.src}
      alt={method.label}
      width={120}
      height={32}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`${paymentLogoImageClass(method.id)} ${logoHeightClass} ${paymentLogoOffsetClass(method.id)} ${className}`}
    />
  );
};
