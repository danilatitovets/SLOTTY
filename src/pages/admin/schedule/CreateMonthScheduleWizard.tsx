import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { HiCalendarDays, HiClock } from 'react-icons/hi2';
import { ADMIN_SCHEDULE_PATH } from '../../../app/paths';
import { SlottyImg } from '../../../shared/ui/SlottyImg';
import { SlottySelect } from '../../../shared/ui/SlottySelect';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { AdminFormSheetLayout, AdminFormSheetStepper } from '../shared/AdminFormSheetLayout';
import { catalogSheetField, catalogSheetLabel } from '../shared/adminCatalogSheetTheme';
import { adminFormSheetStepDoneIconSrc } from '../shared/adminFormSheetTheme';
import {
  scheduleSheetErrorBox,
  scheduleSheetFormPanel,
  scheduleSheetPrimaryBtn,
  scheduleSheetSecondaryBtn,
  scheduleSheetSummaryBody,
  scheduleSheetSummaryHeader,
  scheduleSheetSummaryShell,
} from './adminScheduleTheme';
import { PlannedSlotsPreviewSheet } from './PlannedSlotsPreviewSheet';
import { SCHEDULE_QUICK_SETUP_IMAGES } from './scheduleQuickSetupAssets';
import { ScheduleKpiPhotoBackdrop } from './ScheduleKpiPhotoBackdrop';
import { formatDdMmYyyy } from '../overview/overviewFormat';
import { MasterPublicPreviewLink } from '../shared/MasterPublicPreviewLink';
import {
  addDaysIso,
  filterNonOverlappingBatch,
  planBatchSlots,
  todayIsoLocal,
  type BatchScheduleConfig,
  type BatchWeekday,
  type PlannedBatchSlot,
} from './scheduleBatchPlan';
import { createMySlotsBatch, type BatchCreateSlotsResult } from '../../../features/admin/api/adminSlotsApi';
import { formatDurationRu, windowsCountRu } from './scheduleUtils';
import { WEEKDAY_SHORT } from './repeatSettingsConfig';
import { notifyMasterSlotsChanged } from '../shared/masterSlotsInvalidation';
import {
  batchSkipReasonLabel,
  formatBatchSuccessSummary,
  summarizeBatchSkipped,
} from './batchSkipReasonLabels';
import type { PlannedSlot } from './scheduleTypes';

type ServiceOption = { id: string; title: string; durationMin: number };

type Props = {
  open: boolean;
  onClose: () => void;
  masterId: string | null | undefined;
  services: ServiceOption[];
  defaultWorkDays: number[];
  defaultStartTime: string;
  defaultEndTime: string;
  scheduleHorizonDays: number | null;
  existingSlots: Array<{ startsAt: string; endsAt: string }>;
  onCreated: () => void;
  initialPeriodDays?: 7 | 14 | 30;
  initialServiceId?: string | null;
  useCabinetApi?: boolean;
};

type Step = 0 | 1 | 2 | 3;

const WIZARD_STEPS = ['Период', 'Время', 'Проверка'] as const;

const PERIOD_OPTIONS: Array<{
  days: 7 | 14 | 30;
  label: string;
  hint: string;
}> = [
  { days: 7, label: 'Неделя', hint: 'Быстрый старт — 7 рабочих дней' },
  { days: 14, label: '2 недели', hint: 'Оптимально для Free-тарифа' },
  { days: 30, label: 'Месяц', hint: 'Настроить и ждать клиентов' },
];

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

function FormPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={scheduleSheetFormPanel}>
      <p className="text-[14px] font-bold tracking-[-0.02em] text-[#111827]">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function PresetChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`relative min-h-[2.75rem] min-w-0 flex-1 overflow-hidden rounded-[10px] px-2 py-2.5 text-center text-[13px] font-semibold transition active:scale-[0.97] ${
        active ? 'text-[#111827] ring-2 ring-[#3B4CCA]/25' : 'bg-[#EBEBEB] text-[#111827] hover:bg-[#E4E4E4]'
      }`}
    >
      {active ? <SchedulePhotoActiveLayers /> : null}
      <span className="relative z-10">{label}</span>
    </button>
  );
}

function WeekdayChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`relative flex min-h-[2.5rem] w-full items-center justify-center overflow-hidden rounded-[8px] text-[11px] font-semibold transition active:scale-[0.97] sm:text-[12px] ${
        active
          ? 'text-[#111827] ring-2 ring-[#3B4CCA]/25'
          : 'bg-[#EBEBEB] text-[#6B7280] hover:bg-[#E4E4E4]'
      }`}
    >
      {active ? <SchedulePhotoActiveLayers /> : null}
      <span className="relative z-10">{label}</span>
    </button>
  );
}

function PeriodOptionCard({
  selected,
  label,
  hint,
  days,
  dateRange,
  onClick,
}: {
  selected: boolean;
  label: string;
  hint: string;
  days: number;
  dateRange: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex w-full flex-col overflow-hidden rounded-[12px] px-3.5 py-3 text-left transition active:scale-[0.99] ${
        selected ? 'ring-2 ring-[#3B4CCA]/25' : 'bg-[#EBEBEB] hover:bg-[#E4E4E4]'
      }`}
    >
      {selected ? <SchedulePhotoActiveLayers /> : null}
      <div className="relative z-10 flex w-full items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold leading-snug text-[#111827]">{label}</p>
          <p className="mt-0.5 text-[12px] font-medium leading-snug text-[#6B7280]">{hint}</p>
          <p className="mt-2 text-[12px] font-semibold text-[#9CA3AF]">{dateRange}</p>
        </div>
        <span
          className={`flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-[10px] tabular-nums ${
            selected ? 'bg-white/85 text-[#3B4CCA]' : 'bg-white text-[#3B4CCA] ring-1 ring-[#E0E4F8]'
          }`}
          aria-hidden
        >
          <span className="text-[15px] font-black leading-none">{days}</span>
          <span className="text-[9px] font-bold uppercase leading-none">дн</span>
        </span>
        {selected ? (
          <SlottyImg
            src={adminFormSheetStepDoneIconSrc}
            alt=""
            className="h-6 w-6 shrink-0 object-contain"
            decoding="async"
            aria-hidden
          />
        ) : null}
      </div>
    </button>
  );
}

function ServiceScopeCard({
  selected,
  title,
  description,
  onClick,
}: {
  selected: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex w-full flex-col overflow-hidden rounded-[12px] px-3.5 py-3 text-left transition active:scale-[0.99] ${
        selected ? 'ring-2 ring-[#3B4CCA]/25' : 'bg-[#EBEBEB] hover:bg-[#E4E4E4]'
      }`}
    >
      {selected ? <SchedulePhotoActiveLayers /> : null}
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-[#111827]">{title}</p>
          <p className="mt-1 text-[13px] font-medium leading-snug text-[#6B7280]">{description}</p>
        </div>
        {selected ? (
          <SlottyImg
            src={adminFormSheetStepDoneIconSrc}
            alt=""
            className="h-6 w-6 shrink-0 object-contain"
            decoding="async"
            aria-hidden
          />
        ) : null}
      </div>
    </button>
  );
}

function DurationChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`relative min-h-[2.75rem] overflow-hidden rounded-[10px] px-2 py-2.5 text-center text-[13px] font-semibold transition active:scale-[0.97] ${
        active ? 'text-[#111827] ring-2 ring-[#3B4CCA]/25' : 'bg-[#EBEBEB] text-[#111827] hover:bg-[#E4E4E4]'
      }`}
    >
      {active ? <SchedulePhotoActiveLayers /> : null}
      <span className="relative z-10">{label}</span>
    </button>
  );
}

function batchSlotsToPlanned(slots: PlannedBatchSlot[]): PlannedSlot[] {
  return slots.map((slot) => ({
    dateIso: slot.dateIso,
    startTime: slot.startTime,
    endTime: slot.endTime,
    serviceId: null,
  }));
}

