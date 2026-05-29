import { useEffect, useMemo, useState } from 'react';
import { HiCheck } from 'react-icons/hi2';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import {
  AdminFormSheetLayout,
  AdminFormSheetStepper,
  AdminFormSheetMetrics,
  AdminFormSheetSection,
} from '../shared/AdminFormSheetLayout';
import {
  catalogSheetField,
  catalogSheetGhostBtn,
  catalogSheetPrimaryBtn,
  catalogSheetSecondaryBtn,
} from '../shared/adminCatalogSheetTheme';
import { sheetChipClass, sheetLabelClass, sheetSegmentClass } from '../profile/adminProfileCabinetTheme';
import { EMPTY_PROMO_PRICE } from '../../../shared/lib/emptyDisplayText';
import { PromotionBannerCard } from './PromotionBannerCard';
import {
  PROMOTION_TEMPLATES,
  addDaysIso,
  buildDiscountLabel,
  getPromotionTemplate,
  parseDiscountLabel,
} from './promotionTemplates';
import type { PromotionTemplateId } from './promotionTemplates';
import { SlottyDatePicker } from '../../../shared/ui/SlottyDatePicker';
import { SlottySelect } from '../../../shared/ui/SlottySelect';
import type { ManagedService } from './servicesFormat';
import { derivePromotionStatus, formatServicePrice, isoDateLocal } from './servicesFormat';
import { newPromotionId } from './servicesStorage';
import type { ServicePromotion, ServicePromotionDiscountType } from './servicesTypes';

const STEPS = [
  'Шаблон',
  'Услуга',
  'Срок',
  'Скидка',
  'Превью',
] as const;

const PERIOD_PRESETS = [
  { days: 3, label: '3 дня' },
  { days: 7, label: '7 дней' },
  { days: 14, label: '14 дней' },
  { days: 30, label: '30 дней' },
] as const;

type Props = {
  open: boolean;
  services: ManagedService[];
  initial: ServicePromotion | null;
  onClose: () => void;
  onSave: (promo: ServicePromotion, publish: boolean) => void;
};

function discountedPrice(service: ManagedService, type: ServicePromotionDiscountType, value: number): number | null {
  if (!Number.isFinite(service.priceByn)) return null;
  if (type === 'gift') return service.priceByn;
  if (type === 'money') return Math.max(0, service.priceByn - value);
  return Math.max(0, Math.round(service.priceByn * (1 - value / 100)));
}

