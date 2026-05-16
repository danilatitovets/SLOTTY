import { useMemo, useState } from 'react';
import { HiAdjustmentsHorizontal, HiMagnifyingGlass } from 'react-icons/hi2';
import type { ScheduleWindowView } from './scheduleTypes';
import { ScheduleWindowCard } from './ScheduleWindowCard';
import {
  DEFAULT_SLOTS_FILTERS,
  ScheduleSlotsFiltersSheet,
  type ScheduleSlotsFilters,
} from './ScheduleSlotsFiltersSheet';
import { cardClass } from './scheduleUi';
import { formatGroupHeader, parseIsoDate, startOfLocalDay } from './scheduleUtils';
import { LoadingVideo } from '../../../shared/ui/LoadingVideo';

type Props = {
  windows: ScheduleWindowView[];
  loading: boolean;
  onWindowClick: (w: ScheduleWindowView) => void;
};

function windowMatchesQuery(w: ScheduleWindowView, q: string): boolean {
  const haystack = `${w.serviceName} ${w.clientName ?? ''} ${w.clientPhone ?? ''} ${w.dateIso} ${w.startTime}`.toLowerCase();
  return haystack.includes(q);
}

function isUpcomingWindow(w: ScheduleWindowView): boolean {
  const end = new Date(`${w.dateIso}T${w.endTime}:00`);
  return end.getTime() >= Date.now();
}

export function ScheduleSlotsListTab({ windows, loading, onWindowClick }: Props) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<ScheduleSlotsFilters>(DEFAULT_SLOTS_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtersActive =
    filters.status !== 'all' || filters.dayIso.trim() !== '' || filters.onlyUpcoming;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return windows
      .filter((w) => {
        if (filters.dayIso && w.dateIso !== filters.dayIso) return false;
        if (filters.onlyUpcoming && !isUpcomingWindow(w)) return false;
        if (filters.status !== 'all' && w.status !== filters.status) return false;
        if (q && !windowMatchesQuery(w, q)) return false;
        return true;
      })
      .sort((a, b) => {
        const d = a.dateIso.localeCompare(b.dateIso);
        if (d !== 0) return d;
        return a.startTime.localeCompare(b.startTime);
      });
  }, [filters, query, windows]);

  const grouped = useMemo(() => {
    const todayStart = startOfLocalDay(new Date());
    const map = new Map<string, ScheduleWindowView[]>();
    for (const w of filtered) {
      const list = map.get(w.dateIso) ?? [];
      list.push(w);
      map.set(w.dateIso, list);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateIso, items]) => ({
        dateIso,
        header: formatGroupHeader(parseIsoDate(dateIso), todayStart),
        items,
      }));
  }, [filtered]);

  return (
    <section className="space-y-4">
      <div className="flex gap-2">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Поиск по окнам</span>
          <HiMagnifyingGlass
            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Услуга, клиент, дата…"
            className="w-full rounded-[18px] border border-[#E8E4E4] bg-white py-3 pl-11 pr-3 text-[14px] text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-[#E29595] focus:ring-2 focus:ring-[#E29595]/25"
          />
        </label>
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className={`relative flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[18px] border transition active:scale-[0.97] ${
            filtersActive
              ? 'border-[#E29595] bg-[#FFF5F5] text-[#C97B7B]'
              : 'border-[#E8E4E4] bg-white text-neutral-600'
          }`}
          aria-label="Фильтры"
        >
          <HiAdjustmentsHorizontal className="h-5 w-5" aria-hidden />
          {filtersActive ? (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#E29595]" aria-hidden />
          ) : null}
        </button>
      </div>

      {loading ? (
        <div className={cardClass}>
          <LoadingVideo size="sm" label="Загрузка окон…" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-[22px] bg-[#F1EFEF] px-4 py-6 text-center text-[14px] font-medium text-neutral-600">
          {windows.length === 0
            ? 'Окон пока нет. Создайте первое на вкладке «Создать».'
            : 'Ничего не найдено. Измените поиск или фильтры.'}
        </p>
      ) : (
        <div className="space-y-5">
          {grouped.map((group) => (
            <div key={group.dateIso}>
              <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-neutral-500">
                {group.header}
              </h3>
              <ul className="space-y-2">
                {group.items.map((w) => (
                  <li key={w.id}>
                    <ScheduleWindowCard window={w} onClick={() => onWindowClick(w)} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <ScheduleSlotsFiltersSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_SLOTS_FILTERS)}
      />
    </section>
  );
}
