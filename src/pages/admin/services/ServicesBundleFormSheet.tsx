import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  HiCheck,
  HiMagnifyingGlass,
  HiPhoto,
  HiScissors,
} from 'react-icons/hi2';
import { uploadMasterPortfolioImageFile } from '../../../features/admin/api/masterCabinetApi';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import {
  calcBundleDiscount,
  generateBundleTitle,
  resolveBundleDisplayImage,
  sumServicesDuration,
  sumServicesPrice,
} from './bundleUtils';
import { servicesInput, servicesPinkBtn } from './adminServicesTheme';
import { ServicesBundleCard } from './ServicesBundleCard';
import { BUNDLE_FORM_STEPS, ServicesBundleStepper } from './ServicesBundleStepper';
import type { ManagedService } from './servicesFormat';
import { formatDurationRu, formatServicePrice, serviceImageUrl } from './servicesFormat';
import { newBundleId } from './servicesStorage';
import type { ServiceBundle, ServiceBundleImageSource, ServiceBundleStatus } from './servicesTypes';

type Props = {
  open: boolean;
  draft: MasterDraft;
  services: ManagedService[];
  initial: ServiceBundle | null;
  onClose: () => void;
  onSave: (bundle: ServiceBundle) => void;
};

function parsePriceInput(raw: string): number {
  const n = Number.parseFloat(raw.replace(',', '.').trim());
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export function ServicesBundleFormSheet({
  open,
  draft,
  services,
  initial,
  onClose,
  onSave,
}: Props) {
  const [step, setStep] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bundlePriceInput, setBundlePriceInput] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [durationManual, setDurationManual] = useState(false);
  const [titleTouched, setTitleTouched] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [imageSource, setImageSource] = useState<ServiceBundleImageSource>('placeholder');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { useCabinetApi } = useAdminMasterCabinet();
  const [visibleToClients, setVisibleToClients] = useState(true);
  const [createdAt, setCreatedAt] = useState(() => new Date().toISOString());

  const originalPrice = useMemo(
    () => sumServicesPrice(services, selectedIds),
    [selectedIds, services],
  );

  const bundlePrice = parsePriceInput(bundlePriceInput);
  const { discountAmount, discountPercent } = useMemo(
    () => calcBundleDiscount(originalPrice, bundlePrice),
    [bundlePrice, originalPrice],
  );

  const filteredServices = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) => s.title.toLowerCase().includes(q));
  }, [query, services]);

  const serviceTitleById = useMemo(() => {
    const m = new Map<string, string>();
    services.forEach((s) => m.set(s.id, s.title));
    return m;
  }, [services]);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setQuery('');
    setTitleTouched(false);
    setDurationManual(false);

    if (initial) {
      setSelectedIds(initial.serviceIds);
      setTitle(initial.title);
      setDescription(initial.description);
      setBundlePriceInput(String(initial.bundlePrice));
      setDurationMinutes(initial.durationMinutes);
      setDurationManual(true);
      setImageUrl(initial.imageUrl);
      setImageSource(initial.imageSource);
      setVisibleToClients(initial.status === 'visible');
      setCreatedAt(initial.createdAt);
      setUploadErr(null);
      setUploadingImage(false);
      return;
    }

    setSelectedIds([]);
    setTitle('');
    setDescription('');
    setBundlePriceInput('');
    setDurationMinutes(0);
    setImageUrl(undefined);
    setImageSource('placeholder');
    setUploadErr(null);
    setUploadingImage(false);
    setVisibleToClients(true);
    setCreatedAt(new Date().toISOString());
  }, [open, initial]);

  useEffect(() => {
    if (!open || titleTouched || selectedIds.length === 0) return;
    setTitle(generateBundleTitle(services, selectedIds));
  }, [open, selectedIds, services, titleTouched]);

  useEffect(() => {
    if (!open || durationManual) return;
    setDurationMinutes(sumServicesDuration(services, selectedIds));
  }, [durationManual, open, selectedIds, services]);

  useEffect(() => {
    if (!open || step !== 1 || bundlePriceInput.trim()) return;
    if (originalPrice <= 0) return;
    setBundlePriceInput(String(Math.max(1, Math.round(originalPrice * 0.88))));
  }, [bundlePriceInput, open, originalPrice, step]);

  const onBundlePhotoFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    setUploadErr(null);

    if (useCabinetApi) {
      const preview = URL.createObjectURL(file);
      setImageUrl(preview);
      setImageSource('upload');
      setUploadingImage(true);
      const prevUrl = imageUrl;
      void uploadMasterPortfolioImageFile(file)
        .then((url) => {
          URL.revokeObjectURL(preview);
          setImageUrl(url);
          setImageSource('upload');
        })
        .catch((err: unknown) => {
          URL.revokeObjectURL(preview);
          setImageUrl(prevUrl);
          if (!prevUrl) setImageSource('placeholder');
          setUploadErr(err instanceof Error ? err.message : 'Не удалось загрузить фото');
        })
        .finally(() => setUploadingImage(false));
      return;
    }

    const preview = URL.createObjectURL(file);
    setImageUrl(preview);
    setImageSource('upload');
    const reader = new FileReader();
    reader.onload = () => {
      URL.revokeObjectURL(preview);
      const result = reader.result;
      if (typeof result === 'string') {
        setImageUrl(result);
        setImageSource('upload');
      }
    };
    reader.onerror = () => {
      URL.revokeObjectURL(preview);
      setUploadErr('Не удалось прочитать файл');
    };
    reader.readAsDataURL(file);
  };

  const removeBundlePhoto = () => {
    setImageUrl(undefined);
    setImageSource('placeholder');
    setUploadErr(null);
  };

  const toggleService = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const previewBundle = useMemo((): ServiceBundle => {
    const status: ServiceBundleStatus = visibleToClients ? 'visible' : 'hidden';
    return {
      id: initial?.id ?? 'preview',
      title: title.trim() || 'Набор услуг',
      description: description.trim(),
      serviceIds: selectedIds,
      originalPrice,
      bundlePrice,
      discountPercent,
      discountAmount,
      durationMinutes,
      imageUrl,
      imageSource,
      status,
      createdAt,
      updatedAt: new Date().toISOString(),
    };
  }, [
    bundlePrice,
    createdAt,
    description,
    discountAmount,
    discountPercent,
    durationMinutes,
    imageSource,
    imageUrl,
    initial?.id,
    originalPrice,
    selectedIds,
    title,
    visibleToClients,
  ]);

  const displayImage = resolveBundleDisplayImage(previewBundle, services, draft);

  const buildBundle = (status: ServiceBundleStatus): ServiceBundle => {
    const now = new Date().toISOString();
    return {
      id: initial?.id ?? newBundleId(),
      title: title.trim() || generateBundleTitle(services, selectedIds),
      description: description.trim(),
      serviceIds: selectedIds,
      originalPrice,
      bundlePrice,
      discountPercent,
      discountAmount,
      durationMinutes: durationMinutes || sumServicesDuration(services, selectedIds),
      imageUrl,
      imageSource,
      status,
      createdAt,
      updatedAt: now,
    };
  };

  const canNext =
    (step === 0 && selectedIds.length >= 2) ||
    (step === 1 && title.trim().length > 0 && bundlePrice > 0) ||
    step === 2 ||
    step === 3;

  const handleNext = () => {
    if (step < BUNDLE_FORM_STEPS.length - 1) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  return (
    <AdminBottomSheet
      open={open}
      onClose={onClose}
      title={initial ? 'Редактирование набора' : 'Создание набора'}
    >
      <div className="pb-2">
          <ServicesBundleStepper step={step} />
          <p className="mb-4 text-[12px] font-semibold text-[#9CA3AF]">
            Шаг {step + 1} из {BUNDLE_FORM_STEPS.length}: {BUNDLE_FORM_STEPS[step]}
          </p>

          {step === 0 ? (
            <div className="space-y-3">
              <p className="text-[15px] font-bold text-[#111827]">Выберите услуги</p>
              <p className="text-[13px] text-[#6B7280]">Минимум 2 услуги для набора</p>

              <label className="relative block">
                <HiMagnifyingGlass
                  className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9CA3AF]"
                  aria-hidden
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Поиск услуги"
                  className={`${servicesInput} pl-11`}
                />
              </label>

              {selectedIds.length < 2 ? (
                <p className="rounded-[14px] bg-[#FFF1F4] px-3 py-2.5 text-[13px] font-medium text-[#F47C8C]">
                  Выберите минимум 2 услуги для набора
                </p>
              ) : null}

              <ul className="space-y-2">
                {filteredServices.map((service, serviceIndex) => {
                  const selected = selectedIds.includes(service.id);
                  const thumb = serviceImageUrl(service, draft, serviceIndex);
                  return (
                    <li key={service.id}>
                      <button
                        type="button"
                        onClick={() => toggleService(service.id)}
                        className={`flex w-full touch-pan-y gap-3 rounded-[18px] border p-3 text-left transition active:scale-[0.99] ${
                          selected
                            ? 'border-[#FDE8ED] bg-[#FFF1F4] shadow-[inset_0_0_0_1px_rgba(244,124,140,0.12)]'
                            : 'border-[#EAECEF] bg-white hover:border-[#FDE8ED]'
                        }`}
                      >
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[14px] bg-[#FFF1F4]">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt=""
                              className="h-full w-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center">
                              <HiScissors className="h-6 w-6 text-[#F47C8C]" aria-hidden />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] font-bold text-[#111827]">{service.title}</p>
                          <p className="mt-0.5 text-[13px] text-[#6B7280]">
                            {formatServicePrice(service)} · {formatDurationRu(service.durationMin)}
                          </p>
                        </div>
                        <span
                          className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                            selected
                              ? 'border-[#F47C8C] bg-[#F47C8C] text-white'
                              : 'border-[#EAECEF] bg-white'
                          }`}
                        >
                          {selected ? <HiCheck className="h-4 w-4" aria-hidden /> : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {selectedIds.length >= 2 ? (
                <div className="rounded-[18px] border border-[#FDE8ED] bg-[#FFF9FB] p-4">
                  <p className="text-[13px] font-semibold text-[#6B7280]">
                    Выбрано услуг:{' '}
                    <span className="text-[#111827]">{selectedIds.length}</span>
                  </p>
                  <p className="mt-1 text-[13px] font-semibold text-[#6B7280]">
                    Обычная цена:{' '}
                    <span className="text-[#111827]">{originalPrice} BYN</span>
                  </p>
                  <p className="mt-1 text-[13px] font-semibold text-[#6B7280]">
                    Общее время:{' '}
                    <span className="text-[#111827]">
                      {formatDurationRu(sumServicesDuration(services, selectedIds))}
                    </span>
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-3">
              <p className="text-[15px] font-bold text-[#111827]">Цена и выгода</p>

              <label className="block">
                <span className="text-[13px] font-semibold text-[#6B7280]">Название набора</span>
                <input
                  value={title}
                  onChange={(e) => {
                    setTitleTouched(true);
                    setTitle(e.target.value);
                  }}
                  placeholder="Например: Маникюр + укрепление"
                  className={`${servicesInput} mt-1.5`}
                />
              </label>

              <label className="block">
                <span className="text-[13px] font-semibold text-[#6B7280]">Описание</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Опишите, что входит в набор и почему это выгодно"
                  className={`${servicesInput} mt-1.5 resize-none`}
                />
              </label>

              <label className="block">
                <span className="text-[13px] font-semibold text-[#6B7280]">Обычная цена</span>
                <div
                  className={`${servicesInput} mt-1.5 cursor-default bg-[#FAFAFA] text-[#111827]`}
                  aria-readonly
                >
                  {originalPrice} BYN
                </div>
              </label>

              <label className="block">
                <span className="text-[13px] font-semibold text-[#6B7280]">Цена набора</span>
                <input
                  value={bundlePriceInput}
                  onChange={(e) => setBundlePriceInput(e.target.value)}
                  inputMode="decimal"
                  placeholder="70"
                  className={`${servicesInput} mt-1.5`}
                />
              </label>

              {bundlePrice > 0 && originalPrice > bundlePrice ? (
                <div className="rounded-[18px] bg-[#ECFDF5] px-4 py-3">
                  <p className="text-[14px] font-bold text-[#16A34A]">
                    Экономия {discountAmount} BYN
                  </p>
                  <p className="mt-0.5 text-[13px] font-semibold text-[#22C55E]">
                    Выгода {discountPercent}%
                  </p>
                </div>
              ) : null}

              <label className="block">
                <span className="text-[13px] font-semibold text-[#6B7280]">Длительность</span>
                <input
                  value={String(durationMinutes)}
                  onChange={(e) => {
                    setDurationManual(true);
                    setDurationMinutes(Number.parseInt(e.target.value, 10) || 0);
                  }}
                  inputMode="numeric"
                  className={`${servicesInput} mt-1.5`}
                />
                <p className="mt-1 text-[12px] text-[#9CA3AF]">
                  По умолчанию: {formatDurationRu(sumServicesDuration(services, selectedIds))}
                </p>
              </label>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-3">
              <p className="text-[15px] font-bold text-[#111827]">Фото набора</p>

              <div className="overflow-hidden rounded-[22px] bg-[#FFF1F4]">
                {displayImage ? (
                  <img src={displayImage} alt="" className="aspect-[16/10] w-full object-cover" />
                ) : (
                  <div className="flex aspect-[16/10] w-full items-center justify-center">
                    <HiPhoto className="h-12 w-12 text-[#F9A8B4]" aria-hidden />
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={onBundlePhotoFile}
                disabled={uploadingImage}
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="rounded-[14px] border border-[#EAECEF] bg-white py-2.5 text-[13px] font-bold text-[#374151] transition active:scale-[0.98] disabled:opacity-45"
                >
                  {uploadingImage ? 'Загрузка…' : displayImage ? 'Заменить' : 'Загрузить'}
                </button>
                <button
                  type="button"
                  onClick={removeBundlePhoto}
                  disabled={!displayImage || uploadingImage}
                  className="rounded-[14px] border border-[#FDE8ED] bg-[#FFF1F4] py-2.5 text-[13px] font-bold text-[#F47C8C] transition active:scale-[0.98] disabled:opacity-45"
                >
                  Удалить фото
                </button>
              </div>
              {uploadErr ? (
                <p className="text-center text-[12px] font-medium text-red-600">{uploadErr}</p>
              ) : null}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <p className="text-[15px] font-bold text-[#111827]">Превью и публикация</p>
              <ServicesBundleCard
                bundle={previewBundle}
                services={services}
                draft={draft}
                serviceTitleById={serviceTitleById}
              />

              <label className="flex items-center justify-between gap-3 rounded-[18px] border border-[#EAECEF] bg-[#FAFAFA] px-4 py-3.5">
                <span className="text-[14px] font-semibold text-[#111827]">Показывать клиентам</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={visibleToClients}
                  onClick={() => setVisibleToClients((v) => !v)}
                  className={`relative h-8 w-14 shrink-0 rounded-full transition ${
                    visibleToClients ? 'bg-[#F47C8C]' : 'bg-[#E5E7EB]'
                  }`}
                >
                  <span
                    className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${
                      visibleToClients ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </label>
            </div>
          ) : null}

        <div className="mt-5 flex flex-col gap-2 border-t border-[#F3F4F6] pt-4 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
          {step < BUNDLE_FORM_STEPS.length - 1 ? (
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
                  className="mt-2 flex min-h-12 w-full items-center justify-center rounded-[18px] border border-[#EAECEF] bg-white text-[15px] font-semibold text-[#374151]"
                >
                  Назад
                </button>
              ) : null}
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={!canNext}
                onClick={() => onSave(buildBundle(visibleToClients ? 'visible' : 'hidden'))}
                className={servicesPinkBtn}
              >
                Опубликовать
              </button>
              <button
                type="button"
                onClick={() => onSave(buildBundle('draft'))}
                className="mt-2 flex min-h-12 w-full items-center justify-center rounded-[18px] border border-[#FDE8ED] bg-[#FFF1F4] text-[15px] font-bold text-[#F47C8C] transition active:scale-[0.98]"
              >
                Сохранить черновик
              </button>
              {step > 0 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="mt-2 flex min-h-12 w-full items-center justify-center rounded-[18px] border border-[#EAECEF] bg-white text-[15px] font-semibold text-[#374151]"
                >
                  Назад
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </AdminBottomSheet>
  );
}