function WizardLivePreview({
  periodDays,
  startDateIso,
  endDateIso,
  weekdays,
  dayStartTime,
  dayEndTime,
  slotDurationMinutes,
  toCreate,
  skippedOverlap,
  plannedSlots = [],
}: {
  periodDays: number;
  startDateIso: string;
  endDateIso: string;
  weekdays: BatchWeekday[];
  dayStartTime: string;
  dayEndTime: string;
  slotDurationMinutes: number;
  toCreate: number;
  skippedOverlap: number;
  plannedSlots?: PlannedSlot[];
}) {
  const dayLabels =
    weekdays.length > 0 ? weekdays.map((d) => WEEKDAY_SHORT[d]).join(', ') : 'не выбраны';
  const showPreviewLinks = plannedSlots.length > 0 && toCreate > 0;

  return (
    <div className={scheduleSheetSummaryShell}>
      <div className={scheduleSheetSummaryHeader}>
        <ScheduleKpiPhotoBackdrop />
        <div className="relative z-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6B7280] drop-shadow-sm">
            Предпросмотр
          </p>
          {toCreate > 0 ? (
            <div className="mt-2 flex items-end gap-2">
              <span className="text-[36px] font-black tabular-nums leading-none tracking-[-0.05em] text-[#3B4CCA] drop-shadow-sm">
                {toCreate}
              </span>
              <span className="pb-1 text-[16px] font-bold text-[#3B4CCA] drop-shadow-sm">
                {toCreate === 1 ? 'окно' : toCreate >= 2 && toCreate <= 4 ? 'окна' : 'окон'}
              </span>
            </div>
          ) : (
            <p className="mt-2 text-[18px] font-bold text-[#111827] drop-shadow-sm">—</p>
          )}
        </div>
      </div>

      <div className={scheduleSheetSummaryBody}>
        <ul className="space-y-2 text-[13px] font-medium text-[#374151]">
          <li className="flex gap-2">
            <HiCalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#3B4CCA]" aria-hidden />
            <span>
              {formatDdMmYyyy(startDateIso)} — {formatDdMmYyyy(endDateIso)} ({periodDays} дн.)
            </span>
          </li>
          <li className="flex gap-2">
            <span className="w-4 shrink-0 text-center text-[#3B4CCA]">•</span>
            <span>{dayLabels}</span>
          </li>
          <li className="flex gap-2">
            <HiClock className="mt-0.5 h-4 w-4 shrink-0 text-[#3B4CCA]" aria-hidden />
            <span>
              {dayStartTime}–{dayEndTime}, окно {formatDurationRu(slotDurationMinutes)}
            </span>
          </li>
        </ul>
        {skippedOverlap > 0 ? (
          <p className="mt-3 text-[12px] font-semibold text-[#B45309]">
            {skippedOverlap} пропустим — время уже занято
          </p>
        ) : null}
        {weekdays.length === 0 ? (
          <p className="mt-3 text-[12px] font-semibold text-[#DC2626]">
            Выберите хотя бы один рабочий день
          </p>
        ) : null}
        {showPreviewLinks ? (
          <PlannedSlotsPreviewSheet slots={plannedSlots} className="mt-3" />
        ) : null}
      </div>
    </div>
  );
}

