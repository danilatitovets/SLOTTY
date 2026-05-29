import { HiCheck, HiClock, HiEllipsisHorizontal, HiGift } from 'react-icons/hi2';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import { cabinetIconCircle } from '../profile/adminProfileCabinetTheme';
import {
  bundleHasDiscount,
  bundleStatusLabel,
  resolveBundleDisplayImage,
} from './bundleUtils';
import { formatDurationRu } from './servicesFormat';
import type { ManagedService } from './servicesFormat';
import type { ServiceBundle } from './servicesTypes';

type Props = {
  bundle: ServiceBundle;
  services: ManagedService[];
  draft: MasterDraft;
  serviceTitleById: Map<string, string>;
  onMenu?: () => void;
  className?: string;
  /** Превью Pro: без статусов «Виден» / «Черновик» — только «Только пример». */
  examplePreview?: boolean;
};

function statusBadgeClass(status: ServiceBundle['status']): string {
  switch (status) {
    case 'visible':
      return 'bg-[#ECFDF5]/95 text-[#16A34A]';
    case 'hidden':
      return 'bg-[#F3F4F6] text-[#6B7280]';
    default:
      return 'bg-white/90 text-[#6B7280]';
  }
}

export function ServicesBundleCard({
  bundle,
  services,
  draft,
  serviceTitleById,
  onMenu,
  className = '',
  examplePreview = false,
}: Props) {
  const img = resolveBundleDisplayImage(bundle, services, draft);
  const showDeal = bundleHasDiscount(bundle.originalPrice, bundle.bundlePrice);

  return (
    <article
      className={`flex w-full overflow-hidden rounded-[16px] bg-white lg:rounded-[24px] lg:border lg:border-[#EAECEF] lg:shadow-[0_2px_16px_rgba(17,24,39,0.04)] ${
        examplePreview ? 'ring-2 ring-dashed ring-[#D1D5DB]' : ''
      } ${className}`}
    >
      <div className="relative flex w-[6.25rem] shrink-0 self-stretch bg-[#EBEBEB] sm:w-28 lg:w-[5.5rem] lg:min-h-[120px]">
        {img ? (
          <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        ) : (
          <span className="flex h-full min-h-[7.5rem] w-full items-center justify-center lg:min-h-[120px]">
            <span className={`${cabinetIconCircle} h-12 w-12 rounded-[12px] lg:h-14 lg:w-14 lg:rounded-[14px]`}>
              <HiGift className="h-6 w-6 lg:h-7 lg:w-7" aria-hidden />
            </span>
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-3.5 lg:justify-center lg:px-6 lg:py-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              {examplePreview ? (
                <span className="inline-flex rounded-full bg-[#FFFBEB] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#92400E] ring-1 ring-[#FDE68A]">
                  Только пример
                </span>
              ) : (
                <>
                  {showDeal ? (
                    <span className="inline-flex rounded-full bg-[#FFF1F4] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#F47C8C]">
                      Выгодно
                    </span>
                  ) : null}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusBadgeClass(bundle.status)}`}
                  >
                    {bundleStatusLabel(bundle.status)}
                  </span>
                </>
              )}
            </div>
            {onMenu ? (
              <button
                type="button"
                onClick={onMenu}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#F5F5F5] text-[#6B7280] transition active:scale-[0.96]"
                aria-label="Меню набора"
              >
                <HiEllipsisHorizontal className="h-5 w-5" aria-hidden />
              </button>
            ) : null}
          </div>

          <h3 className="mt-1.5 text-[17px] font-bold leading-snug tracking-[-0.03em] text-[#111827] lg:mt-0 lg:text-[22px] lg:font-black lg:tracking-[-0.05em]">
            {bundle.title}
          </h3>

          <ul className="mt-2 space-y-1">
            {bundle.serviceIds.map((id) => (
              <li key={id} className="flex items-start gap-1.5 text-[12px] text-[#6B7280]">
                <HiCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F47C8C]" aria-hidden />
                <span className="min-w-0 break-words">{serviceTitleById.get(id) ?? 'Услуга'}</span>
              </li>
            ))}
          </ul>

          <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-1 lg:mt-3">
            <span className="text-[20px] font-bold tabular-nums text-[#111827] lg:text-[32px] lg:font-black lg:tracking-[-0.06em]">
              {bundle.bundlePrice} BYN
            </span>
            {showDeal ? (
              <>
                <span className="text-[13px] text-[#9CA3AF] line-through">
                  {bundle.originalPrice} BYN
                </span>
                <span className="text-[12px] font-bold text-[#F47C8C]">
                  -{bundle.discountPercent}%
                </span>
                <span className="text-[12px] font-semibold text-[#22C55E]">
                  Экономия {bundle.discountAmount} BYN
                </span>
              </>
            ) : null}
          </div>

          <p className="mt-1.5 flex items-center gap-1 text-[12px] font-semibold text-[#9CA3AF]">
            <HiClock className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {formatDurationRu(bundle.durationMinutes)}
          </p>
      </div>
    </article>
  );
}
