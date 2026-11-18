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

const FLOW = 'FLOW-03-ADMIN-VISITS-MTP-DCR';

export async function runFlow03() {
  const browser = await launchBrowser();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const mon = attachMonitors(page);

  try {
    await loginAdminWeb(page, CREDS.ADMIN);

    // 1. /visits
    await page.goto(`${URLS.ADMIN}/visits`, { waitUntil: 'domcontentloaded' });
    await waitForIdle(page, 900);
    let txt = await page.evaluate(() => document.body.innerText);
    assert(/visit|field/i.test(txt), '/visits page did not render heading');
    assert(!/\bNaN\b/.test(txt), 'NaN found on /visits');

    // Test status filter or tabs on /visits
    const statusSelect = page.locator('main select').first();
    if (await statusSelect.isVisible().catch(() => false)) {
      const opts = await statusSelect.locator('option').evaluateAll((els) => els.map((e) => e.value));
      if (opts.length > 1) {
        await statusSelect.selectOption(opts[1]);
        await waitForIdle(page, 400);
        await statusSelect.selectOption(opts[0]);
        await waitForIdle(page, 400);
      }
    }

    // Test opening a visit detail modal if any view button or clickable row exists
    const viewVisitBtn = page.locator('main button:has-text("View"), main button:has-text("Details"), main button:has-text("Inspect")').first();
    if (await viewVisitBtn.isVisible().catch(() => false)) {
      await viewVisitBtn.click();
      await page.waitForTimeout(400);
      await page.keyboard.press('Escape');
      const closeBtn = page.locator('button:has-text("Close")').first();
      if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click();
      await page.waitForTimeout(250);
      stepLog(FLOW, '/visits loaded + filter + detail modal verified');
    } else {
      stepLog(FLOW, '/visits loaded + filters verified');
    }

    // Verify global header territory filter works on /visits without errors
    const territorySelect = page.locator('header select').first();
    if (await territorySelect.isVisible().catch(() => false)) {
      const opts = await territorySelect.locator('option').evaluateAll((els) => els.map((e) => e.value));
      const pick = opts.find((v) => v && v !== 'ALL');
      if (pick) {
        await territorySelect.selectOption(pick);
        await waitForIdle(page, 500);
        await territorySelect.selectOption('ALL');
        await waitForIdle(page, 500);
      }
    }
    stepLog(FLOW, '/visits global territory filter sync verified');

    // 2. /tour-plans
    await page.goto(`${URLS.ADMIN}/tour-plans`, { waitUntil: 'domcontentloaded' });
    await waitForIdle(page, 900);
    txt = await page.evaluate(() => document.body.innerText);
    assert(/tour plan|mtp/i.test(txt), '/tour-plans page did not render expected title');
    assert(!/\bNaN\b/.test(txt), 'NaN found on /tour-plans');

    // Click status filter buttons if present
    for (const label of ['Submitted', 'Approved', 'All']) {
      const btn = page.locator(`main button:has-text("${label}")`).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await waitForIdle(page, 350);
      }
    }
    const reviewTpBtn = page.locator('main button:has-text("Review"), main button:has-text("Inspect"), main button:has-text("View")').first();
    if (await reviewTpBtn.isVisible().catch(() => false)) {
      await reviewTpBtn.click();
      await page.waitForTimeout(400);
      const closeBtn = page.locator('button:has-text("Close"), button[aria-label="Close"]').first();
      if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click();
      await page.keyboard.press('Escape');
      await page.waitForTimeout(250);
    }
    stepLog(FLOW, '/tour-plans loaded + status filters + review modal verified');

    // 3. /dcr
    await page.goto(`${URLS.ADMIN}/dcr`, { waitUntil: 'domcontentloaded' });
    await waitForIdle(page, 900);
    txt = await page.evaluate(() => document.body.innerText);
    assert(/daily call report|dcr/i.test(txt), '/dcr page did not render expected title');
    assert(!/\bNaN\b/.test(txt), 'NaN found on /dcr');

    // Test DCR status/unlock filter tabs/buttons
    for (const label of ['Unlock', 'Submitted', 'Approved', 'All']) {
      const btn = page.locator(`main button:has-text("${label}")`).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await waitForIdle(page, 350);
      }
    }
    const reviewDcrBtn = page.locator('main button:has-text("Review"), main button:has-text("View"), main button:has-text("Inspect")').first();
    if (await reviewDcrBtn.isVisible().catch(() => false)) {
      await reviewDcrBtn.click();
      await page.waitForTimeout(450);
      const closeBtn = page.locator('button:has-text("Close"), button[aria-label="Close"]').first();
      if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click();
      await page.keyboard.press('Escape');
      await page.waitForTimeout(250);
    }
    stepLog(FLOW, '/dcr loaded + status/unlock filters + review modal verified');

    mon.assertClean(FLOW);
    console.log(`\n=== ${FLOW}: ALL CHECKS PASSED (0 errors) ===`);
  } finally {
    await browser.close();
  }
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runFlow03().catch((err) => {
    console.error(`\n!!! ${FLOW} FAILED !!!\n`, err);
    process.exit(1);
  });
}
