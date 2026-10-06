/**
 * Captures README figures from a running Harness GUI.
 *
 * Why this exists: the figures in `docs/` are screenshots of a real GUI, and a
 * screenshot of a *personal* harness home leaks whatever the sidebar, session
 * title and account row contain — workspace directory names, a partially masked
 * phone number, the local user name. Those are pixel data, so no text scan can
 * catch them. Capture from a throwaway home instead, so there is nothing to leak.
 *
 * Isolated-home recipe (PowerShell), then boot it and pass its URL here:
 *
 *   $clean = Join-Path $env:TEMP 'dsh-cleanhome'
 *   New-Item -ItemType Directory -Force -Path "$clean\profiles\web\node_modules" | Out-Null
 *   # 1. package.json: the profile's bundles plus this plugin, e.g.
 *   #    { "dsh": { "profile": { "bundles": ["@deepseek-ai/dsh-base",
 *   #      "@deepseek-ai/dsh-web-app", "dsh-plugin-claude-theme"] } } }
 *   # 2. cordis.yml: an empty entry list, "[]"
 *   # 3. cordis.patch.yml: pin the palette, e.g.
 *   #    - id: ui-theme
 *   #      name: '@deepseek-ai/dsh-client-ui-theme'
 *   #      config: { preference: light }
 *   New-Item -ItemType Junction `
 *     -Path "$clean\profiles\web\node_modules\dsh-plugin-claude-theme" `
 *     -Target (Resolve-Path .).Path | Out-Null
 *   $env:DSH_HOME = $clean
 *   dsh --profile web --no-open --port 8097          # prints the tokenised URL
 *
 * Then start Chrome against that URL and capture it. Chrome must already expose
 * the DevTools protocol:
 *
 *   chrome --headless=new --remote-debugging-port=9222 --user-data-dir=$env:TEMP\chrome-cdp about:blank
 *   node scripts/capture-figures.mjs --url "<url from dsh web>" --out docs/gui-light.png
 *
 * The script waits for the page to settle, steps through first-run dialogs the way
 * a user would (choosing "configure later" over "save and continue", so nothing is
 * configured), and only then captures. Before publishing a figure, look at it.
 *
 * Usage: node scripts/capture-figures.mjs --url <url> --out <path> [--settle ms] [--size WxH]
 */
import { writeFileSync } from 'node:fs';

/** Read `--name value` pairs. */
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) args[key] = true;
    else { args[key] = next; i += 1; }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const url = args.url;
const out = args.out;
if (typeof url !== 'string' || typeof out !== 'string') {
  console.error('usage: node scripts/capture-figures.mjs --url <url> --out <path> [--settle ms] [--size WxH]');
  process.exit(1);
}
const settleMs = Number(args.settle ?? 5000);
const [width, height] = String(args.size ?? '1600x1000').split('x').map(Number);
const port = process.env.CDP_PORT ?? '9222';

/** Poll the DevTools HTTP endpoint until a page target appears. */
async function findTarget() {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) return page;
    } catch {
      /* Chrome is not listening yet. */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`no DevTools page target on port ${port}; start Chrome with --remote-debugging-port=${port}`);
}

const target = await findTarget();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true });
  ws.addEventListener('error', reject, { once: true });
});

let nextId = 1;
const pending = new Map();
const events = new Map();
ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id !== undefined) {
    const entry = pending.get(msg.id);
    if (!entry) return;
    pending.delete(msg.id);
    if (msg.error) entry.reject(new Error(JSON.stringify(msg.error)));
    else entry.resolve(msg.result);
    return;
  }
  const waiters = events.get(msg.method);
  if (waiters) {
    events.delete(msg.method);
    for (const waiter of waiters) waiter(msg.params);
  }
});

const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

const waitFor = (method) =>
  new Promise((resolve) => {
    if (!events.has(method)) events.set(method, []);
    events.get(method).push(resolve);
  });

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });

const loaded = waitFor('Page.loadEventFired');
await send('Page.navigate', { url });
await Promise.race([loaded, new Promise((r) => setTimeout(r, 15000))]);

// The app fetches settings after load and renders late UI (palette, dialogs) from them.
await new Promise((r) => setTimeout(r, settleMs));

/** Prefer the dismissive choice so a step-through never configures anything. */
const DISMISS = `(() => {
  const priority = [
    /^(稍后配置|稍后再说|稍后|Skip|Later|Not now|Decide later)$/,
    /^(继续|Continue|Got it|OK|确认|知道了)$/,
  ];
  const buttons = [...document.querySelectorAll('button')];
  for (const pattern of priority) {
    const button = buttons.find((b) => pattern.test((b.textContent || '').trim()));
    if (button) { button.click(); return 'clicked ' + JSON.stringify(button.textContent.trim()); }
  }
  return 'nothing to dismiss';
})()`;

for (let round = 0; round < 5; round += 1) {
  const result = await send('Runtime.evaluate', { returnByValue: true, expression: DISMISS });
  const value = result.result?.value ?? '(no result)';
  console.log(`dismiss ${round + 1}: ${value}`);
  await new Promise((r) => setTimeout(r, 1200));
  if (value === 'nothing to dismiss') break;
}

const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
const png = Buffer.from(data, 'base64');
writeFileSync(out, png);
console.log(`captured ${out} (${png.length} bytes, ${width}x${height})`);
console.log('Inspect it before publishing: a personal harness home leaks sidebar and account data.');
ws.close();
