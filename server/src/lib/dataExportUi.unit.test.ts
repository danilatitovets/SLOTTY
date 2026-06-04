import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

/** Mirror of frontend dataExportConstants for UI contract tests. */
const DATA_EXPORT_SECTION = {
  title: 'Экспорт данных',
  footnote:
    'Мы подготовим ZIP-архив. Внутри будут Excel-таблицы для записей, клиентов и платежей, а также Word/PDF-отчёт по кабинету мастера. Фото, сертификаты и вложения будут добавлены отдельной папкой, если они есть.',
  requestButton: 'Запросить архив',
  preparing: 'Архив готовится. Мы уведомим вас, когда он будет доступен.',
  ready: 'Архив готов',
  failed: 'Не удалось подготовить архив',
} as const;

const DATA_EXPORT_CONTENTS = [
  { label: 'Отчёт по кабинету мастера', detail: 'Word/PDF' },
  { label: 'Записи и история визитов', detail: 'Excel' },
] as const;

type DataExportUiState =
  | 'unavailable'
  | 'idle'
  | 'pending'
  | 'processing'
  | 'ready'
  | 'failed'
  | 'expired';

type DataExportJobSummary = {
  status: string;
  expiresAt: string | null;
};

function resolveDataExportUiState(
  apiAvailable: boolean,
  latestJob: DataExportJobSummary | null | undefined,
): DataExportUiState {
  if (!apiAvailable) return 'unavailable';
  if (!latestJob) return 'idle';
  if (latestJob.status === 'pending' || latestJob.status === 'processing') {
    return latestJob.status;
  }
  if (latestJob.status === 'ready') {
    if (latestJob.expiresAt && new Date(latestJob.expiresAt).getTime() <= Date.now()) {
      return 'expired';
    }
    return 'ready';
  }
  if (latestJob.status === 'failed') return 'failed';
  if (latestJob.status === 'expired') return 'expired';
  return 'idle';
}

function dataExportStatusMessage(state: DataExportUiState): string | null {
  switch (state) {
    case 'pending':
    case 'processing':
      return DATA_EXPORT_SECTION.preparing;
    case 'ready':
      return DATA_EXPORT_SECTION.ready;
    case 'failed':
      return DATA_EXPORT_SECTION.failed;
    default:
      return null;
  }
}

function canDownloadDataExport(state: DataExportUiState): boolean {
  return state === 'ready';
}

function canRetryDataExport(state: DataExportUiState): boolean {
  return state === 'failed';
}

function canRequestDataExport(state: DataExportUiState): boolean {
  return state === 'idle' || state === 'expired' || state === 'failed';
}

describe('DATA_EXPORT_SECTION copy', () => {
  it('does not mention JSON as primary format', () => {
    assert.equal(DATA_EXPORT_SECTION.title, 'Экспорт данных');
    assert.match(DATA_EXPORT_SECTION.footnote, /ZIP-архив/);
    assert.match(DATA_EXPORT_SECTION.footnote, /Excel/);
    assert.doesNotMatch(DATA_EXPORT_SECTION.footnote, /JSON-файл/i);
    assert.equal(DATA_EXPORT_SECTION.requestButton, 'Запросить архив');
  });

  it('lists Word/PDF report in contents', () => {
    assert.ok(DATA_EXPORT_CONTENTS.some((x) => x.detail.includes('Word')));
  });
});

describe('resolveDataExportUiState', () => {
  it('shows unavailable when backend disabled', () => {
    assert.equal(resolveDataExportUiState(false, null), 'unavailable');
  });

  it('request archive creates pending state', () => {
    assert.equal(
      resolveDataExportUiState(true, { status: 'pending', expiresAt: null }),
      'pending',
    );
    assert.match(dataExportStatusMessage('pending') ?? '', /готовится/i);
  });

  it('ready job shows download button state', () => {
    const state = resolveDataExportUiState(true, {
      status: 'ready',
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    });
    assert.equal(state, 'ready');
    assert.equal(canDownloadDataExport(state), true);
    assert.equal(dataExportStatusMessage(state), 'Архив готов');
  });

  it('failed job shows retry', () => {
    const state = resolveDataExportUiState(true, { status: 'failed', expiresAt: null });
    assert.equal(state, 'failed');
    assert.equal(canRetryDataExport(state), true);
    assert.equal(canRequestDataExport(state), true);
  });
});
