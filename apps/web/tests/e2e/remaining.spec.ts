import { test } from '@playwright/test';
import path from 'path';

const SCREENSHOTS_DIR = path.resolve(__dirname, '../../../../docs/qa/screenshots');

test('Capture Remaining Entrepreneur Pages', async ({ page }) => {
  test.setTimeout(90000);

  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', 'fatima@hunar.pk');
  await page.fill('input[type="password"]', 'User1234!');
  await page.click('button[type="submit"]');

  await page.waitForTimeout(2000);

  const remainingRoutes = [
    ['/metrics', '32_entrepreneur_performance_metrics.png'],
    ['/mentors', '33_entrepreneur_mentors_marketplace.png'],
    ['/mentors/bookings', '34_entrepreneur_my_bookings.png'],
    ['/notifications', '35_entrepreneur_notifications.png'],
  ];

  for (const [route, file] of remainingRoutes) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, file) });
  }
});
