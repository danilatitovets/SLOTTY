import type { FC, ReactNode } from 'react';

type Props = {
  children?: ReactNode;
  className?: string;
  tone?: 'light' | 'legal' | 'footer';
};

const toneClass: Record<NonNullable<Props['tone']>, string> = {
  light: 'text-[13px] text-neutral-600',
  legal: 'text-[13px] text-neutral-600',
  footer: 'text-[11px] leading-snug text-[#171717]/55',
};

export const PaymentDisclaimer: FC<Props> = ({
  children,
  className = '',
  tone = 'light',
}) => {
  return (
    <p className={`leading-relaxed ${toneClass[tone]} ${className}`}>{children}</p>
  );
};
