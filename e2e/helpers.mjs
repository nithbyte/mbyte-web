import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
export const { chromium } = require('../node_modules/playwright');

export const URLS = {
  ADMIN: process.env.ADMIN_URL || 'http://localhost:3000',
  API: process.env.API_URL || 'http://localhost:4000/api/v1',
  MOBILE: process.env.MOBILE_URL || 'http://localhost:8081',
};

export const CREDS = {
  SUPER_ADMIN: { email: 'superadmin@mbyte.app', password: 'Password123!' },
  ADMIN: { email: 'mathu@koveldesigns.com', password: 'Password123!' },
  MR: { email: 'durga@koveldesigns.com', password: 'Password123!' },
};

export function findChromiumExecutable() {
  if (process.env.PLAYWRIGHT_CHROME_PATH && fs.existsSync(process.env.PLAYWRIGHT_CHROME_PATH)) {
    return process.env.PLAYWRIGHT_CHROME_PATH;
  }
  const localAppData = process.env.LOCALAPPDATA;
  if (localAppData) {
    const msPlaywright = path.join(localAppData, 'ms-playwright');
    if (fs.existsSync(msPlaywright)) {
      const dirs = fs.readdirSync(msPlaywright).filter((d) => d.startsWith('chromium-')).sort().reverse();
      for (const dir of dirs) {
        const candidates = [
          path.join(msPlaywright, dir, 'chrome-win64', 'chrome.exe'),
          path.join(msPlaywright, dir, 'chrome-win', 'chrome.exe'),
        ];
        for (const c of candidates) {
          if (fs.existsSync(c)) return c;
        }
      }
    }
  }
  return undefined;
}

export async function launchBrowser() {
  const executablePath = findChromiumExecutable();
  return chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
    args: ['--no-sandbox', '--disable-gpu', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  });
}

export function attachMonitors(page, { ignoreHttp = [], ignoreConsole = [] } = {}) {
  const state = {
    pageErrors: [],
    consoleErrors: [],
    httpErrors: [],
  };

  page.on('pageerror', (err) => {
    state.pageErrors.push(err.stack || err.message || String(err));
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (ignoreConsole.some((re) => re.test(text))) return;
      state.consoleErrors.push(text);
    }
  });

  page.on('response', async (res) => {
    const status = res.status();
    if (status >= 400) {
      const url = res.url();
      const method = res.request().method();
      if (ignoreHttp.some((fn) => (typeof fn === 'function' ? fn({ url, status, method }) : fn.test(url)))) {
        return;
      }
      let body = '';
      try {
        body = (await res.text()).slice(0, 300);
      } catch {
        // ignore
      }
      state.httpErrors.push({ method, status, url, body });
    }
  });

  return {
    state,
    clear() {
      state.pageErrors.length = 0;
      state.consoleErrors.length = 0;
      state.httpErrors.length = 0;
    },
    assertClean(label = 'flow') {
      const issues = [];
      if (state.pageErrors.length) {
        issues.push(`pageErrors (${state.pageErrors.length}):\n  - ${state.pageErrors.join('\n  - ')}`);
      }
      if (state.consoleErrors.length) {
        issues.push(`consoleErrors (${state.consoleErrors.length}):\n  - ${state.consoleErrors.join('\n  - ')}`);
      }
      if (state.httpErrors.length) {
        issues.push(
          `httpErrors (${state.httpErrors.length}):\n  - ${state.httpErrors
            .map((e) => `${e.method} ${e.status} ${e.url} :: ${e.body}`)
            .join('\n  - ')}`,
        );
      }
      if (issues.length) {
        throw new Error(`[${label}] Monitor detected errors:\n${issues.join('\n')}`);
      }
    },
  };
}

export function assert(cond, msg) {
  if (!cond) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

export async function waitForIdle(page, ms = 700) {
  try {
    await page.waitForLoadState('networkidle', { timeout: 6000 });
  } catch {
    // SSE or polling may prevent strict networkidle
  }
  if (ms > 0) await page.waitForTimeout(ms);
}

export async function loginAdminWeb(page, { email, password }) {
  await page.goto(`${URLS.ADMIN}/login`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  // Ensure Next.js client hydration has attached before filling controlled inputs
  await page.waitForTimeout(450);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 25000 }),
    page.click('button[type="submit"]'),
  ]);
  await waitForIdle(page, 900);
}

export async function loginMobileWeb(page, { email, password }) {
  await page.goto(URLS.MOBILE, { waitUntil: 'domcontentloaded', timeout: 30000 });
  // Wait for either Login inputs or already-authenticated Visits tab
  await page.waitForFunction(
    () => {
      const text = document.body.innerText || '';
      const hasInput = document.querySelectorAll('input').length >= 2;
      return hasInput || text.includes('Operations') || text.includes('Sign In') || text.includes('SIGN IN');
    },
    { timeout: 30000 },
  );

  // If already logged in, return immediately
  const bodyNow = await page.evaluate(() => document.body.innerText || '');
  if (bodyNow.includes('Operations') && bodyNow.includes('Directory')) {
    await waitForIdle(page, 800);
    return;
  }

  const inputs = page.locator('input');
  await inputs.nth(0).fill(email);
  await inputs.nth(1).fill(password);

  // Click Sign In button
  const signInBtn = page.getByText(/sign in|login/i).last();
  await signInBtn.click();

  await page.waitForFunction(
    () => {
      const text = document.body.innerText || '';
      return text.includes('Operations') && text.includes('Directory');
    },
    { timeout: 25000 },
  );
  await waitForIdle(page, 1000);
}

export async function apiLogin({ email, password }) {
  const res = await fetch(`${URLS.API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`API login failed for ${email}: ${res.status} ${JSON.stringify(json)}`);
  }
  return json.data || json;
}

export function stepLog(flow, msg) {
  console.log(`[${flow}] PASS: ${msg}`);
}
