/**
 * Smoke-проверка block/restrict на API.
 * Запуск: cd server && npx tsx src/scripts/e2ePlatformAdminAccess.ts
 */
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { connectE2ePg, loadE2eEnv } from './e2eDb.js';

type Result = { name: string; ok: boolean; detail?: string };
const results: Result[] = [];

function pass(name: string, detail?: string) {
  results.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name: string, detail?: string) {
  results.push({ name, ok: false, detail });
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ''}`);
}

function bearer(profileId: string, role: 'master' | 'client', jwtSecret: string): string {
  return jwt.sign({ sub: profileId, role }, jwtSecret, { expiresIn: '2h' });
}

async function api(
  base: string,
  token: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; json: unknown }> {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

async function main() {
  loadE2eEnv();

  if (!process.env.JWT_SECRET?.trim()) {
    process.env.JWT_SECRET = 'e2e-platform-access-secret-32chars!!';
  }
  process.env.NODE_ENV = process.env.NODE_ENV ?? 'development';
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const jwtSecret = process.env.JWT_SECRET!;
  const apiBase = process.env.E2E_API_URL ?? `http://localhost:${process.env.PORT ?? 4000}`;

  const pgClient = await connectE2ePg();
  const tag = `e2e_pa_${Date.now()}`;
  const cleanupProfileIds: string[] = [];

  try {
    const cat = await pgClient.query<{ id: string }>(
      `select id from public.service_categories where is_active = true order by sort_order asc limit 1`,
    );
    const categoryId = cat.rows[0]?.id;
    if (!categoryId) {
      fail('setup', 'Нет активной категории услуг');
      process.exit(1);
    }

    const mkProfile = async (role: 'master' | 'client', label: string) => {
      const id = crypto.randomUUID();
      await pgClient.query(
        `insert into public.profiles (id, role, full_name, account_status, created_at, updated_at)
         values ($1, $2::public.user_role, $3, 'active', now(), now())`,
        [id, role, `${tag}_${label}`],
      );
      if (role === 'master') {
        await pgClient.query(
          `insert into public.master_profiles (master_id, display_name, publication_status, created_at, updated_at)
           values ($1, $2, 'published', now(), now())`,
          [id, `${tag}_${label}`],
        );
      }
      cleanupProfileIds.push(id);
      return id;
    };

    const activeMasterId = await mkProfile('master', 'active');
    const restrictMasterId = await mkProfile('master', 'restricted');
    const blockMasterId = await mkProfile('master', 'blocked');
    const restrictClientId = await mkProfile('client', 'restricted_client');
    const activeClientId = await mkProfile('client', 'active_client');

    await pgClient.query(
      `update public.profiles
          set account_status = 'restricted',
              access_restriction_reason = 'e2e test restrict',
              access_restricted_until = null
        where id = $1`,
      [restrictMasterId],
    );
    await pgClient.query(
      `update public.profiles
          set account_status = 'restricted',
              access_restriction_reason = 'e2e client restrict'
        where id = $1`,
      [restrictClientId],
    );
    await pgClient.query(
      `update public.profiles
          set account_status = 'blocked',
              blocked_reason = 'e2e test block'
        where id = $1`,
      [blockMasterId],
    );

    const activeMasterToken = bearer(activeMasterId, 'master', jwtSecret);
    const restrictMasterToken = bearer(restrictMasterId, 'master', jwtSecret);
    const blockMasterToken = bearer(blockMasterId, 'master', jwtSecret);
    const restrictClientToken = bearer(restrictClientId, 'client', jwtSecret);
    const activeClientToken = bearer(activeClientId, 'client', jwtSecret);

    const serviceBody = {
      categoryId,
      title: `${tag}_service`,
      durationMinutes: 60,
      priceAmount: 50,
      priceType: 'fixed',
    };

    const activeSvc = await api(apiBase, activeMasterToken, 'POST', '/api/masters/me/services', serviceBody);
    if (activeSvc.status === 201 || activeSvc.status === 200) {
      pass('active master can create service', `status ${activeSvc.status}`);
    } else {
      fail('active master can create service', `status ${activeSvc.status} ${JSON.stringify(activeSvc.json)}`);
    }

    const restrictedSvc = await api(
      apiBase,
      restrictMasterToken,
      'POST',
      '/api/masters/me/services',
      serviceBody,
    );
    if (restrictedSvc.status === 403) {
      const code = (restrictedSvc.json as { error?: { code?: string } })?.error?.code;
      pass('restricted master cannot create service', code ?? '403');
    } else {
      fail('restricted master cannot create service', `status ${restrictedSvc.status}`);
    }

    const blockedSvc = await api(apiBase, blockMasterToken, 'POST', '/api/masters/me/services', serviceBody);
    if (blockedSvc.status === 403) {
      pass('blocked master cannot create service (old JWT)', '403');
    } else {
      fail('blocked master cannot create service', `status ${blockedSvc.status}`);
    }

    const blockedMe = await api(apiBase, blockMasterToken, 'GET', '/api/me');
    if (blockedMe.status === 403) {
      pass('blocked master GET /api/me returns 403', 'old JWT invalidated by DB status');
    } else {
      fail('blocked master GET /api/me', `status ${blockedMe.status}`);
    }

    const slotStart = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
    const slotBody = {
      startsAt: slotStart.toISOString(),
      endsAt: slotEnd.toISOString(),
    };

    const restrictedSlot = await api(
      apiBase,
      restrictMasterToken,
      'POST',
      '/api/masters/me/slots',
      slotBody,
    );
    if (restrictedSlot.status === 403) {
      pass('restricted master cannot create slot', '403');
    } else {
      fail('restricted master cannot create slot', `status ${restrictedSlot.status}`);
    }

    const fakeSlotId = crypto.randomUUID();
    const fakeServiceId = crypto.randomUUID();
    const restrictedBook = await api(apiBase, restrictClientToken, 'POST', '/api/appointments', {
      slotId: fakeSlotId,
      serviceId: fakeServiceId,
    });
    if (restrictedBook.status === 403) {
      pass('restricted client cannot create booking', '403');
    } else {
      fail('restricted client cannot create booking', `status ${restrictedBook.status}`);
    }

    const activeMe = await api(apiBase, activeClientToken, 'GET', '/api/me');
    if (activeMe.status === 200) {
      pass('active client GET /api/me', '200');
    } else {
      fail('active client GET /api/me', `status ${activeMe.status}`);
    }
  } finally {
    for (const id of cleanupProfileIds) {
      await pgClient.query(`delete from public.appointments where client_id = $1 or master_id = $1`, [id]);
      await pgClient.query(`delete from public.master_availability_slots where master_id = $1`, [id]);
      await pgClient.query(`delete from public.master_services where master_id = $1`, [id]);
      await pgClient.query(`delete from public.master_profiles where master_id = $1`, [id]);
      await pgClient.query(`delete from public.auth_identities where profile_id = $1`, [id]);
      await pgClient.query(`delete from public.profiles where id = $1`, [id]);
    }
    await pgClient.end();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\nИтого: ${results.length - failed.length}/${results.length} OK`);
  if (failed.length) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
