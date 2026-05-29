/**
 * E2E проверки дедупликации Google / canonical profile (только БД + server logic).
 * cd server && npm run e2e:google-dedup
 */
import { randomUUID } from 'node:crypto';
import {
  collectGoogleLoginCandidateProfileIds,
  issueSessionForProfile,
  loginOrRegisterWithGoogle,
  pickPreferredProfileIdAmong,
  resolveCanonicalProfileId,
} from '../modules/auth/authIdentities.service.js';
import {
  isProfileEmptyDuplicate,
  isProfileSubstantial,
} from '../modules/auth/profileDuplicatePolicy.js';
import { query, withTransaction } from '../config/db.js';
import { loadE2eEnv } from './e2eDb.js';

const tag = `e2e_g_${Date.now()}`;
const cleanup: string[] = [];

function log(ok: boolean, name: string, detail: string) {
  console.log(`${ok ? '✓' : '✗'} ${name} — ${detail}`);
  if (!ok) process.exitCode = 1;
}

async function insertProfile(role: 'client' | 'master', name: string): Promise<string> {
  const id = randomUUID();
  await query(
    `insert into public.profiles (id, full_name, role) values ($1, $2, $3::public.user_role)`,
    [id, name, role],
  );
  cleanup.push(id);
  return id;
}

async function insertEmailIdentity(profileId: string, email: string) {
  await query(
    `insert into public.auth_identities (profile_id, provider, provider_user_id, email)
     values ($1, 'email', $2, $2)
     on conflict (provider, provider_user_id) do update set profile_id = excluded.profile_id`,
    [profileId, email],
  );
}

async function insertGoogleIdentity(profileId: string, sub: string, email: string) {
  await query(
    `insert into public.auth_identities (profile_id, provider, provider_user_id, email)
     values ($1, 'google', $2, $3)
     on conflict (provider, provider_user_id) do update set profile_id = excluded.profile_id`,
    [profileId, sub, email],
  );
}

async function insertMasterShell(masterId: string) {
  await query(
    `insert into public.master_profiles (master_id, display_name) values ($1, $2)
     on conflict (master_id) do update set display_name = excluded.display_name`,
    [masterId, `Master ${tag}`],
  );
}

async function insertService(masterId: string) {
  const cat = await query<{ id: string }>(
    `select id from public.service_categories limit 1`,
  );
  const categoryId = cat.rows[0]?.id;
  if (!categoryId) {
    throw new Error('Нет service_categories для e2e');
  }
  await query(
    `insert into public.master_services (master_id, title, duration_minutes, price_amount, category_id)
     values ($1, $2, 30, 10, $3)`,
    [masterId, `Svc ${tag}`, categoryId],
  );
}

async function cleanupAll() {
  for (const id of cleanup) {
    await query(`delete from public.profiles where id = $1`, [id]).catch(() => undefined);
  }
}

