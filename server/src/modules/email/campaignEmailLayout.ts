import { slottyEmailLayout } from '../auth/email/emailLayout.js';
import { publicAppUrl } from '../../lib/publicAppUrl.js';

const MUTED = '#6B7280';

export function plainTextToSafeHtml(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return `<p style="margin:0;color:${MUTED};">&nbsp;</p>`;
  }
  return trimmed
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split('\n').map((l) => escapeHtml(l.trim())).filter(Boolean);
      return `<p style="margin:0 0 12px;color:${MUTED};">${lines.join('<br />')}</p>`;
    })
    .join('');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type NewsletterCampaignEmailParams = {
  subject: string;
  previewText?: string | null;
  bodyText: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  unsubscribeToken: string;
};

export function newsletterCampaignEmail(params: NewsletterCampaignEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const ctaLabel = params.ctaLabel?.trim() || 'Открыть SLOTTY';
  const ctaUrl = params.ctaUrl?.trim() || publicAppUrl('/book');
  const unsubscribeUrl = publicAppUrl(`/unsubscribe/newsletter/${encodeURIComponent(params.unsubscribeToken)}`);
  const bodyHtml = plainTextToSafeHtml(params.bodyText);
  const preview = params.previewText?.trim() || params.subject;

  const html = slottyEmailLayout({
    title: params.subject,
    preview,
    bodyHtml,
    ctaLabel,
    ctaUrl,
    footerNote: `Вы получили это письмо, потому что подписались на новости SLOTTY. <a href="${escapeHtml(unsubscribeUrl)}" style="color:#F47C8C;">Отписаться от рассылки</a>.`,
  });

  const text = [
    params.subject,
    '',
    params.bodyText.trim(),
    '',
    `${ctaLabel}: ${ctaUrl}`,
    '',
    `Отписаться от рассылки: ${unsubscribeUrl}`,
    '',
    '© SLOTTY',
  ].join('\n');

  return { subject: params.subject, html, text };
}

export function testCampaignEmail(params: {
  subject: string;
  previewText?: string | null;
  bodyText: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
}): { subject: string; html: string; text: string } {
  const ctaLabel = params.ctaLabel?.trim() || 'Открыть SLOTTY';
  const ctaUrl = params.ctaUrl?.trim() || publicAppUrl('/book');
  const bodyHtml = plainTextToSafeHtml(params.bodyText);
  const preview = params.previewText?.trim() || `[Тест] ${params.subject}`;

  const html = slottyEmailLayout({
    title: params.subject,
    preview,
    bodyHtml,
    ctaLabel,
    ctaUrl,
    footerNote: 'Это тестовое письмо из админ-панели SLOTTY. Получатели рассылки его не видят.',
  });

  const text = [
    `[Тест] ${params.subject}`,
    '',
    params.bodyText.trim(),
    '',
    `${ctaLabel}: ${ctaUrl}`,
    '',
    '© SLOTTY — тестовое письмо',
  ].join('\n');

  return { subject: `[Тест] ${params.subject}`, html, text };
}

export function serviceCampaignEmail(params: {
  subject: string;
  previewText?: string | null;
  bodyText: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  unsubscribeToken?: string | null;
}): { subject: string; html: string; text: string } {
  const ctaLabel = params.ctaLabel?.trim() || 'Открыть SLOTTY';
  const ctaUrl = params.ctaUrl?.trim() || publicAppUrl('/book');
  const bodyHtml = plainTextToSafeHtml(params.bodyText);
  const preview = params.previewText?.trim() || params.subject;

  const unsubscribeNote = params.unsubscribeToken
    ? `Вы также подписаны на новости SLOTTY. <a href="${escapeHtml(publicAppUrl(`/unsubscribe/newsletter/${encodeURIComponent(params.unsubscribeToken)}`))}" style="color:#F47C8C;">Отписаться от рассылки</a>.`
    : 'Это сервисное уведомление для пользователей SLOTTY с подтверждённым email.';

  const html = slottyEmailLayout({
    title: params.subject,
    preview,
    bodyHtml,
    ctaLabel,
    ctaUrl,
    footerNote: unsubscribeNote,
  });

  const textLines = [params.subject, '', params.bodyText.trim(), '', `${ctaLabel}: ${ctaUrl}`];
  if (params.unsubscribeToken) {
    textLines.push('', `Отписаться от рассылки: ${publicAppUrl(`/unsubscribe/newsletter/${params.unsubscribeToken}`)}`);
  }
  textLines.push('', '© SLOTTY');

  return { subject: params.subject, html, text: textLines.join('\n') };
}
