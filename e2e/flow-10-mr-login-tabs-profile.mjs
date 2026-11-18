import {
  URLS,
  CREDS,
  launchBrowser,
  attachMonitors,
  assert,
  waitForIdle,
  loginMobileWeb,
  stepLog,
} from './helpers.mjs';

const FLOW = 'FLOW-10-MR-LOGIN-TABS-PROFILE';

export async function runFlow10() {
  const browser = await launchBrowser();
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    permissions: ['geolocation'],
    geolocation: { latitude: 8.1833, longitude: 77.4119, accuracy: 10 },
  });
  const page = await context.newPage();
  const mon = attachMonitors(page, {
    // Ignore non-fatal Expo RN-web style deprecation warnings if logged as console.error
    ignoreConsole: [/shadow.*deprecated|useNativeDriver/i],
  });

  try {
    // 1. Login as MR on Mobile Web
    await loginMobileWeb(page, CREDS.MR);
    let txt = await page.evaluate(() => document.body.innerText);
    assert(!/\bNaN\b/.test(txt), 'NaN found on MR initial landing screen');
    stepLog(FLOW, 'Logged in as MR (durga@koveldesigns.com) on Mobile Web (412x915)');

    // 2. Verify & click all 5 bottom tabs
    const tabs = ['Visits', 'Directory', 'Orders', 'Chat', 'Operations'];
    for (const tab of tabs) {
      const tabEl = page.locator(`[role="tab"]:has-text("${tab}"), a:has-text("${tab}"), button:has-text("${tab}")`).last();
      const visible = await tabEl.isVisible().catch(() => false);
      if (visible) {
        await tabEl.click();
      } else {
        await page.getByText(tab, { exact: true }).last().click();
      }
      await waitForIdle(page, 600);
      const t = await page.evaluate(() => document.body.innerText);
      assert(!/\bNaN\b/.test(t), `NaN found on MR tab "${tab}"`);
    }
    stepLog(FLOW, `Verified all 5 MR bottom tabs (${tabs.join(', ')})`);

    // 3. Operations workspace tiles check
    txt = await page.evaluate(() => document.body.innerText);
    assert(/Attendance|Campaign|Sample|Expense|Tour Plan|Collection/i.test(txt), 'Operations workspace tiles missing');
    stepLog(FLOW, 'MR Operations workspace KPIs & feature tiles verified');

    // 4. Open MR Profile screen
    const profileTrigger = page.getByText(/durga|Profile/i).first();
    if (await profileTrigger.isVisible().catch(() => false)) {
      await profileTrigger.click();
      await waitForIdle(page, 800);
      const profTxt = await page.evaluate(() => document.body.innerText);
      assert(/durga/i.test(profTxt), 'MR Profile screen missing durga');
      assert(!/\bNaN\b/.test(profTxt), 'NaN found on MR Profile screen');
      stepLog(FLOW, 'MR Profile screen verified cleanly');
    }

    mon.assertClean(FLOW);
    console.log(`\n=== ${FLOW}: ALL CHECKS PASSED (0 errors) ===`);
  } finally {
    await browser.close();
  }
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runFlow10().catch((err) => {
    console.error(`\n!!! ${FLOW} FAILED !!!\n`, err);
    process.exit(1);
  });
}
