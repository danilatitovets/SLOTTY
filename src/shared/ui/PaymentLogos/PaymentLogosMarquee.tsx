import type { FC } from 'react';
import { PaymentLogoImage } from './PaymentLogoImage';
import { paymentLogoHeightClass, type PaymentMethodConfig } from './paymentLogosConfig';

function MarqueeCard({ method }: { method: PaymentMethodConfig }) {
  return (
    <div className="flex w-[220px] shrink-0 flex-col rounded-[16px] bg-[#F5F5F5] px-5 py-5 sm:w-[260px] sm:px-6 sm:py-6">
      <div className="flex min-h-[5.5rem] items-end justify-center pb-0.5 sm:min-h-[6.25rem]">
        <PaymentLogoImage method={method} logoHeightClass={paymentLogoHeightClass(method.id)} />
      </div>
      <p className="mt-4 text-center text-[14px] font-medium leading-snug text-[#374151] sm:text-[15px]">
        {method.caption}
      </p>
    </div>
  );
}

type Props = {
  methods: PaymentMethodConfig[];
  className?: string;
};

/** Горизонтальная лента логотипов с автопрокруткой. */
export const PaymentLogosMarquee: FC<Props> = ({ methods, className = '' }) => {
  const track = [...methods, ...methods];

  return (
    <div className={`relative overflow-hidden ${className}`.trim()}>
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white to-transparent sm:w-14"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-r from-transparent to-white sm:w-14"
        aria-hidden
      />
      <div className="flex w-max gap-4 py-1 motion-reduce:animate-none animate-payment-marquee sm:gap-5">
        {track.map((method, index) => (
          <MarqueeCard key={`${method.id}-${index}`} method={method} />
        ))}
      </div>
    </div>
  );
};
