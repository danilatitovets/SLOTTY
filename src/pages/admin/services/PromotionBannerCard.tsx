import type { ElementType } from 'react';
import { HiCalendarDays, HiEllipsisHorizontal, HiReceiptPercent } from 'react-icons/hi2';
import { cabinetIconCircle } from '../profile/adminProfileCabinetTheme';
import {
  servicesCatalogCardBody,
  servicesCatalogCardShell,
  servicesCatalogCardThumbCol,
  servicesCatalogMenuBtn,
  servicesCatalogMetaMuted,
} from './adminServicesTheme';
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
      return 'bg-[#ECFDF5] text-[#16A34A]';
    case 'scheduled':
      return 'bg-[#FFF1F4] text-[#F47C8C]';
    case 'finished':
      return 'bg-[#EBEBEB] text-[#6B7280]';
    default:
      return 'bg-[#FFF4E8] text-[#B45309]';
  }
}

export type PromotionCardModel = ServicePromotion & {
  status: ServicePromotionStatus;
};

type Props = {
  promo: PromotionCardModel;
  onMenu?: () => void;
  className?: string;
  as?: 'li' | 'article';
  examplePreview?: boolean;
};

export function PromotionBannerCard({
  promo,
  onMenu,
  className = '',
  as = 'article',
  examplePreview = false,
}: Props) {
  const muted = promo.status === 'finished';
  const bg = promo.backgroundImage?.trim();
  const Tag = as as ElementType;

  return (
    <Tag
      className={`${servicesCatalogCardShell} ${muted && !examplePreview ? 'opacity-80' : ''} ${
        examplePreview ? 'ring-2 ring-dashed ring-[#D1D5DB]' : ''
      } ${className}`.trim()}
    >
      <div className={servicesCatalogCardBody}>
        <div className={`${servicesCatalogCardThumbCol} relative overflow-hidden`}>
          {bg ? (
            <>
              <img
                src={bg}
                alt=""
                className={`absolute inset-0 h-full w-full object-cover ${examplePreview ? 'opacity-60 saturate-50' : ''}`}
                loading="lazy"
              />
              <div
                className={`absolute inset-0 ${examplePreview ? 'bg-[#111827]/35' : 'bg-[#111827]/25'}`}
                aria-hidden
              />
            </>
          ) : (
            <span className="flex h-full min-h-[5.5rem] w-full items-center justify-center bg-[#EBEBEB]">
              <span className={`${cabinetIconCircle} h-11 w-11 rounded-[12px]`}>
                <HiReceiptPercent className="h-5 w-5" aria-hidden />
              </span>
            </span>
          )}
          <div className="relative z-10 flex h-full min-h-[5.5rem] items-center justify-center p-2">
            <span
              className={`inline-flex min-h-[3.25rem] min-w-[3.25rem] items-center justify-center rounded-[12px] px-2 text-center text-[11px] font-black leading-tight text-[#ff5f7a] ring-1 ring-[#FDE8ED] ${
                examplePreview ? 'bg-white/90' : 'bg-[#FFF1F4]'
              }`}
            >
              {promo.discountLabel}
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2 px-3.5 py-3 sm:gap-3 sm:px-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              {examplePreview ? (
                <span className="inline-flex rounded-full bg-[#FFFBEB] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#92400E] ring-1 ring-[#FDE68A]">
                  Только пример
                </span>
              ) : (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusBadgeClass(promo.status)}`}
                >
                  {promotionStatusLabel(promo.status)}
                </span>
              )}
            </div>

            <h3 className="mt-1 line-clamp-2 text-[16px] font-bold leading-snug tracking-[-0.02em] text-[#111827]">
              {promo.title}
            </h3>

            {promo.serviceTitle ? (
              <p className={`mt-0.5 line-clamp-1 ${servicesCatalogMetaMuted}`}>{promo.serviceTitle}</p>
            ) : null}

            {promo.description ? (
              <p className="mt-1 line-clamp-2 text-[12px] font-medium leading-snug text-[#9CA3AF]">
                {promo.description}
              </p>
            ) : null}

            {examplePreview ? (
              <p className={`mt-1 text-[12px] ${servicesCatalogMetaMuted}`}>
                Сроки и условия задаёте при создании своей акции в Pro
              </p>
            ) : (
              <p className={`mt-1 flex items-center gap-1 text-[12px] ${servicesCatalogMetaMuted}`}>
                <HiCalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {formatDdMmRu(promo.startsAt)} — {formatDdMmRu(promo.endsAt)}
              </p>
            )}
          </div>

          {onMenu ? (
            <button
              type="button"
              onClick={onMenu}
              className={servicesCatalogMenuBtn}
              aria-label="Меню акции"
            >
              <HiEllipsisHorizontal className="h-5 w-5" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
    </Tag>
  );
}
