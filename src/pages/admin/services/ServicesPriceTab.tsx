import { useMemo } from 'react';
import { HiClock, HiEllipsisHorizontal, HiWallet } from 'react-icons/hi2';
import { servicesCard, servicesIconCircle } from './adminServicesTheme';
import type { ManagedService } from './servicesFormat';
import { formatDurationRu, formatServicePrice } from './servicesFormat';

type Props = {
  services: ManagedService[];
  onEditPrice: (service: ManagedService) => void;
  onEditDuration: (service: ManagedService) => void;
  onOpenMenu: (service: ManagedService) => void;
};

export function ServicesPriceTab({ services, onEditPrice, onEditDuration, onOpenMenu }: Props) {
  const stats = useMemo(() => {
    const visible = services.filter((s) => s.isActive !== false).length;
    const avg =
      services.length > 0
        ? Math.round(
            services.reduce((sum, s) => sum + (Number.isFinite(s.priceByn) ? s.priceByn : 0), 0) /
              services.length,
          )
        : 0;
    const min =
      services.length > 0
        ? Math.min(...services.map((s) => (Number.isFinite(s.priceByn) ? s.priceByn : 0)))
        : 0;
    const max =
      services.length > 0
        ? Math.max(...services.map((s) => (Number.isFinite(s.priceByn) ? s.priceByn : 0)))
        : 0;

    return { visible, avg, min, max };
  }, [services]);

  return (
    <div className="space-y-4">
      <section className={`${servicesCard} overflow-hidden p-0`}>
        <div className="border-b border-[#F3F4F6] px-4 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">
                Прайс-лист
              </p>
              <p className="mt-0.5 text-[17px] font-bold tracking-[-0.04em] text-[#111827]">
                Сводка по услугам
              </p>
            </div>
            <span className={`${servicesIconCircle} h-11 w-11 rounded-[14px]`}>
              <HiWallet className="h-5 w-5" aria-hidden />
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-[#F3F4F6]">
          <div className="px-3 py-4 text-center">
            <p className="text-[22px] font-bold tabular-nums tracking-[-0.05em] text-[#111827]">
              {services.length}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-[#9CA3AF]">всего</p>
          </div>
          <div className="px-3 py-4 text-center">
            <p className="text-[22px] font-bold tabular-nums tracking-[-0.05em] text-[#F47C8C]">
              {stats.avg > 0 ? stats.avg : '—'}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-[#9CA3AF]">средний, BYN</p>
          </div>
          <div className="px-3 py-4 text-center">
            <p className="text-[22px] font-bold tabular-nums tracking-[-0.05em] text-[#111827]">
              {stats.visible}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-[#9CA3AF]">видимых</p>
          </div>
        </div>

        {services.length > 0 && stats.min !== stats.max ? (
          <p className="border-t border-[#F3F4F6] px-4 py-2.5 text-center text-[12px] font-medium text-[#9CA3AF]">
            Диапазон цен: {stats.min}–{stats.max} BYN
          </p>
        ) : null}
      </section>

      {services.length === 0 ? (
        <div className={`${servicesCard} p-6 text-center`}>
          <p className="text-[15px] font-semibold text-[#6B7280]">Добавьте услуги в каталоге</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {services.map((service) => (
            <li key={service.id} className={`${servicesCard} p-4`}>
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 truncate text-[15px] font-bold text-[#111827]">{service.title}</p>
                <button
                  type="button"
                  onClick={() => onOpenMenu(service)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F7F7F8] text-[#6B7280] transition active:scale-[0.96]"
                  aria-label="Меню"
                >
                  <HiEllipsisHorizontal className="h-5 w-5" aria-hidden />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onEditPrice(service)}
                  className="flex min-h-[52px] flex-col items-start justify-center gap-1 rounded-[14px] border border-[#FDE8ED] bg-[#FFF1F4] px-3 py-2.5 text-left transition active:scale-[0.98]"
                  aria-label={`Изменить цену: ${service.title}`}
                >
                  <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-[#F47C8C]">
                    <HiWallet className="h-3.5 w-3.5" aria-hidden />
                    Цена
                  </span>
                  <span className="text-[15px] font-bold tabular-nums text-[#111827]">
                    {formatServicePrice(service)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onEditDuration(service)}
                  className="flex min-h-[52px] flex-col items-start justify-center gap-1 rounded-[14px] border border-[#EAECEF] bg-[#FAFAFA] px-3 py-2.5 text-left transition active:scale-[0.98]"
                  aria-label={`Изменить длительность: ${service.title}`}
                >
                  <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-[#6B7280]">
                    <HiClock className="h-3.5 w-3.5" aria-hidden />
                    Время
                  </span>
                  <span className="text-[15px] font-bold text-[#111827]">
                    {formatDurationRu(service.durationMin)}
                  </span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
