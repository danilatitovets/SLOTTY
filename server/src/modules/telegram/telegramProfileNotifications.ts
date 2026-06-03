import { getTelegramUserIdForProfile } from '../auth/authIdentities.service.js';
import { sendTelegramMessage, type SendTelegramMessageResult } from './telegram.service.js';

export async function sendNotificationToProfile(
  profileId: string,
  text: string,
  replyMarkup?: Record<string, unknown>,
): Promise<SendTelegramMessageResult> {
  const tid = await getTelegramUserIdForProfile(profileId);
  if (!tid) {
    return { status: 'skipped' };
  }

  return sendTelegramMessage({ telegramUserId: tid, text, replyMarkup });
}
