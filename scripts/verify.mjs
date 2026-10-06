/**
 * Asks a running DeepSeek Harness whether it mounted this plugin.
 *
 * Plugin bundles are served from a public route whose URL carries a revision
 * derived from the bundle's filesystem metadata, so a mount can be confirmed
 * without a browser session and without credentials:
 *
 *   MOUNTED      the harness published the bundle — the row is mounted and the
 *                theme is live (reload the GUI page if it still looks unchanged)
 *   NOT MOUNTED  the row is not mounted yet. A profile composes at startup, so
 *                restart DeepSeek Harness after installing.
 *
 * Usage: node scripts/verify.mjs [--url http://127.0.0.1:19387]
 */
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const flag = process.argv.indexOf('--url');
const base = (flag >= 0 ? process.argv[flag + 1] : process.env.DSH_WEB_URL ?? 'http://127.0.0.1:19387').replace(/\/+$/, '');

const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const clientPath = join(root, 'lib', 'client.js');

/**
 * Mirror of @deepseek-ai/dsh-client-modules `artifactRevision()`: a sha1 over the
 * bundle's metadata, truncated to 12 hex characters. DSH keys the served bundle
 * URL on it, so a stale revision means the harness has not rescanned.
 * @param {string} path absolute bundle path
 * @returns {Promise<string>} the revision
 */
async function artifactRevision(path) {
  const info = await stat(path);
  const parts = [String(info.mtimeMs), String(info.ctimeMs), String(info.size)];
  const hash = createHash('sha1').update('plugin-artifact').update('\0');
  for (const part of parts) hash.update(`${Buffer.byteLength(part)}:`).update(part);
  return hash.digest('hex').slice(0, 12);
}

const revision = await artifactRevision(clientPath);
const url = `${base}/plugins/??${manifest.name}/client.js&rev=${revision}`;

console.log(`harness : ${base}`);
console.log(`plugin  : ${manifest.name}`);
console.log(`revision: ${revision}`);
console.log(`probe   : ${url}`);
console.log('');

let response;
try {
  response = await fetch(url, { signal: AbortSignal.timeout(20000) });
} catch (error) {
  console.log(`NOT MOUNTED - could not reach the harness (${error.message}).`);
  console.log('Check that DeepSeek Harness is running and that --url points at it.');
  process.exit(1);
}

if (response.status !== 200) {
  console.log(`NOT MOUNTED - the harness answered HTTP ${response.status} for this bundle.`);
  console.log('A profile composes at startup: restart DeepSeek Harness, then run this again.');
  process.exit(1);
}

const body = await response.text();
if (!body.includes(manifest.name)) {
  console.log('NOT MOUNTED - the route answered, but not with this bundle.');
  process.exit(1);
}

console.log(`MOUNTED - bundle served (${body.length} bytes).`);
console.log('If the GUI still looks unchanged, reload the page. Settings -> Appearance still switches light/dark/system.');
