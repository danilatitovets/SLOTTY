import { publicAppUrl } from '../../lib/publicAppUrl.js';

/** Логотип для тёмной шапки письма — тот же, что в bar-хедере сайта. */
export const SLOTTY_EMAIL_LOGO_PATH = '/photos/logo-header.webp';

/** Высота логотипа в шапке письма. */
export const SLOTTY_EMAIL_LOGO_HEIGHT_PX = 44;

const TEXT = '#111827';
const MUTED = '#6B7280';
const MUTED_LIGHT = '#9CA3AF';
const BORDER = '#F0F0F0';
const BG = '#F3F4F6';
const SURFACE = '#FFFFFF';
const HERO = '#0A0A0A';
const ACCENT = '#F47C8C';
const FOOTER_BG = '#FAFAFA';

export type TransactionalEmailRow = { label: string; value: string };

export function slottyEmailLogoUrl(): string {
  return publicAppUrl(SLOTTY_EMAIL_LOGO_PATH);
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function escapeAttr(text: string): string {
  return escapeHtml(text).replace(/'/g, '&#39;');
}

/** Логотип из шапки сайта — для тёмного фона письма. */
export function renderSlottyEmailLogo(): string {
  const src = slottyEmailLogoUrl();
  const h = SLOTTY_EMAIL_LOGO_HEIGHT_PX;
  return `<a href="${escapeAttr(publicAppUrl('/book'))}" target="_blank" style="text-decoration:none;">
    <img src="${escapeAttr(src)}" height="${h}" alt="SLOTTY" style="display:block;border:0;outline:none;text-decoration:none;height:${h}px;width:auto;max-width:180px;-ms-interpolation-mode:bicubic;" />
  </a>`;
}

function renderRows(rows: TransactionalEmailRow[]): string {
  return rows
    .map(
      (row, index) => `
        <tr>
          <td style="padding:14px 0;${index < rows.length - 1 ? `border-bottom:1px solid ${BORDER};` : ''}">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td class="detail-label" style="font-size:14px;line-height:1.5;color:${MUTED};vertical-align:top;padding-right:16px;">
                  ${escapeHtml(row.label)}
                </td>
                <td class="detail-value" align="right" style="font-size:14px;line-height:1.5;font-weight:600;color:${TEXT};vertical-align:top;">
                  ${escapeHtml(row.value)}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `,
    )
    .join('');
}

function emailBaseStyles(): string {
  return `
    body { margin:0 !important; padding:0 !important; width:100% !important; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    img { border:0; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
    table { border-collapse:collapse; mso-table-lspace:0; mso-table-rspace:0; }
    a { color:${ACCENT}; }
    @media only screen and (max-width:600px) {
      .email-shell { width:100% !important; max-width:100% !important; border-radius:0 !important; }
      .email-pad { padding-left:20px !important; padding-right:20px !important; }
      .email-hero-pad { padding-left:20px !important; padding-right:20px !important; }
      .header-meta { display:block !important; width:100% !important; text-align:left !important; padding-top:14px !important; }
      .detail-label, .detail-value { display:block !important; width:100% !important; text-align:left !important; }
      .detail-value { padding-top:4px !important; }
      .email-title { font-size:24px !important; }
      .email-cta { display:block !important; width:100% !important; text-align:center !important; box-sizing:border-box !important; }
    }
  `;
}

/** Безопасный рендер футера с опциональными ссылками (только доверенный HTML с сервера). */
function renderFooterNote(note: string): string {
  const linkRe = /<a\s+href="([^"]+)"\s+style="[^"]*">([\s\S]*?)<\/a>/gi;
  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRe.exec(note)) !== null) {
    if (match.index > lastIndex) {
      result += escapeHtml(note.slice(lastIndex, match.index));
    }
    const href = match[1] ?? '';
    const label = match[2] ?? '';
    if (/^https?:\/\//i.test(href)) {
      result += `<a href="${escapeAttr(href)}" style="color:${ACCENT};text-decoration:underline;font-weight:600;">${escapeHtml(label)}</a>`;
    } else {
      result += escapeHtml(match[0]);
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < note.length) {
    result += escapeHtml(note.slice(lastIndex));
  }

  return result || escapeHtml(note);
}

function renderBodyContent(intro: string, bodyHtml?: string): string {
  if (bodyHtml?.trim()) {
    return bodyHtml;
  }

  const trimmed = intro.trim();
  if (!trimmed) return '';

  return trimmed
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map(
      (block) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:${MUTED};">${escapeHtml(block.split('\n').join(' '))}</p>`,
    )
    .join('');
}

export type SlottyEmailParams = {
  documentTitle: string;
  preview: string;
  title: string;
  intro: string;
  /** Готовый безопасный HTML тела письма (приоритетнее intro). */
  bodyHtml?: string;
  rows?: TransactionalEmailRow[];
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
  /** Мелкая подпись справа в шапке, напр. «Заявка». */
  metaLabel?: string;
  /** Вторая строка справа, напр. номер SL-…. */
  metaValue?: string;
};

