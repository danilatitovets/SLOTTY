import { test, expect } from '@playwright/test';

test.describe('Master settings workspace', () => {
  test.skip(!process.env.E2E_BASE_URL, 'Set E2E_BASE_URL to run UI smoke tests');

  test('/master/settings redirects to security', async ({ page }) => {
    await page.goto('/master/settings');
    await expect(page).toHaveURL(/\/master\/settings\/security/);
  });

  test('legacy admin settings login-methods redirects', async ({ page }) => {
    await page.goto('/admin/settings/login-methods');
    await expect(page).toHaveURL(/\/master\/settings\/security/);
  });

  test('team page shows in development', async ({ page }) => {
    await page.goto('/master/settings/team');
    await expect(page.getByText('В разработке')).toBeVisible();
  });

  test('public master profile route does not capture settings', async ({ page }) => {
    const res = await page.goto('/master/settings/billing');
    expect(res?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/\/master\/settings\/billing/);
  });

  test('support hub renders help options', async ({ page }) => {
    const res = await page.goto('/master/settings/support');
    expect(res?.status()).toBeLessThan(500);
    await expect(page.getByRole('heading', { name: 'Поддержка' })).toBeVisible();
    await expect(page.getByText('Связаться с поддержкой')).toBeVisible();
    await expect(page.getByText('Создать обращение')).toBeVisible();
  });

  test('support contact route loads form', async ({ page }) => {
    const res = await page.goto('/master/settings/support/contact');
    expect(res?.status()).toBeLessThan(500);
    await expect(page.getByRole('heading', { name: 'Связаться с поддержкой' })).toBeVisible();
  });

  test('privacy export block shows archive copy', async ({ page }) => {
    const res = await page.goto('/master/settings/privacy');
    expect(res?.status()).toBeLessThan(500);
    await expect(page.getByRole('heading', { name: 'Экспорт данных' })).toBeVisible();
    await expect(page.getByText('Запросить архив')).toBeVisible();
    await expect(page.getByText('Что будет внутри')).toBeVisible();
    await expect(page.getByText('JSON-файл')).toHaveCount(0);
  });
});
