import type { BillingPeriod } from '../../../features/billing/model/masterPlans';
import { billingSegmentBtn, billingSegmentWrap, billingTrayLabel } from './adminBillingTheme';

type Props = {
  period: BillingPeriod;
  onPeriod: (period: BillingPeriod) => void;
  showLabel?: boolean;
  /** Внутри карточки Pro (светлый текст на фото). */
  variant?: 'panel' | 'proCard';
};

export function BillingPeriodSwitch({
  period,
  onPeriod,
  showLabel = true,
  variant = 'panel',
}: Props) {
  const inPro = variant === 'proCard';
  const labelClass = inPro
    ? 'mb-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-white/80'
    : billingTrayLabel;
  const segmentWrap = inPro
    ? 'grid grid-cols-2 gap-1 rounded-[12px] bg-white/20 p-1 backdrop-blur-sm'
    : billingSegmentWrap;
  const segmentBtn = (active: boolean) =>
    inPro
      ? `flex min-h-10 w-full items-center justify-center rounded-[10px] text-[14px] font-semibold transition active:scale-[0.98] ${
          active
            ? 'bg-white text-[#111827] shadow-[0_2px_8px_rgba(0,0,0,0.12)]'
            : 'bg-transparent text-white/90 hover:text-white'
        }`
      : billingSegmentBtn(active);
  const hintClass = inPro
    ? 'mt-2.5 text-center text-[12px] font-medium text-white/75'
    : 'mt-2.5 text-center text-[12px] font-medium text-[#9CA3AF]';

  return (
    <div>
      {showLabel ? <p className={labelClass}>Период оплаты</p> : null}
      <div className={segmentWrap} role="group" aria-label="Период оплаты">
        <button
          type="button"
          onClick={() => onPeriod('month')}
          className={segmentBtn(period === 'month')}
          aria-pressed={period === 'month'}
        >
          Месяц
        </button>
        <button
          type="button"
          onClick={() => onPeriod('year')}
          className={segmentBtn(period === 'year')}
          aria-pressed={period === 'year'}
        >
          Год
        </button>
      </div>
      <p className={hintClass}>2 месяца бесплатно при оплате за год</p>
    </div>
  );
}
