import type { BillingPeriod } from '../../../features/billing/model/masterPlans';
import { billingSegmentBtn, billingSegmentWrap, billingTrayLabel } from './adminBillingTheme';

type Props = {
  period: BillingPeriod;
  onPeriod: (period: BillingPeriod) => void;
  showLabel?: boolean;
};

export function BillingPeriodSwitch({ period, onPeriod, showLabel = true }: Props) {
  return (
    <div>
      {showLabel ? <p className={billingTrayLabel}>Период оплаты</p> : null}
      <div className={billingSegmentWrap}>
        <button type="button" onClick={() => onPeriod('month')} className={billingSegmentBtn(period === 'month')}>
          Месяц
        </button>
        <button type="button" onClick={() => onPeriod('year')} className={billingSegmentBtn(period === 'year')}>
          Год
        </button>
      </div>
      <p className="mt-3 text-center text-[13px] font-medium text-[#9CA3AF]">
        2 месяца бесплатно при оплате за год
      </p>
    </div>
  );
}
