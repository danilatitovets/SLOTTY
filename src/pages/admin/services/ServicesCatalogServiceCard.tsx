import type { PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { HiBars3, HiCalendarDays, HiChevronRight, HiEllipsisHorizontal } from 'react-icons/hi2';
import { SlottyImg } from '../../../shared/ui/SlottyImg';
import { ADMIN_ATTENTION_EXCLAMATION_ICON_SRC } from '../shared/AdminSectionAttentionBadge';
import { adminScheduleAddWindowUrl } from '../schedule/scheduleDeepLinks';
import {
  servicesCatalogBadgeHidden,
  servicesCatalogBadgeVisible,
  servicesCatalogCardBody,
  servicesCatalogCardNoSlotsShell,
  servicesCatalogCardShell,
  servicesCatalogCardThumbCol,
  servicesCatalogDragHandle,
  servicesCatalogMenuBtn,
  servicesCatalogMetaMuted,
  servicesCatalogPriceText,
  servicesCatalogSlotsLink,
} from './adminServicesTheme';
import { ServiceThumbnail, ServiceThumbnailFallback } from './ServicesServiceThumbnail';
import type { ManagedService } from './servicesFormat';
import { formatServicePrice } from './servicesFormat';

type Props = {
  service: ManagedService;
  imageSrc: string | null;
  categoryLabel?: string | null;
  availableSlotsCount?: number;
  upcomingAppointmentsCount?: number;
  onOpenMenu?: (service: ManagedService) => void;
  highlighted?: boolean;
  showMenu?: boolean;
  showDragHandle?: boolean;
  isDragSource?: boolean;
  isDragOver?: boolean;
  onDragHandlePointerDown?: (event: PointerEvent<HTMLButtonElement>) => void;
  /** Клик по карточке (например, превью в профиле → каталог услуг). */
  onCardClick?: () => void;
};

function formatSlotsLabel(count: number): string {
  if (count <= 0) return 'Нет слотов в расписании';
  const mod10 = count % 10;
  const mod100 = count % 100;
  let word = 'окон';
  if (mod10 === 1 && mod100 !== 11) word = 'окно';
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) word = 'окна';
  return `${count} ${word}`;
}

function formatUpcomingLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  let word = 'будущих записей';
  if (mod10 === 1 && mod100 !== 11) word = 'будущая запись';
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) word = 'будущие записи';
  return `${count} ${word}`;
}

