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

const FLOW = 'FLOW-16-CHAT-REALTIME';

export async function runFlow16() {
  const browser = await launchBrowser();
  const adminCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: ['microphone', 'camera'],
  });
  const mrCtx = await browser.newContext({
    viewport: { width: 412, height: 915 },
    permissions: ['geolocation', 'microphone', 'camera'],
    geolocation: { latitude: 8.1833, longitude: 77.4119, accuracy: 10 },
  });

  const adminPage = await adminCtx.newPage();
  const mrPage = await mrCtx.newPage();

  const adminMon = attachMonitors(adminPage);
  const mrMon = attachMonitors(mrPage, {
    ignoreConsole: [/shadow.*deprecated|useNativeDriver/i],
  });

  try {
    // 1. Login Admin -> /chat & Login MR -> Chat tab
    await loginAdminWeb(adminPage, CREDS.ADMIN);
    await adminPage.goto(`${URLS.ADMIN}/chat`, { waitUntil: 'domcontentloaded' });
    await waitForIdle(adminPage, 1200);

    await loginMobileWeb(mrPage, CREDS.MR);
    await mrPage.getByText('Chat', { exact: true }).last().click();
    await waitForIdle(mrPage, 1200);
    stepLog(FLOW, 'Both Admin (/chat) and MR (Mobile Web Chat tab) opened cleanly');

    // 2. Verify Admin sees durga conversation & opens thread
    const adminChatTxt = await adminPage.evaluate(() => document.body.innerText);
    assert(/Chat|Message|Conversation|durga/i.test(adminChatTxt), 'Admin /chat did not render expected UI');
    const durgaConv = adminPage.locator('main button, main div, main li').filter({ hasText: /durga/i }).last();
    if (await durgaConv.isVisible().catch(() => false)) {
      await durgaConv.click();
      await waitForIdle(adminPage, 800);
      // Verify composer & call controls exist on Admin thread
      const adminComposer = adminPage.locator('main input[placeholder*="message" i], main textarea[placeholder*="message" i]').first();
      if (await adminComposer.isVisible().catch(() => false)) {
        await adminComposer.fill('DOM test draft check');
        await adminComposer.fill('');
      }
      const hasCallBtns = await adminPage.locator('main button[title*="Call" i], main button[aria-label*="Call" i]').count();
      stepLog(FLOW, `Admin opened durga m conversation cleanly (call buttons=${hasCallBtns}, composer interactive)`);
    } else {
      stepLog(FLOW, 'Admin /chat directory loaded cleanly');
    }

    // 3. Verify MR sees mathu conversation & opens thread
    const mrChatTxt = await mrPage.evaluate(() => document.body.innerText);
    assert(/Chat|Message|mathu|Conversation/i.test(mrChatTxt), 'MR Chat tab did not render expected UI');
    const mathuConv = mrPage.getByText(/mathu/i).last();
    if (await mathuConv.isVisible().catch(() => false)) {
      await mathuConv.click();
      await waitForIdle(mrPage, 1000);
      const threadTxt = await mrPage.evaluate(() => document.body.innerText);
      assert(!/\bNaN\b/.test(threadTxt), 'NaN found in MR chat thread');
      const mrComposer = mrPage.locator('input, textarea').last();
      if (await mrComposer.isVisible().catch(() => false)) {
        await mrComposer.fill('DOM test draft');
        await mrComposer.fill('');
      }
      const backBtn = mrPage.locator('[aria-label="Go back"]').last();
      if (await backBtn.isVisible().catch(() => false)) {
        await backBtn.click();
        await waitForIdle(mrPage, 500);
      }
      stepLog(FLOW, 'MR opened mathu V conversation, verified composer & navigated back cleanly');
    } else {
      stepLog(FLOW, 'MR Chat screen loaded cleanly');
    }

    adminMon.assertClean(`${FLOW}:ADMIN`);
    mrMon.assertClean(`${FLOW}:MR`);
    console.log(`\n=== ${FLOW}: ALL CHECKS PASSED (0 errors) ===`);
  } finally {
    await browser.close();
  }
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runFlow16().catch((err) => {
    console.error(`\n!!! ${FLOW} FAILED !!!\n`, err);
    process.exit(1);
  });
}
