import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { HiArrowRight } from 'react-icons/hi2';
import type { MasterDraft, MasterOnboardingService } from '../../../features/profile/lib/demoMasterStorage';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import { isUuid } from '../../../features/admin/lib/masterCabinetMapper';
import { ADMIN_SERVICES_PATH, getMasterAdminAppointmentsPath } from '../../../app/paths';
import { SlottyDatePicker } from '../../../shared/ui/SlottyDatePicker';
import { SlottySelect } from '../../../shared/ui/SlottySelect';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { AdminFormSheetLayout } from '../shared/AdminFormSheetLayout';
import { catalogSheetLabel, catalogSheetSecondaryBtn } from '../shared/adminCatalogSheetTheme';
import { ServiceThumbnailFallback } from '../services/ServicesServiceThumbnail';
import {
  draftCategoryWorkImageUrl,
  formatDurationRu,
  serviceCatalogThumbnailUrl,
  type ManagedService,
} from '../services/servicesFormat';
import {
  scheduleAccentTextLink,
  scheduleSheetDangerBtn,
  scheduleSheetFormPanel,
  scheduleSheetPrimaryBtn,
  scheduleSheetSecondaryBtn,
} from './adminScheduleTheme';
import { SCHEDULE_QUICK_SETUP_IMAGES } from './scheduleQuickSetupAssets';
import { ScheduleSheetNotice } from './ScheduleSheetNotice';
import { ScheduleSlotSharePanel } from './ScheduleSlotSharePanel';
import type { ScheduleWindowView, WindowTemplate } from './scheduleTypes';
import {
  addMinutesToTime,
  durationMinutesBetween,
  formatPreviewSummaryParts,
  isScheduleWindowBooked,
  serviceTitleById,
} from './scheduleUtils';
import { mergeScheduleTimeSelectOptions } from './scheduleTimeSelectOptions';

type Props = {
  open: boolean;
  window: ScheduleWindowView | null;
  masterId?: string | null;
  draft: MasterDraft;
  appointments?: DemoMasterAppointment[];
  onClose: () => void;
  services: MasterOnboardingService[];
  templates: WindowTemplate[];
  saving: boolean;
  onSave: (payload: {
    dateIso: string;
    startTime: string;
    endTime: string;
    serviceId: string | null;
  }) => void;
  onDelete: () => void;
};

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

function FormPanel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className={scheduleSheetFormPanel}>
      <p className="text-[14px] font-bold tracking-[-0.02em] text-[#111827]">{title}</p>
      {description ? (
        <p className="mt-0.5 text-[13px] font-medium text-[#6B7280]">{description}</p>
      ) : null}
      <div className={description ? 'mt-3' : 'mt-3'}>{children}</div>
    </div>
  );
}

function resolveServiceImage(
  draft: MasterDraft,
  services: MasterOnboardingService[],
  serviceId: string | null,
): string {
  if (serviceId && isUuid(serviceId)) {
    const service = services.find((s) => s.id === serviceId);
    if (service) {
      return serviceCatalogThumbnailUrl(service as ManagedService, draft);
    }
  }
  return draftCategoryWorkImageUrl(draft);
}

function EditWindowServicePreview({
  title,
  dateIso,
  startTime,
  endTime,
  imageSrc,
  clientLine,
}: {
  title: string;
  dateIso: string;
  startTime: string;
  endTime: string;
  imageSrc: string;
  clientLine?: string | null;
}) {
  const { dateLine, timeLine } = formatPreviewSummaryParts(dateIso, startTime, endTime);

  return (
    <div className="flex overflow-hidden rounded-[12px] bg-[#F5F5F5]">
      <span className="relative h-[5.75rem] w-[5.75rem] shrink-0 overflow-hidden sm:h-[6.25rem] sm:w-[6.25rem]">
        <img src={imageSrc} alt="" className="h-full w-full object-cover object-center" decoding="async" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col justify-center px-3.5 py-3">
        <p className="line-clamp-2 text-[15px] font-bold leading-snug tracking-[-0.02em] text-[#111827]">
          {title}
        </p>
        <p className="mt-1 text-[13px] font-semibold text-[#6B7280]">
          {dateLine} · {timeLine}
        </p>
        {clientLine ? (
          <p className="mt-2 line-clamp-2 text-[13px] font-bold text-[#111827]">{clientLine}</p>
        ) : null}
      </div>
    </div>
  );
}

