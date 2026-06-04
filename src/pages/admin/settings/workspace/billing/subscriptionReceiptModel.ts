import {
  formatBillingDate,
  formatBillingMoney,
  formatMaskedCard,
  formatRenewalSchedule,
} from '../../../billing/billingFormat';
import { ADMIN_DESKTOP_LOGO_SRC } from '../../../../../app/headerLogo';
import type { BillingSubscriptionResponse } from '../../../../../features/billing/api/masterBillingApi';

export const SUBSCRIPTION_RECEIPT_BG_SRC = '/photos/xtr/1.png';

export type SubscriptionReceiptRow = { label: string; value: string };

function formatLimitServices(n: number | null): string {
  return n === null ? 'Безлимит' : `До ${n}`;
}

function formatLimitAppointments(n: number | null): string {
  return n === null ? 'Безлимит' : `До ${n} в месяц`;
}

function formatPeriodRange(start: string, end: string): string | null {
  const from = formatBillingDate(start);
  const to = formatBillingDate(end);
  if (!from || !to) return null;
  return `${from} — ${to}`;
}

export function buildSubscriptionReceiptRows(
  uiState: string,
  billing: BillingSubscriptionResponse,
  isProEntitled: boolean,
): SubscriptionReceiptRow[] {
  const periodUnit = billing.billingPeriod === 'year' ? 'год' : 'месяц';
  const { limits } = billing;

  const limitRows: SubscriptionReceiptRow[] = [
    { label: 'Услуги', value: formatLimitServices(limits.maxServices) },
    { label: 'Записи', value: formatLimitAppointments(limits.maxMonthlyAppointments) },
    { label: 'Расписание', value: `На ${limits.maxScheduleDaysAhead} дней вперёд` },
  ];

  if (!isProEntitled) {
    return [{ label: 'Стоимость', value: '0 BYN' }, ...limitRows];
  }

  const price = formatBillingMoney(billing.priceAmount, billing.currency);
  const rows: SubscriptionReceiptRow[] = [
    { label: 'Тариф', value: 'Master Pro' },
    { label: 'Стоимость', value: `${price} / ${periodUnit}` },
  ];

  const renewal = formatRenewalSchedule(billing, uiState);
  if (renewal) rows.push({ label: 'Продление', value: renewal });

  const periodRange = formatPeriodRange(billing.currentPeriodStart, billing.currentPeriodEnd);
  if (periodRange) rows.push({ label: 'Текущий период', value: periodRange });

  if (uiState === 'pro_active') {
    rows.push({
      label: 'Автопродление',
      value: billing.cancelAtPeriodEnd ? 'Выключено' : 'Включено',
    });
    if (!billing.cancelAtPeriodEnd) {
      rows.push({ label: 'Оплата', value: 'Списание по привязанной карте' });
    }
  } else if (uiState === 'pro_canceled_at_period_end') {
    const end = formatBillingDate(billing.currentPeriodEnd);
    if (end) rows.push({ label: 'Доступ до', value: end });
    rows.push({ label: 'Автопродление', value: 'Выключено' });
  } else if (uiState === 'past_due') {
    rows.push({ label: 'Автопродление', value: 'Приостановлено — требуется оплата' });
    const end = formatBillingDate(billing.currentPeriodEnd);
    if (end) rows.push({ label: 'Период истекает', value: end });
  } else if (uiState === 'expired') {
    rows.push({ label: 'Статус', value: 'Подписка завершена' });
  }

  const card = formatMaskedCard(billing.cardBrand, billing.cardLast4);
  if (card) rows.push({ label: 'Карта', value: card });

  return [...rows, ...limitRows];
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildSubscriptionReceiptHtml(
  planName: string,
  statusLabel: string,
  rows: SubscriptionReceiptRow[],
): string {
  const issuedAt = new Date().toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const issuedTime = new Date().toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const receiptNumber = `SL-${Date.now().toString().slice(-8)}`;
  const logoUrl = escapeHtml(
    typeof window !== 'undefined'
      ? new URL(ADMIN_DESKTOP_LOGO_SRC, window.location.origin).href
      : ADMIN_DESKTOP_LOGO_SRC,
  );
  const bgUrl = escapeHtml(
    typeof window !== 'undefined'
      ? new URL(SUBSCRIPTION_RECEIPT_BG_SRC, window.location.origin).href
      : SUBSCRIPTION_RECEIPT_BG_SRC,
  );

  const importantLabels = new Set([
    'Тариф',
    'Стоимость',
    'Продление',
    'Текущий период',
    'Доступ до',
    'Автопродление',
    'Оплата',
    'Карта',
  ]);

  const detailRows = rows.filter((row) => importantLabels.has(row.label));
  const limitRows = rows.filter((row) => !importantLabels.has(row.label));
  const allRows = [...detailRows, ...limitRows];

  const renderRows = (items: SubscriptionReceiptRow[]) =>
    items
      .map(
        (r) => `
          <div class="receipt-row">
            <span class="receipt-label">${escapeHtml(r.label)}</span>
            <span class="receipt-value">${escapeHtml(r.value)}</span>
          </div>
        `,
      )
      .join('');

  const statusClass =
    statusLabel.toLowerCase().includes('актив') || statusLabel.toLowerCase().includes('оплачен')
      ? 'pill-success'
      : statusLabel.toLowerCase().includes('ошиб') ||
          statusLabel.toLowerCase().includes('просроч') ||
          statusLabel.toLowerCase().includes('оплат')
        ? 'pill-warning'
        : statusLabel.toLowerCase().includes('период')
          ? 'pill-pink'
          : 'pill-neutral';

  const priceValue = rows.find((r) => r.label === 'Стоимость')?.value ?? null;
  const tableRows = allRows.filter((r) => r.label !== 'Стоимость' && r.label !== 'Тариф');

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8"/>
<title>Справка о подписке SLOTTY — ${escapeHtml(planName)}</title>
<style>
  @page { size: A4 portrait; margin: 10mm; }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    background: #fafafa;
    color: #111827;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  .page {
    max-width: 680px;
    margin: 0 auto;
    padding: 12px;
  }

  .receipt {
    overflow: hidden;
    background: #ffffff;
    border: 1px solid #ebebeb;
    border-radius: 20px;
    box-shadow: 0 16px 48px rgba(17, 24, 39, 0.06);
  }

  .hero-card {
    overflow: hidden;
    border-radius: 16px;
    border: 1px solid #f3f4f6;
    margin-bottom: 14px;
    background: #ffffff;
  }

  .hero-card-bg {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 2.4 / 1;
    object-fit: cover;
    object-position: center;
  }

  .hero-card-body {
    padding: 16px 18px;
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 20px 24px 16px;
    border-bottom: 1px solid #f3f4f6;
  }

  .brand-logo-img {
    display: block;
    height: 48px;
    width: auto;
    max-width: 210px;
    object-fit: contain;
    object-position: left center;
  }

  .receipt-id {
    font-size: 11px;
    font-weight: 600;
    color: #9ca3af;
    text-align: right;
    white-space: nowrap;
  }

  .receipt-id strong {
    display: block;
    margin-top: 2px;
    color: #6b7280;
    font-weight: 700;
  }

  .intro {
    padding: 18px 24px 0;
  }

  .eyebrow {
    margin: 0 0 6px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #9ca3af;
  }

  .title-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }

  h1 {
    margin: 0;
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #111827;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    padding: 4px 11px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.2;
  }

  .pill-success { background: #ecfdf5; color: #15803d; }
  .pill-warning { background: #fffbeb; color: #b45309; }
  .pill-pink { background: #fff1f4; color: #ff5f7a; }
  .pill-neutral { background: #f6f7fb; color: #6b7280; }

  .subtitle {
    margin: 8px 0 0;
    font-size: 12px;
    line-height: 1.45;
    color: #6b7280;
  }

  .content {
    padding: 16px 24px 20px;
  }

  .hero-plan {
    margin: 0;
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #111827;
  }

  .hero-price {
    margin: 6px 0 0;
    font-size: 26px;
    font-weight: 900;
    letter-spacing: -0.04em;
    color: #111827;
  }

  .hero-price span {
    font-size: 14px;
    font-weight: 600;
    color: #6b7280;
  }

  .hero-meta {
    margin: 8px 0 0;
    font-size: 11px;
    color: #9ca3af;
  }

  .section {
    overflow: hidden;
    border: 1px solid #f3f4f6;
    border-radius: 16px;
    background: #ffffff;
  }

  .section-title {
    margin: 0;
    padding: 12px 16px;
    border-bottom: 1px solid #f3f4f6;
    background: #fafafa;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #6b7280;
  }

  .receipt-row {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 10px 16px;
    border-bottom: 1px solid #f3f4f6;
    font-size: 12px;
    line-height: 1.4;
  }

  .receipt-row:last-child { border-bottom: 0; }

  .receipt-label { color: #6b7280; flex-shrink: 0; }

  .receipt-value {
    max-width: 60%;
    text-align: right;
    font-weight: 600;
    color: #111827;
  }

  .footer {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid #f3f4f6;
    font-size: 10px;
    line-height: 1.45;
    color: #9ca3af;
  }

  .footer-brand {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.12em;
    color: #ff5f7a;
  }

  @media print {
    body { background: #fff; }
    .page { padding: 0; max-width: none; }
    .receipt {
      border: 0;
      border-radius: 0;
      box-shadow: none;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .head { padding: 14px 18px 12px; }
    .brand-logo-img { height: 42px; }
    .intro { padding: 14px 18px 0; }
    h1 { font-size: 20px; }
    .content { padding: 12px 18px 14px; }
    .hero-card { margin-bottom: 10px; }
    .hero-card-body { padding: 12px 14px; }
    .hero-card-bg {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .hero-price { font-size: 22px; }
    .receipt-row { padding: 7px 14px; font-size: 11px; }
    .footer { margin-top: 10px; padding-top: 8px; }
    .hero-card, .section, .footer {
      break-inside: avoid;
      page-break-inside: avoid;
    }
  }
</style>
</head>
<body>
  <main class="page">
    <article class="receipt">
      <header class="head">
        <img src="${logoUrl}" alt="SLOTTY" class="brand-logo-img" crossorigin="anonymous" />
        <div class="receipt-id">
          Справка
          <strong>№ ${escapeHtml(receiptNumber)}</strong>
        </div>
      </header>

      <div class="intro">
        <p class="eyebrow">Подписка Master</p>
        <div class="title-row">
          <h1>Справка о подписке</h1>
          <span class="pill ${statusClass}">${escapeHtml(statusLabel)}</span>
        </div>
        <p class="subtitle">Тариф, период доступа и лимиты кабинета · ${escapeHtml(issuedAt)}, ${escapeHtml(issuedTime)}</p>
      </div>

      <div class="content">
        <div class="hero-card">
          <img src="${bgUrl}" alt="" class="hero-card-bg" crossorigin="anonymous" />
          <div class="hero-card-body">
            <p class="hero-plan">${escapeHtml(planName)}</p>
            ${priceValue ? `<p class="hero-price">${escapeHtml(priceValue.split(' / ')[0] ?? priceValue)}${priceValue.includes(' / ') ? ` <span>/ ${escapeHtml(priceValue.split(' / ')[1] ?? '')}</span>` : ''}</p>` : ''}
            <p class="hero-meta">SLOTTY · кабинет мастера и онлайн-запись</p>
          </div>
        </div>

        ${
          tableRows.length
            ? `
              <section class="section">
                <h2 class="section-title">Детали подписки</h2>
                ${renderRows(tableRows)}
              </section>
            `
            : ''
        }

        <footer class="footer">
          <div>
            <div class="footer-brand">SLOTTY</div>
            Онлайн-запись и кабинет мастера
          </div>
          <div style="text-align:right;">
            slotty.by<br/>
            Документ сформирован автоматически
          </div>
        </footer>
      </div>
    </article>
  </main>
</body>
</html>`;
}

function printHtmlDocument(html: string): boolean {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'SLOTTY — справка о подписке');
  iframe.setAttribute('aria-hidden', 'true');
  Object.assign(iframe.style, {
    position: 'fixed',
    left: '-9999px',
    top: '0',
    width: '816px',
    minHeight: '1056px',
    border: '0',
    opacity: '0',
    pointerEvents: 'none',
  });
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  if (!win?.document) {
    iframe.remove();
    return false;
  }

  let finished = false;
  const detach = () => {
    if (finished) return;
    finished = true;
    if (iframe.isConnected) iframe.remove();
  };

  win.document.open();
  win.document.write(html);
  win.document.close();

  const triggerPrint = () => {
    try {
      win.addEventListener('afterprint', detach, { once: true });
      win.focus();
      win.print();
      window.setTimeout(detach, 90_000);
    } catch {
      detach();
    }
  };

  const logoImg = win.document.querySelector('.brand-logo-img');
  const bgImg = win.document.querySelector('.hero-card-bg');
  const images = [logoImg, bgImg].filter((img): img is HTMLImageElement => img instanceof HTMLImageElement);

  const waitForImages = () => {
    const pending = images.filter((img) => !img.complete);
    if (pending.length === 0) {
      window.setTimeout(triggerPrint, 200);
      return;
    }
    let left = pending.length;
    const done = () => {
      left -= 1;
      if (left <= 0) window.setTimeout(triggerPrint, 120);
    };
    for (const img of pending) {
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    }
  };

  waitForImages();
  return true;
}

export function downloadSubscriptionReceiptPdf(
  planName: string,
  statusLabel: string,
  rows: SubscriptionReceiptRow[],
): void {
  const html = buildSubscriptionReceiptHtml(planName, statusLabel, rows);
  const printed = printHtmlDocument(html);
  if (printed) return;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const slug = planName.replace(/[^\w.-]+/g, '_').slice(0, 40) || 'subscription';
  anchor.href = url;
  anchor.download = `slotty-${slug}.html`;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
