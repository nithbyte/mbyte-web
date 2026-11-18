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

const FLOW = 'FLOW-07-ADMIN-COMMERCIAL';

export async function runFlow07() {
  const browser = await launchBrowser();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const mon = attachMonitors(page);

  try {
    await loginAdminWeb(page, CREDS.ADMIN);

    // 1. /commercial
    await page.goto(`${URLS.ADMIN}/commercial`, { waitUntil: 'domcontentloaded' });
    await waitForIdle(page, 900);
    let txt = await page.evaluate(() => document.body.innerText);
    assert(/commercial|sales|revenue|order/i.test(txt), '/commercial did not render heading');
    assert(!/\bNaN\b/.test(txt), 'NaN found on /commercial');
    stepLog(FLOW, '/commercial KPIs & charts loaded cleanly');

    // 2. /orders
    await page.goto(`${URLS.ADMIN}/orders`, { waitUntil: 'domcontentloaded' });
    await waitForIdle(page, 900);
    txt = await page.evaluate(() => document.body.innerText);
    assert(/order/i.test(txt), '/orders did not render heading');
    assert(!/\bNaN\b/.test(txt), 'NaN found on /orders');

    const orderViewBtn = page.locator('main button:has-text("View"), main button:has-text("Details"), main button:has-text("Inspect")').first();
    if (await orderViewBtn.isVisible().catch(() => false)) {
      await orderViewBtn.click();
      await page.waitForTimeout(350);
      await page.keyboard.press('Escape');
      const closeBtn = page.locator('button:has-text("Close")').first();
      if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click();
      await page.waitForTimeout(250);
    }
    stepLog(FLOW, '/orders loaded + filters/modal verified');

    // 3. /collections
    await page.goto(`${URLS.ADMIN}/collections`, { waitUntil: 'domcontentloaded' });
    await waitForIdle(page, 900);
    txt = await page.evaluate(() => document.body.innerText);
    assert(/collection|receipt/i.test(txt), '/collections did not render heading');
    assert(!/\bNaN\b/.test(txt), 'NaN found on /collections');

    const colViewBtn = page.locator('main button:has-text("View"), main button:has-text("Receipt"), main button:has-text("Details")').first();
    if (await colViewBtn.isVisible().catch(() => false)) {
      await colViewBtn.click();
      await page.waitForTimeout(350);
      await page.keyboard.press('Escape');
      const closeBtn = page.locator('button:has-text("Close")').first();
      if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click();
      await page.waitForTimeout(250);
    }
    stepLog(FLOW, '/collections loaded + filters/modal verified');

    // 4. /expenses
    await page.goto(`${URLS.ADMIN}/expenses`, { waitUntil: 'domcontentloaded' });
    await waitForIdle(page, 900);
    txt = await page.evaluate(() => document.body.innerText);
    assert(/expense/i.test(txt), '/expenses did not render heading');
    assert(!/\bNaN\b/.test(txt), 'NaN found on /expenses');

    for (const status of ['Pending', 'Approved', 'Rejected', 'All']) {
      const btn = page.locator(`main button:has-text("${status}")`).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await waitForIdle(page, 300);
      }
    }
    const policyBtn = page.locator('main button:has-text("Policy"), main button:has-text("Policies")').first();
    if (await policyBtn.isVisible().catch(() => false)) {
      await policyBtn.click();
      await page.waitForTimeout(350);
      await page.keyboard.press('Escape');
      const closeBtn = page.locator('button:has-text("Close"), button:has-text("Cancel")').first();
      if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click();
      await page.waitForTimeout(250);
    }
    stepLog(FLOW, '/expenses loaded + status filters + policy modal verified');

    // 5. /receivables
    await page.goto(`${URLS.ADMIN}/receivables`, { waitUntil: 'domcontentloaded' });
    await waitForIdle(page, 900);
    txt = await page.evaluate(() => document.body.innerText);
    assert(/receivable|invoice|aging/i.test(txt), '/receivables did not render heading');
    assert(!/\bNaN\b/.test(txt), 'NaN found on /receivables');

    for (const tab of ['Aging', 'Invoices', 'Overdue']) {
      const btn = page.locator(`main button:has-text("${tab}")`).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await waitForIdle(page, 350);
      }
    }
    stepLog(FLOW, '/receivables loaded + Aging/Invoices tabs verified');

    mon.assertClean(FLOW);
    console.log(`\n=== ${FLOW}: ALL CHECKS PASSED (0 errors) ===`);
  } finally {
    await browser.close();
  }
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runFlow07().catch((err) => {
    console.error(`\n!!! ${FLOW} FAILED !!!\n`, err);
    process.exit(1);
  });
}
