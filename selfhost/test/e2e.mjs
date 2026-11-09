// End-to-end check through the real stack (browser -> tailscale serve -> Caddy -> API -> Postgres/Ollama).
// Run on the server (credentials come from a root-only env file, never printed):
//   docker run --rm --network host --env-file /opt/creator-nexus/selfhost/test-account.env -v /opt/creator-nexus/selfhost/test:/t -w /t \
//     mcr.microsoft.com/playwright:v<ver>-noble sh -c 'npm i -s playwright@<ver> && node e2e.mjs https://<host>'
import { chromium } from 'playwright';
const BASE = process.argv[2];
const { E2E_EMAIL: EMAIL, E2E_PASS: PASS } = process.env;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 160)); });
const step = (s) => console.log(new Date().toISOString().slice(11, 19), s);

await page.goto(BASE + '/time-audit', { waitUntil: 'networkidle' });
step('unauthenticated /time-audit -> ' + new URL(page.url()).pathname);
// Register the test account if it does not exist yet, else log in.
await page.goto(BASE + '/register', { waitUntil: 'networkidle' });
await page.fill('input[type=email]', EMAIL);
const pw = page.locator('input[type=password]');
for (let i = 0; i < await pw.count(); i++) await pw.nth(i).fill(PASS);
await page.click('button[type=submit]'); await page.waitForTimeout(3000);
if (new URL(page.url()).pathname === '/register') {
  step('register said: ' + ((await page.locator('.text-destructive, [role=alert]').allInnerTexts()).join(' | ') || 'n/a') + ' -> logging in');
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
  await page.fill('input[type=email]', EMAIL); await page.fill('input[type=password]', PASS);
  await page.click('button[type=submit]'); await page.waitForTimeout(3000);
}
const me = await page.evaluate(async () => (await fetch('/api/apps/x/entities/User/me', { headers: { Authorization: 'Bearer ' + localStorage.getItem('base44_access_token') } })).json());
step(`signed in as ${me.email} role=${me.role} id=${me.id}`);

// UI CRUD on the Time Audit page.
await page.goto(BASE + '/time-audit', { waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
await page.getByText('Log this half hour').first().click(); await page.waitForTimeout(500);
await page.locator('input[type=text]:visible').first().fill('E2E self-host check ' + new Date().toISOString().slice(0, 16));
await page.getByRole('button', { name: /Save & next/i }).first().click(); await page.waitForTimeout(2000);
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
step('after reload, saved row visible: ' + /E2E self-host check/.test(await page.locator('body').innerText()));
await page.screenshot({ path: '/t/e2e-time-audit.png' });

// InvokeLLM end to end: page -> functions.invoke('ideaFinder') -> Core.InvokeLLM -> Ollama (FRAYMUS-HOME first).
const t0 = Date.now();
const idea = await page.evaluate(async () => {
  const r = await fetch('/api/apps/x/functions/ideaFinder', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('base44_access_token') },
    body: JSON.stringify({ action: 'start', niche: 'solo creators who self-host their AI tools', complaints: 'I lose hours moving apps off paid platforms.', price_usd: 49, buyers: 20, hourly_value: 40 }) });
  return { status: r.status, body: await r.json() };
});
const run = idea.body.run || {};
step(`ideaFinder HTTP ${idea.status} in ${Math.round((Date.now() - t0) / 1000)}s, status=${run.status}, ideas=${(run.ideas || []).length}, first="${(run.ideas || [])[0]?.title || idea.body.error || ''}"`);
const st = await page.evaluate(async () => (await fetch('/api/selfhost/status')).json());
step('last LLM route: ' + JSON.stringify(st.last_llm_route) + ' egress log: ' + JSON.stringify(st.egress.slice(0, 5)));
step('browser errors: ' + JSON.stringify(errors.slice(0, 8)));
await browser.close();
