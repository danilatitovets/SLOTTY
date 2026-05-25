import {
  billingCheckIcon,
  billingOutlineBtn,
  billingPinkBtn,
  billingPlanCard,
  billingPlanCardActive,
} from './adminBillingTheme';

function IconCheck({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden
    >
      <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Props = {
  name: string;
  priceLine: string;
  tagline: string;
  includes: string[];
  limits: string[];
  active: boolean;
  onSelect: () => void;
};

export function BillingLandingFreeCard({
  name,
  priceLine,
  tagline,
  includes,
  limits,
  active,
  onSelect,
}: Props) {
  const ctaLabel = active ? 'Текущий тариф' : 'Перейти на Free';
  const priceMain = priceLine.split(' / ')[0] ?? priceLine;
  const priceUnit = priceLine.includes(' / ') ? `/ ${priceLine.split(' / ')[1]}` : '';

  return (
    <article
      className={`${billingPlanCard} ${active ? billingPlanCardActive : ''}`}
    >
      {active ? (
        <span className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a] px-3 py-1 text-[11px] font-bold text-white shadow-[0_4px_12px_rgba(255,95,122,0.28)]">
          Активен
        </span>
      ) : null}

      <p className="text-[17px] font-bold tracking-[-0.02em] text-[#111827]">{name}</p>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-[32px] font-black leading-none tracking-[-0.05em] text-[#111827]">
          {priceMain}
        </span>
        {priceUnit ? (
          <span className="text-[14px] font-medium text-[#6B7280]">{priceUnit}</span>
        ) : null}
      </div>
      <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">{tagline}</p>

      <ul className="mt-4 flex flex-1 flex-col gap-2">
        {includes.map((feature) => (
          <li key={feature} className="flex items-center gap-2.5">
            <span className={billingCheckIcon}>
              <IconCheck className="h-3.5 w-3.5" />
            </span>
            <span className="text-[14px] font-medium text-[#374151]">{feature}</span>
          </li>
        ))}
      </ul>

      {limits.length > 0 ? (
        <div className="mt-4 rounded-[16px] bg-[#f6f7fb] px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">Ограничения</p>
          <ul className="mt-2 space-y-1 text-[13px] text-[#6B7280]">
            {limits.map((line) => (
              <li key={line}>— {line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => {
          if (!active) onSelect();
        }}
        disabled={active}
        className={`mt-5 ${active ? billingOutlineBtn : billingPinkBtn}`}
      >
        {ctaLabel}
      </button>
    </article>
  );
}
