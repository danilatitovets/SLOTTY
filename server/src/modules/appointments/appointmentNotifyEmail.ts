import type { NotifyUserEmail } from '../notifications/notifyUser.js';
import { formatAppointmentDateTime } from '../telegram/formatAppointmentDateTime.js';
import {
  buildBookingEmailLink,
  clientAppointmentsUrl,
  masterPendingAppointmentsUrl,
} from '../notifications/appointmentNotifyLinks.js';
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
  footerNote?: string;
  voucherNumber?: string | null;
}): string {
  const rowsHtml = params.rows
    .map(
      (r) =>
        `<tr><td style="padding:8px 12px 8px 0;color:#6B7280;font-size:14px;vertical-align:top;white-space:nowrap;">${escapeHtml(r.label)}</td>` +
        `<td style="padding:8px 0;font-size:14px;font-weight:600;color:#111827;">${escapeHtml(r.value)}</td></tr>`,
    )
    .join('');

  const footer =
    params.footerNote ??
    'Оплата услуги — у мастера на месте. SLOTTY не списывает карту при записи.';

  const voucherLine = params.voucherNumber
    ? `<p style="margin:16px 0 0;font-size:11px;color:#9CA3AF;">№ записи: ${escapeHtml(params.voucherNumber)}</p>`
    : '';

  return (
    `<div style="font-family:Inter,Segoe UI,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;">` +
    `<p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#F47C8C;">SLOTTY</p>` +
    `<h1 style="margin:0 0 12px;font-size:20px;color:#111827;">${escapeHtml(params.title)}</h1>` +
    `<p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#374151;">${escapeHtml(params.intro)}</p>` +
    `<table style="width:100%;border-collapse:collapse;margin:0 0 24px;background:#FAFAFA;border-radius:12px;padding:4px 12px;">${rowsHtml}</table>` +
    `<a href="${escapeHtml(params.ctaUrl)}" style="display:inline-block;background:#F47C8C;color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:999px;">${escapeHtml(params.ctaLabel)}</a>` +
    voucherLine +
    `<p style="margin:24px 0 0;font-size:12px;color:#9CA3AF;line-height:1.5;">${escapeHtml(footer)}</p>` +
    `</div>`
  );
}

function whenRows(ctx: AppointmentNotifyContext): { when: string; date: string; time: string } {
  const { date, time } = formatAppointmentDateTime(ctx.startsAt);
  return { when: `${date}, ${time}`, date, time };
}

function clientCta(ctx: AppointmentNotifyContext): { label: string; url: string } {
  if (ctx.voucherNumber) {
    return {
      label: 'Открыть запись',
      url: buildBookingEmailLink('client', ctx.voucherNumber),
    };
  }
  return { label: 'Мои записи', url: clientAppointmentsUrl() };
}

function masterCta(ctx: AppointmentNotifyContext): { label: string; url: string } {
  if (ctx.voucherNumber) {
    return {
      label: 'Открыть запись',
      url: buildBookingEmailLink('master', ctx.voucherNumber),
    };
  }
  return { label: 'Открыть заявки', url: masterPendingAppointmentsUrl() };
}

function plainDetails(ctx: AppointmentNotifyContext, when: string): string {
  const lines = [
    `Мастер: ${ctx.masterName}`,
    `Услуга: ${ctx.serviceTitle}`,
    `Когда: ${when}`,
  ];
  if (ctx.voucherNumber) lines.push(`№ ${ctx.voucherNumber}`);
  return lines.join('\n');
}

/** Клиент: заявка отправлена. */
export function clientBookingCreatedEmail(ctx: AppointmentNotifyContext): NotifyUserEmail {
  const { when } = whenRows(ctx);
  const cta = clientCta(ctx);
  const rows = [
    { label: 'Мастер', value: ctx.masterName },
    { label: 'Услуга', value: ctx.serviceTitle },
    { label: 'Дата и время', value: when },
  ];
  const text = `Заявка на запись отправлена.\n${plainDetails(ctx, when)}\n\n${cta.url}`;

  return {
    subject: 'Заявка на запись отправлена — SLOTTY',
    html: bookingEmailHtml({
      title: 'Заявка отправлена',
      intro:
        'Мастер получил вашу заявку. Когда он подтвердит время, вы получите письмо и уведомление с деталями визита.',
      rows,
      ctaLabel: cta.label,
      ctaUrl: cta.url,
      voucherNumber: ctx.voucherNumber,
    }),
    text,
  };
}

