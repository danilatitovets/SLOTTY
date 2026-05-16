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
      } ${draft ? 'ring-1 ring-[#FDE8ED]' : ''} ${className}`}
    >
      <div className="relative min-h-[168px]">
        <img
          src={bg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
        {draft ? (
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#fff5f8]/96 via-[#ffe8ee]/72 via-55% to-transparent"
            aria-hidden
          />
        ) : (
          <>
            <div
              className="absolute inset-0 bg-gradient-to-r from-[#6e3550]/78 via-[#c4617f]/42 via-55% to-transparent"
              aria-hidden
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-[#5a2840]/55 via-transparent to-[#5a2840]/25"
              aria-hidden
            />
          </>
        )}

        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-2 p-4">
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
                draft ? 'bg-white/95 text-[#6B7280] shadow-sm' : 'bg-white/22 text-white backdrop-blur-sm'
              }`}
              aria-label="Меню акции"
            >
              <HiEllipsisHorizontal className="h-5 w-5" aria-hidden />
            </button>
          ) : (
            <span className="h-9 w-9 shrink-0" aria-hidden />
          )}
        </div>

        <div className="absolute right-4 top-1/2 z-10 -translate-y-1/2">
          <span
            className={`flex h-[72px] w-[72px] items-center justify-center rounded-full text-center text-[13px] font-bold leading-tight ${
              draft
                ? 'bg-white text-[#F47C8C] shadow-[0_8px_24px_rgba(244,124,140,0.18)] ring-2 ring-[#FDE8ED]'
                : 'bg-white text-[#F47C8C] shadow-[0_8px_24px_rgba(0,0,0,0.18)]'
            }`}
          >
            {promo.discountLabel}
          </span>
        </div>

        <div
          className={`relative z-10 flex min-h-[168px] flex-col justify-end p-4 pr-[5.75rem] pt-14 ${
            draft ? 'text-[#111827]' : 'text-white'
          }`}
        >
          <h3
            className={`text-[17px] font-bold leading-snug tracking-[-0.03em] ${
              draft
                ? 'text-[#111827]'
                : 'text-white drop-shadow-[0_2px_8px_rgba(90,40,55,0.55)]'
            }`}
          >
            {promo.title}
          </h3>
          {promo.serviceTitle ? (
            <p
              className={`mt-1 truncate text-[13px] font-semibold ${
                draft ? 'text-[#F47C8C]' : 'text-white drop-shadow-[0_1px_6px_rgba(90,40,55,0.5)]'
              }`}
            >
              {promo.serviceTitle}
            </p>
          ) : null}
          <p
            className={`mt-1 line-clamp-2 text-[12px] font-medium leading-snug ${
              draft
                ? 'text-[#6B7280]'
                : 'text-white/95 drop-shadow-[0_1px_5px_rgba(90,40,55,0.45)]'
            }`}
          >
            {promo.description}
          </p>
          <p
            className={`mt-2 flex items-center gap-1 text-[11px] font-semibold ${
              draft ? 'text-[#9CA3AF]' : 'text-white/90 drop-shadow-[0_1px_4px_rgba(90,40,55,0.45)]'
            }`}
          >
            <HiCalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {formatDdMmRu(promo.startsAt)} — {formatDdMmRu(promo.endsAt)}
          </p>
        </div>
      </div>
    </article>
  );
}
