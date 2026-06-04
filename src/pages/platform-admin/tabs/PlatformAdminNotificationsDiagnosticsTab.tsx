import { useCallback, useEffect, useState } from 'react';
import {
  getNotificationDiagnosticsFull,
  postNotificationRetryFailed,
  postTestBookingNotification,
  postTestNotificationEmail,
  postTestNotificationTelegram,
  type NotificationDiagnosticsFull,
} from '../api/platformAdminApi';
import { PlatformAdminError, PlatformAdminLoading } from '../shared/PlatformAdminSharedUi';
import { paCard, paGhostBtn } from '../platformAdminTheme';

function StatusRow({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-[#eef0f5] last:border-0">
      <span className="text-[13px] text-[#6B7280]">{label}</span>
      <span
        className={`text-[14px] font-semibold ${ok === true ? 'text-emerald-700' : ok === false ? 'text-rose-700' : 'text-[#111827]'}`}
      >
        {value}
      </span>
    </div>
  );
}

export function PlatformAdminNotificationsDiagnosticsTab() {
  const [data, setData] = useState<NotificationDiagnosticsFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [bookingCode, setBookingCode] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getNotificationDiagnosticsFull());
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(fn: () => Promise<{ message?: string; retried?: number } | void>) {
    setBusy(true);
    setActionMsg(null);
    setActionErr(null);
    try {
      const out = await fn();
      if (out && 'retried' in out && out.retried != null) {
        const still = 'stillFailed' in out ? (out as { stillFailed?: number }).stillFailed : undefined;
        setActionMsg(
          `Поставлено на retry: ${out.retried}${still != null ? `, осталось failed: ${still}` : ''}`,
        );
      } else if (out && 'message' in out && out.message) {
        setActionMsg(out.message);
      } else {
        setActionMsg('Готово');
      }
      await load();
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  }

  const nw = data?.notificationWorker;
  const ac = data?.autoCompleteWorker;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={paGhostBtn} disabled={busy || loading} onClick={() => void load()}>
          Обновить диагностику
        </button>
      </div>

      {loading ? <PlatformAdminLoading rows={6} /> : null}
      {error ? <PlatformAdminError message={error} onRetry={() => void load()} /> : null}

      {data && !loading ? (
        <>
          <section className={`${paCard} p-5`}>
            <h3 className="text-[15px] font-bold text-[#111827]">Окружение</h3>
            <div className="mt-3">
              <StatusRow label="Environment" value={data.environment} />
              <StatusRow label="App public URL" value={data.appPublicUrl} />
              <StatusRow
                label="Notification jobs enabled"
                value={data.notificationJobsEnabled ? 'да' : 'нет'}
                ok={data.notificationJobsEnabled}
              />
            </div>
          </section>

          <section className={`${paCard} p-5`}>
            <h3 className="text-[15px] font-bold text-[#111827]">Провайдеры</h3>
            <div className="mt-3">
              <StatusRow
                label="Resend"
                value={data.resendConfigured ? 'настроен' : 'Resend не настроен'}
                ok={data.resendConfigured}
              />
              <StatusRow label="From email" value={data.resendFrom ?? '—'} />
              <StatusRow
                label="Telegram"
                value={data.telegramConfigured ? 'настроен' : 'Telegram не настроен'}
                ok={data.telegramConfigured}
              />
            </div>
          </section>

          <section className={`${paCard} p-5`}>
            <h3 className="text-[15px] font-bold text-[#111827]">Workers</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-[#f6f7fb] p-4 text-[13px]">
                <p className="font-bold text-[#111827]">Notification worker</p>
                <p className="mt-2 text-[#6B7280]">
                  running: {nw?.running ? 'да' : 'нет'} · enabled: {nw?.enabled ? 'да' : 'нет'}
                </p>
                <p className="text-[#6B7280]">lastRun: {nw?.lastTickAt ?? '—'}</p>
                {nw?.lastTickError ? (
                  <p className="mt-1 text-rose-700">error: {nw.lastTickError}</p>
                ) : null}
                {nw?.lastReport ? (
                  <p className="mt-2 text-[#374151]">
                    processed: claimed {nw.lastReport.claimed}, sent {nw.lastReport.sent}, failed{' '}
                    {nw.lastReport.failed}, skipped {nw.lastReport.skipped}
                  </p>
                ) : null}
              </div>
              <div className="rounded-xl bg-[#f6f7fb] p-4 text-[13px]">
                <p className="font-bold text-[#111827]">Auto-complete worker</p>
                <p className="mt-2 text-[#6B7280]">running: {ac?.running ? 'да' : 'нет'}</p>
                <p className="text-[#6B7280]">lastRun: {ac?.lastTickAt ?? '—'}</p>
                <p className="text-[#6B7280]">last processed: {ac?.lastProcessed ?? 0}</p>
                {ac?.lastError ? <p className="mt-1 text-rose-700">error: {ac.lastError}</p> : null}
              </div>
            </div>
          </section>

          <section className={`${paCard} p-5`}>
            <h3 className="text-[15px] font-bold text-[#111827]">Очередь jobs</h3>
            <div className="mt-3">
              <StatusRow label="Pending" value={String(data.pendingJobs)} />
              <StatusRow label="Failed" value={String(data.failedJobs)} ok={data.failedJobs === 0} />
              {Object.entries(data.jobCounts).map(([status, count]) => (
                <StatusRow key={status} label={status} value={String(count)} />
              ))}
            </div>
            {data.lastFailedJobs.length > 0 ? (
              <ul className="mt-4 max-h-48 space-y-2 overflow-y-auto">
                {data.lastFailedJobs.map((j) => (
                  <li key={j.id} className="rounded-lg bg-rose-50 px-3 py-2 text-[12px] text-rose-900">
                    <span className="font-semibold">
                      {j.jobType} · {j.channel}
                    </span>
                    <span className="text-rose-700"> · {j.lastError ?? 'без текста'}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className={`${paCard} p-5`}>
            <h3 className="text-[15px] font-bold text-[#111827]">Проверки</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                className="rounded-xl bg-[#ff5f7a] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
                onClick={() =>
                  void runAction(async () => {
                    const r = await postTestNotificationEmail();
                    return { message: r.to ? `Email отправлен на ${r.to}` : 'Email отправлен' };
                  })
                }
              >
                Отправить test email
              </button>
              <button
                type="button"
                disabled={busy}
                className="rounded-xl border border-[#e5e7eb] px-4 py-2 text-[13px] font-semibold disabled:opacity-50"
                onClick={() =>
                  void runAction(async () => {
                    const r = await postTestNotificationTelegram();
                    if (r.skipped) return { message: 'Telegram не привязан к профилю админа (skipped)' };
                    return { message: `Telegram: ${r.status}` };
                  })
                }
              >
                Отправить test Telegram
              </button>
              <button
                type="button"
                disabled={busy || data.failedJobs === 0}
                className="rounded-xl border border-[#e5e7eb] px-4 py-2 text-[13px] font-semibold disabled:opacity-50"
                onClick={() => void runAction(() => postNotificationRetryFailed())}
              >
                Retry failed jobs
              </button>
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-2">
              <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-[12px] font-medium text-[#6B7280]">
                Booking code (SL-…)
                <input
                  value={bookingCode}
                  onChange={(e) => setBookingCode(e.target.value)}
                  className="rounded-lg border border-[#e5e7eb] px-3 py-2 text-[14px] text-[#111827]"
                  placeholder="SL-XXXXXXXXXXXX"
                />
              </label>
              <button
                type="button"
                disabled={busy || !bookingCode.trim()}
                className="rounded-xl bg-[#111827] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
                onClick={() =>
                  void runAction(async () => {
                    const r = await postTestBookingNotification(bookingCode.trim());
                    return { message: `Тест booking email → ${r.to}` };
                  })
                }
              >
                Проверить booking notification
              </button>
            </div>
            {actionMsg ? (
              <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-[13px] text-emerald-900">
                {actionMsg}
              </p>
            ) : null}
            {actionErr ? (
              <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[13px] text-rose-900">{actionErr}</p>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}
