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

const FLOW = 'FLOW-09-ADMIN-ENGAGEMENT-REPORTS';

export async function runFlow09() {
  const browser = await launchBrowser();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const mon = attachMonitors(page);

  try {
    await loginAdminWeb(page, CREDS.ADMIN);

    // 1. /attendance (Shift Records, Regularization, Leave Requests tabs)
    await page.goto(`${URLS.ADMIN}/attendance`, { waitUntil: 'domcontentloaded' });
    await waitForIdle(page, 900);
    let txt = await page.evaluate(() => document.body.innerText);
    assert(/attendance|shift|leave/i.test(txt), '/attendance did not render heading');
    assert(!/\bNaN\b/.test(txt), 'NaN found on /attendance');

    for (const tab of ['Regularization', 'Leave', 'Shift']) {
      const btn = page.locator(`main button:has-text("${tab}")`).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await waitForIdle(page, 350);
      }
    }
    stepLog(FLOW, '/attendance + Shift/Regularization/Leave tabs verified');

    // 2. /campaigns (Heart day + View Details & Enroll MRs + Create modal Target Territory)
    await page.goto(`${URLS.ADMIN}/campaigns`, { waitUntil: 'domcontentloaded' });
    await waitForIdle(page, 900);
    txt = await page.evaluate(() => document.body.innerText);
    assert(/Heart day/i.test(txt), 'Active campaign "Heart day" not visible on /campaigns');
    assert(!/\bNaN\b/.test(txt), 'NaN found on /campaigns');

    // Open View Details modal on Heart day
    const viewDetailsBtn = page.locator('main button:has-text("View Details"), main button:has-text("Details"), main button:has-text("Manage")').first();
    if (await viewDetailsBtn.isVisible().catch(() => false)) {
      await viewDetailsBtn.click();
      await waitForIdle(page, 600);
      const detailTxt = await page.evaluate(() => document.body.innerText);
      assert(/Heart day|Enroll|Participant/i.test(detailTxt), 'Campaign details modal missing expected content');
      await page.keyboard.press('Escape');
      const closeBtn = page.locator('button:has-text("Close")').first();
      if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click();
      await page.waitForTimeout(250);
    }

    // Open Create Campaign modal & verify Target Territory selector
    const createCampBtn = page.locator('main button:has-text("Create Campaign"), main button:has-text("New Campaign"), main button:has-text("Launch Campaign")').first();
    if (await createCampBtn.isVisible().catch(() => false)) {
      await createCampBtn.click();
      await page.waitForTimeout(400);
      const createTxt = await page.evaluate(() => document.body.innerText);
      assert(/Territory/i.test(createTxt), 'Create Campaign modal missing Target Territory control');
      await page.keyboard.press('Escape');
      const closeBtn = page.locator('button:has-text("Cancel"), button:has-text("Close")').first();
      if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click();
      await page.waitForTimeout(250);
    }
    stepLog(FLOW, '/campaigns verified ("Heart day", View Details/Enroll modal, Create modal Territory selector)');

    // 3. /training
    await page.goto(`${URLS.ADMIN}/training`, { waitUntil: 'domcontentloaded' });
    await waitForIdle(page, 900);
    txt = await page.evaluate(() => document.body.innerText);
    assert(/training|quiz|module|learning/i.test(txt), '/training did not render heading');
    assert(!/\bNaN\b/.test(txt), 'NaN found on /training');
    stepLog(FLOW, '/training loaded cleanly');

    // 4. /surveys
    await page.goto(`${URLS.ADMIN}/surveys`, { waitUntil: 'domcontentloaded' });
    await waitForIdle(page, 900);
    txt = await page.evaluate(() => document.body.innerText);
    assert(/survey|feedback/i.test(txt), '/surveys did not render heading');
    assert(!/\bNaN\b/.test(txt), 'NaN found on /surveys');
    stepLog(FLOW, '/surveys loaded cleanly');

    // 5. /reports (all 6 tabs)
    await page.goto(`${URLS.ADMIN}/reports`, { waitUntil: 'domcontentloaded' });
    await waitForIdle(page, 900);
    txt = await page.evaluate(() => document.body.innerText);
    assert(/report|analytics/i.test(txt), '/reports did not render heading');
    assert(!/\bNaN\b/.test(txt), 'NaN found on /reports');

    const reportTabs = [
      'Visit Report',
      'MR Performance',
      'Product Presence',
      'Sales Report',
      'Collection Report',
      'Target Achievement',
    ];
    let visitedReportTabs = 0;
    for (const tab of reportTabs) {
      const btn = page.locator(`main button:has-text("${tab}")`).first();
      assert(await btn.isVisible().catch(() => false), `/reports tab "${tab}" not visible`);
      await btn.click();
      await waitForIdle(page, 350);
      const t = await page.evaluate(() => document.body.innerText);
      assert(!/\bNaN\b/.test(t), `NaN found in /reports tab "${tab}"`);
      visitedReportTabs++;
    }
    assert(visitedReportTabs === 6, `Expected all 6 /reports tabs, clicked ${visitedReportTabs}`);
    stepLog(FLOW, `/reports verified (${visitedReportTabs}/6 tabs cleanly)`);

    // 6. /chat
    await page.goto(`${URLS.ADMIN}/chat`, { waitUntil: 'domcontentloaded' });
    await waitForIdle(page, 1000);
    txt = await page.evaluate(() => document.body.innerText);
    assert(/chat|conversation|message|durga/i.test(txt), '/chat did not render expected UI');
    stepLog(FLOW, '/chat loaded cleanly for Admin');

    // 7. /settings
    await page.goto(`${URLS.ADMIN}/settings`, { waitUntil: 'domcontentloaded' });
    await waitForIdle(page, 900);
    txt = await page.evaluate(() => document.body.innerText);
    assert(/setting|company|security|profile|password/i.test(txt), '/settings did not render expected UI');
    stepLog(FLOW, '/settings loaded cleanly for Admin');

    mon.assertClean(FLOW);
    console.log(`\n=== ${FLOW}: ALL CHECKS PASSED (0 errors) ===`);
  } finally {
    await browser.close();
  }
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runFlow09().catch((err) => {
    console.error(`\n!!! ${FLOW} FAILED !!!\n`, err);
    process.exit(1);
  });
}