export function ServicesPromotionFormSheet({ open, services, initial, onClose, onSave }: Props) {
  const today = isoDateLocal(new Date());
  const defaultEnd = addDaysIso(today, 7);

  const [step, setStep] = useState(0);
  const [templateId, setTemplateId] = useState<PromotionTemplateId>('first_visit');
  const [serviceId, setServiceId] = useState('');
  const [startsAt, setStartsAt] = useState(today);
  const [endsAt, setEndsAt] = useState(defaultEnd);
  const [discountType, setDiscountType] = useState<ServicePromotionDiscountType>('percent');
  const [discountValue, setDiscountValue] = useState(15);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const template = getPromotionTemplate(templateId)!;
  const selectedService = services.find((s) => s.id === serviceId);

  const serviceOptions = useMemo(
    () => [
      { value: '', label: 'Выберите услугу' },
      ...services.map((s) => ({ value: s.id, label: s.title })),
    ],
    [services],
  );

  useEffect(() => {
    if (!open) return;

    setStep(0);
    if (initial) {
      const tpl = getPromotionTemplate(
        initial.template as PromotionTemplateId,
      )?.id ?? 'first_visit';
      const parsed = parseDiscountLabel(initial.discountLabel);
      setTemplateId(tpl);
      setServiceId(initial.serviceId || services[0]?.id || '');
      setStartsAt(initial.startsAt);
      setEndsAt(initial.endsAt);
      const loadedType = initial.discountType ?? parsed.type;
      setDiscountType(loadedType === 'gift' ? 'percent' : loadedType);
      setDiscountValue(
        Number.isFinite(initial.discountValue) ? initial.discountValue : parsed.value,
      );
      setTitle(initial.title);
      setDescription(initial.description);
      return;
    }

    const first = PROMOTION_TEMPLATES[0];
    setTemplateId(first.id);
    setServiceId('');
    setStartsAt(today);
    setEndsAt(defaultEnd);
    setDiscountType(first.defaultDiscountType);
    setDiscountValue(first.defaultDiscountValue);
    setTitle(first.title);
    setDescription(first.description);
  }, [open, initial?.id]);

  useEffect(() => {
    if (!open || initial) return;
    const tpl = getPromotionTemplate(templateId)!;
    setTitle(tpl.title);
    setDescription(tpl.description);
    setDiscountType(tpl.defaultDiscountType);
    setDiscountValue(tpl.defaultDiscountValue);
  }, [templateId, open, initial]);

  const discountLabel = useMemo(
    () => buildDiscountLabel(discountType, discountValue),
    [discountType, discountValue],
  );

  const previewPromo = useMemo((): ServicePromotion & { status: ReturnType<typeof derivePromotionStatus> } => {
    const draftStatus = derivePromotionStatus({
      status: 'active',
      startsAt,
      endsAt,
    });
    return {
      id: initial?.id ?? 'preview',
      template: templateId,
      title: title.trim() || template.title,
      description: description.trim() || template.description,
      serviceId,
      serviceTitle: selectedService?.title ?? '',
      discountType,
      discountValue,
      discountLabel,
      startsAt,
      endsAt,
      status: draftStatus,
      backgroundImage: template.backgroundImage,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    };
  }, [
    description,
    discountLabel,
    discountType,
    discountValue,
    endsAt,
    initial,
    selectedService,
    serviceId,
    startsAt,
    template,
    templateId,
    title,
  ]);

  const applyPeriod = (days: number) => {
    setStartsAt(today);
    setEndsAt(addDaysIso(today, days));
  };

  const buildPromo = (publish: boolean): ServicePromotion => {
    const base: ServicePromotion = {
      id: initial?.id ?? newPromotionId(),
      template: templateId,
      title: title.trim() || template.title,
      description: description.trim() || template.description,
      serviceId,
      serviceTitle: selectedService?.title ?? '',
      discountType,
      discountValue,
      discountLabel,
      startsAt,
      endsAt,
      status: publish ? 'active' : 'draft',
      backgroundImage: template.backgroundImage,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    };
    if (publish) {
      return {
        ...base,
        status: derivePromotionStatus({ status: 'active', startsAt, endsAt }),
      };
    }
    return { ...base, status: 'draft' };
  };

  const canNext =
    step === 0 ||
    (step === 1 && Boolean(serviceId)) ||
    (step === 2 && startsAt && endsAt && startsAt <= endsAt) ||
    step === 3 ||
    step === 4;

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const footer = (
    <div className="flex flex-col gap-2">
      {step < STEPS.length - 1 ? (
        <div className="flex w-full gap-3">
          {step > 0 ? (
            <button type="button" onClick={handleBack} className={catalogSheetSecondaryBtn}>
              Назад
            </button>
          ) : null}
          <button
            type="button"
            disabled={!canNext}
            onClick={handleNext}
            className={catalogSheetPrimaryBtn}
          >
            Далее
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            disabled={!serviceId || startsAt > endsAt}
            onClick={() => onSave(buildPromo(true), true)}
            className={catalogSheetPrimaryBtn}
          >
            Опубликовать
          </button>
          <button
            type="button"
            onClick={() => onSave(buildPromo(false), false)}
            className={catalogSheetSecondaryBtn}
          >
            Сохранить черновик
          </button>
          {step > 0 ? (
            <button type="button" onClick={handleBack} className={catalogSheetGhostBtn}>
              Назад
            </button>
          ) : null}
        </>
      )}
    </div>
  );

  return (
    <AdminBottomSheet
      variant="catalog"
      open={open}
      onClose={onClose}
      title={initial ? 'Редактирование акции' : 'Создание акции'}
      headerAfter={<AdminFormSheetStepper step={step} steps={STEPS} variant="catalog" />}
      footer={footer}
    >
      <AdminFormSheetLayout>
        {step === 0 ? (
          <AdminFormSheetSection title="Шаблон акции" variant="catalog">
            <div className="grid grid-cols-2 gap-2.5 lg:gap-4">
              {PROMOTION_TEMPLATES.map((tpl) => {
                const selected = templateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setTemplateId(tpl.id)}
                    className={`relative overflow-hidden rounded-[18px] border-2 text-left transition active:scale-[0.98] ${
                      selected
                        ? 'border-[#F47C8C] shadow-[0_0_0_3px_rgba(244,124,140,0.15)]'
                        : 'border-transparent'
                    }`}
                  >
                    <div className="relative aspect-[4/3] w-full">
                      <img
                        src={tpl.backgroundImage}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/75 to-transparent" />
                      {selected ? (
                        <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#F47C8C] text-white shadow-md">
                          <HiCheck className="h-4 w-4" aria-hidden />
                        </span>
                      ) : null}
                      <span className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-bold text-[#F47C8C]">
                        {tpl.defaultDiscountLabel}
                      </span>
                    </div>
                    <div className="bg-white p-2.5">
                      <p className="text-[12px] font-bold leading-snug text-[#111827]">{tpl.title}</p>
                      <p className="mt-0.5 text-[10px] font-medium text-[#9CA3AF]">{tpl.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </AdminFormSheetSection>
        ) : null}

        {step === 1 ? (
          <AdminFormSheetSection title="Услуга" variant="catalog">
            <label className="block">
              <span className={sheetLabelClass}>Услуга</span>
              <SlottySelect
                className="mt-1.5 w-full"
                tone="admin"
                value={serviceId}
                disabled={services.length === 0}
                options={serviceOptions}
                placeholder="Выберите услугу"
                onChange={setServiceId}
              />
            </label>
            {selectedService ? (
              <div className="mt-4 space-y-4">
                <p className="text-[15px] font-black tracking-[-0.03em] text-[#111827] lg:text-[17px]">
                  {selectedService.title}
                </p>
                <AdminFormSheetMetrics
                  variant="catalog"
                  items={[
                    { label: 'Было', value: formatServicePrice(selectedService) },
                    {
                      label: 'С акцией',
                      value:
                        discountedPrice(selectedService, discountType, discountValue) != null ? (
                          <>
                            {selectedService.priceType === 'from' ? 'от ' : ''}
                            {discountedPrice(selectedService, discountType, discountValue)} BYN
                          </>
                        ) : (
                          EMPTY_PROMO_PRICE
                        ),
                    },
                  ]}
                />
              </div>
            ) : services.length === 0 ? (
              <p className="rounded-[10px] bg-[#EBEBEB] px-4 py-3 text-[13px] font-medium text-[#6B7280]">
                Сначала добавьте услуги в каталоге
              </p>
            ) : null}
          </AdminFormSheetSection>
        ) : null}

        {step === 2 ? (
          <AdminFormSheetSection title="Срок действия" variant="catalog">
            <div className="flex flex-wrap gap-2">
              {PERIOD_PRESETS.map((p) => {
                const ends = addDaysIso(startsAt, p.days);
                const selected = endsAt === ends;
                return (
                  <button
                    key={p.days}
                    type="button"
                    onClick={() => applyPeriod(p.days)}
                    className={sheetChipClass(selected)}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[12px] font-semibold text-[#6B7280]">Дата начала</span>
                <SlottyDatePicker
                  className="mt-1 w-full"
                  tone="admin"
                  allowClear={false}
                  value={startsAt}
                  min={today}
                  onChange={setStartsAt}
                />
              </label>
              <label className="block">
                <span className="text-[12px] font-semibold text-[#6B7280]">Дата окончания</span>
                <SlottyDatePicker
                  className="mt-1 w-full"
                  tone="admin"
                  allowClear={false}
                  value={endsAt}
                  min={startsAt || today}
                  onChange={setEndsAt}
                />
              </label>
            </div>
            {startsAt > endsAt ? (
              <p className="text-[13px] font-semibold text-[#EF4444]">
                Дата окончания должна быть не раньше начала
              </p>
            ) : null}
          </AdminFormSheetSection>
        ) : null}

        {step === 3 ? (
          <AdminFormSheetSection title="Скидка">
            <div className="grid grid-cols-2 gap-2 rounded-[10px] bg-[#F5F5F5] p-1.5">
              {(
                [
                  { id: 'percent' as const, label: '%' },
                  { id: 'money' as const, label: 'BYN' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDiscountType(opt.id)}
                  className={sheetSegmentClass(discountType === opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="block">
              <span className={sheetLabelClass}>
                {discountType === 'percent' ? 'Размер скидки, %' : 'Скидка, BYN'}
              </span>
              <div
                className={`${catalogSheetField} mt-1.5 cursor-default bg-[#FAFAFA] text-[#111827]`}
                aria-readonly
              >
                {discountType === 'percent'
                  ? `${Math.round(discountValue)}%`
                  : `${discountValue} BYN`}
              </div>
            </div>
            <div className="flex justify-center py-2">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#EBEBEB] text-[18px] font-bold text-[#F47C8C] lg:h-28 lg:w-28 lg:text-[20px]">
                {discountLabel}
              </div>
            </div>
          </AdminFormSheetSection>
        ) : null}

        {step === 4 ? (
          <AdminFormSheetSection title="Превью для клиентов" variant="catalog">
            <PromotionBannerCard promo={previewPromo} />
            <label className="mt-4 block">
              <span className="text-[12px] font-semibold text-[#6B7280]">Заголовок</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`${catalogSheetField} mt-1`}
              />
            </label>
          </AdminFormSheetSection>
        ) : null}
      </AdminFormSheetLayout>
    </AdminBottomSheet>
  );
}
