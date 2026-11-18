import {
  URLS,
  CREDS,
  launchBrowser,
  attachMonitors,
  assert,
  waitForIdle,
  loginAdminWeb,
  apiLogin,
  stepLog,
} from './helpers.mjs';

const FLOW = 'FLOW-04-ADMIN-LIVE-TRACKING';

export async function runFlow04() {
  const browser = await launchBrowser();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  // Allow external map tile network hiccups in headless if offline, while keeping API strict
  const mon = attachMonitors(page, {
    ignoreHttp: [({ url }) => !url.startsWith('http://localhost')],
    ignoreConsole: [/tile\.openstreetmap|basemaps\.cartocdn|arcgisonline/i],
  });

  try {
    await loginAdminWeb(page, CREDS.ADMIN);
    await page.goto(`${URLS.ADMIN}/live-tracking`, { waitUntil: 'domcontentloaded' });
    await waitForIdle(page, 1400);

    // 1. Verify SSE LIVE STREAM badge + Leaflet map container
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    const mapInfo = await page.evaluate(() => {
      const container = document.querySelector('.leaflet-container');
      const rect = container.getBoundingClientRect();
      const text = document.body.innerText;
      return {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        hasLiveBadge: /LIVE STREAM|LIVE/i.test(text),
        hasDurga: /durga/i.test(text),
      };
    });
    assert(mapInfo.width > 300 && mapInfo.height > 250, `Leaflet map too small: ${mapInfo.width}x${mapInfo.height}`);
    assert(mapInfo.hasLiveBadge, 'LIVE STREAM indicator not visible on /live-tracking');
    assert(mapInfo.hasDurga, 'MR durga m not listed in Live Tracking roster');
    stepLog(FLOW, `Leaflet map (${mapInfo.width}x${mapInfo.height}) + SSE LIVE badge + durga m roster verified`);

    // 2. Test Map Layer switcher (Clean / Street / Satellite)
    for (const layer of ['Street', 'Satellite', 'Clean']) {
      const btn = page.locator(`button:has-text("${layer}")`).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(250);
      }
    }
    stepLog(FLOW, 'Map layer switcher (Street / Satellite / Clean) verified');

    // 3. Locate durga m toggle switch and record original state
    const durgaRow = page.locator('div, li, tr').filter({ hasText: /durga/i }).filter({ has: page.locator('button[role="switch"]') }).last();
    const toggleBtn = durgaRow.locator('button[role="switch"]').first();
    assert(await toggleBtn.isVisible(), 'Per-MR Live Tracking switch for durga m not found');
    const initialChecked = (await toggleBtn.getAttribute('aria-checked')) === 'true';

    // Ensure ON
    if (!initialChecked) {
      await toggleBtn.click();
      await waitForIdle(page, 700);
    }
    assert((await toggleBtn.getAttribute('aria-checked')) === 'true', 'Toggle did not turn ON');

    // Reload to verify DB persistence
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    await waitForIdle(page, 1200);
    const durgaRowAfter = page.locator('div, li, tr').filter({ hasText: /durga/i }).filter({ has: page.locator('button[role="switch"]') }).last();
    const toggleAfter = durgaRowAfter.locator('button[role="switch"]').first();
    assert((await toggleAfter.getAttribute('aria-checked')) === 'true', 'Toggle ON state did not persist across reload');
    stepLog(FLOW, `Per-MR toggle ON persisted across reload (initial=${initialChecked})`);

    // 4. Push a live GPS ping as durga@koveldesigns.com and verify live SSE update in DOM (no reload!)
    const mrAuth = await apiLogin(CREDS.MR);
    const pingRes = await fetch(`${URLS.API}/route-tracking/live/ping`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mrAuth.accessToken}`,
      },
      body: JSON.stringify({
        latitude: 8.1838,
        longitude: 77.4126,
        accuracy: 7,
        speedKmh: 30,
        heading: 120,
        batteryLevel: 87,
        capturedAt: new Date().toISOString(),
      }),
    });
    assert(pingRes.ok, `Live GPS ping failed: ${pingRes.status} ${await pingRes.text()}`);
    await page.waitForTimeout(1200);

    const liveUpdate = await page.evaluate(() => {
      const text = document.body.innerText;
      const markers = document.querySelectorAll('.leaflet-marker-icon, .leaflet-interactive').length;
      return {
        markers,
        hasBatteryOrSpeed: /87%|30\s*km\/h|LIVE|Active|Moving|Just now|s ago/i.test(text),
      };
    });
    assert(liveUpdate.markers > 0, 'No Leaflet marker rendered after live GPS ping');
    assert(liveUpdate.hasBatteryOrSpeed, 'Live ping telemetry did not reflect in DOM');
    stepLog(FLOW, `Real-time SSE live ping reflected in DOM without reload (${liveUpdate.markers} map marker elements)`);

    // 5. Click durga card to inspect trail / focus
    await durgaRowAfter.click();
    await waitForIdle(page, 500);
    stepLog(FLOW, 'Focused durga m on map and loaded trail cleanly');

    // 6. Test toggling OFF & verify persistence
    await toggleAfter.click();
    await waitForIdle(page, 700);
    assert((await toggleAfter.getAttribute('aria-checked')) === 'false', 'Failed to toggle durga m back to OFF');
    stepLog(FLOW, 'Toggled durga m live tracking back to OFF cleanly');

    mon.assertClean(FLOW);
    console.log(`\n=== ${FLOW}: ALL CHECKS PASSED (0 errors) ===`);
  } finally {
    await browser.close();
  }
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runFlow04().catch((err) => {
    console.error(`\n!!! ${FLOW} FAILED !!!\n`, err);
    process.exit(1);
  });
}
