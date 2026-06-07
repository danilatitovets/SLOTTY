import type { ReactNode } from 'react';
import { isEmptyDisplayValue } from '../../../shared/lib/emptyDisplayText';
import {
  HiArrowRightEndOnRectangle,
  HiArrowTrendingUp,
  HiBuildingOffice2,
  HiChatBubbleLeftEllipsis,
  HiHome,
  HiKey,
  HiMap,
  HiMapPin,
  HiRectangleStack,
  HiSpeakerWave,
} from 'react-icons/hi2';
import {
  buildLocationAfterBookingPreview,
  buildLocationDisplayParts,
  catalogLineWithoutVisitPrefix,
  formatHomePublicBeforeBooking,
  isHomeAddressHiddenUntilBooking,
  masterVisitTypeLabel,
  type MasterLocation,
  type MasterVisitType,
} from '../model/masterLocation';

type DetailIconName =
  | 'map-pin'
  | 'building'
  | 'home'
  | 'entrance'
  | 'floor'
  | 'apartment'
  | 'intercom'
  | 'landmark'
  | 'directions'
  | 'comment';

const DETAIL_ICONS = {
  'map-pin': HiMapPin,
  building: HiBuildingOffice2,
  home: HiHome,
  entrance: HiArrowRightEndOnRectangle,
  floor: HiRectangleStack,
  apartment: HiKey,
  intercom: HiSpeakerWave,
  landmark: HiMap,
  directions: HiArrowTrendingUp,
  comment: HiChatBubbleLeftEllipsis,
} as const;

function detailIconName(label: string, visitType: MasterVisitType): DetailIconName {
  const lower = label.toLowerCase();
  if (lower.includes('салон')) return 'building';
  if (lower.includes('подъезд') || lower.includes('вход')) return 'entrance';
  if (lower.includes('этаж')) return 'floor';
  if (lower.includes('кабинет') || lower.includes('квартир')) return 'apartment';
  if (lower.includes('домофон') || lower.includes('ресепшен')) return 'intercom';
  if (lower.includes('ориентир') || lower.includes('метро') || lower.includes('район')) return 'landmark';
  if (lower.includes('как пройти')) return 'directions';
  if (lower.includes('комментар')) return 'comment';
  if (lower.includes('дом') || lower.includes('корпус')) return 'home';
  if (lower.includes('адрес')) return 'map-pin';
  return visitType === 'at_home' ? 'home' : 'building';
}

function PreviewIcon({ name, size = 18 }: { name: DetailIconName; size?: number }) {
  const Icon = DETAIL_ICONS[name];
  return <Icon size={size} className="block shrink-0" aria-hidden />;
}

