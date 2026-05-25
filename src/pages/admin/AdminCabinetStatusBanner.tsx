import { useAdminMasterCabinet } from './AdminMasterCabinetContext';
import { ADMIN_CABINET_SHELL_MAX } from './overview/adminOverviewTheme';

export function AdminCabinetStatusBanner() {
  const { cabinetError, useCabinetApi, reloadCabinet, cabinetLoading } = useAdminMasterCabinet();
  if (!useCabinetApi || !cabinetError) return null;
  return (
    <div className={`mx-auto w-full min-w-0 px-4 pb-2 pt-2 lg:max-w-none lg:px-8 ${ADMIN_CABINET_SHELL_MAX}`}>
      <div className="rounded-2xl bg-[#FFF0F0] px-4 py-3 text-center shadow-[0_8px_24px_rgba(17,17,17,0.04)]">
        <p className="text-[13px] font-semibold text-[#9B2C2C]">{cabinetError}</p>
        <button
          type="button"
          disabled={cabinetLoading}
          onClick={() => void reloadCabinet()}
          className="mt-2.5 inline-flex min-h-9 items-center justify-center rounded-[10px] bg-[#F47C8C] px-4 text-[13px] font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
        >
          {cabinetLoading ? 'Загрузка…' : 'Обновить данные'}
        </button>
      </div>
    </div>
  );
}
