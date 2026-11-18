import {
  CREDS,
  launchBrowser,
  attachMonitors,
  assert,
  waitForIdle,
  loginMobileWeb,
  stepLog,
} from './helpers.mjs';

const FLOW = 'FLOW-15-MR-ENGAGEMENT-SETTINGS';

async function openAndVerifyTile(page, ariaLabel, verifyFn, label) {
  const tile = page.locator(`[aria-label="${ariaLabel}"]`).last();
  await tile.scrollIntoViewIfNeeded();
  assert(await tile.isVisible(), `Operations tile "${ariaLabel}" not visible`);
  await tile.click();
  await waitForIdle(page, 1000);
  const txt = await page.evaluate(() => document.body.innerText);
  assert(!/\bNaN\b/.test(txt), `NaN found on ${label} screen`);
  await verifyFn(txt);
  const backBtn = page.locator('[aria-label="Go back"]').last();
  assert(await backBtn.isVisible(), `${label} screen missing Go back button`);
  await backBtn.click();
  await waitForIdle(page, 600);
  stepLog(FLOW, `${label} screen verified & navigated back cleanly`);
}

export async function runFlow15() {
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
    await page.getByText('Operations', { exact: true }).last().click();
    await waitForIdle(page, 800);

    // 1. Shift Attendance
    await openAndVerifyTile(
      page,
      'Shift Attendance',
      (txt) => {
        assert(/Shift|Attendance|Punch|Leave/i.test(txt), 'Shift Attendance missing expected UI');
      },
      'Shift Attendance',
    );

    // 2. Detailing Campaigns -> MUST show "Heart day" (hrt-001)
    await openAndVerifyTile(
      page,
      'Detailing Campaigns',
      (txt) => {
        assert(/Heart day/i.test(txt), `Active campaign "Heart day" NOT displayed in MR Campaigns! Got: ${txt.slice(0, 400)}`);
        assert(!/No Active Campaigns/i.test(txt), 'MR Campaigns erroneously displayed "No Active Campaigns"');
      },
      'Detailing Campaigns ("Heart day" visible)',
    );

    // 3. Training & Quizzes
    await openAndVerifyTile(
      page,
      'Training Curriculum',
      (txt) => {
        assert(/Training|Quiz|Module|Curriculum|Certification/i.test(txt), 'Training screen missing expected UI');
      },
      'Training & Quizzes',
    );

    // 4. Surveys & Feedback
    await openAndVerifyTile(
      page,
      'Customer Surveys',
      (txt) => {
        assert(/Survey|Feedback|Questionnaire/i.test(txt), 'Surveys screen missing expected UI');
      },
      'Surveys & Feedback',
    );

    // 5. Application Settings
    await openAndVerifyTile(
      page,
      'Application Settings',
      (txt) => {
        assert(/Setting|Notification|Account|Password|Sync|Security/i.test(txt), 'Settings screen missing expected UI');
      },
      'Application Settings',
    );

    mon.assertClean(FLOW);
    console.log(`\n=== ${FLOW}: ALL CHECKS PASSED (0 errors) ===`);
  } finally {
    await browser.close();
  }
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runFlow15().catch((err) => {
    console.error(`\n!!! ${FLOW} FAILED !!!\n`, err);
    process.exit(1);
  });
}
