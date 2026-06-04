import AdmZip from 'adm-zip';
import ExcelJS from 'exceljs';
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import type {
  MasterExportPayload,
  MasterExportReportSummary,
} from './dataExport.types.js';

const SECRET_KEY_PATTERN = /(secret|token|password|jwt|authorization|api[_-]?key)/i;

export function sanitizeExportJson(value: unknown): unknown {
  if (value == null || typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(sanitizeExportJson);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SECRET_KEY_PATTERN.test(k)) continue;
      out[k] = sanitizeExportJson(v);
    }
    return out;
  }
  return String(value);
}

function autoWidthSheet(sheet: ExcelJS.Worksheet): void {
  sheet.columns.forEach((col) => {
    let max = 12;
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = String(cell.value ?? '').length;
      if (len > max) max = Math.min(len + 2, 48);
    });
    col.width = max;
  });
}

function addHeaderRow(sheet: ExcelJS.Worksheet, headers: string[]): void {
  const row = sheet.addRow(headers);
  row.font = { bold: true };
  row.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF5F5F5' },
  };
}

export async function buildAppointmentsWorkbook(
  rows: MasterExportPayload['appointments'],
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('Записи');
  addHeaderRow(sheet, [
    'Дата',
    'Время',
    'Клиент',
    'Услуга',
    'Статус',
    'Цена',
    'Формат',
    'Комментарий',
    'created_at',
  ]);
  for (const r of rows) {
    sheet.addRow([
      r.date,
      r.time,
      r.client,
      r.service,
      r.status,
      r.price,
      r.format,
      r.comment,
      r.createdAt,
    ]);
  }
  autoWidthSheet(sheet);
  return Buffer.from(await wb.xlsx.writeBuffer());
}

export async function buildServicesWorkbook(
  rows: MasterExportPayload['services'],
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('Услуги');
  addHeaderRow(sheet, ['Название', 'Категория', 'Цена', 'Длительность (мин)', 'Активна']);
  for (const r of rows) {
    sheet.addRow([r.title, r.category, r.price, r.durationMinutes, r.active]);
  }
  autoWidthSheet(sheet);
  return Buffer.from(await wb.xlsx.writeBuffer());
}

export async function buildClientsWorkbook(rows: MasterExportPayload['clients']): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('Клиенты');
  addHeaderRow(sheet, [
    'Имя',
    'Телефон',
    'Email',
    'Telegram',
    'Записей',
    'Отмены',
    'No-show',
  ]);
  for (const r of rows) {
    sheet.addRow([
      r.name,
      r.phone,
      r.email,
      r.telegram,
      r.bookingsCount,
      r.cancellations,
      r.noShows,
    ]);
  }
  autoWidthSheet(sheet);
  return Buffer.from(await wb.xlsx.writeBuffer());
}

export async function buildPaymentsWorkbook(rows: MasterExportPayload['payments']): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('Платежи');
  addHeaderRow(sheet, [
    'Дата',
    'Сумма',
    'Статус',
    'Тариф',
    'Способ оплаты',
    'Invoice / Payment ID',
  ]);
  for (const r of rows) {
    sheet.addRow([r.date, r.amount, r.status, r.plan, r.paymentMethod, r.paymentId]);
  }
  autoWidthSheet(sheet);
  return Buffer.from(await wb.xlsx.writeBuffer());
}

export async function buildSettingsWorkbook(rows: MasterExportPayload['settings']): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('Настройки');
  addHeaderRow(sheet, ['Раздел', 'Параметр', 'Значение']);
  for (const r of rows) {
    sheet.addRow([r.section, r.key, r.value]);
  }
  autoWidthSheet(sheet);
  return Buffer.from(await wb.xlsx.writeBuffer());
}

export async function buildSupportTicketsWorkbook(
  rows: MasterExportPayload['supportTickets'],
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('Обращения');
  addHeaderRow(sheet, [
    'Ticket code',
    'Категория',
    'Статус',
    'Приоритет',
    'Дата создания',
    'Последнее обновление',
  ]);
  for (const r of rows) {
    sheet.addRow([
      r.ticketCode,
      r.category,
      r.status,
      r.priority,
      r.createdAt,
      r.updatedAt,
    ]);
  }
  autoWidthSheet(sheet);
  return Buffer.from(await wb.xlsx.writeBuffer());
}

