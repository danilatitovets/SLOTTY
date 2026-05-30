import { useCallback, useEffect, useState } from 'react';
import { EMPTY_DATE } from '../../../shared/lib/emptyDisplayText';
import {
  createEmailCampaign,
  getEmailCampaignRecipients,
  getEmailCampaigns,
  getEmailSendingStatus,
  getNewsletterSubscribers,
  previewEmailCampaign,
  retryEmailCampaignRecipient,
  sendEmailCampaign,
  sendTestEmailCampaign,
  updateEmailCampaign,
} from '../api/platformAdminApi';
import type { EmailCampaignAdmin, EmailCampaignAudience } from '../api/platformAdmin.types';
import {
  PlatformAdminCard,
  PlatformAdminEmpty,
  PlatformAdminError,
  PlatformAdminLoading,
} from '../shared/PlatformAdminSharedUi';
import { paDangerBtn, paGhostBtn, paInput, paPrimaryBtn } from '../platformAdminTheme';

const AUDIENCE_LABELS: Record<EmailCampaignAudience, string> = {
  newsletter_subscribers: 'Подписчики рассылки',
  masters: 'Мастера',
  clients: 'Клиенты',
  all_profiles: 'Все пользователи',
  test_only: 'Только тестовый email',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  sending: 'Отправка…',
  sent: 'Отправлено',
  failed: 'Ошибка',
  cancelled: 'Отменено',
  scheduled: 'Запланировано',
};