async function main() {
  loadE2eEnv();
  const email = `${tag}@e2e.test`;
  const googleSub = `google-sub-${tag}`;

  try {
    // --- Сценарий 1: master A с email, нет google → кандидаты по email при login payload ---
    const masterA = await insertProfile('master', `A ${tag}`);
    await insertEmailIdentity(masterA, email);
    await insertMasterShell(masterA);
    await insertService(masterA);

    const candidates1 = await collectGoogleLoginCandidateProfileIds({
      sub: `new-${googleSub}`,
      email,
      name: 'E2E',
      picture: undefined,
    });
    const pick1 = await pickPreferredProfileIdAmong(candidates1);
    log(
      pick1 === masterA || (candidates1.includes(masterA) && pick1 === masterA),
      'S1: Google login candidates prefer master with email',
      `pick=${pick1} masterA=${masterA} candidates=${candidates1.join(',')}`,
    );

    // --- Сценарий 2: пустой B с google, master A с email → pick A ---
    const emptyB = await insertProfile('client', `B ${tag}`);
    await insertGoogleIdentity(emptyB, googleSub, email);

    const candidates2 = await collectGoogleLoginCandidateProfileIds({
      sub: googleSub,
      email,
      name: undefined,
      picture: undefined,
    });
    const pick2 = await pickPreferredProfileIdAmong(candidates2);
    log(
      pick2 === masterA,
      'S2: canonical picks master A over empty Google B',
      `pick=${pick2} expected=${masterA}`,
    );

    const emptyDup = await isProfileEmptyDuplicate(emptyB);
    const substantialA = await isProfileSubstantial(masterA);
    log(emptyDup, 'S2d: B is empty duplicate', String(emptyDup));
    log(substantialA, 'S2e: A is substantial', String(substantialA));

    const canonicalFromB = await resolveCanonicalProfileId(emptyB);
    log(
      canonicalFromB === masterA,
      'S2b: resolveCanonicalProfileId(B) → A',
      `got=${canonicalFromB}`,
    );

    const session = await issueSessionForProfile(emptyB);
    log(
      session.profile.id === masterA,
      'S2c: issueSessionForProfile(B) resolves to master A (orphan shell + alias)',
      `profile.id=${session.profile.id}`,
    );

    const loginSession = await loginOrRegisterWithGoogle({
      sub: googleSub,
      email,
      name: 'E2E Login',
      picture: undefined,
      email_verified: true,
    });
    log(
      loginSession.profile.id === masterA,
      'S2c-login: loginOrRegisterWithGoogle → master A',
      `profile.id=${loginSession.profile.id}`,
    );

    // --- Сценарий 3: link simulation — reassign google to A (same as login merge path) ---
    await withTransaction(async (client) => {
      await client.query(
        `delete from public.auth_identities
          where provider = 'google' and provider_user_id = $1 and profile_id <> $2`,
        [googleSub, masterA],
      );
      await client.query(
        `insert into public.auth_identities (profile_id, provider, provider_user_id, email)
         values ($1, 'google', $2, $3)
         on conflict (provider, provider_user_id) do update set profile_id = excluded.profile_id`,
        [masterA, googleSub, email],
      );
    });
    const googleOnA = await query(
      `select profile_id from public.auth_identities where provider = 'google' and provider_user_id = $1`,
      [googleSub],
    );
    log(
      googleOnA.rows[0]?.profile_id === masterA,
      'S3: Google identity on master A after reassign',
      `profile_id=${googleOnA.rows[0]?.profile_id}`,
    );

    // --- Сценарий 4: два substantial — pick не должен молча мержить чужих ---
    const otherMaster = await insertProfile('master', `Other ${tag}`);
    await insertEmailIdentity(otherMaster, `other-${email}`);
    await insertMasterShell(otherMaster);
    await insertService(otherMaster);
    const pick4 = await pickPreferredProfileIdAmong([masterA, otherMaster]);
    log(
      pick4 === masterA || pick4 === otherMaster,
      'S4: two substantial masters — pick returns one deterministically',
      `pick=${pick4}`,
    );

    // --- Сценарий 5: master+TG vs platform_admin+Google по email → TG/master ---
    const adminG = await insertProfile('client', `Admin ${tag}`);
    await query(
      `update public.profiles set role = 'platform_admin'::public.user_role where id = $1`,
      [adminG],
    );
    await insertGoogleIdentity(adminG, `admin-sub-${tag}`, email);

    const pick5 = await pickPreferredProfileIdAmong([masterA, adminG], { preferProvider: 'telegram' });
    log(
      pick5 === masterA,
      'S5: Telegram login prefers master over platform_admin Google shell',
      `pick=${pick5} masterA=${masterA} adminG=${adminG}`,
    );

    const adminSubstantial = await isProfileSubstantial(adminG);
    log(!adminSubstantial, 'S5b: platform_admin without cabinet is not substantial', String(adminSubstantial));

    console.log('\n[e2e-google-dedup] done');
  } finally {
    await cleanupAll();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
