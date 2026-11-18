import {
  CREDS,
  launchBrowser,
  attachMonitors,
  assert,
  waitForIdle,
  loginMobileWeb,
  stepLog,
} from './helpers.mjs';

const FLOW = 'FLOW-14-MR-COMMERCIAL-OPS';

async function openOperationsTile(page, ariaLabel, expectedRegex, label) {
  const tile = page.locator(`[aria-label="${ariaLabel}"]`).last();
  await tile.scrollIntoViewIfNeeded();
  assert(await tile.isVisible(), `Operations tile "${ariaLabel}" not visible`);
  await tile.click();
  await waitForIdle(page, 1000);
  const txt = await page.evaluate(() => document.body.innerText);
  assert(expectedRegex.test(txt), `${label} screen did not render expected content`);
  assert(!/\bNaN\b/.test(txt), `NaN found on ${label} screen`);
  const backBtn = page.locator('[aria-label="Go back"]').last();
  assert(await backBtn.isVisible(), `${label} screen missing Go back button`);
  await backBtn.click();
  await waitForIdle(page, 600);
  stepLog(FLOW, `${label} screen verified & navigated back cleanly`);
}

export async function runFlow14() {
  const browser = await launchBrowser();
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    permissions: ['geolocation'],
    geolocation: { latitude: 8.1833, longitude: 77.4119, accuracy: 10 },
  });
  const page = await context.newPage();
  const mon = attachMonitors(page, {
    ignoreConsole: [/shadow.*deprecated|useNativeDriver/i],
  });

  try {
    await loginMobileWeb(page, CREDS.MR);

    // 1. Orders tab + Create Order wizard
    await page.getByText('Orders', { exact: true }).last().click();
    await waitForIdle(page, 900);
    let txt = await page.evaluate(() => document.body.innerText);
    assert(/Order/i.test(txt), 'Orders tab did not render expected heading');
    assert(!/\bNaN\b/.test(txt), 'NaN found on Orders tab');

    const newOrderBtn = page.locator('[aria-label*="New Order" i], [aria-label*="Create Order" i]').last();
    if (await newOrderBtn.isVisible().catch(() => false)) {
      await newOrderBtn.click();
      await waitForIdle(page, 900);
      const coTxt = await page.evaluate(() => document.body.innerText);
      assert(/Customer|Product|Order|Chemist/i.test(coTxt), 'Create Order wizard missing expected UI');
      assert(!/\bNaN\b/.test(coTxt), 'NaN found on Create Order wizard');
      await page.locator('[aria-label="Go back"]').last().click();
      await waitForIdle(page, 600);
      stepLog(FLOW, 'Orders tab + Create Order wizard verified cleanly');
    } else {
      stepLog(FLOW, 'Orders tab verified cleanly');
    }

    // Switch to Operations tab for remaining modules
    await page.getByText('Operations', { exact: true }).last().click();
    await waitForIdle(page, 800);

    // 2. Collections & Receipts
    await openOperationsTile(page, 'Payment Collections', /Collection|Receipt|Suma Pharma|Payment/i, 'Collections & Receipts');

    // 3. Expense Claims
    await openOperationsTile(page, 'Expense Claims', /Expense|Claim|Travel|Allowance/i, 'Expense Claims');

    // 4. MY SAMPLES (Sample Stock & Inputs)
    await openOperationsTile(page, 'Sample Stock & Inputs', /Sample|Stock|Custody|Dispatch|Batch/i, 'My Samples');

    // 5. Product Catalogue
    await openOperationsTile(page, 'Product Catalogue', /Product|Risipan|Texlose|MRP|PTR/i, 'Product Catalogue');

    // 6. Visual Aids Library (verify Cloudinary images load on mobile too!)
    const vaTile = page.locator('[aria-label="Visual Aids Library"]').last();
    if (await vaTile.isVisible().catch(() => false)) {
      await vaTile.scrollIntoViewIfNeeded();
      await vaTile.click();
      await waitForIdle(page, 1200);
      const vaTxt = await page.evaluate(() => document.body.innerText);
      assert(/Visual Aid|Detailing|Risipan|Texlose|Library/i.test(vaTxt), 'Visual Aids Library missing content');
      assert(!/\bNaN\b/.test(vaTxt), 'NaN found on Visual Aids Library');
      const brokenImgs = await page.evaluate(() =>
        Array.from(document.querySelectorAll('img'))
          .filter((img) => img.src && img.src.includes('res.cloudinary.com') && (!img.complete || img.naturalWidth === 0))
          .map((img) => img.src),
      );
      assert(brokenImgs.length === 0, `Broken Cloudinary images on mobile Visual Aids: ${brokenImgs.join(', ')}`);
      await page.locator('[aria-label="Go back"]').last().click();
      await waitForIdle(page, 600);
      stepLog(FLOW, 'Visual Aids Library (Cloudinary media) verified cleanly');
    }

    // 7. Analysis & 360° Reports
    await openOperationsTile(page, 'Analysis and Reports', /Analysis|Doctor|Chemist|Order|Visit/i, 'MR Analysis');

    mon.assertClean(FLOW);
    console.log(`\n=== ${FLOW}: ALL CHECKS PASSED (0 errors) ===`);
  } finally {
    await browser.close();
  }
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runFlow14().catch((err) => {
    console.error(`\n!!! ${FLOW} FAILED !!!\n`, err);
    process.exit(1);
  });
}
