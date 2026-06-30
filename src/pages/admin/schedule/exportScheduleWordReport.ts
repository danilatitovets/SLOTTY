import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { DOCUMENT_LOGO_SRC } from '../../../app/documentLogo';
import { EMPTY_CLIENT } from '../../../shared/lib/emptyDisplayText';

/** Компактный логотип в шапке отчёта (как в кабинете / Word). */
const REPORT_LOGO_MAX_WIDTH_PX = 120;
import type { ScheduleWindowStatus, ScheduleWindowView } from './scheduleTypes';
import {
  buildMonthGrid,
  formatGroupHeader,
  formatMonthYearLabel,
  indexWindowsByDate,
  parseIsoDate,
  startOfLocalDay,
  windowsCountRu,
} from './scheduleUtils';

const BRAND = 'FF5F7A';
const BRAND_SOFT = 'FFF1F4';
const INK = '111827';
const MUTED = '6B7280';

function statusLabel(status: ScheduleWindowStatus): string {
  switch (status) {
    case 'booked':
      return 'Запись';
    case 'free':
      return 'Свободно';
    default:
      return 'Закрыто';
  }
}

function sanitizeFilePart(s: string): string {
  return s
    .trim()
    .replace(/[^\p{L}\p{N}\-_]+/gu, '-')
    .replace(/-+/g, '-')
    .slice(0, 48);
}

async function fetchReportLogo(): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('logo load failed'));
    img.src = DOCUMENT_LOGO_SRC;
  });

  const scale =
    img.naturalWidth > REPORT_LOGO_MAX_WIDTH_PX ? REPORT_LOGO_MAX_WIDTH_PX / img.naturalWidth : 1;
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('png encode failed'))), 'image/png');
  });
  return { bytes: new Uint8Array(await blob.arrayBuffer()), width, height };
}

function cellText(text: string, opts?: { bold?: boolean; color?: string; size?: number }) {
  return new TableCell({
    verticalAlign: 'center',
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: opts?.bold,
            color: opts?.color ?? INK,
            size: opts?.size ?? 20,
            font: 'Calibri',
          }),
        ],
      }),
    ],
  });
}

function headerCell(text: string) {
  return new TableCell({
    shading: { fill: BRAND_SOFT },
    verticalAlign: 'center',
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: true,
            color: BRAND,
            size: 20,
            font: 'Calibri',
          }),
        ],
      }),
    ],
  });
}

function buildDayTable(dayWindows: ScheduleWindowView[]): Table {
  const rows = [
    new TableRow({
      children: [
        headerCell('Время'),
        headerCell('Услуга'),
        headerCell('Статус'),
        headerCell('Клиент'),
      ],
    }),
    ...dayWindows.map(
      (w) =>
        new TableRow({
          children: [
            cellText(`${w.startTime}–${w.endTime}`, { bold: true }),
            cellText(w.serviceName),
            cellText(statusLabel(w.status), {
              color: w.status === 'booked' ? BRAND : MUTED,
              bold: w.status === 'booked',
            }),
            cellText(w.clientName?.trim() || w.clientPhone?.trim() || EMPTY_CLIENT, { color: MUTED }),
          ],
        }),
    ),
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'FDE8ED' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'FDE8ED' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'FDE8ED' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'FDE8ED' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'F3F4F6' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'F3F4F6' },
    },
    rows,
  });
}

export type ScheduleWordExportParams = {
  windows: ScheduleWindowView[];
  monthAnchor: Date;
  masterName: string;
};

