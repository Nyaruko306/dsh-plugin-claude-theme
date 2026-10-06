/**
 * Self-consistency gate for this bundle. Runs in CI and before publishing.
 *
 * It answers one question: could DSH actually install and mount what is
 * committed? That means the manifest, the bundle patch, the registered browser
 * factory id, the display metadata, the icon and the README install command must
 * all agree, and the committed browser bundle must be the one `tokens.mjs`
 * produces.
 *
 * Optional, higher-value check: when a DSH installation's theme stylesheets are
 * reachable, every token name is verified against the names DSH declares, so a
 * typo cannot silently become a no-op token. Point at them with
 * `--sheets <dir>` or `DSH_THEME_SHEETS`.
 *
 * Usage: node scripts/check.mjs [--sheets <dir>]
 */
import { readFile, readdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, sep } from 'node:path';
import vm from 'node:vm';

import { CLAUDE_TOKENS, assertTokenTable } from '../tokens.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const findings = [];
const notices = [];

/** Record a failure. */
function fail(message) {
  findings.push(message);
}
/** Record a pass (only used for the summary count). */
let passes = 0;
function assert(condition, message) {
  if (condition) passes++;
  else fail(message);
  return condition;
}
/** Read a package-relative file, recording a failure instead of throwing. */
async function readIfPresent(relative) {
  try {
    return await readFile(join(root, relative), 'utf8');
  } catch {
    fail(`missing file: ${relative}`);
    return undefined;
  }
}
/** Whether a package-relative path exists. */
async function exists(relative) {
  try {
    await access(join(root, relative));
    return true;
  } catch {
    return false;
  }
}

// ── manifest ────────────────────────────────────────────────────────────────
const manifestText = await readIfPresent('package.json');
const manifest = manifestText === undefined ? {} : JSON.parse(manifestText);
const name = manifest.name;

assert(typeof name === 'string' && name.length > 0, 'package.json: name is required');
assert(manifest.private !== true, 'package.json: private must be omitted or false to be installable from a registry');
assert(typeof manifest.version === 'string' && /^\d+\.\d+\.\d+/.test(manifest.version), 'package.json: version must be semver');
assert(manifest.type === 'module', 'package.json: type must be "module"');
assert(typeof manifest.license === 'string', 'package.json: license is required');
assert(typeof manifest.description === 'string' && manifest.description.length > 20, 'package.json: description is required');
assert(typeof manifest.repository?.url === 'string', 'package.json: repository.url is required');

assert(manifest.dsh?.bundle?.patch !== undefined, 'package.json: dsh.bundle.patch is required — without it DSH installs a plain dependency and never mounts a row');
assert(manifest.dsh?.client?.platform === 'web', 'package.json: dsh.client.platform must be "web"');
assert(Array.isArray(manifest.dsh?.client?.inject), 'package.json: dsh.client.inject must list the theme provider');
assert(
  manifest.exports?.['./client'] !== undefined,
  'package.json: exports["./client"] is required — client-modules resolves the browser bundle through it',
);
assert(manifest.exports?.['./package.json'] !== undefined, 'package.json: exports["./package.json"] is required for display metadata');
assert(
  manifest.exports?.['./locale/*.json'] !== undefined,
  'package.json: exports["./locale/*.json"] is required — DSH resolves locale/<lang>.json through exports',
);

// The compatibility gate fails the whole bundle when a declared @deepseek-ai/dsh*
// peer misses the runtime, so this package must not declare one.
const gatedPeers = Object.keys(manifest.peerDependencies ?? {}).filter(
  (peer) => peer === '@deepseek-ai/dsh' || peer.startsWith('@deepseek-ai/dsh-'),
);
assert(gatedPeers.length === 0, `package.json: do not declare gated peers (${gatedPeers.join(', ')}); a range miss silently skips the bundle`);

// ── token table ─────────────────────────────────────────────────────────────
const problems = assertTokenTable();
assert(problems.length === 0, `tokens.mjs: ${problems.join('; ')}`);

// ── browser bundle ──────────────────────────────────────────────────────────
const bundle = await readIfPresent('lib/client.js');
if (bundle !== undefined) {
  let parsed = true;
  try {
    new vm.Script(bundle, { filename: 'lib/client.js' });
  } catch (error) {
    parsed = false;
    fail(`lib/client.js does not parse: ${error.message}`);
  }
  if (parsed) passes++;
  const id = /id:\s*"([^"]+)"/.exec(bundle)?.[1];
  assert(id === name, `lib/client.js registers factory id ${JSON.stringify(id)} but the package is named ${JSON.stringify(name)}; run "npm run build"`);
  assert(
    bundle.includes('overrideTokens'),
    'lib/client.js does not register a theme override layer; run "npm run build"',
  );
}

