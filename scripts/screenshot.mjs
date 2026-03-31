import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../presentation/screenshots');
mkdirSync(OUT, { recursive: true });

const BASE = 'http://localhost:5173';
const EMAIL = 'abyerly3488@gmail.com';
const PASS  = 'DwB5942731@';

const VIEWPORT = { width: 390, height: 844 }; // iPhone 14 Pro

async function shot(page, name) {
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: false });
  console.log(`✓ ${name}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx     = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });
  const page    = await ctx.newPage();

  // ── Login ──────────────────────────────────────────────────────────────────
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('input[type="email"]');
  await shot(page, '00_login');

  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/app/**', { timeout: 10000 });

  // ── Player pages ───────────────────────────────────────────────────────────
  await page.goto(`${BASE}/app/feed`);
  await page.waitForLoadState('networkidle');
  await shot(page, '01_feed');

  await page.goto(`${BASE}/app/film`);
  await page.waitForLoadState('networkidle');
  await shot(page, '02_film');

  await page.goto(`${BASE}/app/stats`);
  await page.waitForLoadState('networkidle');
  await shot(page, '03_stats');

  await page.goto(`${BASE}/app/wellness`);
  await page.waitForLoadState('networkidle');
  await shot(page, '04_wellness');

  await page.goto(`${BASE}/app/playbook`);
  await page.waitForLoadState('networkidle');
  await shot(page, '05_playbook');

  await page.goto(`${BASE}/app/profile`);
  await page.waitForLoadState('networkidle');
  await shot(page, '06_profile');

  // ── Admin pages ────────────────────────────────────────────────────────────
  // Desktop viewport for admin
  await page.setViewportSize({ width: 1280, height: 800 });

  await page.goto(`${BASE}/admin`);
  await page.waitForLoadState('networkidle');
  await shot(page, '07_admin_dashboard');

  await page.goto(`${BASE}/admin/film`);
  await page.waitForLoadState('networkidle');
  await shot(page, '08_admin_film');

  await page.goto(`${BASE}/admin/stats`);
  await page.waitForLoadState('networkidle');
  await shot(page, '09_admin_stats');

  await page.goto(`${BASE}/admin/wellness`);
  await page.waitForLoadState('networkidle');
  await shot(page, '10_admin_wellness');

  await page.goto(`${BASE}/admin/playbook`);
  await page.waitForLoadState('networkidle');
  await shot(page, '11_admin_playbook');

  await browser.close();
  console.log('\nAll screenshots saved to presentation/screenshots/');
})();
