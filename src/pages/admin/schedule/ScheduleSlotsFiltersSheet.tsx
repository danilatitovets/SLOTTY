import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { SlottyDatePicker } from '../../../shared/ui/SlottyDatePicker';
import type { ScheduleSlotsStatusFilter } from './scheduleTypes';
import { labelClass, primaryBtnClass } from './scheduleUi';

export type ScheduleSlotsFilters = {
  status: ScheduleSlotsStatusFilter;
  dayIso: string;
  onlyUpcoming: boolean;
};

export const DEFAULT_SLOTS_FILTERS: ScheduleSlotsFilters = {
  status: 'all',
  dayIso: '',
  onlyUpcoming: false,
};

type Props = {
  open: boolean;
  onClose: () => void;
  filters: ScheduleSlotsFilters;
  onChange: (next: ScheduleSlotsFilters) => void;
  onReset: () => void;
};

const STATUS_OPTIONS: { value: ScheduleSlotsStatusFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'free', label: 'Свободные' },
  { value: 'booked', label: 'С записью' },
  { value: 'blocked', label: 'Недоступные' },
];

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function ScheduleSlotsFiltersSheet({ open, onClose, filters, onChange, onReset }: Props) {
  const hasActive =
    filters.status !== 'all' || filters.dayIso.trim() !== '' || filters.onlyUpcoming;

  return (
    <AdminBottomSheet open={open} onClose={onClose} title="Фильтры">
      <div className="space-y-5">
        <div>
          <p className={labelClass}>Статус</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => {
              const active = filters.status === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange({ ...filters, status: opt.value })}
                  className={`rounded-full px-3.5 py-2 text-[13px] font-semibold transition active:scale-[0.98] ${
                    active
                      ? 'bg-[#E29595] text-white shadow-[0_6px_18px_rgba(226,149,149,0.22)]'
                      : 'bg-[#F1EFEF] text-neutral-700'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className={labelClass}>Конкретный день</p>
          {filters.dayIso ? (
            <>
              <SlottyDatePicker
                className="mt-2 w-full"
                value={filters.dayIso}
                onChange={(v) => onChange({ ...filters, dayIso: v })}
              />
              <button
                type="button"
                className="mt-2 text-[13px] font-semibold text-[#C97B7B]"
                onClick={() => onChange({ ...filters, dayIso: '' })}
              >
                Показать все дни
              </button>
            </>
          ) : (
            <button
              type="button"
              className="mt-2 w-full rounded-[18px] border border-dashed border-[#E29595]/40 bg-[#FFF5F5] px-4 py-3 text-[14px] font-semibold text-[#C97B7B]"
              onClick={() => onChange({ ...filters, dayIso: todayIso() })}
            >
              Выбрать день
            </button>
          )}
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-[20px] bg-[#F1EFEF] px-4 py-3">
          <input
            type="checkbox"
            checked={filters.onlyUpcoming}
            onChange={(e) => onChange({ ...filters, onlyUpcoming: e.target.checked })}
            className="h-5 w-5 shrink-0 rounded border-neutral-300 text-[#E29595] focus:ring-[#E29595]"
          />
          <span className="text-[14px] font-semibold text-neutral-800">Только предстоящие</span>
        </label>

        <div className="flex flex-col gap-2">
          <button type="button" className={primaryBtnClass} onClick={onClose}>
            Применить
          </button>
          {hasActive ? (
            <button
              type="button"
              className="text-[14px] font-semibold text-[#C97B7B]"
              onClick={() => {
                onReset();
                onClose();
              }}
            >
              Сбросить фильтры
            </button>
          ) : null}
        </div>
      </div>
    </AdminBottomSheet>
  );
}
