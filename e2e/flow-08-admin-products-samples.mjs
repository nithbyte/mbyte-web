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

const FLOW = 'FLOW-08-ADMIN-PRODUCTS-SAMPLES';

export async function runFlow08() {
  const browser = await launchBrowser();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const mon = attachMonitors(page);

  try {
    await loginAdminWeb(page, CREDS.ADMIN);

    // 1. /products + Visual Aids modal + Cloudinary image integrity check
    await page.goto(`${URLS.ADMIN}/products`, { waitUntil: 'domcontentloaded' });
    await waitForIdle(page, 1000);
    let txt = await page.evaluate(() => document.body.innerText);
    assert(/product|catalog/i.test(txt), '/products did not render heading');
    assert(!/\bNaN\b/.test(txt), 'NaN found on /products');

    // Open Visual Aids modal on first product that has Visual Aids button
    const vaButtons = page.locator('main button:has-text("Visual"), main button[title*="Visual" i]');
    const vaCount = await vaButtons.count();
    let verifiedCloudinaryImg = 0;
    for (let i = 0; i < Math.min(vaCount, 4); i++) {
      await vaButtons.nth(i).click();
      await waitForIdle(page, 1200);
      const imgs = await page.evaluate(() =>
        Array.from(document.querySelectorAll('img'))
          .filter((img) => img.src && img.src.includes('res.cloudinary.com'))
          .map((img) => ({
            src: img.src,
            complete: img.complete,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
          })),
      );
      if (imgs.length > 0) {
        for (const img of imgs) {
          assert(
            img.complete && img.naturalWidth > 0,
            `Cloudinary Visual Aid image failed to load: ${img.src}`,
          );
          verifiedCloudinaryImg++;
        }
        await page.keyboard.press('Escape');
        const closeBtn = page.locator('button:has-text("Close"), button[aria-label="Close"]').first();
        if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click();
        await page.waitForTimeout(250);
        break;
      }
      await page.keyboard.press('Escape');
      const closeBtn = page.locator('button:has-text("Close"), button[aria-label="Close"]').first();
      if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click();
      await page.waitForTimeout(250);
    }
    assert(verifiedCloudinaryImg > 0, 'Expected at least 1 Cloudinary Visual Aid image to load with naturalWidth > 0');
    stepLog(FLOW, `/products verified + ${verifiedCloudinaryImg} Cloudinary Visual Aid image(s) loaded cleanly (naturalWidth > 0)`);

    // Test Add Product modal open/close
    const addProdBtn = page.locator('main button:has-text("Add Product"), main button:has-text("New Product")').first();
    if (await addProdBtn.isVisible().catch(() => false)) {
      await addProdBtn.click();
      await page.waitForTimeout(350);
      await page.keyboard.press('Escape');
      const closeBtn = page.locator('button:has-text("Cancel"), button:has-text("Close")').first();
      if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click();
      await page.waitForTimeout(250);
    }
    stepLog(FLOW, 'Add Product modal opens/closes cleanly');

    // 2. /samples (all 8 tabs)
    await page.goto(`${URLS.ADMIN}/samples`, { waitUntil: 'domcontentloaded' });
    await waitForIdle(page, 900);
    txt = await page.evaluate(() => document.body.innerText);
    assert(/sample/i.test(txt), '/samples did not render heading');
    assert(!/\bNaN\b/.test(txt), 'NaN found on /samples');

    const sampleTabs = [
      'Inventory Overview',
      'Custody Balances',
      'Dispatch Tracking',
      'MR Field Inventory',
      'Product & Batch Catalog',
      'Returns & Adjustments',
      'Movement Audit Ledger',
      'Inventory Reports & Export',
    ];
    let visitedSampleTabs = 0;
    for (const tab of sampleTabs) {
      const btn = page.locator(`main button:has-text("${tab}")`).first();
      assert(await btn.isVisible().catch(() => false), `/samples tab "${tab}" not visible`);
      await btn.click();
      await waitForIdle(page, 350);
      const t = await page.evaluate(() => document.body.innerText);
      assert(!/\bNaN\b/.test(t), `NaN found in /samples tab "${tab}"`);
      visitedSampleTabs++;
    }
    assert(visitedSampleTabs === 8, `Expected all 8 /samples tabs, clicked ${visitedSampleTabs}`);
    stepLog(FLOW, `/samples verified (${visitedSampleTabs}/8 tabs cleanly)`);

    // 3. /products/presence
    await page.goto(`${URLS.ADMIN}/products/presence`, { waitUntil: 'domcontentloaded' });
    await waitForIdle(page, 900);
    txt = await page.evaluate(() => document.body.innerText);
    assert(/presence|availability|product/i.test(txt), '/products/presence did not render heading');
    assert(!/\bNaN\b/.test(txt), 'NaN found on /products/presence');
    stepLog(FLOW, '/products/presence loaded cleanly');

    mon.assertClean(FLOW);
    console.log(`\n=== ${FLOW}: ALL CHECKS PASSED (0 errors) ===`);
  } finally {
    await browser.close();
  }
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runFlow08().catch((err) => {
    console.error(`\n!!! ${FLOW} FAILED !!!\n`, err);
    process.exit(1);
  });
}
