import { env } from '../../config/env.js';
import { query } from '../../config/db.js';
import { sendSlottyEmailDetailed } from '../auth/email/resendMail.js';
import { shouldDeliverMasterNotification } from './masterNotificationPreferences.deliver.js';
import { notifyUser } from './notifyUser.js';

function escapeTelegramHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function isMasterProfile(profileId: string): Promise<boolean> {
  const r = await query<{ role: string }>(
    `select role::text as role from public.profiles where id = $1`,
    [profileId],
  );
  return r.rows[0]?.role === 'master';
}

export type SlottyNewsCampaignPayload = {
  id: string;
  subject: string;
  previewText: string | null;
  bodyText: string | null;
  ctaText: string | null;
  ctaUrl: string | null;
};

/** Рассылка из админки мастерам с учётом prefs «Новости SLOTTY». */
export async function deliverSlottyNewsToMaster(
  profileId: string,
  recipientEmail: string,
  campaign: SlottyNewsCampaignPayload,
  emailContent: { subject: string; html: string; text: string },
): Promise<'sent' | 'skipped' | 'failed'> {
  const [allowEmail, allowTelegram, allowInApp] = await Promise.all([
    shouldDeliverMasterNotification(profileId, 'news', 'email'),
    shouldDeliverMasterNotification(profileId, 'news', 'telegram'),
    shouldDeliverMasterNotification(profileId, 'news', 'in_app'),
  ]);

  if (!allowEmail && !allowTelegram && !allowInApp) {
    return 'skipped';
  }

  let emailSent = false;
  if (allowEmail) {
    try {
      const result = await sendSlottyEmailDetailed({
        to: recipientEmail,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });
      if (result.devLogged && env.NODE_ENV === 'production') {
        return 'failed';
      }
      emailSent = true;
    } catch {
      if (!allowTelegram && !allowInApp) return 'failed';
    }
  }

  const bodyPlain = (campaign.previewText ?? campaign.bodyText ?? campaign.subject).trim().slice(0, 500);
  const ctaLine = campaign.ctaUrl ? `\n${campaign.ctaText ?? 'Подробнее'}: ${campaign.ctaUrl}` : '';

  if (allowTelegram || allowInApp) {
    await notifyUser({
      userId: profileId,
      type: 'system',
      title: campaign.subject,
      body: `${bodyPlain}${ctaLine}`.trim(),
      telegramHtml: allowTelegram
        ? `<b>${escapeTelegramHtml(campaign.subject)}</b>\n${escapeTelegramHtml(bodyPlain)}${
            campaign.ctaUrl
              ? `\n<a href="${campaign.ctaUrl}">${escapeTelegramHtml(campaign.ctaText ?? 'Подробнее')}</a>`
              : ''
          }`
        : undefined,
      masterPreferenceEvent: 'news',
      relatedEntityType: 'email_campaign',
      relatedEntityId: campaign.id,
    });
  }

  return emailSent || allowTelegram || allowInApp ? 'sent' : 'skipped';
}
