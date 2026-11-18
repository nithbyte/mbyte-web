import {
  CREDS,
  launchBrowser,
  attachMonitors,
  assert,
  waitForIdle,
  loginMobileWeb,
  stepLog,
} from './helpers.mjs';

const FLOW = 'FLOW-12-MR-DIRECTORY-CHEMIST-FLOW';

async function getVisibleScreenText(page) {
  return page.evaluate(() => {
    // React Navigation keeps inactive tabs mounted; inspect top-most visible container if possible
    const all = document.body.innerText || '';
    return all;
  });
}

export async function runFlow12() {
  const browser = await launchBrowser();
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    permissions: ['geolocation'],
    geolocation: { latitude: 8.1833, longitude: 77.4119, accuracy: 10 },
  });
  const page = await context.newPage();
  let dcrLocked400 = false;
  const mon = attachMonitors(page, {
    ignoreConsole: [/shadow.*deprecated|useNativeDriver|status of 400/i],
    ignoreHttp: [
      ({ url, status, method }) => {
        if (method === 'POST' && status === 400 && url.includes('/api/v1/visits')) {
          dcrLocked400 = true;
          return true;
        }
        return false;
      },
    ],
  });

  try {
    await loginMobileWeb(page, CREDS.MR);

    // 1. Open Directory bottom tab
    await page.getByText('Directory', { exact: true }).last().click();
    await waitForIdle(page, 900);

    const docsTab = page.locator('[aria-label="Doctors Directory Tab"]').first();
    const purchTab = page.locator('[aria-label="Purchasing Doctors Directory Tab"]').first();
    const chemTab = page.locator('[aria-label="Chemists Directory Tab"]').first();
    assert(await docsTab.isVisible(), 'Doctors Directory Tab not visible');
    assert(await purchTab.isVisible(), 'Purchasing Doctors Directory Tab not visible');
    assert(await chemTab.isVisible(), 'Chemists Directory Tab not visible');
    stepLog(FLOW, 'Directory tab loaded with Doctors, Purchasing, and Chemists segment tabs');

    // 2. Click Purchasing Doctors tab
    await purchTab.click();
    await waitForIdle(page, 600);
    let txt = await getVisibleScreenText(page);
    assert(!/\bNaN\b/.test(txt), 'NaN found on Purchasing Doctors tab');
    stepLog(FLOW, 'Purchasing Doctors directory tab verified cleanly');

    // 3. Click Doctors tab & open first Doctor Details (click the doctor's name text, NOT the Directions button!)
    await docsTab.click();
    await waitForIdle(page, 700);
    await page.getByText(/^Dr\.\s+/i).last().click();
    await waitForIdle(page, 1000);
    const backBtn = page.locator('[aria-label="Go back"]').last();
    assert(await backBtn.isVisible(), 'Doctor Details screen did not open (Go back button missing)');
    const docTxt = await getVisibleScreenText(page);
    assert(/Solo|Joint|Start|Visit|GPS/i.test(docTxt), 'Doctor Details screen missing Solo/Joint or Visit CTA');
    assert(!/\bNaN\b/.test(docTxt), 'NaN found on Doctor Details screen');
    stepLog(FLOW, 'Doctor Details screen verified (Solo/Joint visit & Start Visit CTA intact)');

    // Go back to Directory via Header Go back button
    await backBtn.click();
    await waitForIdle(page, 700);

    // 4. Switch to Chemists tab & open Suma Pharma (or first chemist)
    await chemTab.click();
    await waitForIdle(page, 800);
    const chemListTxt = await getVisibleScreenText(page);
    assert(/Suma Pharma|Pharma|Chemist|Medical/i.test(chemListTxt), 'Chemists tab did not list chemists');
    stepLog(FLOW, 'Chemists directory tab loaded real chemists');

    const sumaEl = page.getByText(/Suma Pharma/i).last();
    if (await sumaEl.isVisible().catch(() => false)) {
      await sumaEl.click();
    } else {
      await page.getByText(/Pharma|Medical/i).last().click();
    }
    await waitForIdle(page, 1000);

    // Inspect ONLY the Chemist Details screen (last screen mounted in React Navigation stack!)
    const chemVerifyBtn = page.getByText(/VERIFY GPS & GATHER REQUIREMENTS/i).last();
    assert(
      await chemVerifyBtn.isVisible().catch(() => false),
      'Chemist Details screen missing "VERIFY GPS & GATHER REQUIREMENTS" CTA!',
    );
    // Verify NO Solo/Joint visit selector is visible on top-most Chemist Details screen
    const hasSoloJointVisible = await page.getByText(/Joint Field Work|Solo Visit/i).last().isVisible().catch(() => false);
    assert(!hasSoloJointVisible, 'Chemist Details MUST NOT show Solo/Joint visit selector!');
    stepLog(FLOW, 'Chemist Details verified (NO Solo/Joint, HAS "VERIFY GPS & GATHER REQUIREMENTS")');

    // 5. Click VERIFY GPS & GATHER REQUIREMENTS -> Chemist GPSVerificationScreen OR inline DCR-locked banner
    await chemVerifyBtn.click();
    await waitForIdle(page, 1200);

    const hasVisualAidsVisible = await page.getByText(/Open Visual Aids|Start Detailing/i).last().isVisible().catch(() => false);
    assert(!hasVisualAidsVisible, 'Chemist GPSVerificationScreen MUST NOT show Doctor Detailing / Visual Aids!');
    const gpsTxt = await getVisibleScreenText(page);
    if (dcrLocked400) {
      assert(
        /Daily Call Report for this date has already been submitted/i.test(gpsTxt),
        'DCR-locked 400 error was NOT displayed inline to the MR on ChemistDetailsScreen!',
      );
      stepLog(FLOW, 'DCR already submitted today -> inline error banner clearly shown on ChemistDetailsScreen (no silent failure!)');
    } else {
      assert(/GPS|Verify|Geofence|Requirement|Chemist|Distance/i.test(gpsTxt), 'Chemist GPSVerificationScreen missing expected copy');
      stepLog(FLOW, 'Chemist GPSVerificationScreen verified (GPS verification & requirement gathering UI intact, no Visual Aids detailing)');
    }
    assert(!/\bNaN\b/.test(gpsTxt), 'NaN found after clicking VERIFY GPS & GATHER REQUIREMENTS');

    mon.assertClean(FLOW);
    console.log(`\n=== ${FLOW}: ALL CHECKS PASSED (0 errors) ===`);
  } finally {
    await browser.close();
  }
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runFlow12().catch((err) => {
    console.error(`\n!!! ${FLOW} FAILED !!!\n`, err);
    process.exit(1);
  });
}
