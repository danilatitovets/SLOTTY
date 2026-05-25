import { env } from '../../../config/env.js';
import { query } from '../../../config/db.js';
import { ApiError } from '../../../utils/ApiError.js';
import { syncMasterAccountVerified } from '../accountVerification.js';
import {
  findProfileIdByIdentity,
  hashEmailPassword,
  normalizeAuthEmail,
} from '../authIdentities.service.js';
import { resetPasswordEmailHtml, verificationEmailHtml } from './emailLayout.js';
import { createEmailToken, consumeEmailToken } from './emailTokens.service.js';
import { sendSlottyEmail } from './resendMail.js';

function authPageUrl(path: string, token: string): string {
  const base = env.CLIENT_URL.replace(/\/$/, '');
  return `${base}${path}?token=${encodeURIComponent(token)}`;
}

export async function getEmailIdentityForProfile(profileId: string): Promise<{
  email: string;
  emailVerified: boolean;
} | null> {
  const r = await query<{ email: string | null; email_verified_at: Date | string | null }>(
    `select email, email_verified_at
       from public.auth_identities
      where profile_id = $1 and provider = 'email'::public.auth_provider
      limit 1`,
    [profileId],
  );
  const row = r.rows[0];
  if (!row?.email) return null;
  return {
    email: row.email,
    emailVerified: Boolean(row.email_verified_at),
  };
}

export async function sendVerificationEmailForProfile(profileId: string): Promise<{ sent: boolean }> {
  const identity = await getEmailIdentityForProfile(profileId);
  if (!identity) {
    throw ApiError.badRequest('Email не привязан к аккаунту', 'EMAIL_IDENTITY_MISSING');
  }
  if (identity.emailVerified) {
    return { sent: false };
  }

  const raw = await createEmailToken(profileId, identity.email, 'verify_email');
  const url = authPageUrl('/auth/verify-email', raw);
  const { subject, html } = verificationEmailHtml(url);

  await sendSlottyEmail({ to: identity.email, subject, html });
  return { sent: true };
}

export async function sendVerificationEmailByAddress(emailRaw: string): Promise<{ sent: boolean }> {
  const email = normalizeAuthEmail(emailRaw);
  const profileId = await findProfileIdByIdentity('email', email);
  if (!profileId) {
    // Не раскрываем, есть ли аккаунт
    return { sent: true };
  }
  return sendVerificationEmailForProfile(profileId);
}

export async function verifyEmailWithToken(rawToken: string): Promise<{ verified: boolean }> {
  const consumed = await consumeEmailToken(rawToken, 'verify_email');
  await query(
    `update public.auth_identities
        set email_verified_at = now(), updated_at = now()
      where profile_id = $1
        and provider = 'email'::public.auth_provider
        and lower(email) = lower($2)`,
    [consumed.profile_id, consumed.email],
  );
  await syncMasterAccountVerified(consumed.profile_id).catch((e) => {
    console.error('[SLOTTY] sync master is_verified after email verify failed:', e);
  });
  return { verified: true };
}

export async function requestPasswordReset(emailRaw: string): Promise<{ sent: boolean }> {
  const email = normalizeAuthEmail(emailRaw);
  const profileId = await findProfileIdByIdentity('email', email);
  if (!profileId) {
    return { sent: true };
  }

  const identity = await getEmailIdentityForProfile(profileId);
  if (!identity?.emailVerified) {
    // Не отправляем сброс на неподтверждённый email, но ответ как при успехе
    return { sent: true };
  }

  const raw = await createEmailToken(profileId, email, 'reset_password');
  const url = authPageUrl('/auth/reset-password', raw);
  const { subject, html } = resetPasswordEmailHtml(url);

  await sendSlottyEmail({ to: email, subject, html });
  return { sent: true };
}

export async function resetPasswordWithToken(rawToken: string, password: string): Promise<{ ok: boolean }> {
  const consumed = await consumeEmailToken(rawToken, 'reset_password');
  const hash = await hashEmailPassword(password);

  await query(
    `update public.auth_identities
        set credential_hash = $2, updated_at = now()
      where profile_id = $1
        and provider = 'email'::public.auth_provider
        and lower(email) = lower($3)`,
    [consumed.profile_id, hash, consumed.email],
  );

  return { ok: true };
}
