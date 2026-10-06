/**
 * Generates `lib/client.js` from `src/client.template.js` plus the token table in
 * `tokens.mjs`, so the host half and the browser half can never drift apart.
 *
 * The output is checked for syntax before it is written, and every placeholder
 * must be consumed.
 *
 * Usage: node scripts/build.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

import { CLAUDE_TOKENS, assertTokenTable } from '../tokens.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const template = await readFile(join(root, 'src', 'client.template.js'), 'utf8');

const problems = assertTokenTable();
if (problems.length > 0) {
  console.error('token table is invalid:\n  - ' + problems.join('\n  - '));
  process.exit(1);
}

// The bundle's factory id must equal the package name: DSH resolves the browser
// module by package name, and the loader row in cordis.patch.yml names it too.
if (typeof packageJson.name !== 'string' || packageJson.name.length === 0) {
  throw new Error('package.json has no name');
}
if (packageJson.dsh?.bundle?.patch === undefined) {
  throw new Error('package.json declares no dsh.bundle.patch; the bundle layer is missing');
}

/** One token per line: valid JS object-literal syntax, still diffable by eye. */
function serializeTokens(tokens) {
  const lines = Object.entries(tokens).map(
    ([name, pair]) => `\t${JSON.stringify(name)}: { light: ${JSON.stringify(pair.light)}, dark: ${JSON.stringify(pair.dark)} },`,
  );
  return `{\n${lines.join('\n')}\n}`;
}

const body = template
  .replace('__PLUGIN_ID__', JSON.stringify(packageJson.name))
  .replace('__TOKENS__', () => serializeTokens(CLAUDE_TOKENS));

for (const leftover of ['__PLUGIN_ID__', '__TOKENS__']) {
  if (body.includes(leftover)) throw new Error(`client template placeholder ${leftover} was not substituted`);
}

/** Place the template one level inside the factory, preserving its own layout. */
const indentedBody = body
  .split('\n')
  .map((line) => (line.length > 0 ? `\t\t${line}` : line))
  .join('\n');

const bundle = `window.__ModuleLoader__.load({
\tid: ${JSON.stringify(packageJson.name)},
\tfactory: (require) => {
\t\tvar module = { exports: {} };
\t\tvar exports = module.exports;
\t\tObject.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
${indentedBody}
\t\treturn module.exports;
\t}
});
`;

// Parse before writing so a broken bundle can never reach the module system.
new vm.Script(bundle, { filename: 'lib/client.js' });

await writeFile(join(root, 'lib', 'client.js'), bundle);

console.log(`lib/client.js written: ${Object.keys(CLAUDE_TOKENS).length} tokens, ${bundle.length} bytes`);
