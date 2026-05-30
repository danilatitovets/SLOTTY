/**
 * Smoke: newsletter subscription, campaigns, unsubscribe, admin access.
 * cd server && npx tsx src/scripts/e2eNewsletterSmoke.ts
 *
 * Optional env (local only, never commit):
 *   RESEND_API_KEY, RESEND_FROM=SLOTTY <noreply@slotty.of.by>
 *   NEWSLETTER_SMOKE_TEST_EMAIL=you@example.com  — для реальной отправки test email
 *   E2E_API_URL=http://127.0.0.1:4000
 */
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { connectE2ePg, loadE2eEnv } from './e2eDb.js';
import { subscribeToNewsletter, unsubscribeFromNewsletter } from '../modules/newsletter/newsletter.service.js';
import {
  countEmailCampaignAudience,
  createEmailCampaignDraft,
  sendEmailCampaign,
  sendTestEmailCampaign,
} from '../modules/platform-admin/platformAdmin.emailCampaigns.service.js';

type Result = { name: string; ok: boolean; skip?: boolean; detail?: string };
const results: Result[] = [];

function pass(name: string, detail?: string) {
  results.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ''}`);
}

function skip(name: string, detail?: string) {
  results.push({ name, ok: true, skip: true, detail });
  console.log(`○ ${name} (skip)${detail ? ` — ${detail}` : ''}`);
}

function fail(name: string, detail?: string) {
  results.push({ name, ok: false, detail });
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ''}`);
}

function bearer(profileId: string, role: 'client' | 'master' | 'platform_admin', secret: string): string {
  return jwt.sign({ sub: profileId, role }, secret, { expiresIn: '2h' });
}

