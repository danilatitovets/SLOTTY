import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPlatformMaster } from '../api/platformAdminApi';
import type { PlatformMasterDetail, PlatformMasterListItem } from '../api/platformAdmin.types';
import {
  PlatformAdminError,
  PlatformAdminLoading,
  StatusBadge,
} from '../shared/PlatformAdminSharedUi';
import { paCard, paGhostBtn } from '../platformAdminTheme';

const EVENT_LABELS: Record<string, string> = {
  checkout_started: 'Начал оформление Pro',
  checkout_cancelled: 'Отменил оформление',
  plan_changed: 'Смена тарифа',
  pro_interest: 'Интерес к Pro (онбординг)',
  payment_failed: 'Ошибка оплаты',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <dt className="shrink-0 text-[12px] font-bold uppercase tracking-wide text-[#9CA3AF] sm:w-36">
        {label}
      </dt>
      <dd className="min-w-0 break-all text-[14px] font-medium text-[#111827]">{value}</dd>
    </div>
  );
}

type Props = {
  masterId: string | null;
  listPreview?: PlatformMasterListItem | null;
  onClose: () => void;
};

export function PlatformAdminMasterDetailSheet({ masterId, listPreview, onClose }: Props) {
  const [detail, setDetail] = useState<PlatformMasterDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!masterId) return;
    setLoading(true);
    setError(null);
    try {
      setDetail(await getPlatformMaster(masterId));
    } catch (e) {
      setDetail(null);
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  }, [masterId]);

  useEffect(() => {
    if (!masterId) {
      setDetail(null);
      return;
    }
    void load();
  }, [masterId, load]);

  if (!masterId) return null;

  const title = detail?.displayName ?? listPreview?.displayName ?? 'Мастер';
  const isPro = (detail?.subscription?.planCode ?? detail?.planCode) === 'pro';

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-black/40" onClick={onClose}>
      <div
        className={`${paCard} flex h-full w-full max-w-lg flex-col rounded-none border-0 shadow-2xl sm:rounded-l-3xl`}
        role="dialog"
        aria-modal
        onClick={(e) => e.stopPropagation()}
      >
        <header className="shrink-0 border-b border-[#eef0f5] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-[20px] font-bold text-[#111827]">{title}</h2>
              <p className="mt-1 font-mono text-[12px] text-[#9CA3AF]">{masterId}</p>
            </div>
            <button type="button" className={paGhostBtn} onClick={onClose}>
              Закрыть
            </button>
          </div>
          {detail ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge status={detail.publicationStatus} />
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold ${
                  isPro ? 'bg-violet-100 text-violet-800' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {isPro ? 'Pro' : 'Free'}
              </span>
              {detail.isVerified ? (
                <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-[12px] font-semibold text-sky-800">
                  Проверен
                </span>
              ) : null}
            </div>
          ) : null}
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {loading ? <PlatformAdminLoading rows={4} /> : null}
          {error ? <PlatformAdminError message={error} onRetry={() => void load()} /> : null}

          {detail && !loading && !error ? (
            <div className="space-y-6">
              <section>
                <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-[#9CA3AF]">
                  Тариф и Pro
                </h3>
                <dl className="space-y-3">
                  <DetailRow
                    label="Подписка в БД"
                    value={`${detail.subscription?.planName ?? detail.planName} (${detail.subscription?.planCode ?? detail.planCode})`}
                  />
                  <DetailRow label="Профиль master_plan" value={detail.masterPlan} />
                  <DetailRow
                    label="Статус Pro"
                    value={
                      detail.proStatus
                        ? `${detail.proStatus}${detail.proInterested ? ' · интерес при онбординге' : ''}`
                        : detail.proInterested
                          ? 'Интерес при онбординге'
                          : '—'
                    }
                  />
                  {detail.proStartedAt ? (
                    <DetailRow label="Pro с" value={formatDate(detail.proStartedAt)} />
                  ) : null}
                  {detail.proExpiresAt ? (
                    <DetailRow label="Pro до" value={formatDate(detail.proExpiresAt)} />
                  ) : null}
                  {detail.subscription ? (
                    <>
                      <DetailRow
                        label="Период оплаты"
                        value={detail.subscription.billingPeriod === 'year' ? 'Год' : 'Месяц'}
                      />
                      <DetailRow
                        label="Текущий период"
                        value={`${formatDate(detail.subscription.currentPeriodStart)} — ${formatDate(detail.subscription.currentPeriodEnd)}`}
                      />
                      <DetailRow label="Статус подписки" value={detail.subscription.status} />
                      <DetailRow
                        label="Цена Pro"
                        value={`${detail.subscription.priceMonth} BYN/мес · ${detail.subscription.priceYear} BYN/год`}
                      />
                    </>
                  ) : null}
                </dl>
              </section>

              <section>
                <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-[#9CA3AF]">
                  История биллинга
                </h3>
                {detail.billingEvents.length === 0 ? (
                  <p className="text-[14px] text-[#6B7280]">
                    Событий пока нет. Новые попытки Pro и смены тарифа появятся здесь автоматически.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {detail.billingEvents.map((ev) => (
                      <li key={ev.id} className="rounded-2xl bg-[#f6f7fb] px-4 py-3">
                        <p className="text-[14px] font-semibold text-[#111827]">
                          {EVENT_LABELS[ev.eventType] ?? ev.eventType}
                        </p>
                        <p className="mt-1 text-[12px] text-[#6B7280]">
                          {formatDate(ev.createdAt)}
                          {ev.planCode ? ` · ${ev.planCode}` : ''}
                          {ev.billingPeriod ? ` · ${ev.billingPeriod}` : ''}
                          {ev.amount != null ? ` · ${ev.amount} ${ev.currency}` : ''}
                          {` · ${ev.source}`}
                          {ev.status !== 'recorded' ? ` · ${ev.status}` : ''}
                        </p>
                        {ev.errorMessage ? (
                          <p className="mt-1 text-[12px] text-rose-700">{ev.errorMessage}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-[#9CA3AF]">
                  Контакты и профиль
                </h3>
                <dl className="space-y-3">
                  <DetailRow label="Категория" value={detail.categoryName ?? '—'} />
                  <DetailRow label="Email" value={detail.email ?? '—'} />
                  <DetailRow label="Телефон" value={detail.phone ?? '—'} />
                  <DetailRow
                    label="Telegram"
                    value={detail.telegramUsername ? `@${detail.telegramUsername}` : '—'}
                  />
                  <DetailRow label="Регистрация" value={formatDate(detail.createdAt)} />
                  {detail.adminHiddenReason ? (
                    <DetailRow label="Скрытие админом" value={detail.adminHiddenReason} />
                  ) : null}
                  {detail.adminPauseReason ? (
                    <DetailRow label="Пауза админом" value={detail.adminPauseReason} />
                  ) : null}
                </dl>
                <Link
                  to={detail.profileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block text-[14px] font-semibold text-[#ff5f7a]"
                >
                  Публичный профиль →
                </Link>
              </section>

              <section>
                <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-[#9CA3AF]">
                  Активность
                </h3>
                <dl className="grid grid-cols-2 gap-3 text-[13px]">
                  <div>
                    <dt className="text-[#9CA3AF]">Услуги</dt>
                    <dd className="font-bold text-[#111827]">{detail.servicesCount}</dd>
                  </div>
                  <div>
                    <dt className="text-[#9CA3AF]">Окна</dt>
                    <dd className="font-bold text-[#111827]">{detail.slotsCount}</dd>
                  </div>
                  <div>
                    <dt className="text-[#9CA3AF]">Записи</dt>
                    <dd className="font-bold text-[#111827]">{detail.appointmentsCount}</dd>
                  </div>
                  <div>
                    <dt className="text-[#9CA3AF]">Рейтинг</dt>
                    <dd className="font-bold text-[#111827]">
                      {detail.ratingAvg.toFixed(1)} ({detail.reviewsCount})
                    </dd>
                  </div>
                </dl>
              </section>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
