import { HiMapPin } from 'react-icons/hi2';
import { catalogDesktopPanel, catalogPrimaryBtn } from '../servicesCatalog/servicesCatalogTheme';

type Props = {
  onAllow: () => void;
  loading?: boolean;
};

export function GeoPromptCard({ onAllow, loading }: Props) {
  return (
    <div className={`relative max-lg:static ${catalogDesktopPanel} p-4`}>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#EBEBEB] text-[#F47C8C]">
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
            className={`${catalogPrimaryBtn} mt-3 min-h-10 w-full px-4 text-[13px] sm:w-auto`}
          >
            {loading ? 'Определяем…' : 'Разрешить геолокацию'}
          </button>
        </div>
      </div>
    </div>
  );
}
