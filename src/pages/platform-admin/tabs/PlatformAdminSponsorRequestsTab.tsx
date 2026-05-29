import { useCallback, useEffect, useState } from 'react';
import {
  getSponsorRequests,
  updateSponsorRequestStatus,
} from '../api/platformAdminApi';
import type { SponsorRequestAdmin } from '../api/platformAdmin.types';
import { PlatformAdminToolbar } from '../shared/PlatformAdminToolbar';
import {
  ConfirmModal,
  PlatformAdminCard,
  PlatformAdminEmpty,
  PlatformAdminError,
  PlatformAdminLoading,
  SponsorStatusBadge,
} from '../shared/PlatformAdminSharedUi';
import { PlatformAdminLoadMore } from '../shared/PlatformAdminLoadMore';
import { paGhostBtn, paInput, paPrimaryBtn } from '../platformAdminTheme';

type StatusFilter = 'all' | 'pending' | 'in_review' | 'closed' | 'rejected';

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'pending', label: 'Новые' },
  { id: 'in_review', label: 'В работе' },
  { id: 'all', label: 'Все' },
  { id: 'closed', label: 'Закрыты' },
  { id: 'rejected', label: 'Отклонены' },
];

export function PlatformAdminSponsorRequestsTab() {
  const [filter, setFilter] = useState<StatusFilter>('pending');
  const [items, setItems] = useState<SponsorRequestAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [closeId, setCloseId] = useState<string | null>(null);
  const [closeComment, setCloseComment] = useState('');

  const load = useCallback(async (offset = 0) => {
    const append = offset > 0;
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await getSponsorRequests(filter, { offset });
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

  async function setStatus(id: string, status: 'in_review' | 'closed' | 'rejected', comment?: string) {
    setBusyId(id);
    try {
      await updateSponsorRequestStatus(id, status, comment);
      setRejectId(null);
      setRejectComment('');
      setCloseId(null);
      setCloseComment('');
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
              ? 'Когда мастер отправит заявку «Стать спонсором SLOTTY», она появится здесь.'
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
                  <p className="mt-0.5 text-[14px] font-semibold text-[#374151]">{req.contactName}</p>
                  <a
                    href={req.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-[13px] font-semibold text-[#ff5f7a] hover:underline"
                  >
                    Профиль мастера →
                  </a>
                </div>
                <SponsorStatusBadge status={req.status} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#f6f7fb] px-4 py-3">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Телефон</p>
                  <p className="mt-1 text-[15px] font-semibold text-[#111827]">{req.phone}</p>
                </div>
                {req.email ? (
                  <div className="rounded-2xl bg-[#f6f7fb] px-4 py-3">
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Email</p>
                    <p className="mt-1 break-all text-[15px] font-semibold text-[#111827]">{req.email}</p>
                  </div>
                ) : null}
                {req.companyName ? (
                  <div className="rounded-2xl bg-[#f6f7fb] px-4 py-3">
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Компания</p>
                    <p className="mt-1 text-[15px] font-semibold text-[#111827]">{req.companyName}</p>
                  </div>
                ) : null}
                {req.city ? (
                  <div className="rounded-2xl bg-[#f6f7fb] px-4 py-3">
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Город</p>
                    <p className="mt-1 text-[15px] font-semibold text-[#111827]">{req.city}</p>
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl bg-[#FFF1F4]/60 px-4 py-3">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Сообщение</p>
                <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-[#374151]">{req.message}</p>
              </div>

              {req.adminComment ? (
                <div className="rounded-2xl border border-[#EAECEF] bg-white px-4 py-3">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                    Сообщение мастеру
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-[#374151]">
                    {req.adminComment}
                  </p>
                </div>
              ) : null}

              {(req.status === 'pending' || req.status === 'in_review') && (
                <div className="flex flex-wrap gap-2">
                  {req.status === 'pending' ? (
                    <button
                      type="button"
                      disabled={busyId === req.id}
                      className={paGhostBtn}
                      onClick={() => void setStatus(req.id, 'in_review')}
                    >
                      В работу
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={busyId === req.id}
                    className={paPrimaryBtn}
                    onClick={() => {
                      setCloseId(req.id);
                      setCloseComment('');
                    }}
                  >
                    Ответить и закрыть
                  </button>
                  <button
                    type="button"
                    disabled={busyId === req.id}
                    className={paGhostBtn}
                    onClick={() => setRejectId(req.id)}
                  >
                    Отклонить
                  </button>
                </div>
              )}
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
        open={Boolean(closeId)}
        title="Ответ мастеру"
        description="Сообщение появится в кабинете мастера и уйдёт в Telegram, если привязан бот."
        confirmLabel="Отправить и закрыть"
        busy={Boolean(busyId)}
        onClose={() => {
          setCloseId(null);
          setCloseComment('');
        }}
        onConfirm={() => {
          if (closeId) void setStatus(closeId, 'closed', closeComment.trim());
        }}
        confirmDisabled={closeComment.trim().length < 5}
      >
        <label className="block text-left text-[13px] font-medium text-[#6B7280]">
          Текст для мастера *
          <textarea
            className={`${paInput} mt-2 min-h-[120px] w-full resize-y`}
            value={closeComment}
            onChange={(e) => setCloseComment(e.target.value)}
            placeholder="Например: спасибо за предложение! Свяжемся с вами на этой неделе по телефону…"
            maxLength={2000}
          />
        </label>
      </ConfirmModal>

      <ConfirmModal
        open={Boolean(rejectId)}
        title="Отклонить заявку"
        description="Причина отобразится мастеру в кабинете."
        confirmLabel="Отклонить"
        danger
        busy={Boolean(busyId)}
        onClose={() => {
          setRejectId(null);
          setRejectComment('');
        }}
        onConfirm={() => {
          if (rejectId) void setStatus(rejectId, 'rejected', rejectComment.trim());
        }}
        confirmDisabled={rejectComment.trim().length < 5}
      >
        <label className="block text-left text-[13px] font-medium text-[#6B7280]">
          Причина отклонения
          <textarea
            className={`${paInput} mt-2 min-h-[100px] w-full resize-y`}
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            maxLength={2000}
          />
        </label>
      </ConfirmModal>
    </div>
  );
}
