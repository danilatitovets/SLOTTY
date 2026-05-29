import { useCallback, useEffect, useState } from 'react';
import {
  approveCategoryChangeRequest,
  getCategoryChangeRequests,
  rejectCategoryChangeRequest,
} from '../api/platformAdminApi';
import type { CategoryChangeRequestAdmin } from '../api/platformAdmin.types';
import { PlatformAdminToolbar } from '../shared/PlatformAdminToolbar';
import {
  ConfirmModal,
  PlatformAdminCard,
  PlatformAdminEmpty,
  PlatformAdminError,
  PlatformAdminLoading,
  StatusBadge,
} from '../shared/PlatformAdminSharedUi';
import { PlatformAdminLoadMore } from '../shared/PlatformAdminLoadMore';
import { paGhostBtn, paInput, paPrimaryBtn } from '../platformAdminTheme';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'pending', label: 'На проверке' },
  { id: 'all', label: 'Все' },
  { id: 'approved', label: 'Одобрены' },
  { id: 'rejected', label: 'Отклонены' },
];

export function PlatformAdminRequestsTab() {
  const [filter, setFilter] = useState<StatusFilter>('pending');
  const [items, setItems] = useState<CategoryChangeRequestAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [approveId, setApproveId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState('');

  const load = useCallback(async (offset = 0) => {
    const append = offset > 0;
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await getCategoryChangeRequests(filter, { offset });
      setTotal(res.total);
      setItems((prev) => (append ? [...prev, ...res.requests] : res.requests));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filter]);

  useEffect(() => {
    void load(0);
  }, [load]);

  async function handleApprove() {
    if (!approveId) return;
    setBusyId(approveId);
    try {
      await approveCategoryChangeRequest(approveId);
      setApproveId(null);
      await load(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject() {
    if (!rejectId || !rejectComment.trim()) return;
    setBusyId(rejectId);
    try {
      await rejectCategoryChangeRequest(rejectId, rejectComment.trim());
      setRejectId(null);
      setRejectComment('');
      await load(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PlatformAdminToolbar
        resultCount={loading ? undefined : total}
        filterGroups={[
          {
            label: 'Статус заявки',
            chips: FILTERS.map((f) => ({
              id: f.id,
              label: f.label,
              active: filter === f.id,
              onClick: () => setFilter(f.id),
            })),
          },
        ]}
      />

      {loading ? <PlatformAdminLoading /> : null}
      {error ? <PlatformAdminError message={error} onRetry={() => void load(0)} /> : null}

      {!loading && !error && items.length === 0 ? (
        <PlatformAdminEmpty
          title={filter === 'pending' ? 'Новых заявок нет' : 'Заявок не найдено'}
          text={
            filter === 'pending'
              ? 'Когда мастер запросит смену категории, заявка появится здесь.'
              : 'Попробуйте другой фильтр.'
          }
        />
      ) : null}

      {!loading && !error ? (
        <div className="space-y-4">
          {items.map((req) => (
            <PlatformAdminCard key={req.id} className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-[17px] font-bold text-[#111827]">{req.masterName}</h3>
                  <a
                    href={req.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-[13px] font-semibold text-[#ff5f7a] hover:underline"
                  >
                    Открыть профиль →
                  </a>
                </div>
                <StatusBadge status={req.status} />
              </div>

              <div className="rounded-2xl bg-[#f6f7fb] px-4 py-3">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                  Смена категории
                </p>
                <p className="mt-1 text-[16px] font-semibold text-[#111827]">
                  {req.currentCategory?.name ?? 'Без категории'} → {req.requestedCategory.name}
                </p>
              </div>

              <p className="text-[14px] leading-relaxed text-[#374151]">
                <span className="font-semibold text-[#6B7280]">Причина мастера:</span> {req.reason}
              </p>

              <dl className="grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-4">
                <div>
                  <dt className="text-[#9CA3AF]">Услуги</dt>
                  <dd className="font-bold text-[#111827]">{req.activity.servicesCount}</dd>
                </div>
                <div>
                  <dt className="text-[#9CA3AF]">Окна</dt>
                  <dd className="font-bold text-[#111827]">{req.activity.activeWindowsCount}</dd>
                </div>
                <div>
                  <dt className="text-[#9CA3AF]">Будущие записи</dt>
                  <dd className="font-bold text-[#111827]">{req.activity.futureBookingsCount}</dd>
                </div>
                <div>
                  <dt className="text-[#9CA3AF]">Отзывы</dt>
                  <dd className="font-bold text-[#111827]">{req.activity.reviewsCount}</dd>
                </div>
              </dl>

              {req.status === 'pending' ? (
                <div className="flex flex-wrap gap-2 border-t border-[#eef0f5] pt-4">
                  <button
                    type="button"
                    className={paPrimaryBtn}
                    disabled={busyId === req.id}
                    onClick={() => setApproveId(req.id)}
                  >
                    Одобрить
                  </button>
                  <button
                    type="button"
                    className={paGhostBtn}
                    disabled={busyId === req.id}
                    onClick={() => {
                      setRejectId(req.id);
                      setRejectComment('');
                    }}
                  >
                    Отклонить
                  </button>
                </div>
              ) : req.adminComment ? (
                <p className="border-t border-[#eef0f5] pt-3 text-[14px] text-[#6B7280]">
                  Комментарий админа: {req.adminComment}
                </p>
              ) : null}
            </PlatformAdminCard>
          ))}
          <PlatformAdminLoadMore
            loadedCount={items.length}
            total={total}
            loading={loadingMore}
            onLoadMore={() => void load(items.length)}
          />
        </div>
      ) : null}

      <ConfirmModal
        open={Boolean(approveId)}
        title="Одобрить заявку?"
        description="Категория мастера изменится. Услуги из прошлой категории будут скрыты — мастеру нужно будет обновить прайс."
        confirmLabel="Одобрить"
        busy={Boolean(busyId)}
        onConfirm={() => void handleApprove()}
        onClose={() => setApproveId(null)}
      />

      <ConfirmModal
        open={Boolean(rejectId)}
        title="Отклонить заявку"
        confirmLabel="Отклонить"
        danger
        busy={Boolean(busyId)}
        onConfirm={() => void handleReject()}
        onClose={() => setRejectId(null)}
      >
        <label className="block text-left text-[13px] font-semibold text-[#374151]">
          Причина отклонения *
          <textarea
            className={`${paInput} mt-2 min-h-[100px] resize-y`}
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
          />
        </label>
      </ConfirmModal>
    </div>
  );
}
