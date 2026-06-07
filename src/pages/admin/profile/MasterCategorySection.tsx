import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import {
  fetchServiceCategories,
  type ServiceCategoryDto,
} from '../../../features/master-onboarding/api/becomeMasterApi';
import { postCategoryChangeRequest } from '../../../features/admin/api/categoryChangeApi';
import type {
  CategoryChangePolicyDto,
  CategoryChangeRequestDto,
} from '../../../features/admin/lib/categoryChangePolicy';
import { computeLocalCategoryChangePolicy } from '../../../features/admin/lib/categoryChangePolicy';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import type { MasterPublicationStatus } from '../../../features/admin/lib/profileCompletion';
import type { MasterProfilePatch } from '../AdminMasterCabinetContext';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';

const CATEGORY_IMAGES: Record<string, string> = {
  manicure: '/photos/work/manicure.webp',
  barbers: '/photos/work/barbers.webp',
  'brows-lashes': '/photos/work/brows_lashes.webp',
  massage: '/photos/work/massage.webp',
  fitness: '/photos/work/fitness.webp',
  tattoo: '/photos/work/tattoo.webp',
};

function SoftWarning({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-[#FFFBEB] px-4 py-3 ring-1 ring-[#FDE68A]/60">
      <p className="text-[14px] font-semibold text-[#92400E]">{title}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-[#A16207]">{text}</p>
    </div>
  );
}

export type MasterCategorySectionHandle = {
  open: () => void;
};

type Props = {
  draft: MasterDraft;
  publicationStatus: MasterPublicationStatus | null;
  policy: CategoryChangePolicyDto | null;
  useCabinetApi: boolean;
  onPatchCategory: (patch: MasterProfilePatch) => Promise<void>;
  onRefresh: () => Promise<void>;
};

export const MasterCategorySection = forwardRef<MasterCategorySectionHandle, Props>(function MasterCategorySection(
  {
    draft,
    publicationStatus,
    policy: policyProp,
    useCabinetApi,
    onPatchCategory,
    onRefresh,
  },
  ref,
) {
  const [categories, setCategories] = useState<ServiceCategoryDto[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [confirmEmptyPublishedOpen, setConfirmEmptyPublishedOpen] = useState(false);
  const [draftChangeConfirmOpen, setDraftChangeConfirmOpen] = useState(false);
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(null);
  const [pickedCategoryId, setPickedCategoryId] = useState('');
  const [reason, setReason] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [activeRequest, setActiveRequest] = useState<CategoryChangeRequestDto | null>(
    policyProp?.activeRequest ?? null,
  );

  useEffect(() => {
    let cancelled = false;
    void fetchServiceCategories()
      .then((list) => {
        if (!cancelled) setCategories(list);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setActiveRequest(policyProp?.activeRequest ?? null);
  }, [policyProp?.activeRequest]);

  const policy = useMemo(() => {
    if (policyProp) return policyProp;
    return computeLocalCategoryChangePolicy({
      publicationStatus,
      servicesCount: draft.services?.length ?? 0,
      reviewsCount: 0,
      hasActiveRequest: Boolean(activeRequest),
    });
  }, [policyProp, publicationStatus, draft.services?.length, activeRequest]);

  const currentCategoryName = draft.category?.trim() || 'Не указана';
  const servicesCount = draft.services?.length ?? policy.activity.servicesCount;

  const applyCategory = useCallback(
    async (categoryId: string) => {
      const picked = categories.find((c) => c.id === categoryId);
      if (!picked) return;
      setSubmitting(true);
      try {
        await onPatchCategory({
          primaryCategoryId: picked.id,
          primaryCategoryCode: picked.code,
          category: picked.name,
        });
        setPickerOpen(false);
        setConfirmEmptyPublishedOpen(false);
        setDraftChangeConfirmOpen(false);
        setPendingCategoryId(null);
        if (useCabinetApi) await onRefresh();
      } catch (e) {
        setFieldErrors({
          submit: e instanceof Error ? e.message : 'Не удалось изменить категорию',
        });
      } finally {
        setSubmitting(false);
      }
    },
    [categories, onPatchCategory, onRefresh, useCabinetApi],
  );

  const handlePickCategory = (categoryId: string) => {
    if (categoryId === draft.primaryCategoryId) {
      setPickerOpen(false);
      return;
    }
    if (policy.hasActiveRequest || policy.needsRequest) return;

    if (servicesCount > 0 && (!publicationStatus || publicationStatus === 'draft')) {
      setPendingCategoryId(categoryId);
      setDraftChangeConfirmOpen(true);
      return;
    }

    if (policy.canChangeDirectly && publicationStatus === 'published') {
      setPendingCategoryId(categoryId);
      setConfirmEmptyPublishedOpen(true);
      return;
    }

    void applyCategory(categoryId);
  };

  const submitRequest = async () => {
    const errs: Record<string, string> = {};
    if (!pickedCategoryId) errs.category = 'Выберите новую категорию';
    else if (pickedCategoryId === draft.primaryCategoryId) {
      errs.category = 'Выберите категорию, отличную от текущей';
    }
    const trimmed = reason.trim();
    if (!trimmed) errs.reason = 'Укажите причину смены';
    else if (trimmed.length < 10) errs.reason = 'Минимум 10 символов';

    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }

    if (!useCabinetApi) {
      setFieldErrors({ submit: 'Заявки доступны только при подключении к серверу' });
      return;
    }

    setSubmitting(true);
    setFieldErrors({});
    try {
      const request = await postCategoryChangeRequest({
        requestedCategoryId: pickedCategoryId,
        reason: trimmed,
      });
      setActiveRequest(request);
      setRequestOpen(false);
      setSuccessOpen(true);
      await onRefresh();
    } catch (e) {
      setFieldErrors({
        submit:
          e instanceof Error
            ? e.message
            : 'Не удалось отправить заявку. Проверьте соединение и попробуйте ещё раз.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openPrimaryAction = useCallback(() => {
    if (policy.hasActiveRequest) return;
    if (policy.needsRequest) {
      setPickedCategoryId('');
      setReason('');
      setFieldErrors({});
      setRequestOpen(true);
      return;
    }
    setFieldErrors({});
    setPickerOpen(true);
  }, [policy.hasActiveRequest, policy.needsRequest]);

  useImperativeHandle(
    ref,
    () => ({
      open: openPrimaryAction,
    }),
    [openPrimaryAction],
  );

  return (
    <>
      <AdminBottomSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Категория"
        subtitle="Выберите раздел каталога"
        variant="catalog"
        footer={
          <button
            type="button"
            onClick={() => setPickerOpen(false)}
            className="min-h-12 w-full rounded-full bg-[#F1EFEF] text-[15px] font-semibold text-neutral-800"
          >
            Закрыть
          </button>
        }
      >
        <div className="space-y-3 pb-2">
          <SoftWarning
            title="Категория влияет на каталог"
            text="Клиенты будут находить вас в этом разделе. После публикации профиля смена категории может проходить через проверку."
          />
          <div className="grid grid-cols-1 gap-1.5">
            {[...categories]
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((item) => {
                const active = draft.primaryCategoryId === item.id;
                const imageSrc = CATEGORY_IMAGES[item.code];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handlePickCategory(item.id)}
                    disabled={submitting}
                    className={`flex min-h-[4rem] w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition ${
                      active
                        ? 'bg-[#FDF9F9] ring-1 ring-[#E29595]/40'
                        : 'bg-[#F1EFEF] hover:bg-[#E9E6E6] active:scale-[0.99]'
                    }`}
                  >
                    {imageSrc ? (
                      <img src={imageSrc} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[13px] font-semibold text-neutral-400">
                        {item.name.slice(0, 1)}
                      </span>
                    )}
                    <span className="text-[15px] font-semibold text-neutral-950">{item.name}</span>
                  </button>
                );
              })}
          </div>
          {fieldErrors.submit ? (
            <p className="text-[13px] font-medium text-red-600">{fieldErrors.submit}</p>
          ) : null}
        </div>
      </AdminBottomSheet>

      <AdminBottomSheet
        open={draftChangeConfirmOpen}
        onClose={() => {
          setDraftChangeConfirmOpen(false);
          setPendingCategoryId(null);
        }}
        title="Проверьте услуги после смены категории"
        variant="catalog"
        footer={
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setDraftChangeConfirmOpen(false);
                setPendingCategoryId(null);
              }}
              className="min-h-12 flex-1 rounded-full bg-[#F1EFEF] text-[15px] font-semibold text-neutral-800"
            >
              Оставить текущую
            </button>
            <button
              type="button"
              disabled={!pendingCategoryId || submitting}
              onClick={() => pendingCategoryId && void applyCategory(pendingCategoryId)}
              className="min-h-12 flex-1 rounded-full bg-[#ff5f7a] text-[15px] font-semibold text-white disabled:opacity-50"
            >
              Изменить категорию
            </button>
          </div>
        }
      >
        <p className="pb-2 text-[14px] leading-relaxed text-[#6B7280]">
          Некоторые услуги могут не подходить новой категории. После изменения проверьте прайс.
        </p>
      </AdminBottomSheet>

      <AdminBottomSheet
        open={confirmEmptyPublishedOpen}
        onClose={() => {
          setConfirmEmptyPublishedOpen(false);
          setPendingCategoryId(null);
        }}
        title="Изменить категорию?"
        variant="catalog"
        footer={
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setConfirmEmptyPublishedOpen(false);
                setPendingCategoryId(null);
              }}
              className="min-h-12 flex-1 rounded-full bg-[#F1EFEF] text-[15px] font-semibold text-neutral-800"
            >
              Отмена
            </button>
            <button
              type="button"
              disabled={!pendingCategoryId || submitting}
              onClick={() => pendingCategoryId && void applyCategory(pendingCategoryId)}
              className="min-h-12 flex-1 rounded-full bg-[#ff5f7a] text-[15px] font-semibold text-white disabled:opacity-50"
            >
              Изменить
            </button>
          </div>
        }
      >
        <p className="pb-2 text-[14px] leading-relaxed text-[#6B7280]">
          Категория определяет раздел каталога, поиск и подсказки услуг. Вы сможете продолжить настройку
          профиля после изменения.
        </p>
      </AdminBottomSheet>

      <AdminBottomSheet
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        title="Смена категории"
        subtitle="Категория влияет на каталог, услуги и записи. Для активного профиля смена категории проходит через проверку."
        variant="catalog"
        footer={
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setRequestOpen(false)}
              className="min-h-12 flex-1 rounded-full bg-[#F1EFEF] text-[15px] font-semibold text-neutral-800"
            >
              Отмена
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => void submitRequest()}
              className="min-h-12 flex-1 rounded-full bg-[#ff5f7a] text-[15px] font-semibold text-white disabled:opacity-50"
            >
              {submitting ? 'Отправка…' : 'Отправить заявку'}
            </button>
          </div>
        }
      >
        <div className="space-y-4 pb-2">
          <label className="block">
            <span className="text-[12px] font-medium text-[#9CA3AF]">Текущая категория</span>
            <p className="mt-1 rounded-2xl bg-[#F7F7F8] px-4 py-3 text-[15px] font-semibold text-[#111827]">
              {currentCategoryName}
            </p>
          </label>

          <div>
            <span className="text-[12px] font-medium text-[#9CA3AF]">Новая категория</span>
            <div className="mt-2 grid grid-cols-1 gap-1.5">
              {[...categories]
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((item) => {
                  const active = pickedCategoryId === item.id;
                  const isCurrent = draft.primaryCategoryId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={isCurrent}
                      onClick={() => {
                        setPickedCategoryId(item.id);
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.category;
                          return next;
                        });
                      }}
                      className={`rounded-2xl px-4 py-3 text-left text-[15px] font-semibold transition ${
                        isCurrent
                          ? 'cursor-not-allowed bg-[#F7F7F8] text-[#9CA3AF]'
                          : active
                            ? 'bg-[#FDF9F9] ring-1 ring-[#E29595]/40 text-[#111827]'
                            : 'bg-[#F1EFEF] text-[#111827] hover:bg-[#E9E6E6]'
                      }`}
                    >
                      {item.name}
                      {isCurrent ? ' (текущая)' : ''}
                    </button>
                  );
                })}
            </div>
            {fieldErrors.category ? (
              <p className="mt-1.5 text-[12px] font-medium text-red-600">{fieldErrors.category}</p>
            ) : null}
          </div>

          <label className="block">
            <span className="text-[12px] font-medium text-[#9CA3AF]">Причина смены категории</span>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.reason;
                  return next;
                });
              }}
              rows={4}
              placeholder="Например: больше не оказываю услуги маникюра, теперь работаю с бровями"
              className="mt-1.5 w-full resize-none rounded-2xl border-0 bg-[#F1EFEF] px-4 py-3 text-[15px] text-[#111827] outline-none ring-1 ring-transparent focus:ring-[#E29595]/30"
            />
            <p className="mt-1.5 text-[12px] text-[#6B7280]">
              Коротко объясните, почему хотите сменить категорию. Это поможет быстрее проверить заявку.
            </p>
            {fieldErrors.reason ? (
              <p className="mt-1 text-[12px] font-medium text-red-600">{fieldErrors.reason}</p>
            ) : null}
          </label>

          {fieldErrors.submit ? (
            <p className="text-[13px] font-medium text-red-600">{fieldErrors.submit}</p>
          ) : null}
        </div>
      </AdminBottomSheet>

      <AdminBottomSheet
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        title="Заявка отправлена"
        variant="catalog"
        footer={
          <button
            type="button"
            onClick={() => setSuccessOpen(false)}
            className="min-h-12 w-full rounded-full bg-[#ff5f7a] text-[15px] font-semibold text-white"
          >
            Понятно
          </button>
        }
      >
        <p className="pb-2 text-[14px] leading-relaxed text-[#6B7280]">
          Мы проверим смену категории и уведомим вас. Пока заявка на проверке, текущая категория остаётся
          без изменений.
        </p>
      </AdminBottomSheet>
    </>
  );
});
