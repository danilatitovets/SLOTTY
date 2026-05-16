import { HiCalendarDays, HiEllipsisHorizontal } from 'react-icons/hi2';
import { promotionStatusLabel } from './servicesFormat';
import type { ServicePromotion, ServicePromotionStatus } from './servicesTypes';

function formatDdMmRu(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function statusBadgeClass(status: ServicePromotionStatus): string {
  switch (status) {
    case 'active':
      return 'bg-[#ECFDF5]/95 text-[#16A34A]';
    case 'scheduled':
      return 'bg-[#EFF6FF]/95 text-[#2563EB]';
    case 'finished':
      return 'bg-white/80 text-[#6B7280]';
    default:
      return 'bg-white/90 text-[#6B7280]';
  }
}

export type PromotionCardModel = ServicePromotion & {
  status: ServicePromotionStatus;
};

type Props = {
  promo: PromotionCardModel;
  onMenu?: () => void;
  className?: string;
};

export function PromotionBannerCard({ promo, onMenu, className = '' }: Props) {
  const muted = promo.status === 'finished';
  const draft = promo.status === 'draft';
  const bg = promo.backgroundImage?.trim() || '/photos/sale/11.webp';

  return (
    <article
      className={`relative overflow-hidden rounded-[24px] shadow-[0_12px_36px_rgba(17,24,39,0.10)] ${
        muted ? 'opacity-[0.72]' : ''
      } ${draft ? 'ring-1 ring-[#EAECEF]' : ''} ${className}`}
    >
      <div className="relative min-h-[168px]">
        <img
          src={bg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
        <div
          className={`absolute inset-0 ${
            draft
              ? 'bg-gradient-to-r from-white/92 via-white/75 to-white/35'
              : 'bg-gradient-to-t from-[#111827]/88 via-[#111827]/45 to-[#111827]/15'
          }`}
          aria-hidden
        />
        <div
          className={`relative flex min-h-[168px] gap-3 p-4 ${
            draft ? 'text-[#111827]' : 'text-white'
          }`}
        >
          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div className="flex items-start justify-between gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur-sm ${statusBadgeClass(promo.status)}`}
              >
                {promotionStatusLabel(promo.status)}
              </span>
              {onMenu ? (
                <button
                  type="button"
                  onClick={onMenu}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition active:scale-[0.96] ${
                    draft ? 'bg-[#F3F4F6] text-[#6B7280]' : 'bg-white/20 text-white backdrop-blur-sm'
                  }`}
                  aria-label="Меню акции"
                >
                  <HiEllipsisHorizontal className="h-5 w-5" aria-hidden />
                </button>
              ) : null}
            </div>
            <div className="min-w-0 pr-1">
              <h3
                className={`text-[17px] font-bold leading-snug tracking-[-0.03em] ${
                  draft ? 'text-[#111827]' : 'drop-shadow-sm'
                }`}
              >
                {promo.title}
              </h3>
              {promo.serviceTitle ? (
                <p
                  className={`mt-1 truncate text-[13px] font-semibold ${
                    draft ? 'text-[#F47C8C]' : 'text-white/95'
                  }`}
                >
                  {promo.serviceTitle}
                </p>
              ) : null}
              <p
                className={`mt-1 line-clamp-2 text-[12px] font-medium leading-snug ${
                  draft ? 'text-[#6B7280]' : 'text-white/88'
                }`}
              >
                {promo.description}
              </p>
              <p
                className={`mt-2 flex items-center gap-1 text-[11px] font-semibold ${
                  draft ? 'text-[#9CA3AF]' : 'text-white/85'
                }`}
              >
                <HiCalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {formatDdMmRu(promo.startsAt)} — {formatDdMmRu(promo.endsAt)}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-center justify-center">
            <span
              className={`flex h-[72px] w-[72px] items-center justify-center rounded-full text-center text-[13px] font-bold leading-tight ${
                draft
                  ? 'bg-[#FFF1F4] text-[#F47C8C] ring-2 ring-[#FDE8ED]'
                  : 'bg-white text-[#F47C8C] shadow-[0_8px_24px_rgba(0,0,0,0.18)]'
              }`}
            >
              {promo.discountLabel}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