function TemplateChip({
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
      onClick={onClick}
      className={`relative overflow-hidden rounded-[10px] px-3 py-2.5 text-[12px] font-semibold transition active:scale-[0.97] sm:text-[13px] ${
        active ? 'text-[#111827] ring-2 ring-[#3B4CCA]/25' : 'bg-[#EBEBEB] text-[#111827] hover:bg-[#E4E4E4]'
      }`}
    >
      {active ? <SchedulePhotoActiveLayers /> : null}
      <span className="relative z-10">{label}</span>
    </button>
  );
}

export function EditWindowModal({
  open,
  window: w,
  masterId,
  draft,
  appointments = [],
  onClose,
  services,
  templates,
  saving,
  onSave,
  onDelete,
}: Props) {
  const [dateIso, setDateIso] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [serviceId, setServiceId] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  useEffect(() => {
    if (!w) return;
    setDateIso(w.dateIso);
    setStartTime(w.startTime);
    setEndTime(w.endTime);
    setServiceId(w.serviceId ?? '');
    setConfirmDelete(false);
    setActiveTemplateId(null);
  }, [w]);

  const serviceOptions = useMemo(
    () => [
      { value: '', label: 'Любая услуга' },
      ...services.filter((s) => isUuid(s.id)).map((s) => ({ value: s.id, label: s.title })),
    ],
    [services],
  );

  const mergedTimeOptions = useMemo(
    () => mergeScheduleTimeSelectOptions(startTime, endTime),
    [endTime, startTime],
  );

  if (!w) return null;

  const booked = isScheduleWindowBooked(w, appointments);
  const locked = booked;
  const effectiveServiceId = serviceId.trim() || w.serviceId;
  const previewTitle =
    effectiveServiceId && isUuid(effectiveServiceId)
      ? serviceTitleById(services, effectiveServiceId)
      : w.serviceName || 'Любая услуга';
  const previewImageSrc = resolveServiceImage(draft, services, effectiveServiceId);
  const clientLine =
    booked && w.clientName
      ? `${w.clientName}${w.clientPhone ? ` · ${w.clientPhone}` : ''}`
      : null;

  const applyTemplate = (tplId: string) => {
    if (locked) return;
    const tpl = templates.find((t) => t.id === tplId);
    if (!tpl) return;
    setActiveTemplateId(tplId);
    setServiceId(tpl.serviceId);
    setEndTime(addMinutesToTime(startTime, tpl.durationMinutes));
  };

  const handleSave = () => {
    if (locked) return;
    const sid = serviceId.trim() && isUuid(serviceId.trim()) ? serviceId.trim() : null;
    onSave({ dateIso, startTime, endTime, serviceId: sid });
  };

  const statusLabel =
    booked ? 'Записан клиент' : w.status === 'free' ? 'Свободно' : 'Недоступно';
  const shareTitle = `${previewTitle} · ${formatPreviewSummaryParts(
    dateIso || w.dateIso,
    startTime || w.startTime,
    endTime || w.endTime,
  ).dateLine}`;

  const footer = locked ? (
    <button type="button" className={catalogSheetSecondaryBtn} onClick={onClose}>
      Закрыть
    </button>
  ) : confirmDelete ? (
    <div className="flex w-full gap-3">
      <button type="button" className={scheduleSheetSecondaryBtn} onClick={() => setConfirmDelete(false)}>
        Отмена
      </button>
      <button
        type="button"
        className={`${scheduleSheetDangerBtn} min-w-0 flex-1 !w-auto`}
        disabled={saving}
        onClick={onDelete}
      >
        {saving ? 'Удаление…' : 'Подтвердить удаление'}
      </button>
    </div>
  ) : (
    <div className="flex w-full gap-3">
      <button
        type="button"
        className={`${scheduleSheetDangerBtn} min-w-0 flex-1 !w-auto`}
        disabled={locked}
        onClick={() => setConfirmDelete(true)}
      >
        Удалить окно
      </button>
      <button type="button" className={scheduleSheetPrimaryBtn} disabled={saving} onClick={handleSave}>
        {saving ? 'Сохранение…' : 'Сохранить изменения'}
      </button>
    </div>
  );

  return (
    <AdminBottomSheet
      variant="catalog"
      open={open}
      onClose={onClose}
      title="Окно записи"
      subtitle="Время, услуга и статус слота"
      badge={statusLabel}
      accent="schedule"
      footer={footer}
    >
      <AdminFormSheetLayout>
        <FormPanel title="Текущее окно">
          {previewImageSrc ? (
            <EditWindowServicePreview
              title={previewTitle}
              dateIso={dateIso || w.dateIso}
              startTime={startTime || w.startTime}
              endTime={endTime || w.endTime}
              imageSrc={previewImageSrc}
              clientLine={clientLine}
            />
          ) : (
            <div className="flex gap-3 overflow-hidden rounded-[12px] bg-[#F5F5F5]">
              <ServiceThumbnailFallback sizeClass="h-[5.75rem] w-[5.75rem] sm:h-[6.25rem] sm:w-[6.25rem]" edge="flush-left" />
              <div className="flex min-w-0 flex-1 flex-col justify-center px-3.5 py-3">
                <p className="text-[15px] font-bold text-[#111827]">{previewTitle}</p>
              </div>
            </div>
          )}
        </FormPanel>

        {locked ? (
          <ScheduleSheetNotice
            variant="warning"
            action={
              <Link
                to={getMasterAdminAppointmentsPath({ tab: 'requests' })}
                onClick={onClose}
                className={`inline-flex items-center gap-1 ${scheduleAccentTextLink}`}
              >
                Перейти в заявки
                <HiArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            }
          >
            На это окно уже есть запись. Изменить или удалить окно нельзя — сначала отмените запись в разделе
            «Заявки».
          </ScheduleSheetNotice>
        ) : null}

        <div className={locked ? 'pointer-events-none space-y-3 opacity-45' : 'space-y-3'}>
          <FormPanel title="Параметры">
            <div className="space-y-3">
              <div>
                <p className={catalogSheetLabel}>Дата</p>
                <SlottyDatePicker
                  className="mt-1.5 w-full"
                  tone="cabinet"
                  value={dateIso}
                  onChange={setDateIso}
                  sheetTitle="День записи"
                  sheetSubtitle="Дата слота"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className={catalogSheetLabel}>С</p>
                  <SlottySelect
                    className="mt-1.5 w-full"
                    tone="catalog"
                    value={startTime}
                    onChange={(v) => {
                      setStartTime(v);
                      const dur = durationMinutesBetween(startTime, endTime);
                      if (dur > 0) setEndTime(addMinutesToTime(v, dur));
                    }}
                    options={mergedTimeOptions}
                    aria-label="Время начала"
                    sheetTitle="Время начала"
                    sheetSubtitle="Во сколько начинается приём"
                    pickerLayer="sheet"
                  />
                </div>
                <div>
                  <p className={catalogSheetLabel}>По</p>
                  <SlottySelect
                    className="mt-1.5 w-full"
                    tone="catalog"
                    value={endTime}
                    onChange={setEndTime}
                    options={mergedTimeOptions}
                    aria-label="Время окончания"
                    sheetTitle="Время окончания"
                    sheetSubtitle="Когда заканчивается приём"
                    pickerLayer="sheet"
                  />
                </div>
              </div>
              <div>
                <p className={catalogSheetLabel}>Услуга</p>
                <SlottySelect
                  className="mt-1.5 w-full"
                  tone="catalog"
                  value={serviceId}
                  onChange={(v) => {
                    setServiceId(v);
                    setActiveTemplateId(null);
                  }}
                  options={serviceOptions}
                  aria-label="Услуга"
                  sheetTitle="Услуга"
                  pickerLayer="sheet"
                />
              </div>
            </div>
          </FormPanel>

          {!locked && w.status === 'free' ? (
            <ScheduleSlotSharePanel
              masterId={masterId ?? draft.masterId}
              window={w}
              services={services}
              shareTitle={shareTitle}
            />
          ) : null}

          {templates.length > 0 && !locked ? (
            <FormPanel title="Быстро из шаблона" description="Подставить длительность и услугу">
              <div className="flex flex-wrap gap-2">
                {templates.map((t) => (
                  <TemplateChip
                    key={t.id}
                    active={activeTemplateId === t.id}
                    label={`${t.serviceName} · ${formatDurationRu(t.durationMinutes)}`}
                    onClick={() => applyTemplate(t.id)}
                  />
                ))}
              </div>
            </FormPanel>
          ) : null}
        </div>

        {services.length === 0 ? (
          <p className="text-center text-[13px] text-[#6B7280]">
            <Link to={ADMIN_SERVICES_PATH} className={`font-semibold ${scheduleAccentTextLink}`}>
              Добавьте услуги
            </Link>
          </p>
        ) : null}
      </AdminFormSheetLayout>
    </AdminBottomSheet>
  );
}
