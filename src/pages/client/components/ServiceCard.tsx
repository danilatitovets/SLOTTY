import { EMPTY_PRICE, EMPTY_SLOT } from '../../../shared/lib/emptyDisplayText';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  HiCalendarDays,
  HiChevronRight,
  HiClock,
  HiEye,
  HiStar,
  HiUserGroup,
  HiWallet,
} from 'react-icons/hi2';
import { getBookingPath, getMasterPath } from '../../../app/paths';
import type { AggregatedServiceCard } from '../lib/aggregateServices';
import {
  formatDurationMinutes,
  formatPriceFrom,
  formatReviewsCountLabel,
  formatSlotCardSubline,
  formatWeeklyViewsLabel,
} from '../lib/catalogFormat';
import { getCatalogServicePhotoUrl } from '../../../features/catalog/catalogServicePhotos';

import { ImageReveal } from '../../../shared/ui/ImageReveal';
import {
  catalogInnerDivider,
  catalogListCardClass,
  catalogPanelRowClass,
  catalogPanelRowPad,
  catalogPrimaryBtn,
  catalogSecondaryBtn,
} from '../servicesCatalog/servicesCatalogTheme';

type Props = {
  service: AggregatedServiceCard;
  /** stack — мобильная; grid — плитка; wide — десктоп-строка */
  layout?: 'stack' | 'grid' | 'wide';
  /** row — строка внутри общей белой панели (OKX); card — отдельная карточка */
  surface?: 'card' | 'row';
};

function StatRow({
  icon,
  label,
  value,
  valueClassName = 'text-[15px] font-semibold text-[#111827]',
}: {
  icon: ReactNode;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F1EFEF] text-[#6B7280]">
          {icon}
        </span>
        <span className="text-[14px] font-medium text-[#6B7280]">{label}</span>
      </div>
      <span className={`shrink-0 text-right leading-snug ${valueClassName}`}>{value}</span>
    </div>
  );
}

type BadgeTone = 'popular' | 'hit' | 'promo';

function ServiceCardBadge({ label, tone }: { label: string; tone: BadgeTone }) {
  const toneClass =
    tone === 'hit'
      ? 'bg-[#7C3AED]'
      : tone === 'popular'
        ? 'bg-[#111827]/85'
        : 'bg-[#F47C8C]';

  return (
    <span
      className={`inline-flex items-center rounded-[8px] px-2.5 py-1 text-[11px] font-semibold leading-none text-white shadow-[0_2px_8px_rgba(17,24,39,0.14)] ${toneClass}`}
    >
      {label}
    </span>
  );
}

function serviceCardHref(service: AggregatedServiceCard): string {
  if (service.masterId && service.primaryServiceId) {
    return getBookingPath(
      service.masterId,
      service.primaryServiceId,
      service.nextSlotId,
      { from: 'services' },
    );
  }
  if (service.masterId) {
    return getMasterPath(service.masterId);
  }
  return getMasterPath(service.id);
}

function serviceCardPhoto(service: AggregatedServiceCard): string {
  if (service.serviceCoverUrl?.trim()) return service.serviceCoverUrl.trim();
  return getCatalogServicePhotoUrl(
    service.categoryCode || service.categoryName || service.title,
  );
}

function serviceBadgeMeta(service: AggregatedServiceCard, showPromo: boolean) {
  if (service.badge === 'hit') {
    return { label: 'Топ выбор', tone: 'hit' as const };
  }
  if (service.badge === 'popular') {
    return { label: 'Популярно', tone: 'popular' as const };
  }
  if (showPromo) {
    return { label: 'Акция', tone: 'promo' as const };
  }
  return null;
}

