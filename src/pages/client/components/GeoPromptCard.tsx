import { HiMapPin } from 'react-icons/hi2';
import { clientPinkBtn } from '../clientTheme';

type Props = {
  onAllow: () => void;
  loading?: boolean;
};

export function GeoPromptCard({ onAllow, loading }: Props) {
  return (
    <div className="rounded-[24px] bg-gradient-to-br from-[#FFF1F4] to-white p-4 ring-1 ring-[#FCE7EC]">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#F47C8C] shadow-sm">
          <HiMapPin className="h-6 w-6" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-semibold text-[#111827]">Показать мастеров рядом?</p>
          <p className="mt-1 text-[13px] leading-snug text-[#6B7280]">
            Разрешите геолокацию — подберём ближайшие окна и расстояние до мастера.
          </p>
          <button
            type="button"
            disabled={loading}
            onClick={onAllow}
            className={`${clientPinkBtn} mt-3 min-h-10 px-4 text-[13px]`}
          >
            {loading ? 'Определяем…' : 'Разрешить геолокацию'}
          </button>
        </div>
      </div>
    </div>
  );
}