export async function buildReportDocx(report: MasterExportReportSummary): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            children: [new TextRun({ text: 'Отчёт по кабинету мастера SLOTTY', bold: true })],
          }),
          new Paragraph({ children: [new TextRun(`Мастер: ${report.masterName}`)] }),
          new Paragraph({ children: [new TextRun(`Дата экспорта: ${report.exportDate}`)] }),
          new Paragraph({ children: [new TextRun(`Тариф: ${report.plan}`)] }),
          new Paragraph({ spacing: { before: 240 } }),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun('Профиль')],
          }),
          new Paragraph({ children: [new TextRun(report.profileSummary)] }),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun('Сводка')],
          }),
          new Paragraph({ children: [new TextRun(`Услуг: ${report.servicesCount}`)] }),
          new Paragraph({ children: [new TextRun(`Записей: ${report.appointmentsCount}`)] }),
          new Paragraph({ children: [new TextRun(`Клиентов: ${report.clientsCount}`)] }),
          new Paragraph({ children: [new TextRun(`Платежей: ${report.paymentsCount}`)] }),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun('Активные настройки')],
          }),
          new Paragraph({ children: [new TextRun(report.activeSettingsSummary)] }),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun('Краткая сводка')],
          }),
          new Paragraph({
            children: [new TextRun(report.briefSummary)],
            alignment: AlignmentType.JUSTIFIED,
          }),
        ],
      },
    ],
  });
  return Buffer.from(await Packer.toBuffer(doc));
}

async function fetchUploadBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;
    const arr = await res.arrayBuffer();
    if (arr.byteLength === 0 || arr.byteLength > 8 * 1024 * 1024) return null;
    return Buffer.from(arr);
  } catch {
    return null;
  }
}

export type ExportArchiveEntry = {
  name: string;
  buffer: Buffer;
};

export async function buildExportArchiveEntries(
  payload: MasterExportPayload,
): Promise<ExportArchiveEntry[]> {
  const [
    appointmentsXlsx,
    servicesXlsx,
    clientsXlsx,
    paymentsXlsx,
    settingsXlsx,
    supportXlsx,
    reportDocx,
  ] = await Promise.all([
    buildAppointmentsWorkbook(payload.appointments),
    buildServicesWorkbook(payload.services),
    buildClientsWorkbook(payload.clients),
    buildPaymentsWorkbook(payload.payments),
    buildSettingsWorkbook(payload.settings),
    buildSupportTicketsWorkbook(payload.supportTickets),
    buildReportDocx(payload.report),
  ]);

  const entries: ExportArchiveEntry[] = [
    { name: 'Отчёт_кабинета_мастера.docx', buffer: reportDocx },
    { name: 'Записи.xlsx', buffer: appointmentsXlsx },
    { name: 'Услуги.xlsx', buffer: servicesXlsx },
    { name: 'Клиенты.xlsx', buffer: clientsXlsx },
    { name: 'Платежи.xlsx', buffer: paymentsXlsx },
    { name: 'Настройки.xlsx', buffer: settingsXlsx },
    { name: 'Обращения.xlsx', buffer: supportXlsx },
    {
      name: 'data.json',
      buffer: Buffer.from(JSON.stringify(sanitizeExportJson(payload.technicalJson), null, 2), 'utf8'),
    },
  ];

  for (const upload of payload.uploads) {
    const buf = await fetchUploadBuffer(upload.url);
    if (buf) {
      entries.push({ name: `uploads/${upload.relativePath}`, buffer: buf });
    }
  }

  return entries;
}

export async function zipExportEntries(entries: ExportArchiveEntry[]): Promise<Buffer> {
  const zip = new AdmZip();
  for (const entry of entries) {
    zip.addFile(entry.name, entry.buffer);
  }
  return zip.toBuffer();
}

export async function buildMasterExportArchive(payload: MasterExportPayload): Promise<Buffer> {
  const entries = await buildExportArchiveEntries(payload);
  return zipExportEntries(entries);
}

export const EXPORT_ARCHIVE_USER_FILES = [
  'Отчёт_кабинета_мастера.docx',
  'Записи.xlsx',
  'Услуги.xlsx',
  'Клиенты.xlsx',
  'Платежи.xlsx',
  'Настройки.xlsx',
  'Обращения.xlsx',
] as const;
