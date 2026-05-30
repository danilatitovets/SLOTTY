import crypto from 'node:crypto';
import type { Request } from 'express';
import { query } from '../../config/db.js';
import { resolveClientIp } from '../../lib/clientIp.js';
import { ApiError } from '../../utils/ApiError.js';
import { normalizeAuthEmail, findProfileIdByIdentity } from '../auth/authIdentities.service.js';

export const NEWSLETTER_CONSENT_VERSION = 'footer-v1';

export type NewsletterSubscribeStatus = 'subscribed' | 'already_subscribed' | 'resubscribed';

export type NewsletterSubscribeResult = {
  ok: true;
  status: NewsletterSubscribeStatus;
  message: string;
};

function generateUnsubscribeToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function subscribeMessage(status: NewsletterSubscribeStatus): string {
  switch (status) {
    case 'already_subscribed':
      return 'Вы уже подписаны на обновления SLOTTY.';
    case 'resubscribed':
      return 'Спасибо! Подписка снова активна.';
    default:
      return 'Спасибо! Подписка оформлена.';
  }
}

export async function subscribeToNewsletter(params: {
  emailRaw: string;
  consentAccepted: boolean;
  source?: string;
  req?: Request;
}): Promise<NewsletterSubscribeResult> {
  if (!params.consentAccepted) {
    throw ApiError.badRequest('Требуется согласие на рассылку', 'CONSENT_REQUIRED');
  }

  const normalizedEmail = normalizeAuthEmail(params.emailRaw);
  const email = params.emailRaw.trim();
  const source = params.source?.trim() || 'footer';
  const ip = params.req ? resolveClientIp(params.req) : null;
  const userAgent = params.req?.headers['user-agent']?.slice(0, 500) ?? null;

  let profileId: string | null = null;
  try {
    profileId = await findProfileIdByIdentity('email', normalizedEmail);
  } catch {
    profileId = null;
  }

  const existing = await query<{
    id: string;
    status: string;
  }>(
    `select id, status from public.newsletter_subscribers where normalized_email = $1 limit 1`,
    [normalizedEmail],
  );

  const row = existing.rows[0];
  if (!row) {
    await query(
      `insert into public.newsletter_subscribers (
         email, normalized_email, status, source, profile_id,
         consent_accepted, consent_text_version, unsubscribe_token,
         ip_address, user_agent
       ) values ($1, $2, 'subscribed', $3, $4, true, $5, $6, $7, $8)`,
      [
        email,
        normalizedEmail,
        source,
        profileId,
        NEWSLETTER_CONSENT_VERSION,
        generateUnsubscribeToken(),
        ip,
        userAgent,
      ],
    );
    return { ok: true, status: 'subscribed', message: subscribeMessage('subscribed') };
  }

  if (row.status === 'subscribed') {
    return { ok: true, status: 'already_subscribed', message: subscribeMessage('already_subscribed') };
  }

  await query(
    `update public.newsletter_subscribers
        set status = 'subscribed',
            email = $2,
            source = $3,
            profile_id = coalesce($4, profile_id),
            consent_accepted = true,
            consent_text_version = $5,
            subscribed_at = now(),
            unsubscribed_at = null,
            ip_address = coalesce($6, ip_address),
            user_agent = coalesce($7, user_agent),
            updated_at = now()
      where id = $1`,
    [row.id, email, source, profileId, NEWSLETTER_CONSENT_VERSION, ip, userAgent],
  );

  return { ok: true, status: 'resubscribed', message: subscribeMessage('resubscribed') };
}

export async function unsubscribeFromNewsletter(tokenRaw: string): Promise<{ ok: true; already: boolean }> {
  const token = tokenRaw.trim();
  if (!token || token.length < 16) {
    throw ApiError.badRequest('Недействительная ссылка отписки', 'UNSUBSCRIBE_INVALID');
  }

  const r = await query<{ id: string; status: string }>(
    `select id, status from public.newsletter_subscribers where unsubscribe_token = $1 limit 1`,
    [token],
  );
  const row = r.rows[0];
  if (!row) {
    throw ApiError.notFound('Подписка не найдена', 'UNSUBSCRIBE_NOT_FOUND');
  }

  if (row.status === 'unsubscribed') {
    return { ok: true, already: true };
  }

  await query(
    `update public.newsletter_subscribers
        set status = 'unsubscribed', unsubscribed_at = now(), updated_at = now()
      where id = $1`,
    [row.id],
  );

  return { ok: true, already: false };
}

export async function getSubscriberUnsubscribeTokenByEmail(normalizedEmail: string): Promise<string | null> {
  const r = await query<{ unsubscribe_token: string }>(
    `select unsubscribe_token from public.newsletter_subscribers
      where normalized_email = $1 and status = 'subscribed'
      limit 1`,
    [normalizedEmail],
  );
  return r.rows[0]?.unsubscribe_token ?? null;
}
