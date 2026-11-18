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

const FLOW = 'FLOW-01-SUPERADMIN';

export async function runFlow01() {
  const browser = await launchBrowser();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const mon = attachMonitors(page);

  try {
    // 1. Login as Super Admin
    await loginAdminWeb(page, CREDS.SUPER_ADMIN);
    const landedUrl = page.url();
    stepLog(FLOW, `Logged in as Super Admin -> landed on ${landedUrl}`);

    // 2. Verify Sidebar: no scrollbar, collapse button '<' near MByte logo, logo unclipped on collapse
    const sidebarInfo = await page.evaluate(() => {
      const aside = document.querySelector('aside');
      if (!aside) return null;
      const scrollContainer = aside.querySelector('[class*="overflow-y-auto"]') || aside.querySelector('nav');
      const navStyle = scrollContainer ? getComputedStyle(scrollContainer) : null;
      const links = Array.from(aside.querySelectorAll('a')).map((a) => ({
        text: (a.textContent || '').trim(),
        href: a.getAttribute('href'),
      }));
      const collapseBtn = aside.querySelector('button[title*="Collapse" i], button[aria-label*="Collapse" i], button[title*="Sidebar" i]');
      const img = aside.querySelector('img');
      return {
        asideWidth: aside.getBoundingClientRect().width,
        scrollbarWidth: navStyle ? navStyle.scrollbarWidth : null,
        hasNoScrollbarClass: scrollContainer ? /scrollbar-width:none|no-scrollbar|scrollbar-none/.test(scrollContainer.className) : false,
        links,
        hasCollapseBtn: Boolean(collapseBtn),
        hasLogoImg: Boolean(img),
      };
    });
    assert(sidebarInfo, 'Sidebar <aside> not found');
    assert(sidebarInfo.links.length >= 2, `Expected Super Admin sidebar links, got ${sidebarInfo.links.length}`);
    assert(
      sidebarInfo.scrollbarWidth === 'none' || sidebarInfo.hasNoScrollbarClass,
      `Sidebar nav scrollbar should be hidden (scrollbarWidth=${sidebarInfo.scrollbarWidth})`,
    );
    assert(sidebarInfo.hasCollapseBtn, 'Sidebar collapse button not found');
    stepLog(FLOW, `Sidebar verified (${sidebarInfo.links.length} nav links, hidden scrollbar, width=${sidebarInfo.asideWidth}px)`);

    // Test collapse & verify MByte icon is NOT cut off
    const collapseBtn = page.locator('aside button[title*="Collapse" i], aside button[aria-label*="Collapse" i]').first();
    await collapseBtn.click();
    await page.waitForTimeout(400);

    const collapsedState = await page.evaluate(() => {
      const aside = document.querySelector('aside');
      const asideRect = aside.getBoundingClientRect();
      const logo = aside.querySelector('img') || aside.querySelector('svg');
      const logoRect = logo ? logo.getBoundingClientRect() : null;
      return {
        asideWidth: asideRect.width,
        asideLeft: asideRect.left,
        asideRight: asideRect.right,
        logoRect: logoRect
          ? {
              left: logoRect.left,
              right: logoRect.right,
              width: logoRect.width,
              height: logoRect.height,
            }
          : null,
        logoNaturalWidth: logo && logo.tagName === 'IMG' ? logo.naturalWidth : 1,
      };
    });
    assert(collapsedState.asideWidth < sidebarInfo.asideWidth, `Sidebar did not collapse (${collapsedState.asideWidth} vs ${sidebarInfo.asideWidth})`);
    assert(collapsedState.logoRect && collapsedState.logoRect.width > 0, 'MByte logo disappeared when collapsed');
    assert(
      collapsedState.logoRect.left >= collapsedState.asideLeft - 1 &&
        collapsedState.logoRect.right <= collapsedState.asideRight + 1,
      `MByte logo clipped during collapse: logo=[${collapsedState.logoRect.left}, ${collapsedState.logoRect.right}] aside=[${collapsedState.asideLeft}, ${collapsedState.asideRight}]`,
    );
    assert(collapsedState.logoNaturalWidth > 0, 'MByte logo image failed to load');
    stepLog(FLOW, `Sidebar collapse verified (width=${collapsedState.asideWidth}px, logo unclipped ${Math.round(collapsedState.logoRect.width)}x${Math.round(collapsedState.logoRect.height)})`);

    // Re-expand sidebar
    const expandBtn = page.locator('aside button[title*="Expand" i], aside button[aria-label*="Expand" i]').first();
    await expandBtn.click();
    await page.waitForTimeout(400);
    const expandedWidth = await page.evaluate(() => document.querySelector('aside').getBoundingClientRect().width);
    assert(expandedWidth > collapsedState.asideWidth, `Sidebar did not re-expand (${expandedWidth})`);
    stepLog(FLOW, `Sidebar re-expanded cleanly (width=${expandedWidth}px)`);

    // 3. Companies page (/companies)
    await page.goto(`${URLS.ADMIN}/companies`, { waitUntil: 'domcontentloaded' });
    await waitForIdle(page, 900);
    const companiesText = await page.evaluate(() => document.body.innerText);
    assert(/koveldesigns/i.test(companiesText), 'Expected koveldesigns company on /companies page');

    // Test Add Company modal open/close
    const addCompanyBtn = page.locator('button:has-text("Add Company"), button:has-text("New Company"), button:has-text("Register Company")').first();
    if (await addCompanyBtn.isVisible().catch(() => false)) {
      await addCompanyBtn.click();
      await page.waitForTimeout(350);
      const modalVisible = await page.locator('input[placeholder*="Company" i], input[name*="name" i], form input').first().isVisible().catch(() => false);
      assert(modalVisible, 'Add Company modal did not render inputs');
      await page.keyboard.press('Escape');
      const closeBtn = page.locator('button:has-text("Cancel"), button[aria-label="Close"]').first();
      if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click();
      await page.waitForTimeout(250);
      stepLog(FLOW, '/companies rendered koveldesigns + Add Company modal opens/closes cleanly');
    } else {
      stepLog(FLOW, '/companies rendered koveldesigns cleanly');
    }

    // 4. Field Force / Company Admins (/field-force)
    await page.goto(`${URLS.ADMIN}/field-force`, { waitUntil: 'domcontentloaded' });
    await waitForIdle(page, 900);
    const ffText = await page.evaluate(() => document.body.innerText);
    assert(ffText.length > 80, '/field-force page appeared empty for Super Admin');
    stepLog(FLOW, '/field-force loaded for Super Admin cleanly');

    // 5. Chat (/chat)
    await page.goto(`${URLS.ADMIN}/chat`, { waitUntil: 'domcontentloaded' });
    await waitForIdle(page, 900);
    const chatText = await page.evaluate(() => document.body.innerText);
    assert(/chat|message|conversation|channel/i.test(chatText), '/chat page did not render expected UI');
    stepLog(FLOW, '/chat loaded for Super Admin cleanly');

    // 6. Settings (/settings)
    await page.goto(`${URLS.ADMIN}/settings`, { waitUntil: 'domcontentloaded' });
    await waitForIdle(page, 900);
    const settingsText = await page.evaluate(() => document.body.innerText);
    assert(/setting|profile|security|password|account/i.test(settingsText), '/settings page did not render expected UI');
    stepLog(FLOW, '/settings loaded for Super Admin cleanly');

    // 7. Global Search (Ctrl+K or header search)
    await page.goto(`${URLS.ADMIN}/companies`, { waitUntil: 'domcontentloaded' });
    await waitForIdle(page, 600);
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(300);
    const searchInput = page.locator('header input[placeholder*="Search" i], input[placeholder*="Search" i]').first();
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('kovel');
      await page.waitForTimeout(450);
      await searchInput.fill('');
      await page.keyboard.press('Escape');
      stepLog(FLOW, 'Global search input interactive & cleared cleanly');
    }

    // 8. Header Profile menu -> Profile modal -> Sign Out
    const profileTrigger = page.locator('header button[aria-label*="User Profile" i]').first();
    assert(await profileTrigger.isVisible(), 'Header User Profile button not visible');
    await profileTrigger.click();
    await page.waitForTimeout(350);
    const modalText = await page.evaluate(() => document.body.innerText);
    assert(modalText.includes('Corporate Account & Profile'), 'Profile modal title not rendered');
    assert(modalText.includes(CREDS.SUPER_ADMIN.email), `Profile modal missing ${CREDS.SUPER_ADMIN.email}`);
    const signOutBtn = page.locator('button:has-text("Sign Out of Portal")').first();
    assert(await signOutBtn.isVisible(), 'Sign Out of Portal button not visible in Profile modal');
    await signOutBtn.click();
    await page.waitForURL((url) => url.pathname.startsWith('/login'), { timeout: 15000 });
    stepLog(FLOW, 'Profile modal verified + Sign Out of Portal redirected cleanly to /login');

    mon.assertClean(FLOW);
    console.log(`\n=== ${FLOW}: ALL CHECKS PASSED (0 errors) ===`);
  } finally {
    await browser.close();
  }
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runFlow01().catch((err) => {
    console.error(`\n!!! ${FLOW} FAILED !!!\n`, err);
    process.exit(1);
  });
}
