import {
  CREDS,
  launchBrowser,
  attachMonitors,
  assert,
  waitForIdle,
  loginMobileWeb,
  stepLog,
} from './helpers.mjs';

const FLOW = 'FLOW-13-MR-VISITS-DCR-MTP';

export async function runFlow13() {
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

    // 1. Visits tab (default landing)
    await page.getByText('Visits', { exact: true }).last().click();
    await waitForIdle(page, 900);
    let txt = await page.evaluate(() => document.body.innerText);
    assert(/Visit|Schedule|DCR|Daily Call/i.test(txt), 'Visits workspace did not render expected headings');
    assert(!/\bNaN\b/.test(txt), 'NaN found on Visits workspace');
    stepLog(FLOW, 'Visits tab & DCR status banner loaded cleanly');

    // 2. Test date switcher (< / >) if present
    const prevDateBtn = page.locator('[aria-label*="Previous" i], [aria-label*="Prev" i]').first();
    const nextDateBtn = page.locator('[aria-label*="Next" i]').first();
    if (await prevDateBtn.isVisible().catch(() => false)) {
      await prevDateBtn.click();
      await waitForIdle(page, 600);
      if (await nextDateBtn.isVisible().catch(() => false)) {
        await nextDateBtn.click();
        await waitForIdle(page, 600);
      }
      stepLog(FLOW, 'Visits date switcher (< / >) verified cleanly');
    }

    // 3. Open first Visit Details card if a visit exists today
    const visitTrigger = page.getByText(/View Details|Visit Details|COMPLETED|IN PROGRESS|PLANNED/i).first();
    if (await visitTrigger.isVisible().catch(() => false)) {
      await visitTrigger.click();
      await waitForIdle(page, 800);
      const backBtn = page.locator('[aria-label="Go back"]').last();
      if (await backBtn.isVisible().catch(() => false)) {
        const vdTxt = await page.evaluate(() => document.body.innerText);
        assert(!/\bNaN\b/.test(vdTxt), 'NaN found on VisitDetails screen');
        await backBtn.click();
        await waitForIdle(page, 600);
        stepLog(FLOW, 'Opened VisitDetails screen & navigated back cleanly');
      }
    }

    // 4. Test DCR review/modal trigger if visible on Visits tab
    const dcrBtn = page.getByText(/View DCR|Daily Call Report|Submit DCR|Request Unlock|DCR Submitted/i).first();
    if (await dcrBtn.isVisible().catch(() => false)) {
      await dcrBtn.click();
      await waitForIdle(page, 700);
      const dcrTxt = await page.evaluate(() => document.body.innerText);
      assert(!/\bNaN\b/.test(dcrTxt), 'NaN found in DCR view/modal');
      const closeBtn = page.locator('[aria-label="Go back"], button:has-text("Close"), button:has-text("Cancel")').last();
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
        await waitForIdle(page, 500);
      }
      stepLog(FLOW, 'DCR summary / unlock UI verified cleanly');
    }

    // 5. Open Monthly Tour Plan (MTP) from Visits tab
    const mtpBtn = page.getByText(/Open Monthly Tour Plan|Monthly Tour Plan|Tour Plan/i).last();
    assert(await mtpBtn.isVisible(), 'Open Monthly Tour Plan button not visible on Visits tab');
    await mtpBtn.click();
    await waitForIdle(page, 1000);
    const mtpTxt = await page.evaluate(() => document.body.innerText);
    assert(/Tour Plan|MTP|Schedule|Calendar|Month/i.test(mtpTxt), 'Tour Plan screen did not render expected UI');
    assert(!/\bNaN\b/.test(mtpTxt), 'NaN found on Tour Plan (MTP) screen');
    const mtpBack = page.locator('[aria-label="Go back"]').last();
    assert(await mtpBack.isVisible(), 'Tour Plan back button missing');
    await mtpBack.click();
    await waitForIdle(page, 500);
    stepLog(FLOW, 'Tour Plan (MTP) screen loaded & navigated back cleanly');

    mon.assertClean(FLOW);
    console.log(`\n=== ${FLOW}: ALL CHECKS PASSED (0 errors) ===`);
  } finally {
    await browser.close();
  }
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runFlow13().catch((err) => {
    console.error(`\n!!! ${FLOW} FAILED !!!\n`, err);
    process.exit(1);
  });
}
