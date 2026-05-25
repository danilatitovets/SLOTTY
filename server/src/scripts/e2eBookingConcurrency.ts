/**
 * Проверка double-booking: 10 параллельных POST на один slot → 1 success, остальные conflict.
 * Запуск: cd server && npm run e2e:booking-concurrency
 */
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { connectE2ePg, loadE2eEnv } from './e2eDb.js';

function bearer(profileId: string, role: 'client'): string {
  return jwt.sign({ sub: profileId, role }, process.env.JWT_SECRET!, { expiresIn: '2h' });
}

async function book(
  base: string,
  token: string,
  slotId: string,
  serviceId: string,
): Promise<{ status: number; code?: string }> {
  const res = await fetch(`${base}/api/appointments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ slotId, serviceId }),
  });
  const json = (await res.json().catch(() => null)) as { error?: { code?: string } } | null;
  return { status: res.status, code: json?.error?.code };
}

async function main() {
  loadE2eEnv();
  if (!process.env.JWT_SECRET?.trim()) {
    process.env.JWT_SECRET = 'e2e-booking-concurrency-secret-32chars!!';
  }
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const apiBase = process.env.E2E_API_URL ?? `http://localhost:${process.env.PORT ?? 4000}`;
  const pgClient = await connectE2ePg();
  const tag = `e2e_bc_${Date.now()}`;
  const profileIds: string[] = [];
  let masterId = '';
  let serviceId = '';
  let slotId = '';

  try {
    const health = await fetch(`${apiBase}/api/health/`);
    if (!health.ok) {
      console.error('API не отвечает на', apiBase);
      process.exit(1);
    }

    const cat = await pgClient.query<{ id: string }>(
      `select id from public.service_categories where is_active = true order by sort_order asc limit 1`,
    );
    const categoryId = cat.rows[0]?.id;
    if (!categoryId) {
      console.error('Нет категории услуг');
      process.exit(1);
    }

    masterId = crypto.randomUUID();
    await pgClient.query(
      `insert into public.profiles (id, role, full_name, account_status, created_at, updated_at)
       values ($1, 'master', $2, 'active', now(), now())`,
      [masterId, `${tag}_master`],
    );
    profileIds.push(masterId);
    await pgClient.query(
      `insert into public.master_profiles (master_id, display_name, publication_status, is_profile_active, created_at, updated_at)
       values ($1, $2, 'published', true, now(), now())`,
      [masterId, `${tag}_master`],
    );

    serviceId = crypto.randomUUID();
    const startsAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);
    await pgClient.query(
      `insert into public.master_services (
         id, master_id, category_id, title, duration_minutes, price_amount, price_type, is_active, sort_order, created_at, updated_at
       ) values ($1, $2, $3, $4, 60, 50, 'fixed', true, 0, now(), now())`,
      [serviceId, masterId, categoryId, `${tag}_svc`],
    );

    slotId = crypto.randomUUID();
    await pgClient.query(
      `insert into public.master_availability_slots (
         id, master_id, service_id, starts_at, ends_at, status, source, created_at, updated_at
       ) values ($1, $2, $3, $4, $5, 'available', 'manual', now(), now())`,
      [slotId, masterId, serviceId, startsAt.toISOString(), endsAt.toISOString()],
    );

    const clientTokens: string[] = [];
    for (let i = 0; i < 10; i++) {
      const cid = crypto.randomUUID();
      await pgClient.query(
        `insert into public.profiles (id, role, full_name, account_status, created_at, updated_at)
         values ($1, 'client', $2, 'active', now(), now())`,
        [cid, `${tag}_client_${i}`],
      );
      profileIds.push(cid);
      clientTokens.push(bearer(cid, 'client'));
    }

    const results = await Promise.all(
      clientTokens.map((token) => book(apiBase, token, slotId, serviceId)),
    );

    const success = results.filter((r) => r.status === 201).length;
    const conflicts = results.filter(
      (r) => r.status === 409 || r.status === 400 || r.code === 'SLOT_UNAVAILABLE' || r.code === 'MASTER_OVERLAP',
    ).length;

    console.log('Results:', results.map((r) => `${r.status}/${r.code ?? '-'}`).join(', '));
    console.log(`Success: ${success}, Conflicts/other: ${results.length - success}`);

    if (success === 1 && conflicts >= 8) {
      console.log('✓ e2e booking concurrency OK');
      process.exit(0);
    }

    console.error('✗ Expected 1 success and >=8 conflicts');
    process.exit(1);
  } finally {
    for (const id of profileIds) {
      await pgClient.query(`delete from public.profiles where id = $1`, [id]).catch(() => {});
    }
    if (slotId) {
      await pgClient.query(`delete from public.master_availability_slots where id = $1`, [slotId]).catch(() => {});
    }
    if (serviceId) {
      await pgClient.query(`delete from public.master_services where id = $1`, [serviceId]).catch(() => {});
    }
    await pgClient.end().catch(() => {});
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
