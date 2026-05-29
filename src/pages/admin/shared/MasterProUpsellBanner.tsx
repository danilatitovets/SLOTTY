import { Link } from 'react-router-dom';
import { HiArrowRight, HiSparkles } from 'react-icons/hi2';
import { ADMIN_BILLING_PATH } from '../../../app/paths';
import { MiniPicture } from '../../../shared/ui/MiniPicture';
import {
  MASTER_PRO_PLAN_NAME,
  masterProUpsellCopy,
  type MasterProUpsellVariant,
} from '../../../features/billing/masterProUpsell';

type Props = {
  variant: MasterProUpsellVariant;
  className?: string;
};

export function MasterProUpsellBanner({ variant, className = '' }: Props) {
  const copy = masterProUpsellCopy(variant);

  return (
    <section
      className={`overflow-hidden rounded-[16px] bg-white p-5 sm:p-6 lg:rounded-[20px] ${className}`.trim()}
      aria-labelledby={`master-pro-upsell-${variant}`}
    >
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6 lg:gap-8">
        <div className="flex w-full min-w-0 flex-1 items-start gap-3 sm:gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#FFF1F4] text-[#ff5f7a]">
            <HiSparkles className="h-5 w-5" aria-hidden />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">
              Подписка · {MASTER_PRO_PLAN_NAME}
            </p>
            <h2
              id={`master-pro-upsell-${variant}`}
              className="mt-1 text-[20px] font-black tracking-[-0.04em] text-[#111827] lg:text-[22px]"
            >
              {copy.title}
            </h2>
            <p className="mt-2 max-w-[32rem] text-[14px] font-medium leading-relaxed text-[#6B7280]">
              {copy.lead}
            </p>
            <Link
              to={ADMIN_BILLING_PATH}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-[#ff5f7a] px-5 text-[14px] font-bold text-white transition hover:bg-[#f04f6c] active:scale-[0.98] sm:mt-5 sm:w-auto"
            >
              {copy.cta}
              <HiArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-center">
          <MiniPicture
            name="billingPro"
            variant="empty"
            className="mb-0 max-h-[5.75rem] w-auto max-w-[9rem] shrink-0 object-contain sm:max-h-[6.25rem] sm:max-w-[9.5rem]"
          />
        </div>
      </div>
    </section>
  );
}
