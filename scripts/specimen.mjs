/**
 * Renders a typography specimen from `tokens.mjs` into `docs/specimen.html`.
 *
 * The page declares exactly the custom properties the plugin publishes on
 * `<body>` and consumes them the way the shipped DSH stylesheets do
 * (`.markdown { font: var(--dsw-font-markdown-base) }`), so the specimen shows
 * what the faces actually resolve to on this machine — including which fallback
 * wins when Anthropic Serif / Tiempos are absent.
 *
 * Usage: node scripts/specimen.mjs    then open docs/specimen.html
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { CLAUDE_TOKENS, FONTS, ACCENT } from '../tokens.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

/** `--token: value;` lines for one palette, plus the content-size axis the shorthands read. */
function declarations(mode) {
  const lines = Object.entries(CLAUDE_TOKENS).map(([name, pair]) => `  ${name}: ${pair[mode]};`);
  lines.push('  --dsh-content-font-size: 14px;');
  lines.push('  --dsh-content-font-delta: 0px;');
  lines.push('  --dsh-content-font-size-secondary: 13px;');
  lines.push('  --dsh-content-font-delta-secondary: 0px;');
  return lines.join('\n');
}

const styles = `* { box-sizing: border-box; }
body { margin: 0; font-family: ${FONTS.sans}; display: flex; align-items: stretch; }
.panel { flex: 1; padding: 26px 30px; min-height: 100vh;
         background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); }

.light {
${declarations('light')}
}

.dark {
${declarations('dark')}
}

.panel h1 { font-size: 14px; font-weight: 500; letter-spacing: .05em; text-transform: uppercase;
            color: var(--dsw-alias-label-tertiary); margin: 0 0 20px;
            border-bottom: .5px solid var(--dsw-alias-border-l2); padding-bottom: 10px; }
.panel h2 { font: var(--dsw-font-markdown-h2); margin: 20px 0 10px; }
.label { font: 11px/16px var(--dsw-font-family); letter-spacing: .06em; text-transform: uppercase;
         margin: 18px 0 6px; color: var(--dsw-alias-label-tertiary); }
.label code { font: 11px var(--ds-font-family-code); text-transform: none; letter-spacing: 0;
              background: var(--dsw-alias-markdown-inline-code); padding: 1px 5px; border-radius: 4px; }
.ui { font: 14px/22px var(--dsw-font-family); margin: 0; }
.prose { font: var(--dsw-font-markdown-base); margin: 0; }
.secondary { color: var(--dsw-alias-label-secondary); }
.tertiary { color: var(--dsw-alias-label-tertiary); }
.markdown { font: var(--dsw-font-markdown-base); }
.markdown p { margin: 11px 0; }
.markdown ul { margin: 11px 0; padding-left: 22px; }
.markdown code { font: var(--dsw-font-markdown-code); background: var(--dsw-alias-markdown-inline-code);
                 padding: 1px 5px; border-radius: 4px; }
.markdown pre { background: var(--dsw-alias-markdown-code-block); border-radius: 8px;
                padding: 12px 14px; margin: 11px 0; overflow: hidden; }
.markdown pre code { font: var(--dsw-font-markdown-code-block); background: none; padding: 0; }
.markdown table { border-collapse: collapse; width: 100%; font: var(--dsw-font-markdown-table); }
.markdown th { font: var(--dsw-font-markdown-table-head); text-align: left; }
.markdown th, .markdown td { border-bottom: .5px solid var(--dsw-alias-border-l2); padding: 6px 8px; }
.sample::after { content: "The quick brown fox jumps over the lazy dog — 0123456789"; }`;

const panel = (mode, title) => `
  <section class="panel ${mode}">
    <h1>${title}</h1>

    <p class="label">UI / sans · <code>--dsw-font-family</code></p>
    <p class="ui">Chrome keeps the UI face: <strong>strong</strong>, <em>emphasis</em>,
      <span class="secondary">secondary</span>, <span class="tertiary">tertiary</span>.</p>
    <p class="ui sample"></p>

    <p class="label">Transcript / editorial · <code>--dsw-font-markdown-base</code></p>
    <div class="markdown">
      <h2>Markdown h2 in the transcript face</h2>
      <p>Assistant prose is the one place Claude switches voice. Headings, paragraphs, lists and
      tables inherit the same editorial family, while sizes and line-heights stay on DSH's shipped
      scale so nothing reflows. Inline <code>--dsw-alias-*</code> names stay in mono.</p>
      <ul><li>List item in the prose face</li><li>Second item</li></ul>
      <table>
        <thead><tr><th>Token</th><th>Role</th></tr></thead>
        <tbody>
          <tr><td>--dsw-alias-bg-base</td><td>page canvas</td></tr>
          <tr><td>--dsw-alias-brand-primary</td><td>solid accent</td></tr>
        </tbody>
      </table>
      <pre><code>const accent = '${ACCENT.brand}'; // brand accent</code></pre>
    </div>
    <p class="label">Transcript sample</p>
    <p class="prose sample"></p>
  </section>`;

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>dsh-plugin-claude-theme — typography specimen</title>
<style>
${styles}
</style></head>
<body>
${panel('light', 'Claude light')}
${panel('dark', 'Claude dark')}
</body></html>
`;

await mkdir(join(root, 'docs'), { recursive: true });
await writeFile(join(root, 'docs', 'specimen.html'), html);
console.log(`docs/specimen.html written: ${html.length} bytes`);
console.log(`sans : ${FONTS.sans}`);
console.log(`serif: ${FONTS.serif}`);