/** Клиент: мастер подтвердил запись. */
export function clientBookingConfirmedEmail(ctx: AppointmentNotifyContext): NotifyUserEmail {
  const { when } = whenRows(ctx);
  const cta = clientCta(ctx);
  const rows = [
    { label: 'Мастер', value: ctx.masterName },
    { label: 'Услуга', value: ctx.serviceTitle },
    { label: 'Дата и время', value: when },
  ];
  const text = `Запись подтверждена.\n${plainDetails(ctx, when)}\n\n${cta.url}`;

  return {
    subject: 'Ваша запись в SLOTTY подтверждена',
    html: bookingEmailHtml({
      title: 'Запись подтверждена',
      intro: `${ctx.masterName} подтвердил(а) вашу запись. Ниже — детали визита.`,
      rows,
      ctaLabel: cta.label,
      ctaUrl: cta.url,
      voucherNumber: ctx.voucherNumber,
      footerNote:
        'Если планы изменились, отмените запись заранее в приложении, чтобы освободить время мастера.',
    }),
    text,
  };
}

/** Клиент: мастер отменил. */
export function clientBookingCancelledByMasterEmail(ctx: AppointmentNotifyContext): NotifyUserEmail {
  const { when } = whenRows(ctx);
  const cta = clientCta(ctx);
  const text = `Запись отменена мастером.\n${plainDetails(ctx, when)}\n\n${cta.url}`;

  return {
    subject: 'Запись отменена мастером — SLOTTY',
    html: bookingEmailHtml({
      title: 'Запись отменена',
      intro: `${ctx.masterName} отменил(а) запись. Вы можете выбрать другое время.`,
      rows: [
        { label: 'Услуга', value: ctx.serviceTitle },
        { label: 'Было запланировано', value: when },
      ],
      ctaLabel: cta.label,
      ctaUrl: cta.url,
      voucherNumber: ctx.voucherNumber,
    }),
    text,
  };
}

/** Клиент: сам отменил. */
export function clientBookingCancelledBySelfEmail(ctx: AppointmentNotifyContext): NotifyUserEmail {
  const { when } = whenRows(ctx);
  const cta = clientCta(ctx);
  const text = `Вы отменили запись.\n${plainDetails(ctx, when)}\n${cta.url}`;

  return {
    subject: 'Запись отменена — SLOTTY',
    html: bookingEmailHtml({
      title: 'Запись отменена',
      intro: 'Вы отменили запись. При необходимости можно записаться снова.',
      rows: [
        { label: 'Мастер', value: ctx.masterName },
        { label: 'Услуга', value: ctx.serviceTitle },
        { label: 'Было', value: when },
      ],
      ctaLabel: cta.label,
      ctaUrl: cta.url,
      voucherNumber: ctx.voucherNumber,
    }),
    text,
  };
}

/** Клиент: визит завершён. */
export function clientBookingCompletedEmail(ctx: AppointmentNotifyContext): NotifyUserEmail {
  const { when } = whenRows(ctx);
  const cta = clientCta(ctx);
  const text = `Визит завершён.\n${plainDetails(ctx, when)}\n\n${cta.url}`;

  return {
    subject: 'Визит завершён — SLOTTY',
    html: bookingEmailHtml({
      title: 'Спасибо за визит',
      intro: `Надеемся, вам понравился визит к ${ctx.masterName}. Оставьте отзыв — это помогает другим клиентам.`,
      rows: [
        { label: 'Услуга', value: ctx.serviceTitle },
        { label: 'Когда', value: when },
      ],
      ctaLabel: 'Оставить отзыв',
      ctaUrl: cta.url,
      voucherNumber: ctx.voucherNumber,
    }),
    text,
  };
}

