import { apiFetch } from '../../../shared/api/backendClient';
import { readSlottyApiErrorMessage } from '../../../shared/api/slottyApiErrorMessage';

export type MasterProfileReportReason =
  | 'fake_profile'
  | 'inappropriate_photos'
  | 'scam'
  | 'spam'
  | 'harassment'
  | 'other';

export const MASTER_PROFILE_REPORT_REASONS: {
  code: MasterProfileReportReason;
  label: string;
}[] = [
  { code: 'fake_profile', label: 'Подозрительный или фальшивый профиль' },
  { code: 'inappropriate_photos', label: 'Неподходящие фото или контент' },
  { code: 'scam', label: 'Мошенничество или обман' },
  { code: 'spam', label: 'Спам или реклама' },
  { code: 'harassment', label: 'Оскорбления или домогательства' },
  { code: 'other', label: 'Другое' },
];

export async function submitMasterProfileReport(
  masterId: string,
  body: { reasonCode: MasterProfileReportReason; reasonText?: string | null },
): Promise<void> {
  const res = await apiFetch(`/api/masters/${encodeURIComponent(masterId)}/report`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readSlottyApiErrorMessage(res));
}
