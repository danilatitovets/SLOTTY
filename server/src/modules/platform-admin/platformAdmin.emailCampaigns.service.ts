import { env } from '../../config/env.js';
import { query } from '../../config/db.js';
import { publicAppUrl } from '../../lib/publicAppUrl.js';
import { ApiError } from '../../utils/ApiError.js';
import { sendSlottyEmailDetailed } from '../auth/email/resendMail.js';
import {
  newsletterCampaignEmail,
  plainTextToSafeHtml,
  serviceCampaignEmail,
  testCampaignEmail,
} from '../email/campaignEmailLayout.js';
import {
  assertResendConfiguredForCampaign,
  isResendConfigured,
  resolveResendFrom,
} from '../email/emailConfig.js';
import { getSubscriberUnsubscribeTokenByEmail } from '../newsletter/newsletter.service.js';

const BATCH_SIZE = 40;

export type EmailCampaignAudience =
  | 'newsletter_subscribers'
  | 'masters'
  | 'clients'
  | 'all_profiles'
  | 'test_only';

export type EmailCampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'sending'
  | 'sent'
  | 'cancelled'
  | 'failed';

type EmailCampaignRow = {
  id: string;
  title: string;
  subject: string;
  preview_text: string | null;
  body_html: string;
  body_text: string | null;
  cta_text: string | null;
  cta_url: string | null;
  audience: EmailCampaignAudience;
  status: EmailCampaignStatus;
  created_by_profile_id: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  scheduled_at: Date | string | null;
  sent_at: Date | string | null;
  cancelled_at: Date | string | null;
};

type EmailCampaignRecipientRow = {
  id: string;
  campaign_id: string;
  email: string;
  profile_id: string | null;
  subscriber_id: string | null;
  status: string;
  sent_at: Date | string | null;
  failed_at: Date | string | null;
  error_message: string | null;
  resend_message_id: string | null;
  created_at: Date | string;
};

type ResolvedRecipient = {
  email: string;
  profileId: string | null;
  subscriberId: string | null;
};

function mapCampaign(row: EmailCampaignRow) {
  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    previewText: row.preview_text,
    bodyHtml: row.body_html,
    bodyText: row.body_text,
    ctaText: row.cta_text,
    ctaUrl: row.cta_url,
    audience: row.audience,
    status: row.status,
    createdByProfileId: row.created_by_profile_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    scheduledAt: row.scheduled_at,
    sentAt: row.sent_at,
    cancelledAt: row.cancelled_at,
  };
}

function mapRecipient(row: EmailCampaignRecipientRow) {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    email: row.email,
    profileId: row.profile_id,
    subscriberId: row.subscriber_id,
    status: row.status,
    sentAt: row.sent_at,
    failedAt: row.failed_at,
    errorMessage: row.error_message,
    resendMessageId: row.resend_message_id,
    createdAt: row.created_at,
  };
}

function sanitizeCtaUrl(raw: string | null | undefined): string | null {
  const url = raw?.trim();
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new Error('invalid protocol');
    }
    const host = parsed.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host.includes('railway.app')) {
      throw ApiError.badRequest('URL должен вести на slotty.of.by, не localhost/Railway', 'CTA_URL_INVALID');
    }
    return parsed.toString();
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw ApiError.badRequest('Некорректный URL кнопки', 'CTA_URL_INVALID');
  }
}

function buildStoredHtml(bodyText: string): string {
  return plainTextToSafeHtml(bodyText);
}

function isMarketingAudience(audience: EmailCampaignAudience): boolean {
  return audience === 'newsletter_subscribers';
}

export async function listEmailCampaigns(params?: { limit?: number; offset?: number }) {
  const limit = Math.min(params?.limit ?? 50, 100);
  const offset = params?.offset ?? 0;

  const [rows, count] = await Promise.all([
    query<EmailCampaignRow>(
      `select * from public.email_campaigns order by created_at desc limit $1 offset $2`,
      [limit, offset],
    ),
    query<{ count: string }>(`select count(*)::text as count from public.email_campaigns`),
  ]);

  return {
    items: rows.rows.map(mapCampaign),
    total: Number(count.rows[0]?.count ?? 0),
    limit,
    offset,
  };
}

