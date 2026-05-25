/**
 * Безопасный merge: Google identity с пустого duplicate → canonical master profile.
 *
 * cd server && npx tsx src/scripts/mergeGoogleDuplicateProfile.ts --email danila.titovets@gmail.com
 * cd server && npx tsx src/scripts/mergeGoogleDuplicateProfile.ts --email ... --execute
 * cd server && npx tsx src/scripts/mergeGoogleDuplicateProfile.ts --canonical <uuid> --duplicate <uuid> --execute
 */
import { query, withTransaction } from '../config/db.js';
import {
  diagnoseProfilesByEmail,
  isProfileEmptyDuplicate,
  isProfileSubstantial,
} from '../modules/auth/profileDuplicatePolicy.js';
import { loadE2eEnv } from './e2eDb.js';

type IdentityRow = {
  provider: string;
  provider_user_id: string;
  email: string | null;
  credential_hash: string | null;
};

async function reassignAllIdentities(fromId: string, toId: string): Promise<number> {
  let moved = 0;
  await withTransaction(async (client) => {
    const r = await client.query<IdentityRow>(
      `select provider::text as provider, provider_user_id, email, credential_hash
         from public.auth_identities where profile_id = $1`,
      [fromId],
    );

    for (const row of r.rows) {
      const conflict = await client.query<{ profile_id: string }>(
        `select profile_id from public.auth_identities
          where provider = $1::public.auth_provider and provider_user_id = $2`,
        [row.provider, row.provider_user_id],
      );
      const existing = conflict.rows[0]?.profile_id;
      if (existing && existing !== toId && existing !== fromId) {
        throw new Error(
          `Конфликт identity ${row.provider}/${row.provider_user_id}: уже на profile ${existing}`,
        );
      }

      await client.query(
        `insert into public.auth_identities (
           profile_id, provider, provider_user_id, email, credential_hash
         ) values ($1, $2::public.auth_provider, $3, $4, $5)
         on conflict (provider, provider_user_id) do update set
           profile_id = excluded.profile_id,
           email = coalesce(excluded.email, public.auth_identities.email),
           credential_hash = coalesce(excluded.credential_hash, public.auth_identities.credential_hash),
           updated_at = now()`,
        [toId, row.provider, row.provider_user_id, row.email, row.credential_hash],
      );
      await client.query(
        `delete from public.auth_identities
          where profile_id = $1 and provider = $2::public.auth_provider and provider_user_id = $3`,
        [fromId, row.provider, row.provider_user_id],
      );
      moved++;
    }
  });
  return moved;
}

async function countProfileRefs(profileId: string): Promise<Record<string, number>> {
  const tables: { key: string; sql: string }[] = [
    { key: 'auth_identities', sql: `select count(*)::int as n from public.auth_identities where profile_id = $1` },
    { key: 'master_profiles', sql: `select count(*)::int as n from public.master_profiles where master_id = $1` },
    { key: 'master_services', sql: `select count(*)::int as n from public.master_services where master_id = $1` },
    { key: 'master_subscriptions', sql: `select count(*)::int as n from public.master_subscriptions where master_id = $1` },
    {
      key: 'appointments',
      sql: `select count(*)::int as n from public.appointments where master_id = $1 or client_id = $1`,
    },
    { key: 'favorites', sql: `select count(*)::int as n from public.favorites where client_id = $1` },
  ];
  const out: Record<string, number> = {};
  for (const t of tables) {
    const r = await query<{ n: number }>(t.sql, [profileId]);
    out[t.key] = r.rows[0]?.n ?? 0;
  }
  return out;
}

async function safeDeleteProfile(profileId: string): Promise<void> {
  const refs = await countProfileRefs(profileId);
  const blocking = Object.entries(refs).filter(([k, n]) => k !== 'auth_identities' && n > 0);
  if (blocking.length > 0) {
    throw new Error(`Нельзя удалить ${profileId}: остались данные ${JSON.stringify(refs)}`);
  }
  if ((refs.auth_identities ?? 0) > 0) {
    throw new Error(`Нельзя удалить ${profileId}: остались identities`);
  }
  await query(`delete from public.profiles where id = $1`, [profileId]);
}

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');
  const emailIdx = args.indexOf('--email');
  const email = emailIdx >= 0 ? args[emailIdx + 1]?.trim() : undefined;
  const canonicalIdx = args.indexOf('--canonical');
  const duplicateIdx = args.indexOf('--duplicate');
  let canonicalId = canonicalIdx >= 0 ? args[canonicalIdx + 1]?.trim() : undefined;
  let duplicateId = duplicateIdx >= 0 ? args[duplicateIdx + 1]?.trim() : undefined;

  loadE2eEnv();
  if (email) {
      const rows = await diagnoseProfilesByEmail(email);
      console.log('Диагностика:', JSON.stringify(rows, null, 2));
      if (!canonicalId) canonicalId = rows.find((r) => r.isLikelyMainProfile)?.profileId;
      if (!duplicateId) duplicateId = rows.find((r) => r.isLikelyDuplicateProfile)?.profileId;
    }

    if (!canonicalId || !duplicateId) {
      console.error('Укажите --email или пару --canonical + --duplicate');
      process.exit(1);
    }
    if (canonicalId === duplicateId) {
      console.error('canonical и duplicate совпадают');
      process.exit(1);
    }

    const canonicalOk = await isProfileSubstantial(canonicalId);
    const dupEmpty = await isProfileEmptyDuplicate(duplicateId);
    console.log(`\ncanonical ${canonicalId}: substantial=${canonicalOk}`);
    console.log(`duplicate ${duplicateId}: emptyDuplicate=${dupEmpty}`);

    if (!canonicalOk) {
      console.warn('⚠ canonical profile не выглядит «основным» — проверьте вручную');
    }
    if (!dupEmpty) {
      console.warn('⚠ duplicate не пустой — удаление отключено');
    }

    const dupRefs = await countProfileRefs(duplicateId);
    console.log('Duplicate refs:', dupRefs);

    const googleOnDup = await query(
      `select * from public.auth_identities where profile_id = $1 and provider = 'google'`,
      [duplicateId],
    );
    console.log('Google identities on duplicate:', googleOnDup.rows);

    if (!execute) {
      console.log('\n[DRY-RUN] Для выполнения добавьте --execute');
      return;
    }

    const moved = await reassignAllIdentities(duplicateId, canonicalId);
    console.log(`Перенесено identities: ${moved}`);

    if (dupEmpty) {
      await safeDeleteProfile(duplicateId);
      console.log(`Удалён пустой profile ${duplicateId}`);
    } else {
      console.log(`Profile ${duplicateId} НЕ удалён (не пустой дубль)`);
    }

    const after = await diagnoseProfilesByEmail(email ?? '');
    if (email) console.log('\nПосле merge:', JSON.stringify(after, null, 2));
  console.log('\nГотово. Попросите пользователя выйти и войти через Google снова.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
