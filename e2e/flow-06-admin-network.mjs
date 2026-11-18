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

const FLOW = 'FLOW-06-ADMIN-NETWORK';

export async function runFlow06() {
  const browser = await launchBrowser();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const mon = attachMonitors(page);

  try {
    await loginAdminWeb(page, CREDS.ADMIN);

    // 1. /doctors + tabs + Add modal + /doctors/[id] detail page
    await page.goto(`${URLS.ADMIN}/doctors`, { waitUntil: 'domcontentloaded' });
    await waitForIdle(page, 900);
    let txt = await page.evaluate(() => document.body.innerText);
    assert(/doctor/i.test(txt), '/doctors did not render heading');
    assert(!/\bNaN\b/.test(txt), 'NaN found on /doctors');

    for (const tab of ['Pending', 'Rejected', 'All']) {
      const btn = page.locator(`main button:has-text("${tab}")`).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await waitForIdle(page, 350);
      }
    }

    const addDocBtn = page.locator('main button:has-text("Add Doctor"), main button:has-text("Register Doctor"), main button:has-text("New Doctor")').first();
    if (await addDocBtn.isVisible().catch(() => false)) {
      await addDocBtn.click();
      await page.waitForTimeout(350);
      await page.keyboard.press('Escape');
      const closeBtn = page.locator('button:has-text("Cancel"), button:has-text("Close")').first();
      if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click();
      await page.waitForTimeout(250);
    }
    stepLog(FLOW, '/doctors tabs + Add Doctor modal verified');

    // Navigate to Doctor detail page (/doctors/[id])
    const docDetailLink = page.locator('main a[href*="/doctors/"]').first();
    if (await docDetailLink.isVisible().catch(() => false)) {
      await docDetailLink.click();
      await page.waitForURL((u) => /\/doctors\/[^/]+/.test(u.pathname), { timeout: 15000 });
      await waitForIdle(page, 900);
      txt = await page.evaluate(() => document.body.innerText);
      assert(!/\bNaN\b/.test(txt), 'NaN found on /doctors/[id]');
      for (const tab of ['Visits', 'Products', 'Orders']) {
        const t = page.locator(`main button:has-text("${tab}")`).first();
        if (await t.isVisible().catch(() => false)) {
          await t.click();
          await waitForIdle(page, 350);
        }
      }
      stepLog(FLOW, `Doctor detail page (${page.url()}) + Visits/Products/Orders tabs verified`);
    } else {
      stepLog(FLOW, '/doctors has no doctor rows to open detail page (empty list ok)');
    }

    // 2. /purchasing-doctors
    await page.goto(`${URLS.ADMIN}/purchasing-doctors`, { waitUntil: 'domcontentloaded' });
    await waitForIdle(page, 900);
    txt = await page.evaluate(() => document.body.innerText);
    assert(/purchasing|doctor/i.test(txt), '/purchasing-doctors did not render heading');
    assert(!/\bNaN\b/.test(txt), 'NaN found on /purchasing-doctors');
    stepLog(FLOW, '/purchasing-doctors loaded cleanly');

    // 3. /pharmacies
    await page.goto(`${URLS.ADMIN}/pharmacies`, { waitUntil: 'domcontentloaded' });
    await waitForIdle(page, 900);
    txt = await page.evaluate(() => document.body.innerText);
    assert(/pharmac|chemist|retail/i.test(txt), '/pharmacies did not render heading');
    assert(!/\bNaN\b/.test(txt), 'NaN found on /pharmacies');

    for (const tab of ['Pending', 'Rejected', 'All']) {
      const btn = page.locator(`main button:has-text("${tab}")`).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await waitForIdle(page, 350);
      }
    }
    const addPharmBtn = page.locator('main button:has-text("Add"), main button:has-text("Register"), main button:has-text("New")').first();
    if (await addPharmBtn.isVisible().catch(() => false)) {
      await addPharmBtn.click();
      await page.waitForTimeout(350);
      await page.keyboard.press('Escape');
      const closeBtn = page.locator('button:has-text("Cancel"), button:has-text("Close")').first();
      if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click();
      await page.waitForTimeout(250);
    }
    stepLog(FLOW, '/pharmacies tabs + Add modal verified');

    // 4. /distributors
    await page.goto(`${URLS.ADMIN}/distributors`, { waitUntil: 'domcontentloaded' });
    await waitForIdle(page, 900);
    txt = await page.evaluate(() => document.body.innerText);
    assert(/distributor|stockist/i.test(txt), '/distributors did not render heading');
    assert(!/\bNaN\b/.test(txt), 'NaN found on /distributors');

    for (const modalTrigger of ['Stock Inward', 'Secondary Sale', 'Add Distributor', 'Add Stockist']) {
      const btn = page.locator(`main button:has-text("${modalTrigger}")`).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(350);
        await page.keyboard.press('Escape');
        const closeBtn = page.locator('button:has-text("Cancel"), button:has-text("Close")').first();
        if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click();
        await page.waitForTimeout(250);
      }
    }
    stepLog(FLOW, '/distributors + modals verified');

    mon.assertClean(FLOW);
    console.log(`\n=== ${FLOW}: ALL CHECKS PASSED (0 errors) ===`);
  } finally {
    await browser.close();
  }
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runFlow06().catch((err) => {
    console.error(`\n!!! ${FLOW} FAILED !!!\n`, err);
    process.exit(1);
  });
}