/** Мастер: новая заявка. */
export function masterBookingCreatedEmail(ctx: AppointmentNotifyContext): NotifyUserEmail {
  const { when } = whenRows(ctx);
  const cta = masterCta(ctx);
  const rows = [
    { label: 'Клиент', value: ctx.clientName },
    ...(ctx.clientPhone ? [{ label: 'Телефон', value: ctx.clientPhone }] : []),
    { label: 'Услуга', value: ctx.serviceTitle },
    { label: 'Дата и время', value: when },
  ];
  const text = `Новая заявка на запись.\nКлиент: ${ctx.clientName}\n${plainDetails(ctx, when)}\n${cta.url}`;

  return {
    subject: 'Новая запись в SLOTTY',
    html: bookingEmailHtml({
      title: 'Новая заявка на запись',
      intro: 'Клиент записался онлайн. Подтвердите или отклоните заявку в кабинете мастера.',
      rows,
      ctaLabel: cta.label,
      ctaUrl: cta.url,
      voucherNumber: ctx.voucherNumber,
    }),
    text,
  };
}

/** Напоминание клиенту (1ч / 24ч). */
export function clientBookingReminderEmail(
  ctx: AppointmentNotifyContext,
  kind: 'booking_reminder_1h' | 'booking_reminder_24h',
): NotifyUserEmail {
  const { when } = whenRows(ctx);
  const cta = clientCta(ctx);
  const lead = kind === 'booking_reminder_24h' ? 'завтра' : 'через 1 час';
  return {
    subject: 'Напоминание: запись через 1 час — SLOTTY',
    html: bookingEmailHtml({
      title: 'Напоминание о записи',
      intro: `Напоминание: ${lead} у вас запись в SLOTTY.`,
      rows: [
        { label: 'Услуга', value: ctx.serviceTitle },
        { label: 'Мастер', value: ctx.masterName },
        { label: 'Дата и время', value: when },
      ],
      ctaLabel: cta.label,
      ctaUrl: cta.url,
      voucherNumber: ctx.voucherNumber,
    }),
    text: `Напоминание: запись ${lead}.\n${plainDetails(ctx, when)}\n${cta.url}`,
  };
}

/** Напоминание мастеру (1ч / 24ч). */
export function masterBookingReminderEmail(
  ctx: AppointmentNotifyContext,
  kind: 'booking_reminder_1h' | 'booking_reminder_24h',
): NotifyUserEmail {
  const { when } = whenRows(ctx);
  const cta = masterCta(ctx);
  const lead = kind === 'booking_reminder_24h' ? 'завтра' : 'через 1 час';
  return {
    subject: 'Напоминание: запись через 1 час — SLOTTY',
    html: bookingEmailHtml({
      title: 'Напоминание о записи',
      intro: `Через ${lead === 'завтра' ? 'сутки' : 'час'} у вас запись с клиентом.`,
      rows: [
        { label: 'Клиент', value: ctx.clientName },
        { label: 'Услуга', value: ctx.serviceTitle },
        { label: 'Дата и время', value: when },
      ],
      ctaLabel: cta.label,
      ctaUrl: cta.url,
      voucherNumber: ctx.voucherNumber,
    }),
    text: `Напоминание: запись ${lead}.\nКлиент: ${ctx.clientName}\n${cta.url}`,
  };
}

/** Мастер: клиент отменил. */
export function masterClientCancelledEmail(ctx: AppointmentNotifyContext): NotifyUserEmail {
  const { when } = whenRows(ctx);
  const cta = masterCta(ctx);
  const text = `Клиент отменил запись.\nКлиент: ${ctx.clientName}\nУслуга: ${ctx.serviceTitle}\nКогда: ${when}\n${cta.url}`;

  return {
    subject: 'Клиент отменил запись — SLOTTY',
    html: bookingEmailHtml({
      title: 'Клиент отменил запись',
      intro: `${ctx.clientName} отменил(а) запись. Слот снова доступен для других клиентов.`,
      rows: [
        { label: 'Клиент', value: ctx.clientName },
        { label: 'Услуга', value: ctx.serviceTitle },
        { label: 'Было', value: when },
      ],
      ctaLabel: cta.label,
      ctaUrl: cta.url,
      voucherNumber: ctx.voucherNumber,
    }),
    text,
  };
}
