import type { ReactNode } from 'react';
import {
  HiArrowRightOnRectangle,
  HiBuildingOffice2,
  HiChatBubbleLeft,
  HiHome,
  HiKey,
  HiMapPin,
  HiPencil,
  HiPhone,
  HiSquares2X2,
} from 'react-icons/hi2';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import {
  buildLocationDisplayParts,
  catalogLineWithoutVisitPrefix,
  masterVisitTypeLabel,
  type MasterVisitType,
} from '../../../features/profile/model/masterLocation';
import { cabinetCard, cabinetCardPad, cabinetIconCircle } from './adminProfileCabinetTheme';

function addressDetailIcon(label: string, visitType: MasterVisitType): ReactNode {
  const className = 'h-[16px] w-[16px]';
  const lower = label.toLowerCase();

  if (lower.includes('салон')) {
    return <HiBuildingOffice2 className={className} strokeWidth={2} aria-hidden />;
  }
  if (lower.includes('подъезд') || lower.includes('вход')) {
    return <HiArrowRightOnRectangle className={className} strokeWidth={2} aria-hidden />;
  }
  if (lower.includes('этаж')) {
    return <HiSquares2X2 className={className} strokeWidth={2} aria-hidden />;
  }
  if (lower.includes('кабинет') || lower.includes('квартир')) {
    return <HiKey className={className} strokeWidth={2} aria-hidden />;
  }
  if (lower.includes('домофон') || lower.includes('ресепшен')) {
    return <HiPhone className={className} strokeWidth={2} aria-hidden />;
  }
  if (lower.includes('ориентир') || lower.includes('метро') || lower.includes('район')) {
    return <HiMapPin className={className} strokeWidth={2} aria-hidden />;
  }
  if (lower.includes('как пройти')) {
    return <HiMapPin className={className} strokeWidth={2} aria-hidden />;
  }
  if (lower.includes('комментар')) {
    return <HiChatBubbleLeft className={className} strokeWidth={2} aria-hidden />;
  }
  if (lower.includes('дом') || lower.includes('корпус')) {
    return <HiHome className={className} strokeWidth={2} aria-hidden />;
  }
  if (lower.includes('адрес')) {
    return <HiMapPin className={className} strokeWidth={2} aria-hidden />;
  }

  return visitType === 'at_home' ? (
    <HiHome className={className} strokeWidth={2} aria-hidden />
  ) : (
    <HiBuildingOffice2 className={className} strokeWidth={2} aria-hidden />
  );
}

function VisitTypeBadge({ visitType }: { visitType: MasterVisitType }) {
  const isHome = visitType === 'at_home';
  return (
    <div className="flex items-center gap-3 rounded-[18px] bg-[#F7F7F8] p-3">
      <span className={`${cabinetIconCircle} h-9 w-9`}>
        {isHome ? (
          <HiHome className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
        ) : (
          <HiBuildingOffice2 className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium text-[#6B7280]">Формат приёма</p>
        <p className="mt-0.5 text-[15px] font-semibold text-[#111827]">{masterVisitTypeLabel(visitType)}</p>
      </div>
      <span className="shrink-0 rounded-full bg-[#FFF1F4] px-2.5 py-1 text-[11px] font-semibold text-[#F47C8C]">
        Минск
      </span>
    </div>
  );
}

function AddressInfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  const trimmed = value?.trim() ?? '';
  if (!trimmed || trimmed === '—') return null;

  return (
    <div className="flex items-start gap-2.5 rounded-[16px] bg-[#F7F7F8] px-3 py-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FFF1F4] text-[#F47C8C]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium leading-tight text-[#9CA3AF]">{label}</p>
        <p className="mt-0.5 whitespace-pre-wrap text-[14px] font-semibold leading-snug text-[#111827]">
          {trimmed}
        </p>
      </div>
    </div>
  );
}

function AddressBlockTitle({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-2">
      <p className="text-[13px] font-semibold text-[#111827]">{children}</p>
      {hint ? <p className="mt-0.5 text-[12px] leading-snug text-[#6B7280]">{hint}</p> : null}
    </div>
  );
}

/** Подпись поля в форме редактирования адреса. */
export function AddressFieldLabel({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="mb-1 flex items-center gap-2 text-[13px] font-medium text-[#6B7280]">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FFF1F4] text-[#F47C8C]">
        {icon}
      </span>
      <span className="min-w-0">{children}</span>
    </span>
  );
}

export { addressDetailIcon };

export function AddressSection({
  draft,
  onEditAddress,
}: {
  draft: MasterDraft;
  onEditAddress: () => void;
}) {
  const loc = draft.location;
  const parts = buildLocationDisplayParts(loc);
  const visitType = loc?.visitType ?? 'studio';
  const visitLabel = parts?.visitLabel ?? masterVisitTypeLabel(visitType);

  const catalogMain = parts
    ? catalogLineWithoutVisitPrefix(parts.catalogLine, visitLabel)
    : '—';

  const detailRows = parts
    ? [
        ...(parts.addressLine && parts.addressLine !== '—'
          ? [{ label: 'Адрес', value: parts.addressLine }]
          : []),
        ...parts.access,
        ...parts.wayfinding,
      ].filter((row) => row.value?.trim())
    : [];

  const hasAfterBooking = detailRows.length > 0;

  return (
    <div className="-mx-4 space-y-4 bg-[#F7F7F8] px-4 pb-2 pt-1">
      <section className={`${cabinetCard} ${cabinetCardPad}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-[#111827]">Адрес</h2>
            <p className="mt-0.5 text-[13px] leading-snug text-[#6B7280]">
              Как клиенты увидят адрес до и после записи
            </p>
          </div>
          <button
            type="button"
            onClick={onEditAddress}
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full bg-[#FFF1F4] px-3.5 text-[13px] font-semibold text-[#F47C8C] transition hover:bg-[#FFE4EA] active:scale-[0.98]"
          >
            <HiPencil className="h-4 w-4" strokeWidth={2} aria-hidden />
            Изменить
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <VisitTypeBadge visitType={visitType} />

          <div>
            <AddressBlockTitle>На карточке в каталоге</AddressBlockTitle>
            {!catalogMain || catalogMain === '—' ? (
              <p className="rounded-[16px] bg-[#F7F7F8] px-3 py-2.5 text-center text-[12px] leading-snug text-[#9CA3AF]">
                Адрес не указан — нажмите «Изменить»
              </p>
            ) : (
              <AddressInfoRow
                icon={<HiMapPin className="h-[16px] w-[16px]" strokeWidth={2} aria-hidden />}
                label="Адрес для всех"
                value={catalogMain}
              />
            )}
          </div>

          {hasAfterBooking ? (
            <div className="border-t border-[#EAECEF] pt-3">
              <AddressBlockTitle hint="Подъезд, этаж и подсказки — только у клиента с записью">
                После записи
              </AddressBlockTitle>
              <div className="space-y-2">
                {detailRows.map((row) => (
                  <AddressInfoRow
                    key={`${row.label}-${row.value}`}
                    icon={addressDetailIcon(row.label, visitType)}
                    label={row.label}
                    value={row.value}
                  />
                ))}
              </div>
            </div>
          ) : (
            <p className="rounded-[16px] bg-[#FAFAFA] px-3 py-2.5 text-center text-[12px] leading-snug text-[#9CA3AF]">
              Детали «после записи» не указаны — клиент увидит только адрес из каталога
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
