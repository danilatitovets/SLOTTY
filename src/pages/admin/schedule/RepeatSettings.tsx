import { useMemo, useState } from 'react';
import {
  HiArrowPath,
  HiBriefcase,
  HiCalendarDays,
  HiCheck,
  HiQuestionMarkCircle,
  HiSquares2X2,
} from 'react-icons/hi2';
import { PickerSheet } from '../../../shared/ui/PickerSheet';
import { SlottyImg } from '../../../shared/ui/SlottyImg';
import { SlottySelect } from '../../../shared/ui/SlottySelect';
import { adminFormSheetStepDoneIconSrc } from '../shared/adminFormSheetTheme';
import { RepeatCalendarPreview } from './RepeatCalendarPreview';
import { scheduleSheetPrimaryBtn } from './adminScheduleTheme';
import { SchedulePhotoPlusIcon } from './SchedulePhotoPlusIcon';
import { SCHEDULE_QUICK_SETUP_IMAGES } from './scheduleQuickSetupAssets';
import type { PlannedSlot } from './scheduleTypes';
import type { RepeatKind } from './scheduleTypes';
import {
  BIWEEKLY_COUNT_OPTIONS,
  DEFAULT_WEEKDAY_MASK,
  formatRepeatDetail,
  PICK_WEEKDAYS_SPAN_OPTIONS,
  REPEAT_KIND_OPTIONS,
  type RepeatSettingsValue,
  WEEKDAY_SHORT,
  WEEKDAY_SPAN_OPTIONS,
  WEEKLY_COUNT_OPTIONS,
  patchRepeatSettings,
} from './repeatSettingsConfig';
import {
  countRepeatDates,
  formatRepeatStepPreviewLines,
  windowsCountLabelRu,
} from './scheduleUtils';

export type { RepeatSettingsValue } from './repeatSettingsConfig';
export {
  DEFAULT_REPEAT_SETTINGS,
  patchRepeatSettings,
} from './repeatSettingsConfig';

/** @deprecated Используйте RepeatSettingsValue */
export type RepeatCount = 4 | 8 | 12;

type Props = {
  value: RepeatSettingsValue;
  onChange: (value: RepeatSettingsValue) => void;
  /** Для превью числа дат в серии */
  dateIso?: string;
  startTime?: string;
  plannedSlots?: PlannedSlot[];
  /** Компактный стиль в catalog-шите «Новое окно». */
  cabinet?: boolean;
};

const KIND_ICONS: Record<RepeatKind, typeof HiCalendarDays> = {
  none: HiCalendarDays,
  weekly: HiArrowPath,
  biweekly: HiArrowPath,
  weekdays: HiBriefcase,
  pick_weekdays: HiSquares2X2,
};