export async function getEmailCampaign(id: string) {
  const r = await query<EmailCampaignRow>(`select * from public.email_campaigns where id = $1`, [id]);
  const row = r.rows[0];
  if (!row) throw ApiError.notFound('Кампания не найдена', 'CAMPAIGN_NOT_FOUND');
  return mapCampaign(row);
}

export async function createEmailCampaignDraft(
  profileId: string,
  input: {
    title: string;
    subject: string;
    previewText?: string | null;
    bodyText: string;
    ctaText?: string | null;
    ctaUrl?: string | null;
    audience: EmailCampaignAudience;
  },
) {
  const bodyText = input.bodyText.trim();
  if (!bodyText) throw ApiError.badRequest('Текст письма обязателен', 'BODY_REQUIRED');

  const r = await query<EmailCampaignRow>(
    `insert into public.email_campaigns (
       title, subject, preview_text, body_html, body_text, cta_text, cta_url,
       audience, status, created_by_profile_id
     ) values ($1, $2, $3, $4, $5, $6, $7, $8, 'draft', $9)
     returning *`,
    [
      input.title.trim(),
      input.subject.trim(),
      input.previewText?.trim() || null,
      buildStoredHtml(bodyText),
      bodyText,
      input.ctaText?.trim() || null,
      sanitizeCtaUrl(input.ctaUrl) ?? publicAppUrl('/book'),
      input.audience,
      profileId,
    ],
  );
  return mapCampaign(r.rows[0]!);
}

export async function updateEmailCampaignDraft(
  id: string,
  input: {
    title?: string;
    subject?: string;
    previewText?: string | null;
    bodyText?: string;
    ctaText?: string | null;
    ctaUrl?: string | null;
    audience?: EmailCampaignAudience;
  },
) {
  const existing = await getEmailCampaign(id);
  if (existing.status !== 'draft') {
    throw ApiError.badRequest('Редактировать можно только черновик', 'CAMPAIGN_NOT_DRAFT');
  }

  const bodyText = input.bodyText !== undefined ? input.bodyText.trim() : existing.bodyText ?? '';
  if (!bodyText) throw ApiError.badRequest('Текст письма обязателен', 'BODY_REQUIRED');

  const r = await query<EmailCampaignRow>(
    `update public.email_campaigns
        set title = $2,
            subject = $3,
            preview_text = $4,
            body_html = $5,
            body_text = $6,
            cta_text = $7,
            cta_url = $8,
            audience = $9,
            updated_at = now()
      where id = $1
      returning *`,
    [
      id,
      (input.title ?? existing.title).trim(),
      (input.subject ?? existing.subject).trim(),
      input.previewText !== undefined ? input.previewText?.trim() || null : existing.previewText,
      buildStoredHtml(bodyText),
      bodyText,
      input.ctaText !== undefined ? input.ctaText?.trim() || null : existing.ctaText,
      input.ctaUrl !== undefined ? sanitizeCtaUrl(input.ctaUrl) ?? publicAppUrl('/book') : existing.ctaUrl,
      input.audience ?? existing.audience,
    ],
  );
  return mapCampaign(r.rows[0]!);
}

async function resolveAudienceRecipients(
  audience: EmailCampaignAudience,
  testEmail?: string | null,
): Promise<ResolvedRecipient[]> {
  if (audience === 'test_only') {
    const email = testEmail?.trim().toLowerCase();
    if (!email) throw ApiError.badRequest('Укажите тестовый email', 'TEST_EMAIL_REQUIRED');
    return [{ email, profileId: null, subscriberId: null }];
  }

  if (audience === 'newsletter_subscribers') {
    const r = await query<{ email: string; profile_id: string | null; id: string }>(
      `select email, profile_id, id from public.newsletter_subscribers
        where status = 'subscribed'
        order by subscribed_at desc`,
    );
    return r.rows.map((row) => ({
      email: row.email,
      profileId: row.profile_id,
      subscriberId: row.id,
    }));
  }

  const roleFilter =
    audience === 'masters'
      ? `p.role = 'master'::public.user_role`
      : audience === 'clients'
        ? `p.role = 'client'::public.user_role`
        : 'true';

  const r = await query<{ email: string; profile_id: string }>(
    `select distinct lower(ai.email) as email, p.id as profile_id
       from public.profiles p
       join public.auth_identities ai on ai.profile_id = p.id
      where ${roleFilter}
        and ai.email is not null
        and ai.email_verified_at is not null`,
  );

  return r.rows.map((row) => ({
    email: row.email,
    profileId: row.profile_id,
    subscriberId: null,
  }));
}

