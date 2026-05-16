import { useEffect, useMemo, useState } from 'react';
import { HiCheck } from 'react-icons/hi2';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { PromotionBannerCard } from './PromotionBannerCard';
import {
  PROMOTION_TEMPLATES,
  addDaysIso,
  buildDiscountLabel,
  getPromotionTemplate,
  parseDiscountLabel,
} from './promotionTemplates';
import type { PromotionTemplateId } from './promotionTemplates';
import { servicesInput, servicesPinkBtn } from './adminServicesTheme';
import type { ManagedService } from './servicesFormat';
import { derivePromotionStatus, formatDurationRu, formatServicePrice, isoDateLocal } from './servicesFormat';
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
      setDiscountType(initial.discountType ?? parsed.type);
      setDiscountValue(
        Number.isFinite(initial.discountValue) ? initial.discountValue : parsed.value,
      );
      setTitle(initial.title);
      setDescription(initial.description);
      return;
    }

    const first = PROMOTION_TEMPLATES[0];
    setTemplateId(first.id);
    setServiceId(services[0]?.id ?? '');
    setStartsAt(today);
    setEndsAt(defaultEnd);
    setDiscountType(first.defaultDiscountType);
    setDiscountValue(first.defaultDiscountValue);
    setTitle(first.title);
    setDescription(first.description);
  }, [open, initial, services, today, defaultEnd]);

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

  return (
    <AdminBottomSheet
      open={open}
      onClose={onClose}
      title={initial ? 'Редактирование акции' : 'Создание акции'}
    >
      <div className="max-h-[min(78dvh,680px)] overflow-y-auto overscroll-contain pb-2 [-webkit-overflow-scrolling:touch]">
        <div className="mb-4 flex gap-1">
          {STEPS.map((label, index) => (
            <div
              key={label}
              className={`h-1 flex-1 rounded-full transition ${
                index <= step ? 'bg-[#F47C8C]' : 'bg-[#EAECEF]'
              }`}
              title={label}
            />
          ))}
        </div>
        <p className="mb-4 text-[12px] font-semibold text-[#9CA3AF]">
          Шаг {step + 1} из {STEPS.length}: {STEPS[step]}
        </p>

        {step === 0 ? (
          <div className="space-y-3">
            <p className="text-[13px] font-semibold text-[#6B7280]">Выберите шаблон акции</p>
            <div className="grid grid-cols-2 gap-2.5">
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
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-3">
            <label className="block">
              <span className="text-[13px] font-semibold text-[#6B7280]">Услуга</span>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className={`${servicesInput} mt-1.5`}
              >
                <option value="">Выберите услугу</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </label>
            {selectedService ? (
              <div className="rounded-[18px] border border-[#EAECEF] bg-[#FAFAFA] p-4">
                <p className="text-[14px] font-bold text-[#111827]">{selectedService.title}</p>
                <p className="mt-1 text-[13px] text-[#6B7280]">
                  {formatDurationRu(selectedService.durationMin)}
                </p>
                <div className="mt-3 flex flex-wrap items-baseline gap-2">
                  <span className="text-[13px] text-[#9CA3AF] line-through">
                    {formatServicePrice(selectedService)}
                  </span>
                  {discountedPrice(selectedService, discountType, discountValue) != null ? (
                    <span className="text-[16px] font-bold text-[#F47C8C]">
                      {selectedService.priceType === 'from' ? 'от ' : ''}
                      {discountedPrice(selectedService, discountType, discountValue)} BYN
                    </span>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="rounded-[16px] bg-[#FFF1F4] px-4 py-3 text-[13px] font-medium text-[#F47C8C]">
                Сначала добавьте услуги в каталоге
              </p>
            )}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-3">
            <p className="text-[13px] font-semibold text-[#6B7280]">Срок действия</p>
            <div className="flex flex-wrap gap-2">
              {PERIOD_PRESETS.map((p) => (
                <button
                  key={p.days}
                  type="button"
                  onClick={() => applyPeriod(p.days)}
                  className="rounded-full border border-[#EAECEF] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#374151] transition active:scale-[0.98] hover:border-[#FDE8ED] hover:bg-[#FFF1F4]"
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[12px] font-semibold text-[#6B7280]">Дата начала</span>
                <input
                  type="date"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className={`${servicesInput} mt-1`}
                />
              </label>
              <label className="block">
                <span className="text-[12px] font-semibold text-[#6B7280]">Дата окончания</span>
                <input
                  type="date"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className={`${servicesInput} mt-1`}
                />
              </label>
            </div>
            {startsAt > endsAt ? (
              <p className="text-[13px] font-semibold text-[#EF4444]">
                Дата окончания должна быть не раньше начала
              </p>
            ) : null}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-3">
            <p className="text-[13px] font-semibold text-[#6B7280]">Скидка или бонус</p>
            <div className="flex gap-2">
              {(
                [
                  { id: 'percent' as const, label: '%' },
                  { id: 'money' as const, label: 'BYN' },
                  { id: 'gift' as const, label: 'Подарок' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setDiscountType(opt.id);
                    if (opt.id === 'gift') setDiscountValue(0);
                  }}
                  className={`flex-1 rounded-[14px] py-2.5 text-[14px] font-bold transition ${
                    discountType === opt.id
                      ? 'bg-[#FFF1F4] text-[#F47C8C] ring-1 ring-[#FDE8ED]'
                      : 'bg-[#F3F4F6] text-[#6B7280]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {discountType !== 'gift' ? (
              <label className="block">
                <span className="text-[13px] font-semibold text-[#6B7280]">
                  {discountType === 'percent' ? 'Размер скидки, %' : 'Скидка, BYN'}
                </span>
                <input
                  value={String(discountValue)}
                  onChange={(e) =>
                    setDiscountValue(Number.parseFloat(e.target.value.replace(',', '.')) || 0)
                  }
                  inputMode="decimal"
                  className={`${servicesInput} mt-1.5`}
                />
              </label>
            ) : null}
            <div className="flex items-center justify-center py-2">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF1F4] text-[14px] font-bold text-[#F47C8C] ring-2 ring-[#FDE8ED]">
                {discountLabel}
              </span>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-3">
            <p className="text-[13px] font-semibold text-[#6B7280]">Превью для клиентов</p>
            <PromotionBannerCard promo={previewPromo} />
            <label className="block">
              <span className="text-[12px] font-semibold text-[#6B7280]">Заголовок (необязательно)</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`${servicesInput} mt-1`}
              />
            </label>
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-2 border-t border-[#F3F4F6] pt-4">
          {step < STEPS.length - 1 ? (
            <>
              <button
                type="button"
                disabled={!canNext}
                onClick={handleNext}
                className={servicesPinkBtn}
              >
                Далее
              </button>
              {step > 0 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex min-h-12 w-full items-center justify-center rounded-[18px] border border-[#EAECEF] bg-white text-[15px] font-semibold text-[#374151]"
                >
                  Назад
                </button>
              ) : null}
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={!serviceId || startsAt > endsAt}
                onClick={() => onSave(buildPromo(true), true)}
                className={servicesPinkBtn}
              >
                Опубликовать
              </button>
              <button
                type="button"
                onClick={() => onSave(buildPromo(false), false)}
                className="flex min-h-12 w-full items-center justify-center rounded-[18px] border border-[#FDE8ED] bg-[#FFF1F4] text-[15px] font-bold text-[#F47C8C] transition active:scale-[0.98]"
              >
                Сохранить черновик
              </button>
              {step > 0 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex min-h-12 w-full items-center justify-center rounded-[18px] border border-[#EAECEF] bg-white text-[15px] font-semibold text-[#374151]"
                >
                  Назад
                </button>
              ) : null}
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-11 w-full items-center justify-center text-[14px] font-semibold text-[#6B7280]"
          >
            Отмена
          </button>
        </div>
      </div>
    </AdminBottomSheet>
  );
}
