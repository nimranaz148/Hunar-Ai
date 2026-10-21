import { test } from '@playwright/test';
import path from 'path';

const SCREENSHOTS_DIR = path.resolve(__dirname, '../../../../docs/qa/screenshots');

test.describe('Hunar v2 — Complete End-to-End Visual & Functional QA', () => {
  test.setTimeout(180000); // 3 minutes timeout

  test('1. Public Flows (Landing, Login, Signup, Mentor Apply)', async ({ page }) => {
    // 1. Landing Page
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_landing_page.png') });

    // 2. Login Page
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_login_page.png') });

    // 3. Signup Page
    await page.goto('/signup', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_signup_page.png') });

    // 4. Mentor Apply Page
    await page.goto('/mentor-apply', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_mentor_apply_page.png') });
  });

  test('2. Super Admin Portal Flow', async ({ page }) => {
    // Login as Super Admin
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[type="email"]');
    await page.fill('input[type="email"]', 'admin@hunar.pk');
    await page.fill('input[type="password"]', 'Admin1234!');
    await page.click('button[type="submit"]');

    // Wait for redirect to admin or dashboard
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_admin_portal_hub.png') });

    const adminRoutes = [
      ['/admin/cohort', '06_admin_cohort_funnel.png'],
      ['/admin/cohort/stalled', '07_admin_stalled_list.png'],
      ['/admin/mentors', '08_admin_mentor_approvals.png'],
      ['/admin/users', '09_admin_users_management.png'],
      ['/admin/runs', '10_admin_agent_explorer.png'],
      ['/admin/audit', '11_admin_audit_log.png'],
      ['/admin/feature-flags', '12_admin_feature_flags.png'],
      ['/admin/usage', '13_admin_usage_stats.png'],
      ['/admin/settings', '14_admin_system_settings.png'],
    ];

    for (const [route, file] of adminRoutes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, file) });
    }
  });

  test('3. Mentor Pro Panel Flow', async ({ page }) => {
    // Login as Mentor
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[type="email"]');
    await page.fill('input[type="email"]', 'ayesha.mentor@hunar.pk');
    await page.fill('input[type="password"]', 'Mentor1234!');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '15_mentor_dashboard.png') });

    const mentorRoutes = [
      ['/mentor/profile', '16_mentor_profile.png'],
      ['/mentor/services', '17_mentor_services.png'],
      ['/mentor/availability', '18_mentor_availability.png'],
      ['/mentor/mentees', '19_mentor_mentees.png'],
      ['/mentor/earnings', '20_mentor_earnings.png'],
    ];

    for (const [route, file] of mentorRoutes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, file) });
    }
  });

  test('4. Entrepreneur Dashboard & Agent Views Flow', async ({ page }) => {
    // Login as Flagship Entrepreneur (Fatima)
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[type="email"]');
    await page.fill('input[type="email"]', 'fatima@hunar.pk');
    await page.fill('input[type="password"]', 'User1234!');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '21_entrepreneur_today_dashboard.png') });

    const entrepreneurRoutes = [
      ['/business', '22_entrepreneur_business_profile.png'],
      ['/products', '23_entrepreneur_products_catalog.png'],
      ['/validation', '24_entrepreneur_validation_report.png'],
      ['/pricing', '25_entrepreneur_pricing_calculator.png'],
      ['/plan', '26_entrepreneur_30day_launch_plan.png'],
      ['/content', '27_entrepreneur_content_hub.png'],
      ['/content/calendar', '28_entrepreneur_content_calendar.png'],
      ['/content/today', '29_entrepreneur_content_today.png'],
      ['/content/research', '30_entrepreneur_content_research.png'],
      ['/content/outline', '31_entrepreneur_content_outline.png'],
      ['/metrics', '32_entrepreneur_performance_metrics.png'],
      ['/mentors', '33_entrepreneur_mentors_marketplace.png'],
      ['/mentors/bookings', '34_entrepreneur_my_bookings.png'],
      ['/notifications', '35_entrepreneur_notifications.png'],
    ];

    for (const [route, file] of entrepreneurRoutes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, file) });
    }
  });

});