function dedupeRecipients(recipients: ResolvedRecipient[]): ResolvedRecipient[] {
  const map = new Map<string, ResolvedRecipient>();
  for (const r of recipients) {
    const key = r.email.trim().toLowerCase();
    if (!key) continue;
    if (!map.has(key)) map.set(key, { ...r, email: key });
  }
  return [...map.values()];
}

export async function countEmailCampaignAudience(
  audience: EmailCampaignAudience,
  testEmail?: string | null,
): Promise<number> {
  return dedupeRecipients(await resolveAudienceRecipients(audience, testEmail)).length;
}

export async function previewEmailCampaign(id: string) {
  const campaign = await getEmailCampaign(id);
  const recipientCount = await countEmailCampaignAudience(campaign.audience);
  return { campaign, recipientCount, previewHtml: campaign.bodyHtml };
}

export async function sendTestEmailCampaign(
  id: string,
  testEmail: string,
): Promise<{ ok: true; devLogged: boolean; messageId: string | null }> {
  const campaign = await getEmailCampaign(id);
  const to = testEmail.trim();
  if (!to) throw ApiError.badRequest('Укажите email', 'TEST_EMAIL_REQUIRED');

  if (env.NODE_ENV === 'production') {
    assertResendConfiguredForCampaign();
  }

  const { subject, html, text } = testCampaignEmail({
    subject: campaign.subject,
    previewText: campaign.previewText,
    bodyText: campaign.bodyText ?? '',
    ctaLabel: campaign.ctaText,
    ctaUrl: campaign.ctaUrl,
  });

  const result = await sendSlottyEmailDetailed({ to, subject, html, text });
  return { ok: true, devLogged: result.devLogged, messageId: result.messageId };
}

export async function sendEmailCampaign(
  id: string,
  opts: { confirmed: boolean; testEmail?: string | null },
): Promise<{ ok: true; status: EmailCampaignStatus; sent: number; failed: number; skipped: number }> {
  if (!opts.confirmed) {
    throw ApiError.badRequest('Требуется подтверждение отправки', 'CONFIRM_REQUIRED');
  }

  assertResendConfiguredForCampaign();

  const campaign = await getEmailCampaign(id);
  if (campaign.status !== 'draft') {
    throw ApiError.badRequest('Отправить можно только черновик', 'CAMPAIGN_NOT_DRAFT');
  }

  const deduped = dedupeRecipients(await resolveAudienceRecipients(campaign.audience, opts.testEmail));

  await query(`update public.email_campaigns set status = 'sending', updated_at = now() where id = $1`, [id]);

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  try {
    for (let i = 0; i < deduped.length; i += BATCH_SIZE) {
      const batch = deduped.slice(i, i + BATCH_SIZE);
      for (const recipient of batch) {
        const outcome = await sendOneCampaignEmail(campaign, recipient);
        if (outcome === 'sent') sent += 1;
        else if (outcome === 'failed') failed += 1;
        else skipped += 1;
      }
    }

    const finalStatus: EmailCampaignStatus = failed > 0 && sent === 0 ? 'failed' : 'sent';
    await query(
      `update public.email_campaigns set status = $2, sent_at = now(), updated_at = now() where id = $1`,
      [id, finalStatus],
    );

    return { ok: true, status: finalStatus, sent, failed, skipped };
  } catch (e) {
    await query(`update public.email_campaigns set status = 'failed', updated_at = now() where id = $1`, [id]);
    throw e;
  }
}