function formatDate(iso: string | null): string {
  if (!iso) return EMPTY_DATE;
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PlatformAdminEmailCampaignsTab() {
  const [campaigns, setCampaigns] = useState<EmailCampaignAdmin[]>([]);
  const [subscribersTotal, setSubscribersTotal] = useState(0);
  const [emailStatus, setEmailStatus] = useState<{ configured: boolean; from: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [ctaText, setCtaText] = useState('Открыть SLOTTY');
  const [ctaUrl, setCtaUrl] = useState('https://slotty.of.by/book');
  const [audience, setAudience] = useState<EmailCampaignAudience>('newsletter_subscribers');
  const [testEmail, setTestEmail] = useState('');
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [confirmSendOpen, setConfirmSendOpen] = useState(false);
  const [recipients, setRecipients] = useState<Awaited<ReturnType<typeof getEmailCampaignRecipients>> | null>(null);

  const selected = campaigns.find((c) => c.id === selectedId) ?? null;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [campaignRes, subsRes, statusRes] = await Promise.all([
        getEmailCampaigns(),
        getNewsletterSubscribers({ status: 'subscribed', limit: 1 }),
        getEmailSendingStatus(),
      ]);
      setCampaigns(campaignRes.items);
      setSubscribersTotal(subsRes.total);
      setEmailStatus(statusRes);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selectedId) {
      setRecipientCount(null);
      setPreviewHtml(null);
      setRecipients(null);
      return;
    }

    void previewEmailCampaign(selectedId)
      .then((p) => {
        setRecipientCount(p.recipientCount);
        setPreviewHtml(p.previewHtml);
      })
      .catch(() => {});

    void getEmailCampaignRecipients(selectedId, { limit: 20 })
      .then(setRecipients)
      .catch(() => setRecipients(null));
  }, [selectedId, campaigns]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !subject.trim() || !bodyText.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const created = await createEmailCampaign({
        title: title.trim(),
        subject: subject.trim(),
        previewText: previewText.trim() || null,
        bodyText: bodyText.trim(),
        ctaText: ctaText.trim() || null,
        ctaUrl: ctaUrl.trim() || null,
        audience,
      });
      setFormOpen(false);
      setTitle('');
      setSubject('');
      setPreviewText('');
      setBodyText('');
      await load();
      setSelectedId(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать');
    } finally {
      setBusy(false);
    }
  }

  async function onSaveDraft() {
    if (!selected || selected.status !== 'draft') return;
    setBusy(true);
    setError(null);
    try {
      await updateEmailCampaign(selected.id, {
        title,
        subject,
        previewText: previewText || null,
        bodyText,
        ctaText: ctaText || null,
        ctaUrl: ctaUrl || null,
        audience,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить');
    } finally {
      setBusy(false);
    }
  }

  function selectCampaign(c: EmailCampaignAdmin) {
    setSelectedId(c.id);
    setTitle(c.title);
    setSubject(c.subject);
    setPreviewText(c.previewText ?? '');
    setBodyText(c.bodyText ?? '');
    setCtaText(c.ctaText ?? 'Открыть SLOTTY');
    setCtaUrl(c.ctaUrl ?? 'https://slotty.of.by/book');
    setAudience(c.audience);
    setConfirmSendOpen(false);
  }

  async function onTestSend() {
    if (!selected || !testEmail.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const result = await sendTestEmailCampaign(selected.id, testEmail.trim());
      if (result.devLogged) {
        setError('Dev-режим: письмо залогировано в консоль сервера (нет RESEND_API_KEY).');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить тест');
    } finally {
      setBusy(false);
    }
  }

  async function onSendConfirmed() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const result = await sendEmailCampaign(selected.id, {
        confirmed: true,
        testEmail: selected.audience === 'test_only' ? testEmail.trim() || null : null,
      });
      setConfirmSendOpen(false);
      await load();
      alert(`Готово: отправлено ${result.sent}, ошибок ${result.failed}, пропущено ${result.skipped}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить');
    } finally {
      setBusy(false);
    }
  }

  async function onRetryRecipient(recipientId: string) {
    if (!selected) return;
    setBusy(true);
    try {
      await retryEmailCampaignRecipient(selected.id, recipientId);
      const r = await getEmailCampaignRecipients(selected.id, { limit: 20 });
      setRecipients(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Retry failed');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <PlatformAdminLoading />;
  if (error && campaigns.length === 0) return <PlatformAdminError message={error} onRetry={() => void load()} />;

  return (
    <div className="space-y-5">
      {emailStatus && !emailStatus.configured ? (
        <PlatformAdminCard className="border-amber-200 bg-amber-50 p-4 text-[14px] text-amber-900">
          Resend не настроен (RESEND_API_KEY / RESEND_FROM). В production массовая отправка будет недоступна.
        </PlatformAdminCard>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] text-[#6B7280]">
          Подписчиков рассылки: <strong>{subscribersTotal}</strong>
          {emailStatus?.from ? ` · Отправитель: ${emailStatus.from}` : null}
        </p>
        <button type="button" className={paPrimaryBtn} onClick={() => setFormOpen((v) => !v)}>
          {formOpen ? 'Скрыть форму' : 'Новая рассылка'}
        </button>
      </div>

      {error ? <PlatformAdminCard className="p-4 text-[14px] text-red-600">{error}</PlatformAdminCard> : null}

      {formOpen ? (
        <PlatformAdminCard className="p-5">
          <form className="space-y-4" onSubmit={onCreate}>
            <h3 className="text-[16px] font-semibold text-[#111827]">Черновик кампании</h3>
            <input className={paInput} placeholder="Название (внутреннее)" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <input className={paInput} placeholder="Тема письма" value={subject} onChange={(e) => setSubject(e.target.value)} required />
            <input className={paInput} placeholder="Preview text (опционально)" value={previewText} onChange={(e) => setPreviewText(e.target.value)} />
            <textarea className={`${paInput} min-h-[140px] resize-y`} placeholder="Текст письма (plain text, абзацы через пустую строку)" value={bodyText} onChange={(e) => setBodyText(e.target.value)} required />
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={paInput} placeholder="Текст кнопки" value={ctaText} onChange={(e) => setCtaText(e.target.value)} />
              <input className={paInput} placeholder="URL кнопки (https://slotty.of.by/…)" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} />
            </div>
            <select className={paInput} value={audience} onChange={(e) => setAudience(e.target.value as EmailCampaignAudience)}>
              {(Object.keys(AUDIENCE_LABELS) as EmailCampaignAudience[]).map((a) => (
                <option key={a} value={a}>
                  {AUDIENCE_LABELS[a]}
                </option>
              ))}
            </select>
            {audience === 'all_profiles' ? (
              <p className="text-[13px] text-amber-800">
                Используйте только для важных сервисных уведомлений, не для маркетинга.
              </p>
            ) : null}
            <button type="submit" className={paPrimaryBtn} disabled={busy}>
              Сохранить черновик
            </button>
          </form>
        </PlatformAdminCard>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,340px)_1fr]">
        <PlatformAdminCard className="overflow-hidden">
          {campaigns.length === 0 ? (
            <PlatformAdminEmpty title="Нет кампаний" text="Создайте черновик рассылки." />
          ) : (
            <ul className="divide-y divide-[#eef0f5]">
              {campaigns.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`w-full px-4 py-3 text-left transition hover:bg-[#fafbff] ${selectedId === c.id ? 'bg-[#fff5f7]' : ''}`}
                    onClick={() => selectCampaign(c)}
                  >
                    <p className="text-[14px] font-semibold text-[#111827]">{c.title}</p>
                    <p className="mt-0.5 text-[12px] text-[#6B7280]">
                      {STATUS_LABELS[c.status] ?? c.status} · {AUDIENCE_LABELS[c.audience]}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </PlatformAdminCard>

        {selected ? (
          <div className="space-y-4">
            <PlatformAdminCard className="space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-[18px] font-semibold text-[#111827]">{selected.title}</h3>
                  <p className="mt-1 text-[13px] text-[#6B7280]">
                    {STATUS_LABELS[selected.status]} · {formatDate(selected.sentAt ?? selected.createdAt)}
                  </p>
                </div>
                {selected.status === 'draft' ? (
                  <button type="button" className={paGhostBtn} disabled={busy} onClick={() => void onSaveDraft()}>
                    Сохранить
                  </button>
                ) : null}
              </div>

              {selected.status === 'draft' ? (
                <>
                  <input className={paInput} value={subject} onChange={(e) => setSubject(e.target.value)} />
                  <textarea className={`${paInput} min-h-[120px]`} value={bodyText} onChange={(e) => setBodyText(e.target.value)} />
                  <select className={paInput} value={audience} onChange={(e) => setAudience(e.target.value as EmailCampaignAudience)}>
                    {(Object.keys(AUDIENCE_LABELS) as EmailCampaignAudience[]).map((a) => (
                      <option key={a} value={a}>
                        {AUDIENCE_LABELS[a]}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <p className="text-[14px] text-[#374151]">{selected.subject}</p>
              )}

              <p className="text-[13px] text-[#6B7280]">
                Получателей: <strong>{recipientCount ?? '…'}</strong>
              </p>

              {previewHtml ? (
                <div className="overflow-hidden rounded-2xl border border-[#eef0f5] bg-[#fafafa] p-4">
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Preview HTML</p>
                  <div className="max-h-[320px] overflow-auto text-[13px]" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <input
                  className={`${paInput} max-w-xs`}
                  type="email"
                  placeholder="Email для теста"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
                <button type="button" className={paGhostBtn} disabled={busy || !testEmail.trim()} onClick={() => void onTestSend()}>
                  Тестовое письмо
                </button>
                {selected.status === 'draft' ? (
                  <button type="button" className={paPrimaryBtn} disabled={busy} onClick={() => setConfirmSendOpen(true)}>
                    Отправить кампанию
                  </button>
                ) : null}
              </div>
            </PlatformAdminCard>

            {recipients && recipients.items.length > 0 ? (
              <PlatformAdminCard className="overflow-x-auto p-4">
                <p className="mb-3 text-[14px] font-semibold text-[#111827]">Доставка ({recipients.total})</p>
                <table className="min-w-full text-left text-[13px]">
                  <thead>
                    <tr className="text-[#6B7280]">
                      <th className="pb-2 pr-4">Email</th>
                      <th className="pb-2 pr-4">Статус</th>
                      <th className="pb-2 pr-4">Ошибка</th>
                      <th className="pb-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {recipients.items.map((r) => (
                      <tr key={r.id} className="border-t border-[#eef0f5]">
                        <td className="py-2 pr-4">{r.email}</td>
                        <td className="py-2 pr-4">{r.status}</td>
                        <td className="py-2 pr-4 text-[#9CA3AF]">{r.errorMessage ?? '—'}</td>
                        <td className="py-2">
                          {r.status === 'failed' ? (
                            <button type="button" className="text-[#ff5f7a] underline" disabled={busy} onClick={() => void onRetryRecipient(r.id)}>
                              Retry
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </PlatformAdminCard>
            ) : null}
          </div>
        ) : (
          <PlatformAdminCard className="p-8">
            <PlatformAdminEmpty title="Выберите кампанию" text="Или создайте новый черновик." />
          </PlatformAdminCard>
        )}
      </div>

      {confirmSendOpen && selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-[18px] font-semibold text-[#111827]">Подтвердите отправку</h3>
            <p className="mt-2 text-[14px] text-[#6B7280]">
              Кампания «{selected.title}» будет отправлена аудитории «{AUDIENCE_LABELS[selected.audience]}» (
              {recipientCount ?? '?'} получателей).
            </p>
            {selected.audience === 'all_profiles' ? (
              <p className="mt-3 rounded-xl bg-amber-50 p-3 text-[13px] text-amber-900">
                Это все пользователи с подтверждённым email. Используйте только для сервисных уведомлений, не для
                маркетинга.
              </p>
            ) : null}
            {selected.audience === 'test_only' && !testEmail.trim() ? (
              <p className="mt-3 text-[13px] text-red-600">Укажите тестовый email перед отправкой.</p>
            ) : null}
            <div className="mt-6 flex gap-3">
              <button type="button" className={paGhostBtn} onClick={() => setConfirmSendOpen(false)}>
                Отмена
              </button>
              <button
                type="button"
                className={paDangerBtn}
                disabled={busy || (selected.audience === 'test_only' && !testEmail.trim())}
                onClick={() => void onSendConfirmed()}
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