function VisitTypeBadge({ visitType }: { visitType: MasterVisitType }) {
  const isHome = visitType === 'at_home';
  return (
    <div className="flex items-center gap-3 rounded-[18px] bg-[#F7F7F8] p-3.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#FFF1F4] text-[#F47C8C]">
        {isHome ? <HiHome size={20} aria-hidden /> : <HiBuildingOffice2 size={20} aria-hidden />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-[#6B7280]">Формат приёма</p>
        <p className="mt-0.5 text-[17px] font-semibold leading-snug text-[#111827]">
          {masterVisitTypeLabel(visitType)}
        </p>
      </div>
    </div>
  );
}

function PreviewBlockTitle({ children }: { children: ReactNode }) {
  return <p className="mb-2 text-[14px] font-semibold text-[#111827]">{children}</p>;
}

function PreviewInfoRow({ label, value, visitType }: { label: string; value: string; visitType: MasterVisitType }) {
  if (isEmptyDisplayValue(value)) return null;

  return (
    <div className="flex items-start gap-2.5 rounded-[16px] bg-[#F7F7F8] px-3 py-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF1F4] text-[#F47C8C]">
        <PreviewIcon name={detailIconName(label, visitType)} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium leading-tight text-[#9CA3AF]">{label}</p>
        <p className="mt-0.5 whitespace-pre-wrap text-[15px] font-semibold leading-snug text-[#111827]">
          {value.trim()}
        </p>
      </div>
    </div>
  );
}

type Props = {
  location: MasterLocation;
  title?: string;
  className?: string;
};

/** Превью адреса в стиле кабинета мастера (каталог + после записи). */
export function MasterAddressClientPreview({
  location,
  title = 'Как увидит клиент',
  className = '',
}: Props) {
  const visitType = location.visitType ?? 'studio';
  const parts = buildLocationDisplayParts(location);
  const visitLabel = parts?.visitLabel ?? masterVisitTypeLabel(visitType);
  const hiddenUntilBooking = isHomeAddressHiddenUntilBooking(location);
  const streetEmpty = isEmptyDisplayValue(location.street);

  const catalogMain = (() => {
    if (hiddenUntilBooking) {
      const publicLine = formatHomePublicBeforeBooking(location);
      if (publicLine?.trim()) return publicLine.trim();
    }
    if (parts) return catalogLineWithoutVisitPrefix(parts.catalogLine, visitLabel);
    return '';
  })();

  const afterBookingRows = hiddenUntilBooking
    ? buildLocationAfterBookingPreview(location).filter((row) => row.value?.trim())
    : parts
      ? [
          ...(parts.addressLine && !isEmptyDisplayValue(parts.addressLine)
            ? [{ label: 'Адрес', value: parts.addressLine }]
            : []),
          ...parts.access,
          ...parts.wayfinding,
        ].filter((row) => row.value?.trim())
      : [];

  const hasAfterBooking = afterBookingRows.length > 0;
  const showExtraBlock = !hiddenUntilBooking && hasAfterBooking;

  return (
    <div
      className={`rounded-[26px] bg-white p-4 ring-1 ring-[#EAECEF] lg:rounded-[16px] lg:p-5 ${className}`.trim()}
    >
      <p className="text-[15px] font-semibold tracking-normal text-[#111827]">{title}</p>

      <div className="mt-4 space-y-3">
        <VisitTypeBadge visitType={visitType} />

        {streetEmpty ? (
          <p className="rounded-[16px] bg-[#F7F7F8] px-3 py-3 text-center text-[13px] leading-snug text-[#9CA3AF]">
            Адрес пока не указан
          </p>
        ) : (
          <>
            <div>
              <PreviewBlockTitle>На карточке в каталоге</PreviewBlockTitle>
              {isEmptyDisplayValue(catalogMain) ? (
                <p className="rounded-[16px] bg-[#F7F7F8] px-3 py-2.5 text-center text-[13px] leading-snug text-[#9CA3AF]">
                  Укажите адрес справа
                </p>
              ) : (
                <PreviewInfoRow label="Адрес для всех" value={catalogMain} visitType={visitType} />
              )}
              {hiddenUntilBooking ? (
                <p className="mt-2 rounded-[14px] bg-[#FAFAFA] px-3 py-2.5 text-[13px] leading-relaxed text-[#6B7280]">
                  Подъезд, этаж и точный адрес — только после подтверждения записи
                </p>
              ) : null}
            </div>

            {hiddenUntilBooking && hasAfterBooking ? (
              <div className="border-t border-[#EAECEF] pt-3">
                <PreviewBlockTitle>После записи</PreviewBlockTitle>
                <div className="space-y-2">
                  {afterBookingRows.map((row) => (
                    <PreviewInfoRow
                      key={`${row.label}-${row.value}`}
                      label={row.label}
                      value={row.value}
                      visitType={visitType}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {showExtraBlock ? (
              <div className="border-t border-[#EAECEF] pt-3">
                <PreviewBlockTitle>Дополнительно</PreviewBlockTitle>
                <div className="space-y-2">
                  {afterBookingRows.map((row) => (
                    <PreviewInfoRow
                      key={`${row.label}-${row.value}`}
                      label={row.label}
                      value={row.value}
                      visitType={visitType}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {!hiddenUntilBooking && !showExtraBlock && !streetEmpty ? (
              <p className="rounded-[16px] bg-[#FAFAFA] px-3 py-2.5 text-center text-[13px] leading-snug text-[#9CA3AF]">
                Дополнительные детали можно указать ниже в форме
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
