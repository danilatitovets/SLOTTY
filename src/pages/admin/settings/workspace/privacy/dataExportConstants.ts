export const DATA_EXPORT_SECTION = {
  title: 'Экспорт данных',
  description:
    'Скачайте отчёт в Word со сводкой по аккаунту, кабинету, записям, подписке и обращениям в поддержку.',
  wordTitle: 'Отчёт в Word',
  wordSubtitle:
    'Файл .docx с профилем, услугами, расписанием, записями, платежами и настройками уведомлений — можно открыть в Word или скопировать текст.',
  wordButton: 'Скачать в Word',
  archiveTitle: 'Полный ZIP-архив',
  archiveSubtitle:
    'ZIP с Excel-таблицами, Word/PDF-отчётом и папкой uploads. Готовность — до 7 дней, уведомим в кабинете.',
  footnote:
    'Технические JSON-файлы не отдаются отдельно — только внутри архива для поддержки.',
  unavailableHint:
    'Экспорт архива скоро будет доступен. Пока вы можете запросить копию данных через поддержку или скачать отчёт в Word.',
  requestButton: 'Запросить архив',
  downloadButton: 'Скачать архив',
  retryButton: 'Повторить',
  soonBadge: 'Скоро',
  preparing: 'Архив готовится. Мы уведомим вас, когда он будет доступен.',
  ready: 'Архив готов',
  failed: 'Не удалось подготовить архив',
  contentsTitle: 'Что входит в отчёт Word',
} as const;

export const DATA_EXPORT_CONTENTS = [
  { label: 'Аккаунт и способы входа', detail: 'Word' },
  { label: 'Профиль мастера и адрес', detail: 'Word' },
  { label: 'Услуги, расписание, правила записи', detail: 'Word' },
  { label: 'Записи (до 200 последних)', detail: 'Word' },
  { label: 'Подписка и платежи', detail: 'Word' },
  { label: 'Настройки уведомлений', detail: 'Word' },
  { label: 'Обращения в поддержку', detail: 'Word' },
  { label: 'Портфолио и сертификаты', detail: 'ссылки в Word' },
] as const;

export type DataExportUiState =
  | 'unavailable'
  | 'idle'
  | 'pending'
  | 'processing'
  | 'ready'
  | 'failed'
  | 'expired';

export type DataExportJobSummary = {
  id: string;
  status: string;
  expiresAt: string | null;
  errorMessage: string | null;
  createdAt: string;
};

export function resolveDataExportUiState(
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

export function dataExportStatusMessage(state: DataExportUiState): string | null {
  switch (state) {
    case 'unavailable':
      return DATA_EXPORT_SECTION.unavailableHint;
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

export function canRequestDataExport(state: DataExportUiState): boolean {
  return state === 'idle' || state === 'expired' || state === 'failed';
}

export function canDownloadDataExport(state: DataExportUiState): boolean {
  return state === 'ready';
}

export function canRetryDataExport(state: DataExportUiState): boolean {
  return state === 'failed';
}
