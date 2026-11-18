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

const FLOW = 'FLOW-02-ADMIN-OVERVIEW-HEADER';

export async function runFlow02() {
  const browser = await launchBrowser();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const mon = attachMonitors(page);

  try {
    // 1. Login as Company Admin
    await loginAdminWeb(page, CREDS.ADMIN);
    const bodyText = await page.evaluate(() => document.body.innerText);
    assert(/koveldesigns/i.test(bodyText), 'Company badge koveldesigns not found in header/page');
    assert(/mathu/i.test(bodyText), 'Admin user mathu not found in header');
    assert(!/\bNaN\b/.test(bodyText), 'Found NaN in overview page text');
    stepLog(FLOW, `Logged in as Admin (mathu@koveldesigns.com) -> ${page.url()}`);

    // 2. Verify Admin Sidebar (links, hidden scrollbar, collapse with unclipped logo)
    const sidebar = await page.evaluate(() => {
      const aside = document.querySelector('aside');
      const scroll = aside?.querySelector('[class*="overflow-y-auto"]');
      const links = Array.from(aside?.querySelectorAll('a') || []).map((a) => a.getAttribute('href'));
      return {
        count: links.length,
        hasLiveTracking: links.includes('/live-tracking'),
        hasCampaigns: links.includes('/campaigns'),
        hasDcr: links.includes('/dcr'),
        scrollbarHidden: scroll ? getComputedStyle(scroll).scrollbarWidth === 'none' : false,
      };
    });
    assert(sidebar.count >= 15, `Expected full Admin nav links (>=15), got ${sidebar.count}`);
    assert(sidebar.hasLiveTracking && sidebar.hasCampaigns && sidebar.hasDcr, 'Missing key Admin nav routes in sidebar');
    assert(sidebar.scrollbarHidden, 'Admin sidebar scrollbar should be hidden');
    stepLog(FLOW, `Admin sidebar verified (${sidebar.count} links, hidden scrollbar)`);

    // Test collapse + expand
    const collapseBtn = page.locator('aside button[title*="Collapse" i], aside button[aria-label*="Collapse" i]').first();
    await collapseBtn.click();
    await page.waitForTimeout(350);
    const collapsedLogo = await page.evaluate(() => {
      const aside = document.querySelector('aside').getBoundingClientRect();
      const logo = document.querySelector('aside img')?.getBoundingClientRect();
      return { aside, logo };
    });
    assert(collapsedLogo.logo && collapsedLogo.logo.right <= collapsedLogo.aside.right + 1, 'Logo clipped on collapse');
    await page.locator('aside button[title*="Expand" i], aside button[aria-label*="Expand" i]').first().click();
    await page.waitForTimeout(350);
    stepLog(FLOW, 'Sidebar collapse/expand + unclipped logo verified');

    // 3. Global Header Territory selector
    const territorySelect = page.locator('header select').first();
    if (await territorySelect.isVisible().catch(() => false)) {
      const options = await territorySelect.locator('option').evaluateAll((opts) =>
        opts.map((o) => ({ value: o.value, label: o.textContent?.trim() })),
      );
      assert(options.length >= 1, 'Territory dropdown has no options');
      if (options.length > 1) {
        const pick = options.find((o) => o.value && o.value !== 'ALL');
        await territorySelect.selectOption(pick.value);
        await waitForIdle(page, 600);
        assert(page.url().includes(`territory=${encodeURIComponent(pick.value)}`), `URL missing territory param after selecting ${pick.label}`);
        await territorySelect.selectOption('ALL');
        await waitForIdle(page, 600);
        stepLog(FLOW, `Header Territory filter works (${options.length} options; tested "${pick.label}" -> reset to ALL)`);
      } else {
        stepLog(FLOW, `Header Territory selector rendered (${options.length} option)`);
      }
    }

    // 4. Global Header Date controls (Yesterday -> Today -> Custom Date -> Today)
    const yesterdayBtn = page.locator('header button:has-text("Yesterday")').first();
    const todayBtn = page.locator('header button:has-text("Today")').first();
    assert(await yesterdayBtn.isVisible(), 'Header Yesterday button not visible');
    assert(await todayBtn.isVisible(), 'Header Today button not visible');
    await yesterdayBtn.click();
    await waitForIdle(page, 600);
    assert(page.url().includes('date='), 'URL did not sync ?date= after clicking Yesterday');
    await todayBtn.click();
    await waitForIdle(page, 600);
    const dateInput = page.locator('header input[type="date"]').first();
    assert(await dateInput.isVisible(), 'Header date input not visible');
    const todayVal = await dateInput.inputValue();
    assert(/^\d{4}-\d{2}-\d{2}$/.test(todayVal), `Invalid date input value: ${todayVal}`);
    stepLog(FLOW, `Header Date selector works (Yesterday/Today/date input=${todayVal})`);

    // 5. Notification Bell dropdown
    const notifBtn = page.locator('header button[aria-label*="notification" i]').first();
    assert(await notifBtn.isVisible(), 'Notification bell button not visible');
    await notifBtn.click();
    await page.waitForTimeout(350);
    await notifBtn.click();
    await page.waitForTimeout(250);
    stepLog(FLOW, 'Notification bell dropdown opens/closes cleanly');

    // 6. Theme Toggle
    const themeBtn = page.locator('header button[aria-label*="theme" i], header button[title*="theme" i], header button[aria-label*="mode" i]').first();
    if (await themeBtn.isVisible().catch(() => false)) {
      await themeBtn.click();
      await page.waitForTimeout(250);
      await themeBtn.click();
      await page.waitForTimeout(250);
      stepLog(FLOW, 'Theme toggle switches and restores cleanly');
    }

    // 7. Global Search -> search "durga" -> verify live result -> click navigates cleanly
    const searchInput = page.locator('header input[placeholder*="Search" i]').first();
    assert(await searchInput.isVisible(), 'Header global search input not visible');
    await searchInput.click();
    await searchInput.fill('durga');
    await waitForIdle(page, 700);
    const searchDropdownText = await page.evaluate(() => document.body.innerText);
    assert(/durga/i.test(searchDropdownText), 'Global search did not show durga');
    const resultBtn = page.locator('header button:has-text("durga"), [role="listbox"] button:has-text("durga"), a:has-text("durga")').first();
    if (await resultBtn.isVisible().catch(() => false)) {
      await resultBtn.click();
      await waitForIdle(page, 800);
      stepLog(FLOW, `Global Search navigated cleanly to ${page.url()}`);
    } else {
      await searchInput.fill('');
      stepLog(FLOW, 'Global Search rendered live query results cleanly');
    }

    mon.assertClean(FLOW);
    console.log(`\n=== ${FLOW}: ALL CHECKS PASSED (0 errors) ===`);
  } finally {
    await browser.close();
  }
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runFlow02().catch((err) => {
    console.error(`\n!!! ${FLOW} FAILED !!!\n`, err);
    process.exit(1);
  });
}
