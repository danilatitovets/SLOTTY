import { Link } from 'react-router-dom';
import type { MasterOnboardingService } from '../../../features/profile/lib/demoMasterStorage';
import { isUuid } from '../../../features/admin/lib/masterCabinetMapper';
import { ADMIN_SERVICES_PATH } from '../../../app/paths';
import { SlottyDatePicker } from '../../../shared/ui/SlottyDatePicker';
import { SlottySelect } from '../../../shared/ui/SlottySelect';
import type { PlannedSlot, RepeatKind, WindowTemplate } from './scheduleTypes';
import { errorBoxClass } from './scheduleTypes';
import { serviceTitleById, templateDisplayLabel, windowsCountRu } from './scheduleUtils';
import { mergeScheduleTimeSelectOptions } from './scheduleTimeSelectOptions';
import { labelClass, primaryBtnClass, secondaryBtnClass } from './scheduleUi';
import { RepeatSettings, type RepeatCount } from './RepeatSettings';
import { SchedulePreview } from './SchedulePreview';

type Props = {
  variant?: 'sheet';
  dateIso: string;
  onDateIsoChange: (v: string) => void;
  startTime: string;
  onStartTimeChange: (v: string) => void;
  endTime: string;
  onEndTimeChange: (v: string) => void;
  manualMode: boolean;
  onManualModeChange: (v: boolean) => void;
  serviceId: string;
  onServiceIdChange: (v: string) => void;
  selectedTemplateId: string | null;
  templates: WindowTemplate[];
  services: MasterOnboardingService[];
  serviceOptions: { value: string; label: string }[];
  repeatKind: RepeatKind;
  onRepeatKindChange: (k: RepeatKind) => void;
  repeatCount: RepeatCount;
  onRepeatCountChange: (n: RepeatCount) => void;
  plannedSlots: PlannedSlot[];
  creatableCount: number;
  beyondHorizon: number;
  horizonDays: number | null;
  summaryLine: string | null;
  createError: string | null;
  saving: boolean;
  onSubmit: () => void;
  onCancel?: () => void;
};

export function AddWindowForm({
  variant,
  dateIso,
  onDateIsoChange,
  startTime,
  onStartTimeChange,
  endTime,
  onEndTimeChange,
  manualMode,
  onManualModeChange,
  serviceId,
  onServiceIdChange,
  selectedTemplateId,
  templates,
  services,
  serviceOptions,
  repeatKind,
  onRepeatKindChange,
  repeatCount,
  onRepeatCountChange,
  plannedSlots,
  creatableCount,
  beyondHorizon,
  horizonDays,
  summaryLine,
  createError,
  saving,
  onSubmit,
  onCancel,
}: Props) {
  const timeOptions = mergeScheduleTimeSelectOptions(startTime, endTime);
  const inSheet = variant === 'sheet';
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) ?? null;
  const showManualFields = manualMode || !selectedTemplate;

  const submitLabel =
    creatableCount <= 1
      ? 'Добавить окно'
      : `Добавить окна (${windowsCountRu(creatableCount)})`;

  const summaryFallback = selectedTemplate
    ? templateDisplayLabel(selectedTemplate)
    : serviceTitleById(services, serviceId && isUuid(serviceId) ? serviceId : null);

  return (
    <div className="space-y-4">
      {selectedTemplate && !manualMode ? (
        <div className="rounded-[20px] bg-[#FFF5F5] px-4 py-3 ring-1 ring-[#E29595]/15">
          <p className="text-[12px] font-semibold text-neutral-500">Шаблон</p>
          <p className="mt-1 text-[15px] font-semibold text-neutral-900">
            {templateDisplayLabel(selectedTemplate)}
          </p>
        </div>
      ) : null}

      <div>
        <p className={labelClass}>Дата</p>
        <SlottyDatePicker className="mt-1.5 w-full" value={dateIso} onChange={onDateIsoChange} />
      </div>

      <div>
        <p className={labelClass}>Время начала</p>
        <SlottySelect
          className="mt-1.5 w-full"
          value={startTime}
          onChange={onStartTimeChange}
          options={timeOptions}
          aria-label="Время начала"
        />
      </div>

      {showManualFields ? (
        <>
          <div>
            <p className={labelClass}>Услуга</p>
            <SlottySelect
              className="mt-1.5 w-full"
              value={serviceId}
              onChange={onServiceIdChange}
              options={serviceOptions}
              aria-label="Услуга"
            />
          </div>
          <div>
            <p className={labelClass}>Время окончания</p>
            <SlottySelect
              className="mt-1.5 w-full"
              value={endTime}
              onChange={onEndTimeChange}
              options={timeOptions}
              aria-label="Время окончания"
            />
          </div>
        </>
      ) : (
        <div className="rounded-[20px] bg-[#F1EFEF] px-4 py-3">
          <p className="text-[12px] font-semibold text-neutral-500">Итог</p>
          <p className="mt-1 text-[15px] font-semibold text-neutral-900">
            {summaryLine ?? `${summaryFallback} · ${startTime}–${endTime}`}
          </p>
        </div>
      )}

      {selectedTemplate ? (
        <button
          type="button"
          onClick={() => onManualModeChange(!manualMode)}
          className="text-[13px] font-semibold text-[#C97B7B]"
        >
          {manualMode ? 'Вернуться к шаблону' : 'Изменить услугу и время вручную'}
        </button>
      ) : null}

      <RepeatSettings
        repeatKind={repeatKind}
        onRepeatKindChange={onRepeatKindChange}
        repeatCount={repeatCount}
        onRepeatCountChange={onRepeatCountChange}
      />

      {plannedSlots.length > 0 ? (
        <SchedulePreview
          slots={plannedSlots}
          services={services}
          creatableCount={creatableCount}
          serviceName={
            selectedTemplateId
              ? (() => {
                  const tpl = templates.find((t) => t.id === selectedTemplateId);
                  return tpl ? templateDisplayLabel(tpl) : undefined;
                })()
              : serviceTitleById(services, serviceId && isUuid(serviceId) ? serviceId : null)
          }
          beyondHorizon={beyondHorizon}
          horizonDays={horizonDays}
        />
      ) : null}

      {createError ? <p className={errorBoxClass}>{createError}</p> : null}

      {serviceOptions.length <= 1 && inSheet ? (
        <p className="text-[13px] text-neutral-500">
          <Link to={ADMIN_SERVICES_PATH} className="font-semibold text-[#C97B7B]">
            Добавьте услуги
          </Link>
          , чтобы привязать окно к услуге.
        </p>
      ) : null}

      <div className={inSheet ? 'flex flex-col gap-2 pt-1' : 'space-y-2'}>
        <button
          type="button"
          className={primaryBtnClass}
          disabled={saving || creatableCount === 0}
          onClick={onSubmit}
        >
          {saving ? 'Сохранение…' : submitLabel}
        </button>
        {inSheet && onCancel ? (
          <button type="button" className={secondaryBtnClass} disabled={saving} onClick={onCancel}>
            Отмена
          </button>
        ) : null}
      </div>
    </div>
  );
}
