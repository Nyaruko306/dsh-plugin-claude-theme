/**
 * Browser half of the Claude theme plugin.
 *
 * Build template — `scripts/build.mjs` inlines the plugin id and the token table
 * from `tokens.mjs` and writes the result to `lib/client.js`. The DSH module
 * system loads client bundles as factory-registered CJS, so the file is a single
 * `window.__ModuleLoader__.load({...})` call: running it only registers a
 * factory, and the body below executes at materialization.
 */

/** Identity of this override layer. `overrideTokens` keys layers by source. */
const PLUGIN_ID = __PLUGIN_ID__;

/** Complete `--dsw-*` override layer: `{ token: { light, dark } }`. */
const TOKENS = __TOKENS__;

/**
 * Required services. `theme` is provided by `@deepseek-ai/dsh-client-ui-theme`;
 * declaring it parks this plugin until that provider is live and unloads it if
 * the provider goes away.
 */
const inject = ['theme'];

/**
 * Plugin body: stack the Claude token layer over whatever built-in palette the
 * user selected. Stacking instead of replacing keeps Settings → Appearance
 * meaningful — light/dark/system still work, and each resolves to Claude's own
 * light or dark values.
 * @param ctx - client plugin context.
 */
function apply(ctx) {
  ctx.effect(
    () => ctx.theme.overrideTokens(PLUGIN_ID, TOKENS),
    'theme-claude: palette and typography override layer',
  );
}

exports.apply = apply;
exports.inject = inject;
