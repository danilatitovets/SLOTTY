import { sendSlottyEmail } from '../auth/email/resendMail.js';
import { resolveAccountEmail } from '../profiles/profiles.service.js';
import { formatAppointmentDateTime } from '../telegram/formatAppointmentDateTime.js';
import { clientAppointmentsUrl, masterPendingAppointmentsUrl } from '../notifications/appointmentNotifyLinks.js';
import type { AppointmentNotifyContext } from './appointmentNotifyContext.js';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function bookingEmailHtml(params: {
  title: string;
  intro: string;
  rows: Array<{ label: string; value: string }>;
  ctaLabel: string;
  ctaUrl: string;
}): string {
  const rowsHtml = params.rows
    .map(
      (r) =>
        `<tr><td style="padding:8px 12px 8px 0;color:#6B7280;font-size:14px;vertical-align:top;">${escapeHtml(r.label)}</td>` +
        `<td style="padding:8px 0;font-size:14px;font-weight:600;color:#111827;">${escapeHtml(r.value)}</td></tr>`,
    )
    .join('');

  return (
    `<div style="font-family:Inter,Segoe UI,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;">` +
    `<p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#F47C8C;">SLOTTY</p>` +
    `<h1 style="margin:0 0 12px;font-size:20px;color:#111827;">${escapeHtml(params.title)}</h1>` +
    `<p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#374151;">${escapeHtml(params.intro)}</p>` +
    `<table style="width:100%;border-collapse:collapse;margin:0 0 24px;">${rowsHtml}</table>` +
    `<a href="${escapeHtml(params.ctaUrl)}" style="display:inline-block;background:#F47C8C;color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:999px;">${escapeHtml(params.ctaLabel)}</a>` +
    `<p style="margin:24px 0 0;font-size:12px;color:#9CA3AF;">Оплата услуги — у мастера на месте. SLOTTY не списывает карту при записи.</p>` +
    `</div>`
  );
}

async function sendToProfile(
  profileId: string,
  subject: string,
  html: string,
  text: string,
): Promise<void> {
  const email = await resolveAccountEmail(profileId);
  if (!email) return;
  try {
    await sendSlottyEmail({ to: email, subject, html, text });
  } catch (e) {
    console.warn(`[notify] appointment email to ${profileId}:`, e instanceof Error ? e.message : e);
  }
}

export async function sendAppointmentCreatedEmails(ctx: AppointmentNotifyContext): Promise<void> {
  const { date, time } = formatAppointmentDateTime(ctx.startsAt);
  const when = `${date}, ${time}`;
  const voucher = ctx.voucherNumber ? `\nНомер записи: ${ctx.voucherNumber}` : '';

  await Promise.all([
    sendToProfile(
      ctx.clientId,
      'Заявка на запись отправлена — SLOTTY',
      bookingEmailHtml({
        title: 'Заявка отправлена',
        intro: 'Мы сообщим в Telegram, когда мастер подтвердит время.',
        rows: [
          { label: 'Мастер', value: ctx.masterName },
          { label: 'Услуга', value: ctx.serviceTitle },
          { label: 'Когда', value: when },
          ...(ctx.voucherNumber ? [{ label: 'Номер', value: ctx.voucherNumber }] : []),
        ],
        ctaLabel: 'Мои записи',
        ctaUrl: clientAppointmentsUrl(),
      }),
      `Заявка на запись отправлена.\nМастер: ${ctx.masterName}\nУслуга: ${ctx.serviceTitle}\nКогда: ${when}${voucher}\n${clientAppointmentsUrl()}`,
    ),
    sendToProfile(
      ctx.masterId,
      'Новая заявка на запись — SLOTTY',
      bookingEmailHtml({
        title: 'Новая заявка на запись',
        intro: 'Клиент записался онлайн. Подтвердите время в кабинете мастера.',
        rows: [
          { label: 'Клиент', value: ctx.clientName },
          ...(ctx.clientPhone ? [{ label: 'Телефон', value: ctx.clientPhone }] : []),
          { label: 'Услуга', value: ctx.serviceTitle },
          { label: 'Когда', value: when },
          ...(ctx.voucherNumber ? [{ label: 'Номер', value: ctx.voucherNumber }] : []),
        ],
        ctaLabel: 'Открыть заявки',
        ctaUrl: masterPendingAppointmentsUrl(),
      }),
      `Новая заявка на запись.\nКлиент: ${ctx.clientName}\nУслуга: ${ctx.serviceTitle}\nКогда: ${when}${voucher}\n${masterPendingAppointmentsUrl()}`,
    ),
  ]);
}