function ServiceNoSlotsNotice({ serviceId, serviceTitle }: { serviceId: string; serviceTitle: string }) {
  const scheduleUrl = adminScheduleAddWindowUrl(serviceId);

  return (
    <div
      className="mx-3.5 mb-3.5 mt-3 rounded-[12px] border border-[#FDE8ED] bg-[#FFFBFC] px-3.5 py-3 sm:mx-4 sm:mb-4 sm:px-4"
      role="note"
      aria-label={`У услуги «${serviceTitle}» нет времени для записи`}
    >
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center" aria-hidden>
            <SlottyImg
              src={ADMIN_ATTENTION_EXCLAMATION_ICON_SRC}
              alt=""
              className="h-6 w-6 object-contain"
              decoding="async"
            />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold leading-snug text-[#111827]">
              У «{serviceTitle}» нет времени для записи
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-[#6B7280]">
              В расписании нет свободных слотов для этой услуги — клиенты увидят её в каталоге, но не
              смогут выбрать дату и время.
            </p>
          </div>
        </div>

        <Link
          to={scheduleUrl}
          className="inline-flex min-h-9 w-full shrink-0 items-center justify-center gap-1.5 rounded-[10px] bg-[#F47C8C] px-3.5 text-[12px] font-semibold leading-none text-white transition hover:opacity-95 active:scale-[0.98] sm:w-auto"
        >
          <HiCalendarDays className="h-4 w-4 shrink-0" aria-hidden />
          <span>Добавить в расписание</span>
        </Link>
      </div>
    </div>
  );
}

function visibilityBadgeClass(visible: boolean): string {
  return visible ? servicesCatalogBadgeVisible : servicesCatalogBadgeHidden;
}

function ServiceScheduleMeta({
  serviceId,
  visible,
  availableSlotsCount,
  upcomingAppointmentsCount,
}: {
  serviceId: string;
  visible: boolean;
  availableSlotsCount: number;
  upcomingAppointmentsCount: number;
}) {
  if (!visible) return null;

  const scheduleUrl = adminScheduleAddWindowUrl(serviceId);
  const upcomingLabel =
    upcomingAppointmentsCount > 0 ? formatUpcomingLabel(upcomingAppointmentsCount) : null;

  if (availableSlotsCount > 0) {
    return (
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
        <Link
          to={scheduleUrl}
          className={servicesCatalogSlotsLink}
          aria-label={`${formatSlotsLabel(availableSlotsCount)} — открыть создание расписания для услуги`}
        >
          <span>{formatSlotsLabel(availableSlotsCount)}</span>
          <HiChevronRight className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
        </Link>
        {upcomingLabel ? (
          <span className={`text-[12px] ${servicesCatalogMetaMuted}`}>{upcomingLabel}</span>
        ) : null}
      </div>
    );
  }

  if (upcomingLabel) {
    return <p className={`mt-1 text-[12px] ${servicesCatalogMetaMuted}`}>{upcomingLabel}</p>;
  }

  return null;
}

/** Карточка услуги в каталоге кабинета (мобилка + десктоп). */
export function CatalogServiceCard({
  service,
  imageSrc,
  categoryLabel,
  availableSlotsCount = 0,
  upcomingAppointmentsCount = 0,
  onOpenMenu,
  highlighted = false,
  showMenu = true,
  showDragHandle = false,
  isDragSource = false,
  isDragOver = false,
  onDragHandlePointerDown,
  onCardClick,
}: Props) {
  const visible = service.isActive !== false;
  const subtitle = categoryLabel?.trim() || null;
  const showNoSlotsNotice = visible && availableSlotsCount <= 0 && !onCardClick;
  const shellClass = showNoSlotsNotice
    ? servicesCatalogCardNoSlotsShell
    : highlighted
      ? `${servicesCatalogCardShell} ring-2 ring-[#F47C8C]/35 ring-offset-2 ring-offset-white`
      : servicesCatalogCardShell;

  const dragStateClass = isDragSource
    ? 'opacity-60'
    : isDragOver
      ? 'ring-2 ring-[#F47C8C]/45 ring-offset-2 ring-offset-[#F5F5F5]'
      : '';

  return (
    <li
      data-catalog-service-id={service.id}
      className={`${shellClass} ${dragStateClass} ${onCardClick ? 'cursor-pointer transition hover:opacity-95 active:scale-[0.995]' : ''}`.trim()}
      onClick={onCardClick}
      onKeyDown={
        onCardClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onCardClick();
              }
            }
          : undefined
      }
      role={onCardClick ? 'button' : undefined}
      tabIndex={onCardClick ? 0 : undefined}
      aria-label={onCardClick ? `Открыть раздел «Услуги»: ${service.title}` : undefined}
    >
      <div className={servicesCatalogCardBody}>
        {showDragHandle ? (
          <button
            type="button"
            className={servicesCatalogDragHandle}
            aria-label={`Переместить «${service.title}»`}
            onPointerDown={onDragHandlePointerDown}
          >
            <HiBars3 className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
        <div className={servicesCatalogCardThumbCol}>
          {imageSrc ? (
            <ServiceThumbnail
              src={imageSrc}
              title={service.title}
              edge="flush-left"
              sizeClass="block h-full min-h-[5.5rem] w-full"
            />
          ) : (
            <ServiceThumbnailFallback
              edge="flush-left"
              sizeClass="flex h-full min-h-[5.5rem] w-full items-center justify-center"
            />
          )}
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2 px-3.5 py-3 sm:gap-3 sm:px-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 text-[16px] font-bold leading-snug tracking-[-0.02em] text-[#111827]">
                {service.title}
              </h3>
              <span className={`shrink-0 ${visibilityBadgeClass(visible)}`}>
                {visible ? 'Видимая' : 'Скрытая'}
              </span>
            </div>

            {subtitle ? (
              <p className={`mt-0.5 line-clamp-1 ${servicesCatalogMetaMuted}`}>{subtitle}</p>
            ) : null}

            <p className={servicesCatalogPriceText}>{formatServicePrice(service)}</p>

            {onCardClick ? null : (
              <ServiceScheduleMeta
                serviceId={service.id}
                visible={visible}
                availableSlotsCount={availableSlotsCount}
                upcomingAppointmentsCount={upcomingAppointmentsCount}
              />
            )}
          </div>

          {showMenu && onOpenMenu ? (
            <button
              type="button"
              onClick={() => onOpenMenu(service)}
              className={servicesCatalogMenuBtn}
              aria-label={`Меню: ${service.title}`}
            >
              <HiEllipsisHorizontal className="h-5 w-5" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      {showNoSlotsNotice ? (
        <ServiceNoSlotsNotice serviceId={service.id} serviceTitle={service.title} />
      ) : null}
    </li>
  );
}