export function ServiceCard({ service, layout = 'stack', surface = 'card' }: Props) {
  const href = serviceCardHref(service);
  const photo = serviceCardPhoto(service);
  const slotLine = formatSlotCardSubline(service.nearestSlotIso);
  const hasSlot = Boolean(slotLine);
  const showPromo = Boolean(service.promoText);
  const showPopular = service.badge === 'popular' || service.badge === 'hit';
  const isGrid = layout === 'grid';
  const isWide = layout === 'wide';

  if (isWide && surface === 'row') {
    return (
      <Link
        to={href}
        className={`group ${catalogPanelRowClass} ${catalogPanelRowPad}`}
      >
        <div className="flex items-center gap-4 lg:gap-5">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[10px] bg-[#EBEBEB] lg:h-14 lg:w-14">
            <ImageReveal src={photo} alt="" className="h-full w-full object-cover" loading="lazy" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-[#8E8E93]">{service.categoryName}</p>
            <h3 className="mt-0.5 text-[16px] font-bold leading-snug text-[#111827] lg:text-[17px]">
              {service.title}
            </h3>
            <p className="mt-0.5 line-clamp-1 text-[13px] text-[#8E8E93] lg:hidden">{service.masterName}</p>
          </div>

          <div className="hidden shrink-0 items-center gap-0 lg:flex">
            <div className="min-w-[100px] border-l border-[#EEEEEE] px-5 first:border-l-0 first:pl-0">
              <p className="text-[13px] text-[#8E8E93]">Цена</p>
              <p className="mt-0.5 text-[15px] font-bold tabular-nums text-[#111827]">
                {service.minPrice > 0 ? formatPriceFrom(service.minPrice) : EMPTY_PRICE}
              </p>
            </div>
            <div className="min-w-[88px] border-l border-[#EEEEEE] px-5">
              <p className="text-[13px] text-[#8E8E93]">Время</p>
              <p className="mt-0.5 text-[15px] font-bold text-[#111827]">
                {formatDurationMinutes(service.durationMinutes)}
              </p>
            </div>
            <div className="min-w-[120px] border-l border-[#EEEEEE] px-5">
              <p className="text-[13px] text-[#8E8E93]">Окно</p>
              <p className={`mt-0.5 text-[15px] font-semibold ${hasSlot ? 'text-[#111827]' : 'text-[#8E8E93]'}`}>
                {hasSlot ? slotLine : EMPTY_SLOT}
              </p>
            </div>
          </div>

          <HiChevronRight
            className="h-5 w-5 shrink-0 text-[#C7C7CC] transition group-hover:text-[#111827]"
            aria-hidden
          />
        </div>
      </Link>
    );
  }

  if (isWide) {
    const badgeMeta = serviceBadgeMeta(service, showPromo);

    return (
      <Link
        to={href}
        className={`group relative flex w-full ${catalogListCardClass} lg:min-h-[148px] lg:flex-row`}
      >
        <div className="relative h-44 w-full shrink-0 overflow-hidden bg-[#EBEBEB] lg:h-auto lg:w-[168px] lg:min-h-[148px]">
          <ImageReveal
            src={photo}
            alt=""
            className="h-full min-h-[176px] w-full object-cover transition duration-300 group-hover:scale-[1.01] lg:min-h-[148px]"
            loading="lazy"
          />
          {badgeMeta ? (
            <span className="pointer-events-none absolute left-2 top-2 z-10">
              <ServiceCardBadge label={badgeMeta.label} tone={badgeMeta.tone} />
            </span>
          ) : null}
        </div>

        <div className="relative flex min-w-0 flex-1 flex-col p-5 lg:min-h-[148px] lg:p-4 lg:pr-[184px]">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-[#8E8E93]">{service.categoryName}</p>
            <h3 className="mt-1 text-[18px] font-bold leading-snug tracking-[-0.02em] text-[#111827]">
              {service.title}
            </h3>
            <p className="mt-1.5 max-w-xl text-[14px] leading-relaxed text-[#8E8E93] lg:hidden">
              {service.masterName}
            </p>
            {service.tags.length > 0 ? (
              <div className="mt-2 hidden flex-wrap gap-1.5 lg:flex">
                {service.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-[8px] bg-[#F5F5F5] px-2.5 py-1 text-[12px] font-medium text-[#6B7280]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] font-medium text-[#374151]">
              {service.avgRating > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <HiStar className="h-4 w-4 text-[#F59E0B]" aria-hidden />
                  {service.avgRating.toFixed(1)}
                </span>
              ) : null}
              {service.masterName ? (
                <span className="inline-flex items-center gap-1">
                  <HiUserGroup className="h-4 w-4 text-[#9CA3AF]" aria-hidden />
                  {service.masterName}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1">
                <HiEye className="h-4 w-4 text-[#9CA3AF]" aria-hidden />
                {formatWeeklyViewsLabel(service.weeklyViews)}
              </span>
              <span className="inline-flex items-center gap-1">
                <HiClock className="h-4 w-4 text-[#9CA3AF]" aria-hidden />
                {formatDurationMinutes(service.durationMinutes)}
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-[#111827]">
                {service.minPrice > 0 ? formatPriceFrom(service.minPrice) : 'Цена по запросу'}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {showPromo ? (
                <span className="rounded-[8px] bg-[#FFF1F4] px-2.5 py-1 text-[12px] font-semibold text-[#F47C8C]">
                  Акция {service.promoText ?? '-10%'}
                </span>
              ) : null}
              {hasSlot ? (
                <span className="rounded-[8px] bg-[#ECFDF5] px-2.5 py-1 text-[12px] font-semibold text-[#15803D]">
                  Бесплатная отмена
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex w-full flex-col items-stretch gap-2 lg:absolute lg:bottom-4 lg:right-4 lg:mt-0 lg:w-[168px]">
            <div className="w-full rounded-[10px] bg-[#F5F5F5] px-3 py-2">
              <p className="text-[11px] font-medium text-[#8E8E93]">Ближайшее окно</p>
              <p
                className={`mt-0.5 text-[13px] font-semibold leading-snug ${hasSlot ? 'text-[#111827]' : 'text-[#8E8E93]'}`}
              >
                {hasSlot ? slotLine : 'Уточните у мастера'}
              </p>
            </div>
            <span className={`${hasSlot ? catalogPrimaryBtn : catalogSecondaryBtn} w-full !min-h-9 !text-[13px]`}>
              {hasSlot ? 'Записаться' : 'К мастеру'}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  if (isGrid) {
    const badgeMeta = serviceBadgeMeta(service, showPromo);
    const priceLabel =
      service.minPrice > 0 ? formatPriceFrom(service.minPrice) : EMPTY_PRICE;
    const slotCta = service.hasToday
      ? 'Сегодня'
      : hasSlot && slotLine?.toLowerCase().startsWith('завтра')
        ? 'Завтра'
        : hasSlot
          ? 'Есть окно'
          : 'Выбрать мастера';
    const masterLabel = service.masterName || null;
    const durationLabel = formatDurationMinutes(service.durationMinutes);

    return (
      <Link
        to={href}
        className={`group relative flex flex-col overflow-hidden ${catalogListCardClass} active:scale-[0.98]`}
      >
        <div className="relative aspect-[5/6] w-full shrink-0 overflow-hidden bg-[#EBEBEB]">
          <ImageReveal
            src={photo}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
          {badgeMeta ? (
            <span className="pointer-events-none absolute left-2 top-2 z-10">
              <ServiceCardBadge label={badgeMeta.label} tone={badgeMeta.tone} />
            </span>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5 p-2.5 pt-2">
          <p className="shrink-0 text-[17px] font-bold leading-none tracking-[-0.02em] text-[#F47C8C] tabular-nums">
            {priceLabel}
          </p>

          <div className="min-w-0 shrink-0 space-y-0.5">
            <h3 className="line-clamp-2 text-[12px] font-bold leading-snug text-[#111827]">
              {service.title}
            </h3>
            <p className="line-clamp-1 text-[12px] font-medium leading-[1.4] text-[#8E8E93]">
              {masterLabel ?? service.categoryName}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-x-1 gap-y-0.5 text-[11px] font-medium">
            {service.avgRating > 0 ? (
              <span className="inline-flex items-center gap-0.5 text-[#111827]">
                <HiStar className="h-3 w-3 shrink-0 text-[#F59E0B]" aria-hidden />
                {service.avgRating.toFixed(1).replace('.', ',')}
                {service.totalReviews > 0 ? (
                  <span className="text-[#8E8E93]">
                    · {formatReviewsCountLabel(service.totalReviews)}
                  </span>
                ) : null}
              </span>
            ) : service.isNew ? (
              <span className="text-[#F47C8C]">Новинка</span>
            ) : (
              <span className="text-[#8E8E93]">Пока без отзывов</span>
            )}
          </div>

          <p className="flex shrink-0 flex-wrap items-center gap-1 text-[10px] font-medium leading-none text-[#8E8E93]">
            <span className="inline-flex items-center gap-0.5">
              <HiClock className="h-3 w-3 shrink-0" aria-hidden />
              {durationLabel}
            </span>
            {masterLabel ? (
              <>
                <span aria-hidden>·</span>
                <span className="line-clamp-1 text-[#8E8E93]">{masterLabel}</span>
              </>
            ) : null}
          </p>

          <span
            className={`${hasSlot ? catalogPrimaryBtn : catalogSecondaryBtn} mt-0.5 shrink-0 !min-h-8 w-full !rounded-full !px-2 !py-1.5 !text-[11px] !font-semibold`}
          >
            <span className="inline-flex items-center justify-center gap-1">
              <HiCalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {slotCta}
            </span>
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={href}
      className={`block w-full ${catalogListCardClass} active:scale-[0.99]`}
    >
      <div className="p-4">
        <div className="flex gap-3.5">
          <div className="relative h-[5.5rem] w-[5.5rem] shrink-0">
            <ImageReveal
              src={photo}
              alt=""
              className="h-full w-full rounded-[20px] object-cover"
              loading="lazy"
            />
            {showPopular ? (
              <span className="absolute -left-0.5 -top-0.5 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#111827] shadow-sm">
                🔥 Топ
              </span>
            ) : null}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="text-[20px] font-semibold leading-[1.15] tracking-tight text-[#111827]">
              {service.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-[14px] leading-snug text-[#6B7280]">
              {service.masterName}
            </p>
            {service.categoryName ? (
              <p className="mt-2 text-[13px] font-medium text-[#9CA3AF]">{service.categoryName}</p>
            ) : null}
          </div>

          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center self-center rounded-full bg-[#F1EFEF] text-[#9CA3AF]"
            aria-hidden
          >
            <HiChevronRight className="h-5 w-5" />
          </span>
        </div>

        <div className={`mt-4 space-y-1 pt-3 ${catalogInnerDivider}`}>
          <StatRow
            icon={<HiWallet className="h-[18px] w-[18px]" aria-hidden />}
            label="Цена"
            value={service.minPrice > 0 ? formatPriceFrom(service.minPrice) : 'Уточните'}
          />
          <StatRow
            icon={<HiClock className="h-[18px] w-[18px]" aria-hidden />}
            label="Длительность"
            value={formatDurationMinutes(service.durationMinutes)}
          />
          <StatRow
            icon={<HiCalendarDays className="h-[18px] w-[18px]" aria-hidden />}
            label="Окна"
            value={service.hasToday ? 'Сегодня' : hasSlot ? 'Есть' : 'Уточните'}
            valueClassName={
              service.hasToday || hasSlot
                ? 'text-[15px] font-semibold text-[#F47C8C]'
                : 'text-[15px] font-semibold text-[#111827]'
            }
          />
        </div>

        <div className="mt-4 rounded-[10px] bg-[#F5F5F5] p-3.5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-[#8E8E93]">Ближайшее окно</p>
              {hasSlot ? (
                <p className="mt-0.5 text-[14px] font-semibold leading-snug text-[#111827]">{slotLine}</p>
              ) : (
                <p className="mt-0.5 text-[14px] font-medium leading-snug text-[#8E8E93]">
                  Свободных окон пока нет
                </p>
              )}
            </div>
            <span className={hasSlot ? catalogPrimaryBtn : catalogSecondaryBtn}>
              {hasSlot ? 'Записаться' : 'К мастеру'}
            </span>
          </div>
        </div>
      </div>

      {showPromo ? (
        <div className={`flex items-center gap-2 bg-[#F6F7FB] px-4 py-3 ${catalogInnerDivider}`}>
          <span className="text-[13px] font-semibold text-[#374151]">С акцией</span>
          <span className="min-w-0 flex-1 text-[13px] font-medium leading-snug text-[#6B7280]">
            {service.promoText}
          </span>
          <HiChevronRight className="h-4 w-4 shrink-0 text-[#9CA3AF]" aria-hidden />
        </div>
      ) : null}
    </Link>
  );
}
