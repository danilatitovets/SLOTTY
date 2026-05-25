import { useCallback, useEffect, useState } from 'react';
import { getPlatformServices, hideService, unhideService } from '../api/platformAdminApi';
import type { PlatformMasterPickerItem, PlatformServiceListItem } from '../api/platformAdmin.types';
import { PlatformAdminMasterFilter } from '../services/PlatformAdminMasterFilter';
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

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PlatformAdminServicesTab() {
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [masterFilter, setMasterFilter] = useState<PlatformMasterPickerItem | null>(null);
  const [services, setServices] = useState<PlatformServiceListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hideTarget, setHideTarget] = useState<PlatformServiceListItem | null>(null);
  const [detailTarget, setDetailTarget] = useState<PlatformServiceListItem | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (offset = 0) => {
    const append = offset > 0;
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await getPlatformServices({
        filter: filter === 'all' ? undefined : filter,
        q: q.trim() || undefined,
        masterId: masterFilter?.masterId,
        offset,
      });
      setTotal(res.total);
      setServices((prev) => (append ? [...prev, ...res.services] : res.services));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filter, q, masterFilter?.masterId]);

  useEffect(() => {
    const t = setTimeout(() => void load(0), 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <PlatformAdminPageIntro />

      <PlatformAdminToolbar
        search={{ value: q, onChange: setQ, placeholder: 'Название услуги' }}
        resultCount={loading ? undefined : total}
        filterGroups={[
          {
            label: 'Видимость',
            chips: [
              ['all', 'Все'],
              ['visible', 'Видимые'],
              ['hidden', 'Скрытые админом'],
            ].map(([id, label]) => ({
              id,
              label,
              active: filter === id,
              onClick: () => setFilter(id),
            })),
          },
        ]}
        trailing={
          <PlatformAdminMasterFilter
            selectedMasterId={masterFilter?.masterId ?? null}
            selectedMasterName={masterFilter?.displayName ?? null}
            onSelect={setMasterFilter}
          />
        }
      />

      {masterFilter ? (
        <p className="mb-4 text-[14px] text-[#6B7280]">
          Показаны услуги мастера <span className="font-semibold text-[#111827]">{masterFilter.displayName}</span>
        </p>
      ) : null}

      {loading ? <PlatformAdminLoading /> : null}
      {error ? <PlatformAdminError message={error} onRetry={() => void load(0)} /> : null}
      {!loading && !error && services.length === 0 ? (
        <PlatformAdminEmpty
          title="Услуги не найдены"
          text={masterFilter ? 'У этого мастера нет услуг по фильтру.' : 'Измените поиск, мастера или фильтр.'}
        />
      ) : null}

      {!loading && !error ? (
        <div className="space-y-3">
          {services.map((s) => (
            <PlatformAdminCard key={s.id}>
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setDetailTarget(s)}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-[16px] font-bold text-[#111827]">{s.title}</h3>
                  <StatusBadge status={s.isAdminHidden ? 'hidden' : 'published'} />
                </div>
                <p className="mt-2 text-[14px] text-[#6B7280]">
                  Мастер: <span className="font-semibold text-[#374151]">{s.masterName}</span>
                  {s.categoryName ? ` · ${s.categoryName}` : null}
                </p>
                <p className="mt-1 text-[14px] text-[#374151]">
                  {s.priceAmount.toLocaleString('ru-RU')} ₽ · {s.durationMinutes} мин · записей:{' '}
                  {s.appointmentsCount}
                </p>
                {s.adminHiddenReason ? (
                  <p className="mt-2 rounded-xl bg-[#f6f7fb] px-3 py-2 text-[13px] text-[#6B7280]">
                    Скрыто: {s.adminHiddenReason}
                  </p>
                ) : null}
                <p className="mt-2 text-[13px] font-semibold text-[#ff5f7a]">Подробнее →</p>
              </button>

              <div className="mt-3 border-t border-[#eef0f5] pt-3">
                {s.isAdminHidden ? (
                  <button
                    type="button"
                    className="text-[13px] font-semibold text-[#374151]"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await unhideService(s.id);
                        await load();
                        setDetailTarget(null);
                      } catch (e) {
                        setError(e instanceof Error ? e.message : 'Ошибка');
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Вернуть в каталог
                  </button>
                ) : (
                  <button
                    type="button"
                    className="text-[13px] font-semibold text-[#ef4444]"
                    onClick={() => {
                      setHideTarget(s);
                      setReason('');
                    }}
                  >
                    Скрыть с причиной
                  </button>
                )}
              </div>
            </PlatformAdminCard>
          ))}
          <PlatformAdminLoadMore
            loadedCount={services.length}
            total={total}
            loading={loadingMore}
            onLoadMore={() => void load(services.length)}
          />
        </div>
      ) : null}

      {detailTarget ? (
        <div className="fixed inset-0 z-[80] flex justify-end bg-black/40" onClick={() => setDetailTarget(null)}>
          <div
            className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl sm:rounded-l-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="border-b border-[#eef0f5] px-5 py-4">
              <h2 className="text-[18px] font-bold text-[#111827]">{detailTarget.title}</h2>
              <p className="mt-1 text-[14px] text-[#6B7280]">{detailTarget.masterName}</p>
              <p className="mt-1 font-mono text-[11px] text-[#9CA3AF]">{detailTarget.id}</p>
            </header>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 text-[14px]">
              <p>
                <span className="text-[#9CA3AF]">Мастер ID:</span> {detailTarget.masterId}
              </p>
              <p>
                <span className="text-[#9CA3AF]">Цена:</span> {detailTarget.priceAmount} ₽ ·{' '}
                {detailTarget.durationMinutes} мин
              </p>
              <p>
                <span className="text-[#9CA3AF]">Создана:</span> {formatWhen(detailTarget.createdAt)}
              </p>
              {detailTarget.adminHiddenAt ? (
                <p>
                  <span className="text-[#9CA3AF]">Скрыта админом:</span>{' '}
                  {formatWhen(detailTarget.adminHiddenAt)}
                </p>
              ) : null}
              {detailTarget.adminHiddenReason ? (
                <div className="rounded-xl bg-rose-50 px-3 py-2 text-rose-900">
                  <p className="text-[12px] font-bold uppercase">Причина блокировки</p>
                  <p className="mt-1">{detailTarget.adminHiddenReason}</p>
                </div>
              ) : (
                <p className="text-[#6B7280]">Услуга видна клиентам</p>
              )}
            </div>
            <footer className="border-t border-[#eef0f5] p-4">
              <button
                type="button"
                className="w-full rounded-2xl border border-[#e5e7eb] py-2.5 text-[14px] font-semibold"
                onClick={() => setDetailTarget(null)}
              >
                Закрыть
              </button>
            </footer>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={Boolean(hideTarget)}
        title="Скрыть услугу?"
        description={`Мастер: ${hideTarget?.masterName}. Клиенты не увидят услугу; причину получит мастер.`}
        confirmLabel="Скрыть"
        danger
        busy={busy}
        onConfirm={async () => {
          if (!hideTarget || !reason.trim()) return;
          setBusy(true);
          try {
            await hideService(hideTarget.id, reason.trim());
            setHideTarget(null);
            setReason('');
            setDetailTarget(null);
            await load();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Ошибка');
          } finally {
            setBusy(false);
          }
        }}
        onClose={() => setHideTarget(null)}
      >
        <textarea
          className={`${paInput} min-h-[100px]`}
          placeholder="Причина скрытия (обязательно) *"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </ConfirmModal>
    </div>
  );
}