// ── bundle patch ────────────────────────────────────────────────────────────
const patchPath = manifest.dsh?.bundle?.patch;
if (typeof patchPath === 'string') {
  const patchText = await readIfPresent(patchPath.replace(/^\.\//, ''));
  if (patchText !== undefined) {
    let parsed;
    try {
      const { load } = await import('js-yaml');
      parsed = load(patchText);
    } catch {
      notices.push('js-yaml is unavailable: the bundle patch was checked structurally only');
    }
    if (parsed !== undefined) {
      const inserts = Array.isArray(parsed) ? parsed.flatMap((entry) => entry?.insert ?? []) : [];
      assert(inserts.length === 1, `${patchPath}: expected exactly one inserted row, found ${inserts.length}`);
      assert(inserts[0]?.name === name, `${patchPath}: the row name must be the package name (${JSON.stringify(inserts[0]?.name)})`);
      assert(typeof inserts[0]?.id === 'string' && inserts[0].id.length > 0, `${patchPath}: the row needs an id`);
    } else {
      assert(/^-\s*insert:/m.test(patchText), `${patchPath}: no top-level "- insert:" list`);
      assert(patchText.includes(`name: ${name}`), `${patchPath}: no row named ${name}`);
      assert(new RegExp(`^\\s*id:\\s*\\S+`, 'm').test(patchText), `${patchPath}: no row id`);
    }
  }
} else {
  fail('package.json: dsh.bundle.patch must be a string path');
}

// ── display metadata and icon ───────────────────────────────────────────────
for (const language of ['en', 'zh']) {
  const relative = `locale/${language}.json`;
  const text = await readIfPresent(relative);
  if (text === undefined) continue;
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    fail(`${relative} is not valid JSON: ${error.message}`);
    continue;
  }
  assert(typeof parsed.title === 'string' && parsed.title.length > 0, `${relative}: title must be a non-empty string`);
  assert(typeof parsed.description === 'string' && parsed.description.length > 0, `${relative}: description must be a non-empty string`);
}

const icon = manifest.icon;
if (typeof icon !== 'string') {
  fail('package.json: icon is required for the Plugins page');
} else {
  const iconRelative = icon.replace(/^\.\//, '');
  const accepted = /\.(svg|png|jpe?g|webp)$/i.test(iconRelative);
  assert(accepted, `icon ${icon}: must be SVG, PNG, JPEG or WebP`);
  if (accepted) {
    try {
      const { stat } = await import('node:fs/promises');
      const info = await stat(join(root, iconRelative));
      assert(info.isFile(), `icon ${icon}: not a regular file`);
      assert(info.size <= 256 * 1024, `icon ${icon}: ${info.size} bytes exceeds DSH's 256 KiB limit`);
      const resolved = resolve(root, iconRelative);
      assert(resolved.startsWith(resolve(root) + sep), `icon ${icon}: must stay inside the package`);
    } catch {
      fail(`icon ${icon}: file not found`);
    }
  }
}

// ── files list covers the manifest's own references ─────────────────────────
const files = Array.isArray(manifest.files) ? manifest.files : [];
/** Whether the npm `files` list would ship a package-relative path. */
function shipped(relative) {
  if (!files.some((entry) => relative === entry || relative.startsWith(entry.replace(/\/$/, '') + '/'))) {
    // npm always ships these regardless of `files`.
    return /^(package\.json|README|LICENSE|CHANGELOG)/i.test(relative);
  }
  return true;
}
for (const relative of ['lib/client.js', 'lib/index.js', 'tokens.mjs', 'cordis.patch.yml', 'assets/icon.svg', 'locale/en.json', 'locale/zh.json']) {
  assert(shipped(relative), `package.json files[] does not ship ${relative}`);
}

// ── README install command ──────────────────────────────────────────────────
const readme = await readIfPresent('README.md');
if (readme !== undefined) {
  assert(
    readme.includes(`add ${name}`),
    `README.md: no install command ends in "add ${name}" — the documented install must name this package`,
  );
  assert(
    /dsh plugin --profile \S+ add /.test(readme) || /pnpm add /.test(readme),
    'README.md: no "dsh plugin --profile <profile> add <pkg>" or "pnpm add <pkg>" command',
  );
  for (const match of readme.matchAll(/\]\((docs\/[^)]+)\)/g)) {
    assert(await exists(match[1]), `README.md references ${match[1]}, which is not in the package`);
  }
}

// ── optional: every token name is one DSH declares ──────────────────────────
const sheetsFlag = process.argv.indexOf('--sheets');
const sheetsDir = sheetsFlag >= 0 ? process.argv[sheetsFlag + 1] : process.env.DSH_THEME_SHEETS;
if (sheetsDir === undefined) {
  notices.push(
    `token-name validation skipped: pass --sheets <dir> or set DSH_THEME_SHEETS to a directory of DSH theme CSS sheets (${Object.keys(CLAUDE_TOKENS).length} names unchecked)`,
  );
} else {
  const declared = new Set();
  for (const entry of await readdir(sheetsDir)) {
    if (!entry.endsWith('.css')) continue;
    const css = await readFile(join(sheetsDir, entry), 'utf8');
    for (const match of css.matchAll(/(--d(?:sw|s)-[a-z0-9-]+)\s*:/g)) declared.add(match[1]);
  }
  assert(declared.size > 0, `--sheets ${sheetsDir}: no DSH theme tokens found`);
  const unknown = Object.keys(CLAUDE_TOKENS).filter((token) => !declared.has(token));
  assert(unknown.length === 0, `tokens.mjs: ${unknown.length} name(s) DSH does not declare: ${unknown.join(', ')}`);
}

// ── report ──────────────────────────────────────────────────────────────────
for (const notice of notices) console.log(`notice: ${notice}`);
if (findings.length === 0) {
  console.log(`check: OK — ${passes} assertions passed, ${Object.keys(CLAUDE_TOKENS).length} theme tokens`);
} else {
  console.error(`check: ${findings.length} problem(s)\n  - ${findings.join('\n  - ')}`);
  process.exit(1);
}
