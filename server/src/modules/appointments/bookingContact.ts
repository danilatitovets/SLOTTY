import type { PoolClient } from 'pg';
import { query } from '../../config/db.js';
import { formatClientName } from '../../lib/displayFormat.js';
import { ApiError } from '../../utils/ApiError.js';

export type ClientContactSnapshot = {
  clientName: string;
  clientPhone: string | null;
  clientEmail: string | null;
  clientTelegramUsername: string | null;
  clientTelegramId: string | null;
  bookingSource: string;
};

export async function loadClientContactSnapshot(
  clientId: string,
  client?: PoolClient,
): Promise<ClientContactSnapshot> {
  const run = client ? client.query.bind(client) : query;
  const r = await run<{
    full_name: string;
    phone: string | null;
    telegram_username: string | null;
    telegram_user_id: string | null;
  }>(
    `select coalesce(p.full_name, '') as full_name, p.phone, p.telegram_username,
            p.telegram_user_id::text as telegram_user_id
       from public.profiles p where p.id = $1`,
    [clientId],
  );
  const row = r.rows[0];
  const emailR = await run<{ email: string }>(
    `select email from public.auth_identities
      where profile_id = $1 and email is not null and trim(email) <> ''
      order by case provider::text when 'email' then 0 when 'google' then 1 else 2 end
      limit 1`,
    [clientId],
  );
  const email = emailR.rows[0]?.email?.trim() || null;

  let bookingSource = 'web';
  const idR = await run<{ providers: string }>(
    `select string_agg(distinct provider::text, ',') as providers
       from public.auth_identities where profile_id = $1`,
    [clientId],
  );
  const providers = idR.rows[0]?.providers ?? '';
  if (providers.includes('telegram')) bookingSource = 'telegram';
  else if (providers.includes('google')) bookingSource = 'google';
  else if (providers.includes('email')) bookingSource = 'email';

  const clientName = formatClientName({
    full_name: row?.full_name ?? '',
    phone: row?.phone,
    telegram_username: row?.telegram_username,
  });

  return {
    clientName,
    clientPhone: row?.phone?.trim() || null,
    clientEmail: email,
    clientTelegramUsername: row?.telegram_username?.trim().replace(/^@+/, '') || null,
    clientTelegramId: row?.telegram_user_id?.trim() || null,
    bookingSource,
  };
}

export function assertClientHasContact(snapshot: ClientContactSnapshot): void {
  if (snapshot.clientPhone || snapshot.clientEmail || snapshot.clientTelegramId || snapshot.clientTelegramUsername) {
    return;
  }
  throw ApiError.badRequest(
    'Для записи нужен телефон, email или Telegram. Укажите контакт в профиле.',
    'BOOKING_CONTACT_REQUIRED',
  );
}
