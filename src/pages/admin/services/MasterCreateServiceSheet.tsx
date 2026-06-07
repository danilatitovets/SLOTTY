import { useCallback, useMemo, useState } from 'react';
import type { MasterDraft, MasterOnboardingService } from '../../../features/profile/lib/demoMasterStorage';
import { postMasterService } from '../../../features/admin/api/masterCabinetApi';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { useMasterPlanEntitlements } from '../../../features/billing/useMasterPlanEntitlements';
import { ServicesServiceSheet } from './ServicesServiceSheet';
import { useSingleFlight } from '../shared/useSingleFlight';
import {
  getServiceTitlePlaceholder,
  templatePriceTypeToApp,
  type ServiceTemplate,
} from '../../../constants/serviceTemplates';
import {
  cabinetServiceDtoToManaged,
  draftWithServices,
} from './servicesCabinetSync';
import type { ManagedService } from './servicesFormat';
import { ServicesServiceFormFields } from './ServicesServiceFormFields';

const DEFAULT_SERVICE_DURATION_MIN = 60;

function newServiceId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `svc-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeService(service: MasterOnboardingService, index: number): ManagedService {
  const item = service as ManagedService;
  return {
    ...item,
    priceType: item.priceType ?? 'fixed',
    isActive: item.isActive ?? true,
    sortOrder: item.sortOrder ?? index,
  };
}

type Props = {
  open: boolean;
  onClose: () => void;
  draft: MasterDraft;
  onPersist: (next: MasterDraft) => void;
  useCabinetApi: boolean;
  onCreated?: (serviceId: string) => void;
};

export function MasterCreateServiceSheet({
  open,
  onClose,
  draft,
  onPersist,
  useCabinetApi,
  onCreated,
}: Props) {
  const { commitDraftBaseline } = useAdminMasterCabinet();
  const { freeServiceLimitReached } = useMasterPlanEntitlements();
  const { busy, run } = useSingleFlight();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [priceType, setPriceType] = useState<'fixed' | 'from'>('fixed');
  const [durationMin, setDurationMin] = useState(String(DEFAULT_SERVICE_DURATION_MIN));
  const [desc, setDesc] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [templateHighlightId, setTemplateHighlightId] = useState<string | null>(null);

  const services = useMemo(
    () =>
      draft.services
        .map((service, index) => normalizeService(service, index))
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [draft.services],
  );

  const serviceCategoryCode = draft.primaryCategoryCode ?? draft.category;
  const serviceTitlePlaceholder = useMemo(
    () => getServiceTitlePlaceholder(serviceCategoryCode),
    [serviceCategoryCode],
  );

  const resetForm = useCallback(() => {
    setTitle('');
    setPrice('');
    setPriceType('fixed');
    setDurationMin(String(DEFAULT_SERVICE_DURATION_MIN));
    setDesc('');
    setIsActive(true);
    setFormError(null);
    setTemplateHighlightId(null);
  }, []);

  const handleClose = useCallback(() => {
    onClose();
    resetForm();
  }, [onClose, resetForm]);

  const applyServiceTemplate = useCallback((tm: ServiceTemplate) => {
    setTitle(tm.title);
    setPrice(String(tm.price));
    setPriceType(templatePriceTypeToApp(tm.priceType));
    setDesc(tm.description ?? '');
    setDurationMin(String(tm.durationMinutes));
    setTemplateHighlightId(tm.id);
    setFormError(null);
  }, []);

  const saveService = useCallback(async () => {
    if (freeServiceLimitReached) {
      setFormError('На тарифе Free можно не больше 3 услуг.');
      return;
    }

    const preparedTitle = title.trim();
    const preparedDescription = desc.trim();
    const durationNumber = Number.parseInt(durationMin, 10) || DEFAULT_SERVICE_DURATION_MIN;
    const priceNumber = Number.parseFloat(price.replace(',', '.').trim());

    if (!preparedTitle) {
      setFormError('Укажите название услуги.');
      return;
    }
    if (!Number.isFinite(priceNumber) || priceNumber < 0) {
      setFormError('Укажите цену. Можно 0.');
      return;
    }

    await run(async () => {
      const nextService: ManagedService = {
        id: newServiceId(),
        title: preparedTitle,
        durationMin: durationNumber,
        priceByn: priceNumber,
        priceType,
        isActive,
        description: preparedDescription,
        sortOrder: services.length,
      };
      const nextServices = [...services, nextService];

      if (!useCabinetApi) {
        onPersist(draftWithServices(draft, nextServices));
        handleClose();
        onCreated?.(nextService.id);
        return;
      }

      const catId = draft.primaryCategoryId;
      if (!catId) {
        setFormError('Сначала укажите категорию в профиле (основная информация).');
        return;
      }

      setFormError(null);
      try {
        const row = await postMasterService({
          categoryId: catId,
          title: preparedTitle,
          description: preparedDescription,
          durationMinutes: durationNumber,
          priceAmount: priceNumber,
          priceType,
          sortOrder: nextService.sortOrder ?? 0,
        });
        const synced = [...services, cabinetServiceDtoToManaged(row, services.length)];
        commitDraftBaseline(draftWithServices(draft, synced));
        handleClose();
        onCreated?.(row.id);
      } catch (e) {
        setFormError(e instanceof Error ? e.message : 'Не удалось сохранить');
      }
    });
  }, [
    commitDraftBaseline,
    desc,
    draft,
    durationMin,
    freeServiceLimitReached,
    handleClose,
    isActive,
    onCreated,
    onPersist,
    price,
    priceType,
    run,
    services,
    title,
    useCabinetApi,
  ]);

  return (
    <ServicesServiceSheet
      open={open}
      onClose={handleClose}
      title="Новая услуга"
      mode="create"
      busy={busy}
      saveLabel="Сохранить"
      onSave={() => void saveService()}
      titleValue={title}
      price={price}
      durationMin={durationMin}
    >
      {({ step, stepError }) => (
        <ServicesServiceFormFields
          mode="create"
          open={open}
          step={step}
          stepError={stepError}
          title={title}
          onTitleChange={setTitle}
          price={price}
          onPriceChange={setPrice}
          priceType={priceType}
          onPriceTypeChange={setPriceType}
          isActive={isActive}
          onIsActiveChange={setIsActive}
          desc={desc}
          onDescChange={setDesc}
          durationMin={durationMin}
          onDurationMinChange={setDurationMin}
          formError={formError}
          serviceCategoryCode={serviceCategoryCode}
          categoryLabel={draft.category}
          templateHighlightId={templateHighlightId}
          onApplyTemplate={applyServiceTemplate}
          onClearTemplateHighlight={() => setTemplateHighlightId(null)}
          serviceTitlePlaceholder={serviceTitlePlaceholder}
        />
      )}
    </ServicesServiceSheet>
  );
}