function KindCard({
  selected,
  label,
  description,
  previewLines,
  intervalDays,
  onClick,
  icon: Icon,
  cabinet,
  fullWidth,
}: {
  selected: boolean;
  label: string;
  description: string;
  previewLines?: string[];
  intervalDays?: number;
  onClick: () => void;
  icon: typeof HiCalendarDays;
  cabinet?: boolean;
  fullWidth?: boolean;
}) {
  if (cabinet) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`relative flex w-full items-center gap-3 overflow-hidden rounded-[12px] px-3.5 py-3 text-left transition active:scale-[0.99] ${
          fullWidth ? 'col-span-2' : ''
        } ${
          selected
            ? 'ring-2 ring-[#3B4CCA]/25'
            : 'bg-[#EBEBEB] text-[#111827] hover:bg-[#E4E4E4]'
        }`}
      >
        {selected ? (
          <>
            <span
              className="pointer-events-none absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${SCHEDULE_QUICK_SETUP_IMAGES.tabCreateActiveBg})` }}
              aria-hidden
            />
            <span className="pointer-events-none absolute inset-0 bg-white/55" aria-hidden />
          </>
        ) : null}
        <span className="relative z-10 min-w-0 flex-1">
          <span className="block text-[14px] font-semibold leading-snug text-[#111827]">{label}</span>
          {previewLines?.map((line) => (
            <span key={line} className="mt-0.5 block text-[12px] font-medium leading-snug text-[#6B7280]">
              {line}
            </span>
          ))}
        </span>
        {intervalDays != null ? (
          <span
            className={`relative z-10 flex h-9 min-w-[2.25rem] shrink-0 flex-col items-center justify-center rounded-[10px] px-2 tabular-nums ${
              selected ? 'bg-white/85 text-[#3B4CCA]' : 'bg-white text-[#3B4CCA] ring-1 ring-[#E0E4F8]'
            }`}
            aria-hidden
          >
            <span className="text-[15px] font-black leading-none">{intervalDays}</span>
            <span className="text-[9px] font-bold uppercase leading-none">дн</span>
          </span>
        ) : null}
        {selected ? (
          <SlottyImg
            src={adminFormSheetStepDoneIconSrc}
            alt=""
            className="relative z-10 h-6 w-6 shrink-0 object-contain"
            decoding="async"
            aria-hidden
          />
        ) : null}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-[18px] border px-4 py-3.5 text-left transition active:scale-[0.99] ${
        selected
          ? 'border-[#A8B0E8] bg-gradient-to-br from-[#F5F6FD] to-white shadow-[0_8px_24px_rgba(59,76,202,0.12)] ring-2 ring-[#EEF0FC]'
          : 'border-[#EAECEF] bg-white hover:border-[#D8DCF5] hover:bg-[#F4F5FD]'
      }`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${
          selected
            ? 'bg-gradient-to-br from-[#4558D4] to-[#3B4CCA] text-white shadow-[0_8px_20px_rgba(59,76,202,0.28)]'
            : 'bg-[#f6f7fb] text-[#9CA3AF]'
        }`}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[15px] font-black text-[#111827]">{label}</span>
          {selected ? (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#3B4CCA] text-white">
              <HiCheck className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block text-[12px] font-semibold leading-relaxed text-[#6B7280]">
          {description}
        </span>
      </span>
    </button>
  );
}

function SchedulePhotoActiveLayers() {
  return (
    <>
      <span
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${SCHEDULE_QUICK_SETUP_IMAGES.tabCreateActiveBg})` }}
        aria-hidden
      />
      <span className="pointer-events-none absolute inset-0 bg-white/55" aria-hidden />
    </>
  );
}

function CountChips({
  label,
  value,
  options,
  onChange,
  ariaLabel,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  ariaLabel: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel}>
      <p className="text-[13px] font-medium text-[#6B7280]">{label}</p>
      <div className="mt-2 flex gap-1.5">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(opt.value)}
              className={`relative min-h-[2.75rem] min-w-0 flex-1 overflow-hidden rounded-[10px] px-1.5 py-2.5 text-center text-[12px] font-semibold leading-snug transition active:scale-[0.97] sm:text-[13px] ${
                active
                  ? 'text-[#111827] ring-2 ring-[#3B4CCA]/25'
                  : 'bg-[#EBEBEB] text-[#111827] hover:bg-[#E4E4E4]'
              }`}
            >
              {active ? <SchedulePhotoActiveLayers /> : null}
              <span className="relative z-10">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CountSelect({
  label,
  value,
  options,
  onChange,
  ariaLabel,
  cabinet,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  ariaLabel: string;
  cabinet?: boolean;
}) {
  if (cabinet) {
    return (
      <CountChips
        label={label}
        value={value}
        options={options}
        onChange={onChange}
        ariaLabel={ariaLabel}
      />
    );
  }

  return (
    <div>
      <p className="text-[13px] font-bold text-[#111827]">{label}</p>
      <SlottySelect
        className="mt-1.5 w-full"
        tone="admin"
        value={value}
        onChange={onChange}
        options={options}
        aria-label={ariaLabel}
        sheetTitle={label}
        pickerLayer="sheet"
      />
    </div>
  );
}

function RepeatKindDetails({
  value,
  onChange,
  cabinet,
}: {
  value: RepeatSettingsValue;
  onChange: (value: RepeatSettingsValue) => void;
  cabinet?: boolean;
}) {
  const toggleWeekday = (index: number) => {
    const next = [...value.pickWeekdayMask] as RepeatSettingsValue['pickWeekdayMask'];
    next[index] = !next[index];
    onChange(patchRepeatSettings(value, { pickWeekdayMask: next }));
  };

  return (
    <div
      className={
        cabinet
          ? 'space-y-4 border-t border-[#EEEEEE] pt-4'
          : 'space-y-4 rounded-[20px] border border-[#D8DCF5] bg-[#f6f7fb] p-4'
      }
    >
      {value.kind === 'weekly' ? (
        <CountSelect
          label="На сколько недель"
          cabinet={cabinet}
          value={String(value.weeklyCount)}
          options={WEEKLY_COUNT_OPTIONS.map((o) => ({
            value: String(o.value),
            label: o.label,
          }))}
          onChange={(v) =>
            onChange(
              patchRepeatSettings(value, {
                weeklyCount: Number(v) as (typeof value)['weeklyCount'],
              }),
            )
          }
          ariaLabel="Сколько недель повторять"
        />
      ) : null}

      {value.kind === 'biweekly' ? (
        <CountSelect
          label="Сколько раз повторить"
          cabinet={cabinet}
          value={String(value.biweeklyCount)}
          options={BIWEEKLY_COUNT_OPTIONS.map((o) => ({
            value: String(o.value),
            label: o.label,
          }))}
          onChange={(v) =>
            onChange(
              patchRepeatSettings(value, {
                biweeklyCount: Number(v) as (typeof value)['biweeklyCount'],
              }),
            )
          }
          ariaLabel="Сколько раз повторять раз в две недели"
        />
      ) : null}

      {value.kind === 'weekdays' ? (
        <CountSelect
          label="На сколько недель"
          cabinet={cabinet}
          value={String(value.weekdaySpanWeeks)}
          options={WEEKDAY_SPAN_OPTIONS.map((o) => ({
            value: String(o.value),
            label: o.label,
          }))}
          onChange={(v) =>
            onChange(
              patchRepeatSettings(value, {
                weekdaySpanWeeks: Number(v) as (typeof value)['weekdaySpanWeeks'],
              }),
            )
          }
          ariaLabel="Период для будних дней"
        />
      ) : null}

      {value.kind === 'pick_weekdays' ? (
        <div className="space-y-4">
          <div>
            <p className="text-[13px] font-medium text-[#6B7280]">Дни недели</p>
            <div className="mt-2 flex w-full gap-1">
              {WEEKDAY_SHORT.map((label, idx) => {
                const on = value.pickWeekdayMask[idx];
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleWeekday(idx)}
                    className={`relative min-h-[2.5rem] min-w-0 flex-1 overflow-hidden rounded-[8px] text-[11px] font-semibold transition active:scale-[0.97] sm:text-[12px] ${
                      on
                        ? 'text-[#111827] ring-2 ring-[#3B4CCA]/25'
                        : 'bg-[#EBEBEB] text-[#6B7280] hover:bg-[#E4E4E4]'
                    }`}
                    aria-pressed={on}
                  >
                    {on ? <SchedulePhotoActiveLayers /> : null}
                    <span className="relative z-10">{label}</span>
                  </button>
                );
              })}
            </div>
            {!value.pickWeekdayMask.some(Boolean) ? (
              <p className="mt-2 text-[12px] font-semibold text-[#DC2626]">
                Выберите хотя бы один день
              </p>
            ) : null}
          </div>

          <CountSelect
            label="На сколько недель"
            cabinet={cabinet}
            value={String(value.pickWeekdaysSpanWeeks)}
            options={PICK_WEEKDAYS_SPAN_OPTIONS.map((o) => ({
              value: String(o.value),
              label: o.label,
            }))}
            onChange={(v) =>
              onChange(
                patchRepeatSettings(value, {
                  pickWeekdaysSpanWeeks: Number(v) as (typeof value)['pickWeekdaysSpanWeeks'],
                }),
              )
            }
            ariaLabel="Период для выбранных дней"
          />

          <button
            type="button"
            className="mt-1 w-full rounded-[10px] bg-[#EBEBEB] px-3 py-2.5 text-[12px] font-semibold text-[#111827] transition hover:bg-[#E4E4E4] active:scale-[0.99] sm:text-[13px]"
            onClick={() =>
              onChange(patchRepeatSettings(value, { pickWeekdayMask: [...DEFAULT_WEEKDAY_MASK] }))
            }
          >
            Будни пн–пт
          </button>
        </div>
      ) : null}

      {cabinet ? null : (
        <p className="text-[12px] font-semibold leading-relaxed text-[#6B7280]">
          Занятые слоты пропустим автоматически.
        </p>
      )}
    </div>
  );
}

function RepeatSummaryBox({
  dateCount,
  detail,
  seriesMode,
  cabinet,
}: {
  dateCount: number;
  detail: string;
  seriesMode: boolean;
  cabinet?: boolean;
}) {
  const showCountAccent = dateCount > 0;

  return (
    <div
      className={
        cabinet
          ? showCountAccent
            ? 'rounded-[12px] bg-[#EEF0FC] px-4 py-3.5'
            : 'rounded-[10px] bg-[#EBEBEB] px-4 py-3'
          : `rounded-[16px] px-4 py-3 ${
              seriesMode && dateCount > 0
                ? 'bg-[#EEF0FC] ring-1 ring-[#D8DCF5]'
                : 'bg-white ring-1 ring-[#EAECEF]'
            }`
      }
    >
      {showCountAccent ? (
        <>
          <p className="text-[12px] font-semibold text-[#6B7280]">Создастся</p>
          <p className="mt-1 flex items-end gap-2">
            <span className="text-[36px] font-black tabular-nums leading-none tracking-[-0.05em] text-[#3B4CCA]">
              {dateCount}
            </span>
            <span className="pb-1 text-[16px] font-bold text-[#3B4CCA]">
              {windowsCountLabelRu(dateCount)}
            </span>
          </p>
          {seriesMode ? (
            <p className="mt-2 text-[13px] font-medium leading-snug text-[#6B7280]">{detail}</p>
          ) : null}
        </>
      ) : (
        <p className="text-[14px] font-semibold leading-snug text-[#374151]">{detail}</p>
      )}
    </div>
  );
}

const REPEAT_HELP_TEXT =
  'Можно сразу создать несколько окон на будущее — каждую неделю, раз в две недели или в выбранные дни. Если повтор не нужен, оставьте «Без повтора». Пересечения с уже занятым временем пропустим сами.';

function RepeatSettingsCabinet({
  value,
  onChange,
  dateIso,
  startTime,
  plannedSlots,
}: {
  value: RepeatSettingsValue;
  onChange: (value: RepeatSettingsValue) => void;
  dateIso: string;
  startTime: string;
  plannedSlots: PlannedSlot[];
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const dateCount = useMemo(
    () => (dateIso.trim() ? countRepeatDates(dateIso, value) : 0),
    [dateIso, value],
  );

  const detail = formatRepeatDetail(value);
  const repeatEnabled = value.kind !== 'none';

  const setKind = (kind: RepeatKind) => {
    onChange(patchRepeatSettings(value, { kind }));
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-1 rounded-[10px] bg-[#EBEBEB] pr-2">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex min-h-12 min-w-0 flex-1 items-center gap-3 py-3 pl-4 pr-1 text-left transition hover:bg-[#E4E4E4] active:scale-[0.99]"
            aria-haspopup="dialog"
            aria-expanded={sheetOpen}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-[#111827]">Повторять окна</span>
              {repeatEnabled ? (
                <span className="mt-0.5 block truncate text-[13px] font-medium text-[#6B7280]">
                  {detail}
                </span>
              ) : null}
            </span>
            <SchedulePhotoPlusIcon />
          </button>
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#9CA3AF] transition hover:bg-white/70 hover:text-[#6B7280] active:scale-[0.97]"
            aria-label="Как работает повторение"
          >
            <HiQuestionMarkCircle className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <RepeatSummaryBox dateCount={dateCount} detail={detail} seriesMode={repeatEnabled} cabinet />
      </div>

      <PickerSheet
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Как работает повтор"
        footer={
          <button type="button" className={scheduleSheetPrimaryBtn} onClick={() => setHelpOpen(false)}>
            Понятно
          </button>
        }
      >
        <p className="text-[14px] font-medium leading-relaxed text-[#6B7280]">{REPEAT_HELP_TEXT}</p>
      </PickerSheet>

      <PickerSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Повторение"
        subtitle="Как часто создавать окна"
        footer={
          <button type="button" className={scheduleSheetPrimaryBtn} onClick={() => setSheetOpen(false)}>
            Готово
          </button>
        }
      >
        <div className="space-y-3">
          <div className="space-y-2">
            {REPEAT_KIND_OPTIONS.map((opt) => {
              const Icon = KIND_ICONS[opt.value];
              return (
                <KindCard
                  key={opt.value}
                  selected={value.kind === opt.value}
                  label={opt.label}
                  description={opt.description}
                  previewLines={
                    opt.intervalDays
                      ? formatRepeatStepPreviewLines(dateIso, startTime, opt.intervalDays)
                      : undefined
                  }
                  intervalDays={opt.intervalDays}
                  icon={Icon}
                  onClick={() => setKind(opt.value)}
                  cabinet
                />
              );
            })}
          </div>

          {repeatEnabled ? <RepeatKindDetails value={value} onChange={onChange} cabinet /> : null}

          {plannedSlots.length > 0 ? (
            <RepeatCalendarPreview slots={plannedSlots} />
          ) : null}
        </div>
      </PickerSheet>
    </>
  );
}

export function RepeatSettings({
  value,
  onChange,
  dateIso = '',
  startTime = '',
  plannedSlots = [],
  cabinet,
}: Props) {
  const dateCount = useMemo(
    () => (dateIso.trim() ? countRepeatDates(dateIso, value) : 0),
    [dateIso, value],
  );

  const detail = formatRepeatDetail(value);
  const seriesMode = value.kind !== 'none';

  const setKind = (kind: RepeatKind) => {
    onChange(patchRepeatSettings(value, { kind }));
  };

  if (cabinet) {
    return (
      <RepeatSettingsCabinet
        value={value}
        onChange={onChange}
        dateIso={dateIso}
        startTime={startTime}
        plannedSlots={plannedSlots}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {REPEAT_KIND_OPTIONS.map((opt) => {
          const Icon = KIND_ICONS[opt.value];
          return (
            <KindCard
              key={opt.value}
              selected={value.kind === opt.value}
              label={opt.label}
              description={opt.description}
              previewLines={
                opt.intervalDays
                  ? formatRepeatStepPreviewLines(dateIso, startTime, opt.intervalDays)
                  : undefined
              }
              intervalDays={opt.intervalDays}
              icon={Icon}
              onClick={() => setKind(opt.value)}
            />
          );
        })}
      </div>

      {seriesMode ? <RepeatKindDetails value={value} onChange={onChange} /> : null}

      <RepeatSummaryBox dateCount={dateCount} detail={detail} seriesMode={seriesMode} />
    </div>
  );
}
