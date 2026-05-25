import { useCallback, useEffect, useState } from 'react';
import { getMasterPath } from '../../../app/paths';
import { Link } from 'react-router-dom';
import {
  getPlatformMasters,
  hideMaster,
  pauseMaster,
  unhideMaster,
  unpauseMaster,
} from '../api/platformAdminApi';
import type { PlatformMasterListItem } from '../api/platformAdmin.types';
import { PlatformAdminMasterDetailSheet } from '../masters/PlatformAdminMasterDetailSheet';
import { PlatformAdminPageIntro } from '../shared/PlatformAdminPageIntro';
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
import { paInput } from '../platformAdminTheme';

const FILTERS = [
  ['all', 'Все'],
  ['published', 'В каталоге'],
  ['hidden', 'Скрытые'],
  ['paused', 'На паузе'],
  ['blocked', 'Заблокированы'],
  ['pending_requests', 'С заявкой'],
] as const;

function modalCopy(type: 'hide' | 'pause' | 'unhide' | 'unpause') {
  switch (type) {
    case 'hide':
      return {
        title: 'Скрыть профиль из каталога?',
        description: 'Мастер останется в системе, но клиенты не увидят его в поиске.',
      };
    case 'pause':
      return {
        title: 'Поставить профиль на паузу?',
        description: 'Запись к мастеру будет недоступна, пока пауза не снята.',
      };
    case 'unhide':
      return { title: 'Вернуть в каталог?', description: 'Профиль снова будет виден клиентам.' };
    case 'unpause':
      return { title: 'Снять паузу?', description: 'Мастер снова сможет принимать записи.' };
  }
}

export function PlatformAdminMastersTab() {
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [masters, setMasters] = useState<PlatformMasterListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{
    type: 'hide' | 'pause' | 'unhide' | 'unpause';
    m: PlatformMasterListItem;
  } | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<PlatformMasterListItem | null>(null);

  const load = useCallback(async (offset = 0) => {
    const append = offset > 0;
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await getPlatformMasters({
        filter: filter === 'all' ? undefined : filter,
        q: q.trim() || undefined,
        offset,
      });
      setTotal(res.total);
      setMasters((prev) => (append ? [...prev, ...res.masters] : res.masters));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filter, q]);

  useEffect(() => {
    const t = setTimeout(() => void load(0), 300);
    return () => clearTimeout(t);
  }, [load]);

  async function runAction() {
    if (!modal) return;
    setBusy(true);
    try {
      const id = modal.m.masterId;
      if (modal.type === 'hide') await hideMaster(id, reason);
      else if (modal.type === 'pause') await pauseMaster(id, reason);
      else if (modal.type === 'unhide') await unhideMaster(id);
      else await unpauseMaster(id);
      setModal(null);
      setReason('');
      await load(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  }

  const copy = modal ? modalCopy(modal.type) : null;

  return (
    <div>
      <PlatformAdminPageIntro />

      <PlatformAdminToolbar
        search={{ value: q, onChange: setQ, placeholder: 'Имя мастера или категория' }}
        resultCount={loading ? undefined : total}
        filterGroups={[
          {
            label: 'Статус профиля',
            chips: FILTERS.map(([id, label]) => ({
              id,
              label,
              active: filter === id,
              onClick: () => setFilter(id),
            })),
          },
        ]}
      />

      {loading ? <PlatformAdminLoading /> : null}
      {error ? <PlatformAdminError message={error} onRetry={() => void load(0)} /> : null}
      {!loading && !error && masters.length === 0 ? (
        <PlatformAdminEmpty title="Мастера не найдены" text="Измените поиск или фильтр." />
      ) : null}

      {!loading && !error ? (
        <div className="space-y-3">
          {masters.map((m) => (
            <PlatformAdminCard key={m.masterId}>
              <button
                type="button"
                className="w-full text-left"
                onClick={() => {
                  setSelectedId(m.masterId);
                  setSelectedPreview(m);
                }}
              >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-[16px] font-bold text-[#111827]">{m.displayName}</h3>
                  <p className="mt-0.5 text-[14px] text-[#6B7280]">{m.categoryName ?? 'Категория не указана'}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-[#9CA3AF]">{m.masterId}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={m.publicationStatus} />
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold ${
                      m.planCode === 'pro' ? 'bg-violet-100 text-violet-800' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {m.planCode === 'pro' ? 'Pro' : 'Free'}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-[13px] font-semibold text-[#ff5f7a]">Тариф, платежи, подробности →</p>
              </button>

              <dl className="mt-3 grid grid-cols-2 gap-2 text-[13px] sm:grid-cols-4">
                <div>
                  <dt className="text-[#9CA3AF]">Услуги</dt>
                  <dd className="font-bold text-[#111827]">{m.servicesCount}</dd>
                </div>
                <div>
                  <dt className="text-[#9CA3AF]">Окна</dt>
                  <dd className="font-bold text-[#111827]">{m.slotsCount}</dd>
                </div>
                <div>
                  <dt className="text-[#9CA3AF]">Записи</dt>
                  <dd className="font-bold text-[#111827]">{m.appointmentsCount}</dd>
                </div>
                <div>
                  <dt className="text-[#9CA3AF]">Рейтинг</dt>
                  <dd className="font-bold text-[#111827]">
                    {m.ratingAvg.toFixed(1)} ({m.reviewsCount})
                  </dd>
                </div>
              </dl>

              {m.hasPendingCategoryRequest ? (
                <p className="mt-2 text-[13px] font-semibold text-amber-700">Есть заявка на смену категории</p>
              ) : null}

              <div
                className="mt-4 flex flex-wrap gap-3 border-t border-[#eef0f5] pt-3 text-[13px] font-semibold"
                onClick={(e) => e.stopPropagation()}
              >
                <Link to={getMasterPath(m.masterId)} className="text-[#ff5f7a]">
                  Публичный профиль
                </Link>
                {m.publicationStatus !== 'hidden' ? (
                  <button type="button" className="text-[#374151]" onClick={() => setModal({ type: 'hide', m })}>
                    Скрыть
                  </button>
                ) : (
                  <button type="button" className="text-[#374151]" onClick={() => setModal({ type: 'unhide', m })}>
                    В каталог
                  </button>
                )}
                {m.publicationStatus !== 'paused' ? (
                  <button type="button" className="text-[#374151]" onClick={() => setModal({ type: 'pause', m })}>
                    Пауза
                  </button>
                ) : (
                  <button type="button" className="text-[#374151]" onClick={() => setModal({ type: 'unpause', m })}>
                    Снять паузу
                  </button>
                )}
              </div>
            </PlatformAdminCard>
          ))}
          <PlatformAdminLoadMore
            loadedCount={masters.length}
            total={total}
            loading={loadingMore}
            onLoadMore={() => void load(masters.length)}
          />
        </div>
      ) : null}

      <PlatformAdminMasterDetailSheet
        masterId={selectedId}
        listPreview={selectedPreview}
        onClose={() => {
          setSelectedId(null);
          setSelectedPreview(null);
        }}
      />

      <ConfirmModal
        open={Boolean(modal)}
        title={copy?.title ?? ''}
        description={copy?.description}
        confirmLabel="Применить"
        busy={busy}
        onConfirm={() => void runAction()}
        onClose={() => setModal(null)}
      >
        {modal && (modal.type === 'hide' || modal.type === 'pause') ? (
          <textarea
            className={`${paInput} min-h-[80px]`}
            placeholder="Причина *"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        ) : null}
      </ConfirmModal>
    </div>
  );
}