async function main() {
  loadE2eEnv();
  if (!process.env.JWT_SECRET?.trim()) {
    process.env.JWT_SECRET = 'e2e-newsletter-smoke-secret-32chars!';
  }
  process.env.NODE_ENV = process.env.NODE_ENV ?? 'development';

  const tag = `e2e_nl_${Date.now()}`;
  const testEmail = process.env.NEWSLETTER_SMOKE_TEST_EMAIL?.trim() || `${tag}@e2e.test`;
  const apiBase = process.env.E2E_API_URL ?? `http://127.0.0.1:${process.env.PORT ?? 4000}`;
  const jwtSecret = process.env.JWT_SECRET!;

  const pg = await connectE2ePg();
  let adminProfileId: string | null = null;
  let clientProfileId: string | null = null;
  let campaignId: string | null = null;
  let unsubscribeToken: string | null = null;

  try {
    // 1–3: subscribe + resubscribe + no duplicate
    const first = await subscribeToNewsletter({
      emailRaw: testEmail,
      consentAccepted: true,
      source: 'footer',
    });
    if (first.status === 'subscribed' || first.status === 'resubscribed') {
      pass('subscribe new/resubscribed', first.status);
    } else {
      pass('subscribe (already existed)', first.status);
    }

    const second = await subscribeToNewsletter({
      emailRaw: testEmail,
      consentAccepted: true,
      source: 'footer',
    });
    if (second.status === 'already_subscribed') {
      pass('resubscribe same email', 'already_subscribed');
    } else {
      fail('resubscribe same email', `expected already_subscribed, got ${second.status}`);
    }

    const countRows = await pg.query<{ n: string }>(
      `select count(*)::text as n from public.newsletter_subscribers where normalized_email = lower($1)`,
      [testEmail.trim()],
    );
    const rowCount = Number(countRows.rows[0]?.n ?? 0);
    if (rowCount === 1) {
      pass('no duplicate subscriber row', `count=${rowCount}`);
    } else {
      fail('no duplicate subscriber row', `count=${rowCount}`);
    }

    const subRow = await pg.query<{ unsubscribe_token: string; status: string }>(
      `select unsubscribe_token, status from public.newsletter_subscribers where normalized_email = lower($1)`,
      [testEmail.trim()],
    );
    unsubscribeToken = subRow.rows[0]?.unsubscribe_token ?? null;
    if (subRow.rows[0]?.status === 'subscribed' && unsubscribeToken) {
      pass('subscriber active with token', 'subscribed');
    } else {
      fail('subscriber active with token', JSON.stringify(subRow.rows[0]));
    }

    // Admin + client profiles for HTTP checks
    adminProfileId = crypto.randomUUID();
    clientProfileId = crypto.randomUUID();
    await pg.query(
      `insert into public.profiles (id, role, full_name, account_status, created_at, updated_at)
       values ($1, 'platform_admin'::public.user_role, $2, 'active', now(), now())`,
      [adminProfileId, `${tag}_admin`],
    );
    await pg.query(
      `insert into public.profiles (id, role, full_name, account_status, created_at, updated_at)
       values ($1, 'client'::public.user_role, $2, 'active', now(), now())`,
      [clientProfileId, `${tag}_client`],
    );

    const adminToken = bearer(adminProfileId, 'platform_admin', jwtSecret);
    const clientToken = bearer(clientProfileId, 'client', jwtSecret);

    // 4–5: create draft + test email
    const draft = await createEmailCampaignDraft(adminProfileId, {
      title: `${tag} smoke`,
      subject: 'SLOTTY smoke test',
      previewText: 'Smoke test newsletter',
      bodyText: 'Это автоматический smoke-тест рассылки SLOTTY.\n\nЕсли вы получили это письмо — Resend работает.',
      ctaText: 'Открыть SLOTTY',
      ctaUrl: 'https://slotty.of.by/book',
      audience: 'test_only',
    });
    campaignId = draft.id;
    pass('create campaign draft', draft.id);

    const resendConfigured = Boolean(process.env.RESEND_API_KEY?.trim());
    const realTestEmail = process.env.NEWSLETTER_SMOKE_TEST_EMAIL?.trim();

    if (resendConfigured && realTestEmail) {
      const testSend = await sendTestEmailCampaign(draft.id, realTestEmail);
      if (testSend.devLogged) {
        fail('send test email via Resend', 'devLogged despite RESEND_API_KEY');
      } else if (testSend.messageId) {
        pass('send test email via Resend', `messageId=${testSend.messageId}`);
      } else {
        pass('send test email via Resend', 'sent (no messageId)');
      }
    } else {
      skip(
        'send test email via Resend',
        !resendConfigured
          ? 'RESEND_API_KEY not set in server/.env'
          : 'NEWSLETTER_SMOKE_TEST_EMAIL not set',
      );
    }

    // 7–8: unsubscribe
    if (unsubscribeToken) {
      const unsub = await unsubscribeFromNewsletter(unsubscribeToken);
      if (unsub.ok) {
        pass('unsubscribe by token', unsub.already ? 'already' : 'ok');
      } else {
        fail('unsubscribe by token');
      }

      const after = await pg.query<{ status: string }>(
        `select status from public.newsletter_subscribers where normalized_email = lower($1)`,
        [testEmail.trim()],
      );
      if (after.rows[0]?.status === 'unsubscribed') {
        pass('status after unsubscribe', 'unsubscribed');
      } else {
        fail('status after unsubscribe', after.rows[0]?.status);
      }
    }

    // 9: unsubscribed not in newsletter audience
    const audienceCount = await countEmailCampaignAudience('newsletter_subscribers');
    const stillListed = await pg.query<{ n: string }>(
      `select count(*)::text as n from public.newsletter_subscribers
        where normalized_email = lower($1) and status = 'subscribed'`,
      [testEmail.trim()],
    );
    if (Number(stillListed.rows[0]?.n ?? 0) === 0) {
      pass('unsubscribed excluded from subscribed list', `audience total=${audienceCount}`);
    } else {
      fail('unsubscribed excluded from subscribed list');
    }

    // test_only campaign send (no real users)
    if (resendConfigured && realTestEmail) {
      const sendResult = await sendEmailCampaign(draft.id, {
        confirmed: true,
        testEmail: realTestEmail,
      });
      pass('send test_only campaign', `sent=${sendResult.sent} failed=${sendResult.failed}`);
    } else {
      skip('send test_only campaign', 'Resend or NEWSLETTER_SMOKE_TEST_EMAIL not configured');
    }

    // 10: HTTP admin guard
    let apiReachable = false;
    try {
      const health = await fetch(`${apiBase}/api/health/`, { signal: AbortSignal.timeout(3000) });
      apiReachable = health.ok;
    } catch {
      apiReachable = false;
    }

    if (apiReachable) {
      const clientRes = await fetch(`${apiBase}/api/platform-admin/email/campaigns`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      if (clientRes.status === 403) {
        pass('client blocked from admin campaigns', '403');
      } else {
        fail('client blocked from admin campaigns', `status ${clientRes.status}`);
      }

      const adminRes = await fetch(`${apiBase}/api/platform-admin/email/campaigns`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (adminRes.status === 200) {
        pass('platform_admin can list campaigns', '200');
      } else {
        fail('platform_admin can list campaigns', `status ${adminRes.status}`);
      }

      if (unsubscribeToken) {
        const unsubHttp = await fetch(`${apiBase}/api/newsletter/unsubscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: unsubscribeToken }),
        });
        if (unsubHttp.status === 200) {
          pass('unsubscribe HTTP endpoint', '200');
        } else {
          fail('unsubscribe HTTP endpoint', `status ${unsubHttp.status}`);
        }
      }
    } else {
      skip('HTTP admin/unsubscribe checks', `API not reachable at ${apiBase}`);
    }
  } finally {
    if (campaignId) {
      await pg.query(`delete from public.email_campaign_recipients where campaign_id = $1`, [campaignId]);
      await pg.query(`delete from public.email_campaigns where id = $1`, [campaignId]);
    }
    await pg.query(`delete from public.newsletter_subscribers where normalized_email = lower($1)`, [testEmail.trim()]);
    if (adminProfileId) await pg.query(`delete from public.profiles where id = $1`, [adminProfileId]);
    if (clientProfileId) await pg.query(`delete from public.profiles where id = $1`, [clientProfileId]);
    await pg.end();
  }

  const failed = results.filter((r) => !r.ok);
  const skipped = results.filter((r) => r.skip);
  console.log(`\nИтого: ${results.length - failed.length - skipped.length} OK, ${skipped.length} skip, ${failed.length} fail`);
  if (failed.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
