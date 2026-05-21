import { createHash, randomBytes } from 'node:crypto';
import type { PoolClient } from 'pg';
import { query, withTransaction } from '../../../config/db.js';
import { ApiError } from '../../../utils/ApiError.js';

export type EmailTokenPurpose = 'verify_email' | 'reset_password';

const TTL_MS: Record<EmailTokenPurpose, number> = {
  verify_email: 24 * 60 * 60 * 1000,
  reset_password: 60 * 60 * 1000,
};

function hashToken(raw: string): string {
  return createHash('sha256').update(raw, 'utf8').digest('hex');
}

export function generateRawToken(): string {
  return randomBytes(32).toString('base64url');
}

async function invalidatePendingTokens(
  client: PoolClient,
  profileId: string,
  purpose: EmailTokenPurpose,
): Promise<void> {
  await client.query(
    `update public.auth_email_tokens
        set used_at = now()
      where profile_id = $1
        and purpose = $2::public.auth_email_token_purpose
        and used_at is null`,
    [profileId, purpose],
  );
}

export async function createEmailToken(
  profileId: string,
  email: string,
  purpose: EmailTokenPurpose,
): Promise<string> {
  const raw = generateRawToken();
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + TTL_MS[purpose]);

  await withTransaction(async (client) => {
    await invalidatePendingTokens(client, profileId, purpose);
    await client.query(
      `insert into public.auth_email_tokens (profile_id, email, token_hash, purpose, expires_at)
       values ($1, $2, $3, $4::public.auth_email_token_purpose, $5)`,
      [profileId, email, tokenHash, purpose, expiresAt.toISOString()],
    );
  });

  return raw;
}

type ConsumedToken = {
  profile_id: string;
  email: string;
  purpose: EmailTokenPurpose;
};

export async function consumeEmailToken(
  rawToken: string,
  expectedPurpose: EmailTokenPurpose,
): Promise<ConsumedToken> {
  const tokenHash = hashToken(rawToken.trim());
  const r = await query<{
    id: string;
    profile_id: string;
    email: string;
    purpose: EmailTokenPurpose;
    expires_at: Date | string;
    used_at: Date | string | null;
  }>(
    `select id, profile_id, email, purpose::text as purpose, expires_at, used_at
       from public.auth_email_tokens
      where token_hash = $1
      limit 1`,
    [tokenHash],
  );

  const row = r.rows[0];
  if (!row) {
    throw ApiError.badRequest('Ссылка недействительна или устарела', 'EMAIL_TOKEN_INVALID');
  }
  if (row.purpose !== expectedPurpose) {
    throw ApiError.badRequest('Ссылка недействительна или устарела', 'EMAIL_TOKEN_INVALID');
  }
  if (row.used_at) {
    throw ApiError.badRequest('Ссылка уже использована', 'EMAIL_TOKEN_USED');
  }

  const expires =
    row.expires_at instanceof Date ? row.expires_at.getTime() : new Date(row.expires_at).getTime();
  if (expires < Date.now()) {
    throw ApiError.badRequest('Ссылка истекла. Запросите новую.', 'EMAIL_TOKEN_EXPIRED');
  }

  await query(
    `update public.auth_email_tokens set used_at = now() where id = $1`,
    [row.id],
  );

  return {
    profile_id: row.profile_id,
    email: row.email,
    purpose: row.purpose,
  };
}
