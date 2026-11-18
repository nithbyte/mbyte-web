import {
  URLS,
  CREDS,
  launchBrowser,
  attachMonitors,
  assert,
  waitForIdle,
  loginAdminWeb,
  loginMobileWeb,
  stepLog,
} from './helpers.mjs';

const FLOW = 'FLOW-11-LIVE-TRACKING-ROUNDTRIP';

export async function runFlow11() {
  const browser = await launchBrowser();
  const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const mrCtx = await browser.newContext({
    viewport: { width: 412, height: 915 },
    permissions: ['geolocation'],
    geolocation: { latitude: 8.1841, longitude: 77.4130, accuracy: 8 },
  });

  const adminPage = await adminCtx.newPage();
  const mrPage = await mrCtx.newPage();

  const adminMon = attachMonitors(adminPage, {
    ignoreHttp: [({ url }) => !url.startsWith('http://localhost')],
    ignoreConsole: [/tile\.openstreetmap|basemaps\.cartocdn|arcgisonline/i],
  });
  const mrMon = attachMonitors(mrPage, {
    ignoreConsole: [/shadow.*deprecated|useNativeDriver/i],
  });

  let mrPingCount = 0;
  mrPage.on('response', (res) => {
    if (res.url().includes('/route-tracking/live/ping') && res.status() >= 200 && res.status() < 300) {
      mrPingCount++;
    }
  });

  try {
    // 1. Login Admin -> /live-tracking & Login MR -> Mobile Web
    await loginAdminWeb(adminPage, CREDS.ADMIN);
    await adminPage.goto(`${URLS.ADMIN}/live-tracking`, { waitUntil: 'domcontentloaded' });
    await adminPage.waitForSelector('.leaflet-container', { timeout: 15000 });
    await waitForIdle(adminPage, 1000);

    await loginMobileWeb(mrPage, CREDS.MR);
    // Navigate MR to Operations tab (MRDashboardScreen) where the Live GPS Tracking banner renders
    await mrPage.getByText('Operations', { exact: true }).last().click();
    await waitForIdle(mrPage, 700);
    stepLog(FLOW, 'Both Admin (/live-tracking) and MR (Mobile Web -> Operations) authenticated simultaneously');

    // 2. Admin toggles durga m ON
    const durgaRow = adminPage
      .locator('div, li, tr')
      .filter({ hasText: /durga/i })
      .filter({ has: adminPage.locator('button[role="switch"]') })
      .last();
    const toggleBtn = durgaRow.locator('button[role="switch"]').first();
    assert(await toggleBtn.isVisible(), 'durga m live tracking toggle not visible on Admin');
    if ((await toggleBtn.getAttribute('aria-checked')) !== 'true') {
      await toggleBtn.click();
      await waitForIdle(adminPage, 700);
    }
    assert((await toggleBtn.getAttribute('aria-checked')) === 'true', 'Admin failed to toggle durga m ON');
    stepLog(FLOW, 'Admin toggled durga m Live Tracking ON');

    // 3. Wait for MR Mobile Web to detect ON (poll / visibility sync) -> banner visible + live ping emitted
    await mrPage.evaluate(() => window.dispatchEvent(new Event('focus')));
    await mrPage.waitForFunction(
      () => /Live GPS Tracking/i.test(document.body.innerText || ''),
      { timeout: 22000 },
    );
    await mrPage.waitForTimeout(2500);
    assert(mrPingCount >= 1, `Expected MR Mobile Web to emit >=1 live GPS ping, got ${mrPingCount}`);
    stepLog(FLOW, `MR Mobile Web displayed "Live GPS Tracking" banner & auto-published ${mrPingCount} live GPS fix(es)`);

    // 4. Verify Admin /live-tracking received live fix WITHOUT reload
    await adminPage.waitForTimeout(1000);
    const adminLive = await adminPage.evaluate(() => ({
      markers: document.querySelectorAll('.leaflet-marker-icon, .leaflet-interactive').length,
      text: document.body.innerText,
    }));
    assert(adminLive.markers > 0, 'No live markers visible on Admin map');
    assert(/LIVE|Just now|s ago|Active/i.test(adminLive.text), 'Admin did not show live status for durga m');
    stepLog(FLOW, `Admin /live-tracking updated live from MR browser (${adminLive.markers} markers, zero reload)`);

    // 5. Admin toggles durga m OFF
    await toggleBtn.click();
    await waitForIdle(adminPage, 700);
    assert((await toggleBtn.getAttribute('aria-checked')) === 'false', 'Admin failed to toggle durga m OFF');
    stepLog(FLOW, 'Admin toggled durga m Live Tracking OFF');

    // 6. Verify MR Mobile Web hides Live GPS Tracking banner cleanly
    await mrPage.evaluate(() => window.dispatchEvent(new Event('focus')));
    await mrPage.waitForFunction(
      () => !/Live GPS Tracking/i.test(document.body.innerText || ''),
      { timeout: 22000 },
    );
    stepLog(FLOW, 'MR Mobile Web stopped tracking & hid Live GPS Tracking banner cleanly');

    adminMon.assertClean(`${FLOW}:ADMIN`);
    mrMon.assertClean(`${FLOW}:MR`);
    console.log(`\n=== ${FLOW}: ALL CHECKS PASSED (0 errors) ===`);
  } finally {
    await browser.close();
  }
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runFlow11().catch((err) => {
    console.error(`\n!!! ${FLOW} FAILED !!!\n`, err);
    process.exit(1);
  });
}