export function CreateMonthScheduleWizard({
  open,
  onClose,
  masterId,
  services,
  defaultWorkDays,
  defaultStartTime,
  defaultEndTime,
  scheduleHorizonDays,
  existingSlots,
  onCreated,
  initialPeriodDays = 30,
  initialServiceId = null,
  useCabinetApi = true,
}: Props) {
  const [step, setStep] = useState<Step>(0);
  const [periodDays, setPeriodDays] = useState<7 | 14 | 30>(initialPeriodDays);
  const [weekdays, setWeekdays] = useState<BatchWeekday[]>(() =>
    (defaultWorkDays.length ? defaultWorkDays : [0, 1, 2, 3, 4]) as BatchWeekday[],
  );
  const [dayStartTime, setDayStartTime] = useState(defaultStartTime || '10:00');
  const [dayEndTime, setDayEndTime] = useState(defaultEndTime || '19:00');
  const [breakStartTime, setBreakStartTime] = useState('14:00');
  const [breakEndTime, setBreakEndTime] = useState('15:00');
  const [useBreak, setUseBreak] = useState(false);
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(60);
  const [serviceScope, setServiceScope] = useState<'all' | 'one'>(() =>
    initialServiceId ? 'one' : 'all',
  );
  const [serviceId, setServiceId] = useState<string | null>(initialServiceId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BatchCreateSlotsResult | null>(null);

  const maxPeriod = scheduleHorizonDays ?? 30;
  const effectivePeriod = Math.min(periodDays, maxPeriod) as 7 | 14 | 30;

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setResult(null);
    setError(null);
    setPeriodDays(initialPeriodDays);
    if (initialServiceId) {
      setServiceScope('one');
      setServiceId(initialServiceId);
    }
  }, [open, initialPeriodDays, initialServiceId]);

  const startDateIso = todayIsoLocal();
  const endDateIso = addDaysIso(startDateIso, effectivePeriod - 1);

  const config = useMemo((): BatchScheduleConfig => {
    return {
      startDateIso,
      endDateIso,
      weekdays,
      dayStartTime,
      dayEndTime,
      breakStartTime: useBreak ? breakStartTime : null,
      breakEndTime: useBreak ? breakEndTime : null,
      slotDurationMinutes,
      serviceId: serviceScope === 'one' ? serviceId : null,
    };
  }, [
    breakEndTime,
    breakStartTime,
    dayEndTime,
    dayStartTime,
    endDateIso,
    serviceId,
    serviceScope,
    slotDurationMinutes,
    startDateIso,
    useBreak,
    weekdays,
  ]);

  const preview = useMemo(() => {
    const planned = planBatchSlots(config);
    const { toCreate, skippedOverlap } = filterNonOverlappingBatch(planned, existingSlots);
    return {
      total: planned.length,
      toCreate: toCreate.length,
      skippedOverlap,
      slots: toCreate,
      plannedSlots: batchSlotsToPlanned(toCreate),
    };
  }, [config, existingSlots]);

  const toggleWeekday = (day: BatchWeekday) => {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b),
    );
  };

  const resetAndClose = () => {
    setStep(0);
    setResult(null);
    setError(null);
    onClose();
  };

  const canProceed =
    step === 0
      ? weekdays.length > 0
      : step === 1
        ? dayStartTime < dayEndTime
        : step === 2
          ? preview.toCreate > 0 && (serviceScope === 'all' || Boolean(serviceId))
          : true;

  const submit = async () => {
    if (!useCabinetApi) {
      setError('Создание окон доступно только с подключённым кабинетом. Это не демо-режим записи.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await createMySlotsBatch({
        startDate: config.startDateIso,
        endDate: config.endDateIso,
        weekdays: config.weekdays,
        dayStartTime: config.dayStartTime,
        dayEndTime: config.dayEndTime,
        breakStartTime: config.breakStartTime,
        breakEndTime: config.breakEndTime,
        slotDurationMinutes: config.slotDurationMinutes,
        serviceId: config.serviceId,
      });
      if (res.created <= 0) {
        const skippedHint = summarizeBatchSkipped(res);
        setError(
          skippedHint
            ? `Не удалось создать ни одного окна. ${skippedHint}.`
            : 'Не удалось создать окна. Проверьте настройки и попробуйте ещё раз.',
        );
        return;
      }
      setResult(res);
      setStep(3);
      notifyMasterSlotsChanged();
      onCreated();
    } catch {
      setError('Не удалось создать окна. Проверьте соединение и попробуйте ещё раз.');
    } finally {
      setBusy(false);
    }
  };

  const footer =
    step === 3 ? (
      <div className="flex w-full flex-col gap-2">
        <Link
          to={`${ADMIN_SCHEDULE_PATH}?tab=calendar`}
          className={`${scheduleSheetPrimaryBtn} w-full text-center`}
        >
          Посмотреть календарь
        </Link>
        <MasterPublicPreviewLink masterId={masterId} ready className="w-full justify-center" variant="secondary" />
        <button type="button" onClick={resetAndClose} className={`${scheduleSheetSecondaryBtn} w-full`}>
          Ждать заявок
        </button>
      </div>
    ) : (
      <div className="flex w-full gap-3">
        {step > 0 ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => setStep((s) => (s - 1) as Step)}
            className={scheduleSheetSecondaryBtn}
          >
            Назад
          </button>
        ) : (
          <button type="button" disabled={busy} onClick={resetAndClose} className={scheduleSheetSecondaryBtn}>
            Отмена
          </button>
        )}
        {step < 2 ? (
          <button
            type="button"
            disabled={!canProceed}
            onClick={() => setStep((s) => (s + 1) as Step)}
            className={scheduleSheetPrimaryBtn}
          >
            Далее
          </button>
        ) : (
          <button
            type="button"
            disabled={busy || !canProceed}
            onClick={() => void submit()}
            className={scheduleSheetPrimaryBtn}
          >
            {busy ? 'Создаём…' : `Создать ${windowsCountRu(preview.toCreate)}`}
          </button>
        )}
      </div>
    );

  return (
    <AdminBottomSheet
      variant="catalog"
      open={open}
      onClose={resetAndClose}
      title={step === 3 ? 'Готово' : 'Создать окна на период'}
      headerAfter={
        step < 3 ? (
          <AdminFormSheetStepper step={step} steps={WIZARD_STEPS} variant="catalog" accent="schedule" />
        ) : null
      }
      footer={footer}
    >
      <AdminFormSheetLayout>
      {error ? <p className={scheduleSheetErrorBox}>{error}</p> : null}

      {step === 0 ? (
        <div className="space-y-3">
          <FormPanel title="Период">
            {scheduleHorizonDays != null && scheduleHorizonDays < 30 ? (
              <p className="mb-3 text-[13px] font-medium text-[#6B7280]">
                На вашем тарифе — до {scheduleHorizonDays} дней вперёд.
              </p>
            ) : null}
            <div className="space-y-2">
              {PERIOD_OPTIONS.filter((o) => o.days <= maxPeriod).map((opt) => {
                const endIso = addDaysIso(startDateIso, opt.days - 1);
                return (
                  <PeriodOptionCard
                    key={opt.days}
                    selected={effectivePeriod === opt.days}
                    label={opt.label}
                    hint={opt.hint}
                    days={opt.days}
                    dateRange={`${formatDdMmYyyy(startDateIso)} — ${formatDdMmYyyy(endIso)}`}
                    onClick={() => setPeriodDays(opt.days)}
                  />
                );
              })}
            </div>
          </FormPanel>

          <FormPanel title="Рабочие дни">
            <div className="flex gap-1.5">
              <PresetChip
                active={weekdays.join(',') === '0,1,2,3,4'}
                label="Пн–Пт"
                onClick={() => setWeekdays([0, 1, 2, 3, 4])}
              />
              <PresetChip
                active={weekdays.length === 7}
                label="Каждый день"
                onClick={() => setWeekdays([0, 1, 2, 3, 4, 5, 6])}
              />
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1">
              {WEEKDAY_SHORT.map((label, day) => (
                <WeekdayChip
                  key={label}
                  active={weekdays.includes(day as BatchWeekday)}
                  label={label}
                  onClick={() => toggleWeekday(day as BatchWeekday)}
                />
              ))}
            </div>
            {weekdays.length === 0 ? (
              <p className="mt-2 text-[12px] font-semibold text-[#DC2626]">
                Выберите хотя бы один рабочий день
              </p>
            ) : null}
          </FormPanel>

          <WizardLivePreview
            periodDays={effectivePeriod}
            startDateIso={startDateIso}
            endDateIso={endDateIso}
            weekdays={weekdays}
            dayStartTime={dayStartTime}
            dayEndTime={dayEndTime}
            slotDurationMinutes={slotDurationMinutes}
            toCreate={preview.toCreate}
            skippedOverlap={preview.skippedOverlap}
            plannedSlots={preview.plannedSlots}
          />
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-3">
          <FormPanel title="Часы приёма">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={catalogSheetLabel}>Начало дня</span>
                <input
                  type="time"
                  value={dayStartTime}
                  onChange={(e) => setDayStartTime(e.target.value)}
                  className={catalogSheetField}
                />
              </label>
              <label className="block">
                <span className={catalogSheetLabel}>Конец дня</span>
                <input
                  type="time"
                  value={dayEndTime}
                  onChange={(e) => setDayEndTime(e.target.value)}
                  className={catalogSheetField}
                />
              </label>
            </div>
            {dayStartTime >= dayEndTime ? (
              <p className="mt-2 text-[13px] font-semibold text-[#DC2626]">
                Конец должен быть позже начала
              </p>
            ) : null}
          </FormPanel>

          <FormPanel title="Перерыв">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] bg-[#EBEBEB] px-4 py-3">
              <input
                type="checkbox"
                checked={useBreak}
                onChange={(e) => setUseBreak(e.target.checked)}
                className="h-5 w-5 rounded border-[#D1D5DB] text-[#3B4CCA]"
              />
              <span className="text-[14px] font-semibold text-[#374151]">Не создавать окна в перерыве</span>
            </label>
            {useBreak ? (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <input
                  type="time"
                  value={breakStartTime}
                  onChange={(e) => setBreakStartTime(e.target.value)}
                  aria-label="Начало перерыва"
                  className={catalogSheetField}
                />
                <input
                  type="time"
                  value={breakEndTime}
                  onChange={(e) => setBreakEndTime(e.target.value)}
                  aria-label="Конец перерыва"
                  className={catalogSheetField}
                />
              </div>
            ) : null}
          </FormPanel>

          <FormPanel title="Длительность окна">
            <p className="mb-3 text-[13px] font-medium text-[#6B7280]">
              Клиент выбирает свободное окно; услуга должна помещаться по времени.
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {[30, 45, 60, 90, 120, 150, 180].map((m) => (
                <DurationChip
                  key={m}
                  active={slotDurationMinutes === m}
                  label={`${m}′`}
                  onClick={() => setSlotDurationMinutes(m)}
                />
              ))}
            </div>
          </FormPanel>

          <WizardLivePreview
            periodDays={effectivePeriod}
            startDateIso={startDateIso}
            endDateIso={endDateIso}
            weekdays={weekdays}
            dayStartTime={dayStartTime}
            dayEndTime={dayEndTime}
            slotDurationMinutes={slotDurationMinutes}
            toCreate={preview.toCreate}
            skippedOverlap={preview.skippedOverlap}
            plannedSlots={preview.plannedSlots}
          />
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-3">
          <FormPanel title="Услуги">
            <div className="space-y-2">
              <ServiceScopeCard
                selected={serviceScope === 'all'}
                title="Все активные услуги"
                description="Клиент выберет любую услугу, которая помещается по длительности."
                onClick={() => setServiceScope('all')}
              />
              <ServiceScopeCard
                selected={serviceScope === 'one'}
                title="Конкретная услуга"
                description="Окна только для одной позиции каталога."
                onClick={() => setServiceScope('one')}
              />
            </div>
            {serviceScope === 'one' ? (
              <div className="mt-3">
                <SlottySelect
                  className="w-full"
                  tone="catalog"
                  value={serviceId ?? ''}
                  onChange={(v) => setServiceId(v || null)}
                  options={[
                    { value: '', label: 'Выберите услугу' },
                    ...services.map((s) => ({
                      value: s.id,
                      label: `${s.title} · ${formatDurationRu(s.durationMin)}`,
                    })),
                  ]}
                  aria-label="Услуга"
                  sheetTitle="Услуга"
                  pickerLayer="sheet"
                />
              </div>
            ) : null}
          </FormPanel>

          <WizardLivePreview
            periodDays={effectivePeriod}
            startDateIso={startDateIso}
            endDateIso={endDateIso}
            weekdays={weekdays}
            dayStartTime={dayStartTime}
            dayEndTime={dayEndTime}
            slotDurationMinutes={slotDurationMinutes}
            toCreate={preview.toCreate}
            skippedOverlap={preview.skippedOverlap}
            plannedSlots={preview.plannedSlots}
          />
        </div>
      ) : null}

      {step === 3 && result ? (
        <div className="space-y-4 py-2 text-center">
          <SlottyImg
            src={adminFormSheetStepDoneIconSrc}
            alt=""
            className="mx-auto h-16 w-16 object-contain"
            decoding="async"
            aria-hidden
          />
          <p className="text-[18px] font-black tracking-[-0.03em] text-[#111827]">
            Клиенты теперь могут выбрать время
          </p>
          <p className="text-[14px] font-semibold text-[#111827]">{formatBatchSuccessSummary(result)}</p>
          {result.skipped > 0 ? (
            <p className="text-[13px] font-medium text-[#6B7280]">{summarizeBatchSkipped(result)}</p>
          ) : null}
          {result.skippedReasons.length > 0 && result.skipped <= 8 ? (
            <ul className="mx-auto max-w-sm space-y-1 text-left text-[12px] font-medium text-[#6B7280]">
              {result.skippedReasons.slice(0, 8).map((row) => (
                <li key={`${row.date}-${row.time}-${row.reason}`}>
                  {row.date} {row.time} — {batchSkipReasonLabel(row.reason)}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      </AdminFormSheetLayout>
    </AdminBottomSheet>
  );
}