async function upsertRecipientLog(
  campaignId: string,
  recipient: ResolvedRecipient,
  status: string,
  messageId: string | null,
  errorMessage: string | null,
): Promise<string> {
  const r = await query<{ id: string }>(
    `insert into public.email_campaign_recipients (
       campaign_id, email, profile_id, subscriber_id, status,
       sent_at, failed_at, error_message, resend_message_id
     ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     on conflict (campaign_id, email) do update
       set status = excluded.status,
           sent_at = excluded.sent_at,
           failed_at = excluded.failed_at,
           error_message = excluded.error_message,
           resend_message_id = excluded.resend_message_id
     returning id`,
    [
      campaignId,
      recipient.email,
      recipient.profileId,
      recipient.subscriberId,
      status,
      status === 'sent' ? new Date() : null,
      status === 'failed' || status === 'unsubscribed' ? new Date() : null,
      errorMessage,
      messageId,
    ],
  );
  return r.rows[0]!.id;
}

async function sendOneCampaignEmail(
  campaign: ReturnType<typeof mapCampaign>,
  recipient: ResolvedRecipient,
): Promise<'sent' | 'failed' | 'skipped'> {
  const existing = await query<{ status: string }>(
    `select status from public.email_campaign_recipients
      where campaign_id = $1 and email = $2 limit 1`,
    [campaign.id, recipient.email],
  );
  if (existing.rows[0]?.status === 'sent') {
    return 'skipped';
  }

  if (campaign.audience === 'newsletter_subscribers') {
    const sub = await query<{ status: string; id: string }>(
      `select id, status from public.newsletter_subscribers where normalized_email = $1 limit 1`,
      [recipient.email],
    );
    if (!sub.rows[0] || sub.rows[0].status !== 'subscribed') {
      await upsertRecipientLog(campaign.id, recipient, 'unsubscribed', null, 'Not subscribed');
      return 'skipped';
    }
    recipient = { ...recipient, subscriberId: sub.rows[0].id };
  }

  const recipientId = await upsertRecipientLog(campaign.id, recipient, 'pending', null, null);

  try {
    const bodyText = campaign.bodyText ?? '';
    let emailContent: { subject: string; html: string; text: string };

    if (isMarketingAudience(campaign.audience)) {
      const token =
        recipient.subscriberId != null
          ? (
              await query<{ unsubscribe_token: string }>(
                `select unsubscribe_token from public.newsletter_subscribers where id = $1`,
                [recipient.subscriberId],
              )
            ).rows[0]?.unsubscribe_token
          : await getSubscriberUnsubscribeTokenByEmail(recipient.email);

      if (!token) {
        await upsertRecipientLog(campaign.id, recipient, 'skipped', null, 'Missing unsubscribe token');
        return 'skipped';
      }

      emailContent = newsletterCampaignEmail({
        subject: campaign.subject,
        previewText: campaign.previewText,
        bodyText,
        ctaLabel: campaign.ctaText,
        ctaUrl: campaign.ctaUrl,
        unsubscribeToken: token,
      });
    } else {
      const newsletterToken = await getSubscriberUnsubscribeTokenByEmail(recipient.email);
      emailContent = serviceCampaignEmail({
        subject: campaign.subject,
        previewText: campaign.previewText,
        bodyText,
        ctaLabel: campaign.ctaText,
        ctaUrl: campaign.ctaUrl,
        unsubscribeToken: newsletterToken,
      });
    }

    const result = await sendSlottyEmailDetailed({
      to: recipient.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (result.devLogged && env.NODE_ENV === 'production') {
      throw new Error('Email not configured');
    }

    await query(
      `update public.email_campaign_recipients
          set status = 'sent', sent_at = now(), resend_message_id = $2, error_message = null
        where id = $1`,
      [recipientId, result.messageId],
    );
    return 'sent';
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Send failed';
    await query(
      `update public.email_campaign_recipients
          set status = 'failed', failed_at = now(), error_message = $2
        where id = $1`,
      [recipientId, msg.slice(0, 2000)],
    );
    return 'failed';
  }
}

export async function listEmailCampaignRecipients(
  campaignId: string,
  params?: { status?: string; limit?: number; offset?: number; search?: string },
) {
  const limit = Math.min(params?.limit ?? 50, 100);
  const offset = params?.offset ?? 0;
  const conditions: string[] = ['campaign_id = $1'];
  const values: unknown[] = [campaignId];
  let idx = 2;

  if (params?.status && params.status !== 'all') {
    conditions.push(`status = $${idx++}`);
    values.push(params.status);
  }
  if (params?.search?.trim()) {
    conditions.push(`email ilike $${idx++}`);
    values.push(`%${params.search.trim()}%`);
  }

  const where = conditions.join(' and ');
  const countValues = [...values];
  values.push(limit, offset);

  const [rows, count] = await Promise.all([
    query<EmailCampaignRecipientRow>(
      `select * from public.email_campaign_recipients
        where ${where}
        order by created_at desc
        limit $${idx++} offset $${idx}`,
      values,
    ),
    query<{ count: string }>(
      `select count(*)::text as count from public.email_campaign_recipients where ${where}`,
      countValues,
    ),
  ]);

  return {
    items: rows.rows.map(mapRecipient),
    total: Number(count.rows[0]?.count ?? 0),
    limit,
    offset,
  };
}

export async function retryFailedCampaignRecipient(campaignId: string, recipientId: string) {
  assertResendConfiguredForCampaign();
  const campaign = await getEmailCampaign(campaignId);

  const r = await query<EmailCampaignRecipientRow>(
    `select * from public.email_campaign_recipients where id = $1 and campaign_id = $2`,
    [recipientId, campaignId],
  );
  const row = r.rows[0];
  if (!row) throw ApiError.notFound('Получатель не найден', 'RECIPIENT_NOT_FOUND');
  if (row.status !== 'failed') {
    throw ApiError.badRequest('Повтор только для failed', 'RECIPIENT_NOT_FAILED');
  }

  const outcome = await sendOneCampaignEmail(campaign, {
    email: row.email,
    profileId: row.profile_id,
    subscriberId: row.subscriber_id,
  });

  return { ok: true, outcome };
}

export function getEmailSendingStatus(): { configured: boolean; from: string | null } {
  return {
    configured: isResendConfigured(),
    from: isResendConfigured() ? resolveResendFrom() : null,
  };
}

export async function listNewsletterSubscribers(params?: {
  limit?: number;
  offset?: number;
  status?: string;
  search?: string;
}) {
  const limit = Math.min(params?.limit ?? 50, 100);
  const offset = params?.offset ?? 0;
  const conditions: string[] = ['true'];
  const values: unknown[] = [];
  let idx = 1;

  if (params?.status && params.status !== 'all') {
    conditions.push(`status = $${idx++}`);
    values.push(params.status);
  }
  if (params?.search?.trim()) {
    conditions.push(`(email ilike $${idx} or normalized_email ilike $${idx})`);
    values.push(`%${params.search.trim()}%`);
    idx += 1;
  }

  const where = conditions.join(' and ');
  const countValues = [...values];
  values.push(limit, offset);

  const [rows, count] = await Promise.all([
    query<{
      id: string;
      email: string;
      status: string;
      source: string;
      subscribed_at: Date | string;
      unsubscribed_at: Date | string | null;
    }>(
      `select id, email, status, source, subscribed_at, unsubscribed_at
         from public.newsletter_subscribers
        where ${where}
        order by subscribed_at desc
        limit $${idx++} offset $${idx}`,
      values,
    ),
    query<{ count: string }>(
      `select count(*)::text as count from public.newsletter_subscribers where ${where}`,
      countValues,
    ),
  ]);

  return {
    items: rows.rows.map((r) => ({
      id: r.id,
      email: r.email,
      status: r.status,
      source: r.source,
      subscribedAt: r.subscribed_at,
      unsubscribedAt: r.unsubscribed_at,
    })),
    total: Number(count.rows[0]?.count ?? 0),
    limit,
    offset,
  };
}
