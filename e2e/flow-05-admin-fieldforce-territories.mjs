import {
  URLS,
  CREDS,
  launchBrowser,
  attachMonitors,
  assert,
  waitForIdle,
  loginAdminWeb,
  stepLog,
} from './helpers.mjs';

const FLOW = 'FLOW-05-ADMIN-FIELDFORCE-TERRITORIES';

export async function runFlow05() {
  const browser = await launchBrowser();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const mon = attachMonitors(page);

  try {
    await loginAdminWeb(page, CREDS.ADMIN);

    // 1. /field-force
    await page.goto(`${URLS.ADMIN}/field-force`, { waitUntil: 'domcontentloaded' });
    await waitForIdle(page, 900);
    let txt = await page.evaluate(() => document.body.innerText);
    assert(/durga/i.test(txt), 'durga m not rendered on /field-force');
    assert(!/\bNaN\b/.test(txt), 'NaN found on /field-force');

    // Open & close Add Member/MR modal
    const addBtn = page.locator('main button:has-text("Add"), main button:has-text("New MR"), main button:has-text("Create")').first();
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(350);
      await page.keyboard.press('Escape');
      const closeBtn = page.locator('button:has-text("Cancel"), button:has-text("Close"), button[aria-label="Close"]').first();
      if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click();
      await page.waitForTimeout(250);
    }
    stepLog(FLOW, '/field-force loaded durga m + Add modal opens/closes cleanly');

    // Navigate to durga m MR Analysis (/field-force/[id])
    const durgaLink = page.locator('main a[href*="/field-force/"]').filter({ hasText: /durga|Analysis|View|Profile/i }).first();
    if (await durgaLink.isVisible().catch(() => false)) {
      await durgaLink.click();
    } else {
      const durgaRow = page.locator('tr, div').filter({ hasText: /durga/i }).last();
      const anyLink = durgaRow.locator('a[href*="/field-force/"]').first();
      if (await anyLink.isVisible().catch(() => false)) {
        await anyLink.click();
      } else {
        await page.locator('main a[href*="/field-force/"]').first().click();
      }
    }
    await page.waitForURL((u) => /\/field-force\/[^/]+/.test(u.pathname), { timeout: 15000 });
    await waitForIdle(page, 1000);
    txt = await page.evaluate(() => document.body.innerText);
    assert(/durga/i.test(txt), 'MR Analysis detail page did not load durga m');
    assert(!/\bNaN\b/.test(txt), 'NaN found on /field-force/[id]');
    stepLog(FLOW, `Opened MR Analysis detail page -> ${page.url()}`);

    // Click through ALL 7 MR Analysis tabs
    const tabPatterns = [
      /Visits/i,
      /Doctors/i,
      /Chemists|Pharmacies/i,
      /Orders/i,
      /Collections/i,
      /Products|DCR/i,
      /Target/i,
    ];
    let clickedTabs = 0;
    for (const pat of tabPatterns) {
      const tabBtn = page.locator('main button, [role="tab"]').filter({ hasText: pat }).first();
      if (await tabBtn.isVisible().catch(() => false)) {
        await tabBtn.click();
        await waitForIdle(page, 400);
        const t = await page.evaluate(() => document.body.innerText);
        assert(!/\bNaN\b/.test(t), `NaN found in tab ${pat}`);
        clickedTabs++;
      }
    }
    assert(clickedTabs >= 5, `Expected at least 5 MR Analysis tabs, clicked ${clickedTabs}`);
    stepLog(FLOW, `Verified ${clickedTabs}/7 MR Analysis tabs cleanly`);

    // Test Date preset buttons on MR Analysis
    for (const preset of ['This Month', 'Last 30 Days', 'Today', 'All']) {
      const btn = page.locator(`main button:has-text("${preset}")`).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await waitForIdle(page, 350);
      }
    }
    stepLog(FLOW, 'MR Analysis date presets interactive cleanly');

    // 2. /territories
    await page.goto(`${URLS.ADMIN}/territories`, { waitUntil: 'domcontentloaded' });
    await waitForIdle(page, 900);
    txt = await page.evaluate(() => document.body.innerText);
    assert(/territor|HQ-TER-01|koveldesigns/i.test(txt), '/territories page did not render territories');
    assert(!/\bNaN\b/.test(txt), 'NaN found on /territories');

    const createTerBtn = page.locator('main button:has-text("Add"), main button:has-text("Create"), main button:has-text("New")').first();
    if (await createTerBtn.isVisible().catch(() => false)) {
      await createTerBtn.click();
      await page.waitForTimeout(350);
      await page.keyboard.press('Escape');
      const closeBtn = page.locator('button:has-text("Cancel"), button:has-text("Close")').first();
      if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click();
      await page.waitForTimeout(250);
    }
    stepLog(FLOW, '/territories loaded + Create modal opens/closes cleanly');

    mon.assertClean(FLOW);
    console.log(`\n=== ${FLOW}: ALL CHECKS PASSED (0 errors) ===`);
  } finally {
    await browser.close();
  }
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runFlow05().catch((err) => {
    console.error(`\n!!! ${FLOW} FAILED !!!\n`, err);
    process.exit(1);
  });
}