/** Единый шаблон писем SLOTTY — тёмная шапка, чистое тело, без рамок. */
export function buildSlottyEmailHtml(params: SlottyEmailParams): string {
  const ctaLabel = params.ctaLabel?.trim();
  const ctaUrl = params.ctaUrl?.trim();
  const rows = params.rows ?? [];
  const footerNote =
    params.footerNote ??
    'Это автоматическое уведомление SLOTTY. Если вы не ожидали это письмо, просто проигнорируйте его.';
  const siteUrl = publicAppUrl('/book');
  const bodyContent = renderBodyContent(params.intro, params.bodyHtml);

  const metaBlock =
    params.metaLabel || params.metaValue
      ? `<td class="header-meta" align="right" style="vertical-align:top;font-size:11px;line-height:1.45;font-weight:600;color:${MUTED_LIGHT};white-space:nowrap;">
          ${params.metaLabel ? escapeHtml(params.metaLabel) : ''}
          ${
            params.metaValue
              ? `<span style="display:block;margin-top:3px;font-size:12px;font-weight:700;color:#E5E7EB;">${escapeHtml(params.metaValue)}</span>`
              : ''
          }
        </td>`
      : '';

  const rowsBlock =
    rows.length > 0
      ? `
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:8px 0 0;">
            ${renderRows(rows)}
          </table>
        `
      : '';

  const ctaBlock =
    ctaLabel && ctaUrl
      ? `
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:28px 0 0;">
            <tr>
              <td>
                <a href="${escapeAttr(ctaUrl)}" target="_blank" class="email-cta" style="display:inline-block;padding:14px 28px;border-radius:12px;background-color:${ACCENT};color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:-0.01em;mso-padding-alt:0;box-shadow:0 8px 24px rgba(244,124,140,0.28);">
                  <!--[if mso]><i style="letter-spacing:24px;mso-font-width:-100%;mso-text-raise:18pt;">&nbsp;</i><![endif]-->
                  <span style="mso-text-raise:8pt;">${escapeHtml(ctaLabel)}</span>
                  <!--[if mso]><i style="letter-spacing:24px;mso-font-width:-100%;">&nbsp;</i><![endif]-->
                </a>
              </td>
            </tr>
          </table>
        `
      : '';

  return `<!DOCTYPE html>
<html lang="ru" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(params.documentTitle)}</title>
  <style type="text/css">${emailBaseStyles()}</style>
</head>
<body style="margin:0;padding:0;background-color:${BG};color:${TEXT};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(params.preview)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${BG};">
    <tr>
      <td align="center" style="padding:24px 12px 32px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="email-shell" style="max-width:600px;background-color:${SURFACE};border:0;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(17,24,39,0.08);">
          <tr>
            <td class="email-hero-pad" style="padding:32px 36px 28px;background-color:${HERO};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="left" style="vertical-align:middle;">
                    ${renderSlottyEmailLogo()}
                  </td>
                  ${metaBlock}
                </tr>
              </table>
              <h1 class="email-title" style="margin:28px 0 0;font-size:28px;line-height:1.25;font-weight:800;letter-spacing:-0.03em;color:#FFFFFF;">
                ${escapeHtml(params.title)}
              </h1>
            </td>
          </tr>
          <tr>
            <td class="email-pad" style="padding:32px 36px 28px;background-color:${SURFACE};">
              ${bodyContent}
              ${rowsBlock}
              ${ctaBlock}
            </td>
          </tr>
          <tr>
            <td class="email-pad" style="padding:20px 36px 28px;background-color:${FOOTER_BG};">
              <p style="margin:0 0 12px;font-size:12px;line-height:1.65;color:${MUTED_LIGHT};">
                ${renderFooterNote(footerNote)}
              </p>
              <p style="margin:0;font-size:12px;line-height:1.5;color:${MUTED_LIGHT};">
                <a href="${escapeAttr(siteUrl)}" style="color:${MUTED};text-decoration:none;font-weight:600;">slotty.of.by</a>
                · © ${new Date().getFullYear()} SLOTTY
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** @deprecated используйте buildSlottyEmailHtml */
export function buildTransactionalEmailHtml(params: {
  documentTitle: string;
  preview: string;
  title: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  rows?: TransactionalEmailRow[];
  footerNote?: string;
  metaLabel?: string;
}): string {
  const intro = params.bodyHtml
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return buildSlottyEmailHtml({
    documentTitle: params.documentTitle,
    preview: params.preview,
    title: params.title,
    intro: intro || params.preview,
    rows: params.rows,
    ctaLabel: params.ctaLabel,
    ctaUrl: params.ctaUrl,
    footerNote: params.footerNote,
    metaLabel: params.metaLabel,
  });
}

export function plainParagraphHtml(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  return trimmed
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => block.split('\n').map((line) => line.trim()).filter(Boolean).join(' '))
    .join('\n\n');
}
