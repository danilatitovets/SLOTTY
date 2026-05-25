import { HiHomeModern, HiMapPin } from 'react-icons/hi2';
import {
  buildLocationDisplayParts,
  catalogLineWithoutVisitPrefix,
  formatHomePublicBeforeBooking,
  isHomeAddressHiddenUntilBooking,
  masterVisitTypeLabel,
} from '../../../features/profile/model/masterLocation';
import type { MasterLocation } from '../../../features/profile/model/masterLocation';

type DetailRow = { label: string; value: string };

function DetailList({ rows }: { rows: DetailRow[] }) {
  const visible = rows.filter((r) => r.label.trim() && r.value.trim());
  if (!visible.length) return null;

  return (
    <ul className="mt-3 space-y-2.5">
      {visible.map((row) => (
        <li key={`${row.label}-${row.value}`} className="flex gap-3 text-[14px] leading-snug">
          <span className="w-[5.5rem] shrink-0 font-medium text-[#9CA3AF]">{row.label}</span>
          <span className="min-w-0 flex-1 text-[#374151]">{row.value}</span>
        </li>
      ))}
    </ul>
  );
}

type Props = { location: MasterLocation };

export function MasterAddressBlock({ location }: Props) {
  const parts = buildLocationDisplayParts(location);
  const visitLabel = parts?.visitLabel ?? masterVisitTypeLabel(location.visitType);
  const hiddenUntilBooking = isHomeAddressHiddenUntilBooking(location);

  const mainLine = (() => {
    if (hiddenUntilBooking) {
      const publicLine = formatHomePublicBeforeBooking(location);
      if (publicLine?.trim()) return publicLine.trim();
      const district = location.district?.trim();
      if (district) return district;
      return null;
    }
    if (parts?.addressLine && parts.addressLine !== '—') {
      return parts.addressLine.trim();
    }
    if (parts?.catalogLine) {
      const withoutVisit = catalogLineWithoutVisitPrefix(parts.catalogLine, visitLabel);
      if (withoutVisit.trim()) return withoutVisit.trim();
    }
    return null;
  })();

  const detailRows: DetailRow[] = hiddenUntilBooking
    ? []
    : [...(parts?.access ?? []), ...(parts?.wayfinding ?? [])];

  const VisitIcon = location.visitType === 'at_home' ? HiHomeModern : HiMapPin;

  return (
    <div className="space-y-3">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF1F4] px-3 py-1.5 text-[13px] font-semibold text-[#F47C8C]">
        <VisitIcon className="h-4 w-4 shrink-0" aria-hidden />
        {visitLabel}
      </span>

      {mainLine ? (
        <p className="text-[15px] font-semibold leading-snug text-[#111827]">{mainLine}</p>
      ) : (
        <p className="text-[14px] text-[#6B7280]">Адрес уточняется у мастера</p>
      )}

      {hiddenUntilBooking ? (
        <p className="rounded-[14px] bg-[#FAFAFA] px-3 py-2.5 text-[13px] leading-relaxed text-[#6B7280]">
          Подъезд, этаж и точный адрес будут доступны после подтверждения записи
        </p>
      ) : (
        <DetailList rows={detailRows} />
      )}
    </div>
  );
}
