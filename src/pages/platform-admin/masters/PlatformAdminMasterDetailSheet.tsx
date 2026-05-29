import { displayOrEmpty, EMPTY_FIELD, EMPTY_METRIC } from '../../../shared/lib/emptyDisplayText';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPlatformMaster, grantMasterComplimentaryPro } from '../api/platformAdminApi';
import type { PlatformMasterDetail, PlatformMasterListItem } from '../api/platformAdmin.types';
import {
  PlatformAdminError,
  PlatformAdminLoading,
  StatusBadge,
} from '../shared/PlatformAdminSharedUi';
import { paCard, paGhostBtn, paInput, paPrimaryBtn } from '../platformAdminTheme';
import {
  labelBillingEventType,
  labelBillingPeriod,
  labelBillingSource,
  labelMasterPlan,
  labelProStatus,
  labelSubscriptionStatus,
} from '../platformAdminLabels';

const GRANT_DAYS_PRESETS = [7, 14, 30, 90, 180] as const;

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

function GrantProPanel({
  masterId,
  onGranted,
}: {
  masterId: string;
  onGranted: () => void;
}) {
  const [days, setDays] = useState(30);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [grantError, setGrantError] = useState<string | null>(null);
  const [grantSuccess, setGrantSuccess] = useState<string | null>(null);

  const submit = async () => {
    setGrantError(null);
    setGrantSuccess(null);
    if (reason.trim().length < 3) {
      setGrantError('Укажите причину (не короче 3 символов)');
      return;
    }
    setBusy(true);
    try {
      const res = await grantMasterComplimentaryPro(masterId, {
        days,
        reason: reason.trim(),
      });
      setGrantSuccess(
        `Pro выдан до ${new Date(res.validUntil).toLocaleString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`,
      );
      setReason('');
      onGranted();
    } catch (e) {
      setGrantError(e instanceof Error ? e.message : 'Не удалось выдать тариф');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#FDE8ED] bg-gradient-to-br from-[#FFF8F9] to-white p-4">
      <h4 className="text-[15px] font-bold text-[#111827]">Выдать Pro бесплатно</h4>
      <p className="mt-1 text-[13px] leading-relaxed text-[#6B7280]">
        Тариф активируется сразу на выбранный срок. Запись появится в журнале действий.
      </p>

      <p className="mt-4 text-[12px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Срок</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {GRANT_DAYS_PRESETS.map((d) => (
          <button
            key={d}
            type="button"
            className={`rounded-full px-3 py-1.5 text-[13px] font-semibold transition ${
              days === d
                ? 'bg-[#ff5f7a] text-white'
                : 'bg-white text-[#6B7280] ring-1 ring-[#E5E7EB] hover:bg-[#FAFAFA]'
            }`}
            onClick={() => setDays(d)}
          >
            {d} дн.
          </button>
        ))}
      </div>
      <label className="mt-3 block text-[13px] font-medium text-[#6B7280]">
        Или своё число дней (1–365)
        <input
          type="number"
          min={1}
          max={365}
          value={days}
          onChange={(e) => setDays(Number(e.target.value) || 1)}
          className={`${paInput} mt-1.5`}
        />
      </label>

      <label className="mt-3 block text-[13px] font-medium text-[#6B7280]">
        Причина для журнала и уведомления мастеру *
        <textarea
          className={`${paInput} mt-1.5 min-h-[88px] resize-y`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Например: партнёрская программа, конкурс, компенсация…"
          maxLength={2000}
        />
      </label>

      {grantError ? <p className="mt-2 text-[13px] font-medium text-rose-600">{grantError}</p> : null}
      {grantSuccess ? (
        <p className="mt-2 rounded-xl bg-[#ECFDF5] px-3 py-2 text-[13px] font-medium text-[#047857]">
          {grantSuccess}
        </p>
      ) : null}

      <button
        type="button"
        className={`${paPrimaryBtn} mt-4`}
        disabled={busy}
        onClick={() => void submit()}
      >
        {busy ? 'Выдаём…' : 'Выдать Pro'}
      </button>
    </div>
  );
}

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
                {isPro ? 'Pro' : 'Бесплатный'}
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
                  <DetailRow label="Тариф в профиле" value={labelMasterPlan(detail.masterPlan)} />
                  <DetailRow
                    label="Статус Pro"
                    value={
                      detail.proStatus
                        ? `${labelProStatus(detail.proStatus)}${detail.proInterested ? ' · интерес при онбординге' : ''}`
                        : detail.proInterested
                          ? 'Интерес при онбординге'
                          : EMPTY_METRIC
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
                      <DetailRow
                        label="Статус подписки"
                        value={labelSubscriptionStatus(detail.subscription.status)}
                      />
                      <DetailRow
                        label="Цена Pro"
                        value={`${detail.subscription.priceMonth} BYN/мес · ${detail.subscription.priceYear} BYN/год`}
                      />
                    </>
                  ) : null}
                </dl>

                <div className="mt-4">
                  <GrantProPanel masterId={masterId} onGranted={() => void load()} />
                </div>
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
                          {labelBillingEventType(ev.eventType)}
                        </p>
                        <p className="mt-1 text-[12px] text-[#6B7280]">
                          {formatDate(ev.createdAt)}
                          {ev.planCode ? ` · ${ev.planCode === 'pro' ? 'Pro' : ev.planCode}` : ''}
                          {ev.billingPeriod
                            ? ` · ${labelBillingPeriod(ev.billingPeriod)}`
                            : ''}
                          {ev.amount != null ? ` · ${ev.amount} ${ev.currency}` : ''}
                          {` · ${labelBillingSource(ev.source)}`}
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
                  <DetailRow label="Категория" value={displayOrEmpty(detail.categoryName)} />
                  <DetailRow label="Email" value={displayOrEmpty(detail.email)} />
                  <DetailRow label="Телефон" value={displayOrEmpty(detail.phone)} />
                  <DetailRow
                    label="Telegram"
                    value={detail.telegramUsername ? `@${detail.telegramUsername}` : EMPTY_FIELD}
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