export async function downloadScheduleMonthWordReport(params: ScheduleWordExportParams): Promise<void> {
  const { windows, monthAnchor, masterName } = params;
  const logo = await fetchReportLogo();
  const todayStart = startOfLocalDay(new Date());
  const monthLabel = formatMonthYearLabel(monthAnchor);
  const generatedAt = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

  const monthCells = buildMonthGrid(monthAnchor).filter((c) => c.inCurrentMonth);
  const monthIsoSet = new Set(monthCells.map((c) => c.dateIso));
  const monthWindows = windows.filter((w) => monthIsoSet.has(w.dateIso));
  const statsByDate = indexWindowsByDate(monthWindows);

  const windowsByDate = new Map<string, ScheduleWindowView[]>();
  for (const w of monthWindows) {
    const list = windowsByDate.get(w.dateIso) ?? [];
    list.push(w);
    windowsByDate.set(w.dateIso, list);
  }
  for (const [, list] of windowsByDate) {
    list.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  const totalBooked = monthWindows.filter((w) => w.status === 'booked').length;
  const totalFree = monthWindows.filter((w) => w.status === 'free').length;
  const totalBlocked = monthWindows.filter((w) => w.status === 'blocked').length;
  const daysWithWindows = monthCells.filter((c) => (statsByDate.get(c.dateIso)?.total ?? 0) > 0).length;

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [
        new ImageRun({
          type: 'png',
          data: logo.bytes,
          transformation: { width: logo.width, height: logo.height },
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.TITLE,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: 'Расписание окон',
          bold: true,
          size: 40,
          color: INK,
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: masterName.trim() || 'Мастер',
          size: 28,
          bold: true,
          color: BRAND,
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 280 },
      children: [
        new TextRun({
          text: monthLabel,
          size: 24,
          color: MUTED,
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      shading: { fill: BRAND_SOFT },
      border: {
        left: { style: BorderStyle.SINGLE, size: 12, color: BRAND, space: 4 },
      },
      children: [
        new TextRun({
          text: `Итого за месяц: ${windowsCountRu(monthWindows.length)}`,
          bold: true,
          size: 22,
          font: 'Calibri',
        }),
        new TextRun({
          text: `  ·  ${daysWithWindows} ${daysWithWindows === 1 ? 'день' : 'дней'} с окнами`,
          size: 22,
          color: MUTED,
          font: 'Calibri',
        }),
        new TextRun({
          text: `\nЗапись: ${totalBooked}   Свободно: ${totalFree}   Закрыто: ${totalBlocked}`,
          size: 20,
          color: MUTED,
          font: 'Calibri',
        }),
      ],
    }),
  ];

  for (const cell of monthCells) {
    const dayWindows = windowsByDate.get(cell.dateIso) ?? [];
    const dayTitle = formatGroupHeader(parseIsoDate(cell.dateIso), todayStart);

    children.push(
      new Paragraph({
        spacing: { before: 320, after: 160 },
        children: [
          new TextRun({
            text: dayTitle,
            bold: true,
            size: 26,
            color: INK,
            font: 'Calibri',
          }),
          new TextRun({
            text: dayWindows.length > 0 ? `  ·  ${windowsCountRu(dayWindows.length)}` : '  ·  без окон',
            size: 22,
            color: MUTED,
            font: 'Calibri',
          }),
        ],
      }),
    );

    if (dayWindows.length === 0) {
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: 'На этот день окна не добавлены.',
              italics: true,
              size: 20,
              color: MUTED,
              font: 'Calibri',
            }),
          ],
        }),
      );
    } else {
      children.push(buildDayTable(dayWindows));
    }
  }

  children.push(
    new Paragraph({
      spacing: { before: 400 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Сформировано в SLOTTY · ${generatedAt}`,
          size: 18,
          color: '9CA3AF',
          font: 'Calibri',
        }),
      ],
    }),
  );

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22, color: INK },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 900, right: 900, bottom: 900, left: 900 },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const fileMonth = sanitizeFilePart(monthLabel);
  const fileMaster = sanitizeFilePart(masterName || 'master');
  anchor.href = url;
  anchor.download = `SLOTTY-raspisanie-${fileMaster}-${fileMonth}.docx`;
  anchor.click();
  URL.revokeObjectURL(url);
}
