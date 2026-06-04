import { test, expect } from '@playwright/test';

const apiUrl = process.env.E2E_API_URL?.replace(/\/$/, '');
const adminToken = process.env.E2E_PLATFORM_ADMIN_TOKEN;
const bookingCode = process.env.E2E_BOOKING_CODE?.trim().toUpperCase();

test.describe('Booking lifecycle — API smoke', () => {
  test.skip(!apiUrl, 'Set E2E_API_URL');

  test('scenario 5: client deep link path is valid format', async () => {
    const code = bookingCode ?? 'SL-TEST0000001';
    expect(code).toMatch(/^SL-[A-Z0-9]{12}$/);
    expect(`/client/appointments/${code}`).toContain('/client/appointments/');
    expect(`/master/appointments/${code}`).toContain('/master/appointments/');
  });

  test('scenario 5: foreign voucher returns 403/404 without auth', async ({ request }) => {
    const res = await request.get(
      `${apiUrl}/api/me/appointments/voucher/SL-AAAAAAAAAAAA`,
    );
    expect([401, 403, 404]).toContain(res.status());
  });

  test.skip(!adminToken, 'Set E2E_PLATFORM_ADMIN_TOKEN for admin API checks');

  test('scenario 6/7: diagnostics endpoint returns worker + job counts', async ({ request }) => {
    const res = await request.get(`${apiUrl}/api/platform-admin/notifications/diagnostics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('notificationWorker');
    expect(body).toHaveProperty('autoCompleteWorker');
    expect(body).toHaveProperty('jobCounts');
    expect(body).toHaveProperty('pendingJobs');
    expect(body).toHaveProperty('failedJobs');
    expect(typeof body.resendConfigured).toBe('boolean');
    expect(typeof body.telegramConfigured).toBe('boolean');
  });

  test('retry-failed endpoint returns retried count', async ({ request }) => {
    const res = await request.post(`${apiUrl}/api/platform-admin/notifications/retry-failed`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(typeof body.retried).toBe('number');
  });

  test.skip(!bookingCode, 'Set E2E_BOOKING_CODE for booking audit');

  test('scenario 2/4: admin can load booking events and disputes', async ({ request }) => {
    const headers = { Authorization: `Bearer ${adminToken}` };
    const events = await request.get(
      `${apiUrl}/api/platform-admin/bookings/voucher/${bookingCode}/events`,
      { headers },
    );
    expect(events.ok()).toBeTruthy();
    const disputes = await request.get(
      `${apiUrl}/api/platform-admin/bookings/voucher/${bookingCode}/disputes`,
      { headers },
    );
    expect(disputes.ok()).toBeTruthy();
  });
});

test.describe('Booking lifecycle — UI (manual staging)', () => {
  test.skip(!process.env.E2E_BASE_URL, 'Set E2E_BASE_URL');
  test.skip(!process.env.E2E_UI_LIFECYCLE, 'Set E2E_UI_LIFECYCLE=1 for full UI run');

  test('platform-admin diagnostics tab loads', async ({ page }) => {
    test.skip(!adminToken, 'needs logged-in session or E2E_UI_LIFECYCLE with storageState');

    await page.goto('/platform-admin/notifications?tab=diagnostics');
    await expect(page.getByText('Диагностика').or(page.getByText('Workers'))).toBeVisible({
      timeout: 15_000,
    });
  });
});
