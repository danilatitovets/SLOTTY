import { publicAppUrl } from '../../lib/publicAppUrl.js';
import {
  SLOTTY_DOCUMENT_LOGO_HEIGHT_PX,
  SLOTTY_DOCUMENT_LOGO_PATH,
} from '../../lib/documentLogo.js';

/** @deprecated используйте SLOTTY_DOCUMENT_LOGO_PATH */
export const SLOTTY_EMAIL_LOGO_PATH = SLOTTY_DOCUMENT_LOGO_PATH;

/** Высота логотипа в шапке письма. */
export const SLOTTY_EMAIL_LOGO_HEIGHT_PX = SLOTTY_DOCUMENT_LOGO_HEIGHT_PX;

const TEXT = '#111827';
const MUTED = '#4B5563';
const MUTED_LIGHT = '#9CA3AF';
const BORDER = '#E5E7EB';
const BG = '#F4F4F4';
const SURFACE = '#FFFFFF';
const ACCENT = '#F47C8C';
const ROWS_HEADER_BG = '#F9FAFB';

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

export function renderSlottyEmailLogo(): string {
  const src = slottyEmailLogoUrl();
  const h = SLOTTY_EMAIL_LOGO_HEIGHT_PX;
  return `<a href="${escapeAttr(publicAppUrl('/book'))}" target="_blank" style="text-decoration:none;">
    <img src="${escapeAttr(src)}" height="${h}" alt="SLOTTY" style="display:block;border:0;outline:none;text-decoration:none;height:${h}px;width:auto;max-width:180px;margin:0 auto;-ms-interpolation-mode:bicubic;" />
  </a>`;
}

function renderRows(rows: TransactionalEmailRow[]): string {
  const rowCells = rows
    .map(
      (row, index) => `
        <tr>
          <td style="padding:12px 16px;${index < rows.length - 1 ? `border-bottom:1px solid ${BORDER};` : ''}">
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

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0 0;border:1px solid ${BORDER};border-radius:6px;overflow:hidden;">
      <tr>
        <td style="padding:10px 16px;background-color:${ROWS_HEADER_BG};border-bottom:1px solid ${BORDER};font-size:12px;line-height:1.4;font-weight:600;color:${MUTED};">
          Детали
        </td>
      </tr>
      ${rowCells}
    </table>
  `;
}

function emailBaseStyles(): string {
  return `
    body { margin:0 !important; padding:0 !important; width:100% !important; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    img { border:0; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
    table { border-collapse:collapse; mso-table-lspace:0; mso-table-rspace:0; }
    a { color:${ACCENT}; }
    @media only screen and (max-width:600px) {
      .email-shell { width:100% !important; max-width:100% !important; border-radius:0 !important; border-left:0 !important; border-right:0 !important; }
      .email-pad { padding-left:20px !important; padding-right:20px !important; }
      .email-logo-pad { padding-left:20px !important; padding-right:20px !important; }
      .header-meta { display:block !important; width:100% !important; text-align:left !important; padding-top:12px !important; }
      .detail-label, .detail-value { display:block !important; width:100% !important; text-align:left !important; }
      .detail-value { padding-top:4px !important; }
      .email-title { font-size:20px !important; }
      .email-cta { display:block !important; width:100% !important; text-align:center !important; box-sizing:border-box !important; }
      .footer-links { font-size:11px !important; }
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
      result += `<a href="${escapeAttr(href)}" style="color:${ACCENT};text-decoration:underline;">${escapeHtml(label)}</a>`;
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
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${MUTED};">${escapeHtml(block.split('\n').join(' '))}</p>`,
    )
    .join('');
}

function renderFooterLinks(siteUrl: string, privacyUrl: string): string {
  const linkStyle = `color:${MUTED_LIGHT};text-decoration:underline;font-size:12px;line-height:1.5;`;
  const sep = `<span style="color:${BORDER};padding:0 6px;">|</span>`;

  return `
    <p class="footer-links" style="margin:16px 0 0;font-size:12px;line-height:1.6;color:${MUTED_LIGHT};text-align:center;">
      <a href="${escapeAttr(siteUrl)}" style="${linkStyle}">Записаться</a>${sep}
      <a href="${escapeAttr(privacyUrl)}" style="${linkStyle}">Конфиденциальность</a>${sep}
      <a href="${escapeAttr(siteUrl)}" style="${linkStyle}">slotty.of.by</a>
    </p>
  `;
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

/** Единый шаблон писем SLOTTY — светлый, плоский, без теней. */
export function buildSlottyEmailHtml(params: SlottyEmailParams): string {
  const ctaLabel = params.ctaLabel?.trim();
  const ctaUrl = params.ctaUrl?.trim();
  const rows = params.rows ?? [];
  const footerNote =
    params.footerNote ??
    'Это автоматическое уведомление SLOTTY. Если вы не ожидали это письмо, просто проигнорируйте его.';
  const siteUrl = publicAppUrl('/book');
  const privacyUrl = publicAppUrl('/legal/privacy');
  const bodyContent = renderBodyContent(params.intro, params.bodyHtml);

  const metaBlock =
    params.metaLabel || params.metaValue
      ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px;">
          <tr>
            <td class="header-meta" align="right" style="font-size:12px;line-height:1.5;color:${MUTED_LIGHT};">
              ${params.metaLabel ? `<span style="display:block;font-weight:600;color:${MUTED};">${escapeHtml(params.metaLabel)}</span>` : ''}
              ${params.metaValue ? `<span style="display:block;margin-top:2px;font-weight:600;color:${TEXT};">${escapeHtml(params.metaValue)}</span>` : ''}
            </td>
          </tr>
        </table>`
      : '';

  const rowsBlock = rows.length > 0 ? renderRows(rows) : '';

  const ctaBlock =
    ctaLabel && ctaUrl
      ? `
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0 0;">
            <tr>
              <td>
                <a href="${escapeAttr(ctaUrl)}" target="_blank" class="email-cta" style="display:inline-block;padding:12px 24px;border-radius:6px;background-color:${ACCENT};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;mso-padding-alt:0;border:0;">
                  <!--[if mso]><i style="letter-spacing:24px;mso-font-width:-100%;mso-text-raise:16pt;">&nbsp;</i><![endif]-->
                  <span style="mso-text-raise:6pt;">${escapeHtml(ctaLabel)}</span>
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
<body style="margin:0;padding:0;background-color:${BG};color:${TEXT};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(params.preview)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${BG};">
    <tr>
      <td align="center" style="padding:28px 12px 36px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;">
          <tr>
            <td class="email-logo-pad" align="center" style="padding:0 0 20px;">
              ${renderSlottyEmailLogo()}
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="email-shell" style="max-width:600px;background-color:${SURFACE};border:1px solid ${BORDER};border-radius:8px;">
          <tr>
            <td class="email-pad" style="padding:28px 32px 24px;">
              ${metaBlock}
              <h1 class="email-title" style="margin:0 0 16px;font-size:22px;line-height:1.35;font-weight:700;color:${TEXT};">
                ${escapeHtml(params.title)}
              </h1>
              ${bodyContent}
              ${rowsBlock}
              ${ctaBlock}
            </td>
          </tr>
          <tr>
            <td class="email-pad" style="padding:20px 32px 24px;border-top:1px solid ${BORDER};">
              <p style="margin:0;font-size:12px;line-height:1.65;color:${MUTED_LIGHT};">
                ${renderFooterNote(footerNote)}
              </p>
              ${renderFooterLinks(siteUrl, privacyUrl)}
              <p style="margin:12px 0 0;font-size:11px;line-height:1.5;color:${MUTED_LIGHT};text-align:center;">
                © ${new Date().getFullYear()} SLOTTY · slotty.of.by
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
