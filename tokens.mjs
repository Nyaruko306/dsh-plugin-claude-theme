/**
 * Single source of truth for the "Claude look" applied to the DeepSeek Harness web GUI.
 *
 * Values are taken from Anthropic's own published host-token table (see README
 * "Sources"), cross-checked against community dumps of claude.ai's stylesheet.
 *
 * Every entry is a `{ light, dark }` pair because the DSH theme override layer
 * resolves one value per active colour scheme and rejects bare strings.
 */

/** Anthropic / claude.ai accent family. */
export const ACCENT = Object.freeze({
  /** Official Anthropic brand accent ("Orange: #d97757"). */
  brand: '#D97757',
  /** Brighter accent, used where the dark palette needs more lift. */
  brandBright: '#E0876A',
  /** Solid primary-action fill (claude.ai's live send/primary button). */
  ui: '#C6613F',
  /** Pressed / hover state for the primary fill. */
  uiPressed: '#B0523A',
  /** Tinted accent surface (selected navigation, accent washes). */
  tintLight: '#F7E3DA',
  tintDark: '#4A2A20',
  /** Deep end of the accent ramp. */
  deep: '#8A4130',
});

/**
 * Text stacks.
 *
 * Anthropic Sans / Anthropic Serif / Anthropic Mono are the current (2025-26)
 * brand faces and are not redistributable, so they are requested first and the
 * stack degrades through the previous brand faces (Styrene / Tiempos) into the
 * platform UI and text faces. CJK fallbacks mirror the shipped DSH stack so
 * Chinese and Japanese content keeps rendering with the right metrics.
 */
export const FONTS = Object.freeze({
  sans: [
    '"Anthropic Sans"',
    '"Anthropic Sans Variable"',
    '"Styrene B"',
    '"Styrene A"',
    'system-ui',
    '-apple-system',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    '"PingFang SC"',
    '"Hiragino Sans GB"',
    '"Microsoft YaHei"',
    'sans-serif',
  ].join(', '),
  serif: [
    '"Anthropic Serif"',
    '"Anthropic Serif Variable"',
    '"Tiempos Text"',
    '"Tiempos"',
    'ui-serif',
    'Georgia',
    'Cambria',
    '"Source Serif 4"',
    '"Songti SC"',
    'SimSun',
    'serif',
  ].join(', '),
  mono: [
    'ui-monospace',
    '"Anthropic Mono"',
    '"SF Mono"',
    'SFMono-Regular',
    'Menlo',
    '"Roboto Mono"',
    'Consolas',
    '"Liberation Mono"',
    '"PingFang SC"',
    '"Microsoft YaHei"',
    'monospace',
  ].join(', '),
});

/**
 * Plugin-owned indirection variable for the assistant's prose face.
 *
 * A host half (or any other stylesheet) may define `--dcl-prose-font` on `body`
 * to override the editorial face without touching the token table — set it to
 * {@link FONTS.sans} to render responses in the UI face instead.
 */
export const PROSE_FONT_VAR = '--dcl-prose-font';

/** Warm neutral ramp that replaces DSH's blue-tinted `neutral-bluish` ladder. */
const WARM_LADDER = Object.freeze({
  '00': '#FFFFFF',
  50: '#FAF9F5',
  60: '#F5F4ED',
  75: '#F0EEE6',
  100: '#EBE9E0',
  150: '#E8E6DC',
  200: '#E3E1D7',
  300: '#DAD9D4',
  400: '#B0AEA5',
  500: '#9C9A92',
  600: '#87867F',
  700: '#73726C',
  750: '#5E5D59',
  800: '#3D3D3A',
  850: '#2E2D2B',
  875: '#262624',
  900: '#1F1E1D',
  950: '#141413',
  1000: '#0F0E0D',
});

/** Pure neutral ramp (`neutral-*`, used by scrollbars and inline code). */
const PURE_LADDER = Object.freeze({
  '00': '#FFFFFF',
  50: '#FAF9F5',
  100: '#F5F4ED',
  150: '#F2F0E8',
  200: '#EBE9E0',
  250: '#E3E1D7',
  300: '#DAD9D4',
  400: '#B0AEA5',
  500: '#9C9A92',
  550: '#8F8E86',
  600: '#87867F',
  700: '#55544E',
  800: '#30302E',
  850: '#1F1E1D',
  900: '#141413',
  1000: '#000000',
});

/** Terracotta ramp that replaces DSH's `deepseek` blue accent ladder. */
const ACCENT_LADDER = Object.freeze({
  50: '#FBF1EC',
  100: '#F7E3DA',
  200: '#F0CDBD',
  300: '#E8B39C',
  400: '#E0876A',
  450: '#DD8062',
  500: '#D97757',
  600: '#C6613F',
  '700-delete': '#B0523A',
  800: '#8A4130',
  900: '#6B3226',
});

/** Warm tint ladder replacing the `blue-*` statics. */
const TINT_LADDER = Object.freeze({
  50: '#FBF1EC',
  '50p': '#FBF1EC',
  75: '#F7E7DE',
  100: '#F2D8CB',
  300: '#E8B39C',
  400: '#E0876A',
  450: '#DD8062',
  500: '#D97757',
  600: '#C6613F',
  800: '#8A4130',
  900: '#6B3226',
  950: '#3A1F14',
});

/** Expand one ramp into `{ '--prefix-key': { light, dark } }` entries. */
function expandRamp(prefix, ramp) {
  const out = {};
  for (const [key, value] of Object.entries(ramp)) out[`${prefix}${key}`] = { light: value, dark: value };
  return out;
}

/**
 * Static palettes. DSH declares these identically in both palettes and derives
 * almost every alias from them, so re-tinting the ramps re-tints any alias this
 * table does not name explicitly.
 */
const STATIC_TOKENS = {
  ...expandRamp('--dsw-static-neutral-bluish-', WARM_LADDER),
  ...expandRamp('--dsw-static-neutral-', PURE_LADDER),
  ...expandRamp('--dsw-static-deepseek-', ACCENT_LADDER),
  ...expandRamp('--dsw-static-blue-', TINT_LADDER),
};

/** Semantic alias layer: the app-facing colours the DSH design system publishes. */
const ALIAS_TOKENS = {
  // ── canvas and surfaces ────────────────────────────────────────────────────
  '--dsw-alias-bg-base': { light: '#FAF9F5', dark: '#141413' },
  '--dsw-alias-bg-layer-1': { light: '#FFFFFF', dark: '#30302E' },
  '--dsw-alias-bg-layer-2': { light: '#FFFFFF', dark: '#30302E' },
  '--dsw-alias-bg-layer-3': { light: '#FFFFFF', dark: '#3A3A38' },
  '--dsw-alias-bg-overlay': { light: '#FFFFFF', dark: '#3A3A38' },
  '--dsw-alias-bg-module-platform': { light: '#F5F4ED', dark: '#30302E' },
  '--dsw-alias-bg-multi-select': { light: '#F5F4ED', dark: '#3A3A38' },
  '--dsw-alias-bg-skeleton': { light: 'rgba(31, 30, 29, 0.06)', dark: 'rgba(222, 220, 209, 0.08)' },
  '--dsw-alias-bg-document-preview': { light: '#E8E6DC', dark: '#1F1E1D' },
  '--dsw-alias-label-document-preview': { light: '#3D3D3A', dark: '#C2C0B6' },
  '--dsw-alias-bg-document-selection': {
    light: `color-mix(in srgb, ${ACCENT.brand} 35%, transparent)`,
    dark: `color-mix(in srgb, ${ACCENT.brand} 40%, transparent)`,
  },
  '--dsw-alias-bg-mask-1': { light: 'rgba(20, 20, 19, 0.24)', dark: 'rgba(0, 0, 0, 0.50)' },
  '--dsw-alias-bg-mask-2': { light: 'rgba(20, 20, 19, 0.12)', dark: 'rgba(0, 0, 0, 0.20)' },
  '--dsw-alias-bg-mask-3': { light: 'rgba(20, 20, 19, 0.48)', dark: 'rgba(0, 0, 0, 0.48)' },
  '--dsw-alias-bg-mask-photo': { light: 'rgba(20, 20, 19, 0.88)', dark: 'rgba(0, 0, 0, 0.88)' },
  '--dsw-alias-bg-mask-drop': { light: 'rgba(250, 249, 245, 0.70)', dark: 'rgba(48, 48, 46, 0.70)' },

  // ── hairlines ──────────────────────────────────────────────────────────────
  '--dsw-alias-border-l1': { light: 'rgba(31, 30, 29, 0.08)', dark: 'rgba(222, 220, 209, 0.08)' },
  '--dsw-alias-border-l2': { light: 'rgba(31, 30, 29, 0.16)', dark: 'rgba(222, 220, 209, 0.16)' },
  '--dsw-alias-border-l2-darkmode-thin': { light: 'rgba(31, 30, 29, 0.16)', dark: 'rgba(222, 220, 209, 0.10)' },
  '--dsw-alias-border-l3': { light: 'rgba(31, 30, 29, 0.28)', dark: 'rgba(222, 220, 209, 0.28)' },
  '--dsw-alias-border-l4': { light: 'rgba(31, 30, 29, 0.40)', dark: 'rgba(222, 220, 209, 0.40)' },
  '--dsw-alias-border-inverted': { light: 'transparent', dark: 'rgba(222, 220, 209, 0.10)' },
  '--dsw-alias-border-inverted2': { light: 'transparent', dark: 'rgba(222, 220, 209, 0.14)' },

  // ── brand and accent ───────────────────────────────────────────────────────
  '--dsw-alias-brand-primary': { light: ACCENT.ui, dark: ACCENT.ui },
  '--dsw-alias-brand-primary-invert': { light: '#141413', dark: '#FAF9F5' },
  '--dsw-alias-brand-text': { light: '#141413', dark: '#FAF9F5' },
  '--dsw-alias-brand-primary-new-colorprimary-new-color': { light: ACCENT.brand, dark: ACCENT.brandBright },
  '--dsw-alias-state-business-primary': { light: ACCENT.brand, dark: ACCENT.brandBright },
  '--dsw-alias-state-business-tertiary': { light: ACCENT.tintLight, dark: ACCENT.tintDark },
  '--dsw-alias-link': { light: ACCENT.ui, dark: ACCENT.brandBright },

  // ── text ───────────────────────────────────────────────────────────────────
  '--dsw-alias-label-primary': { light: '#141413', dark: '#FAF9F5' },
  '--dsw-alias-label-primary-dimmed': { light: '#1F1E1D', dark: '#F5F4ED' },
  '--dsw-alias-label-primary-bluish': { light: '#141413', dark: '#FAF9F5' },
  '--dsw-alias-label-primary-foreground': { light: '#FFFFFF', dark: '#FFFFFF' },
  '--dsw-alias-label-primary-inverted': { light: '#FAF9F5', dark: '#30302E' },
  '--dsw-alias-label-secondary': { light: '#3D3D3A', dark: '#C2C0B6' },
  '--dsw-alias-label-tertiary': { light: '#73726C', dark: '#9C9A92' },
  '--dsw-alias-label-caption': { light: '#9C9A92', dark: '#87867F' },
  '--dsw-alias-label-dimmed': { light: '#DEDCD1', dark: '#5E5D59' },
  '--dsw-alias-label-shimmer': {
    light: 'color-mix(in srgb, #141413 30%, transparent)',
    dark: 'color-mix(in srgb, #FAF9F5 45%, transparent)',
  },
  '--dsw-alias-label-deep-diving': {
    light: `color-mix(in srgb, ${ACCENT.brand} 70%, ${ACCENT.tintDark})`,
    dark: `color-mix(in srgb, ${ACCENT.brandBright} 55%, #9C9A92)`,
  },
  '--dsw-alias-label-deep-diving-shimmer': {
    light: `color-mix(in srgb, ${ACCENT.brand} 30%, ${ACCENT.tintDark})`,
    dark: `color-mix(in srgb, ${ACCENT.brandBright} 65%, ${ACCENT.brand})`,
  },

  // ── controls ───────────────────────────────────────────────────────────────
  '--dsw-alias-button-contrast-fill': { light: '#30302E', dark: '#FAF9F5' },
  '--dsw-alias-button-elevated-fill': { light: '#FFFFFF', dark: '#3A3A38' },
  '--dsw-alias-button-floating-fill': { light: '#FFFFFF', dark: '#30302E' },
  '--dsw-alias-button-floating-hover': { light: '#F0EEE6', dark: '#3A3A38' },
  '--dsw-alias-button-ghost-active-border': { light: '#B0AEA5', dark: '#6B6A64' },
  '--dsw-alias-button-ghost-active-fill': { light: '#EBE9E0', dark: '#3A3A38' },
  '--dsw-alias-button-ghost-active-hover': { light: '#F0EEE6', dark: '#45443F' },
  '--dsw-alias-button-info-fill': { light: ACCENT.brand, dark: ACCENT.brand },
  '--dsw-alias-button-info-hover': { light: ACCENT.ui, dark: ACCENT.brandBright },
  '--dsw-alias-button-primary-dimmed': { light: '#F0EEE6', dark: '#3A3A38' },
  '--dsw-alias-button-primary-fill': { light: ACCENT.ui, dark: ACCENT.ui },
  '--dsw-alias-button-primary-hover': { light: ACCENT.uiPressed, dark: ACCENT.brand },
  '--dsw-alias-button-tool-bar-fill': { light: 'rgba(48, 48, 46, 0.50)', dark: 'rgba(48, 48, 46, 0.50)' },
  '--dsw-alias-button-tool-bar-fill-invisible': { light: 'rgba(31, 31, 31, 0.36)', dark: 'rgba(31, 31, 31, 0.36)' },
  '--dsw-alias-button-tool-bar-hover': { light: 'rgba(48, 48, 46, 0.60)', dark: 'rgba(48, 48, 46, 0.60)' },
  '--dsw-alias-interactive-bg-hover': { light: 'rgba(31, 30, 29, 0.05)', dark: 'rgba(222, 220, 209, 0.08)' },
  '--dsw-alias-interactive-bg-hover-solid': { light: '#F0EEE6', dark: '#30302E' },
  '--dsw-alias-interactive-bg-hover-accent': {
    light: 'rgba(217, 119, 87, 0.14)',
    dark: 'rgba(224, 135, 106, 0.24)',
  },
  '--dsw-alias-interactive-bg-hover-danger': { light: 'rgba(180, 35, 31, 0.05)', dark: 'rgba(232, 140, 130, 0.16)' },
  '--dsw-alias-interactive-bg-active': { light: 'rgba(31, 30, 29, 0.10)', dark: 'rgba(222, 220, 209, 0.14)' },

  // ── floating surfaces ──────────────────────────────────────────────────────
  '--dsw-menu-surface-fill': { light: 'rgba(250, 249, 245, 0.94)', dark: 'rgba(48, 48, 46, 0.45)' },
  '--dsw-alias-menu-group-header-fill': { light: 'rgba(250, 249, 245, 0.94)', dark: 'rgba(38, 38, 36, 0.94)' },
  '--dsw-specific-menu': { light: 'rgba(250, 249, 245, 0.94)', dark: 'rgba(38, 38, 36, 0.94)' },
  '--dsw-alias-menu-icon': { light: '#3D3D3A', dark: '#F5F4ED' },
  '--dsw-alias-tooltip-bg': { light: '#262624', dark: '#30302E' },
  '--dsw-alias-tooltip-key-bg': {
    light: 'color-mix(in srgb, #262624, white 18%)',
    dark: 'color-mix(in srgb, #30302E, white 18%)',
  },
  '--dsw-alias-toast-bg': { light: '#30302E', dark: '#3A3A38' },
  '--dsw-alias-toast-label': { light: '#FAF9F5', dark: '#FAF9F5' },
  '--dsw-alias-switch-thumb': { light: '#FFFFFF', dark: '#9C9A92' },
  '--dsw-alias-turn-trigger-bg': { light: '#F5F4ED', dark: 'rgba(222, 220, 209, 0.08)' },
  '--dsw-alias-turn-trigger-bg-hover': { light: 'rgba(31, 30, 29, 0.05)', dark: 'rgba(222, 220, 209, 0.14)' },

  // ── markdown ───────────────────────────────────────────────────────────────
  '--dsw-alias-markdown-code-block': { light: '#F5F4ED', dark: '#1F1E1D' },
  '--dsw-alias-markdown-code-block-banner': { light: '#F0EEE6', dark: '#262624' },
  '--dsw-alias-markdown-code-segment-selected': { light: '#FFFFFF', dark: '#30302E' },
  '--dsw-alias-markdown-code-segment-unselected': { light: '#F5F4ED', dark: '#1F1E1D' },
  '--dsw-alias-markdown-inline-code': { light: '#F0EEE6', dark: '#262624' },
  '--dsw-alias-markdown-citation': { light: '#E8E6DC', dark: '#30302E' },
  '--dsw-alias-markdown-placeholder': { light: '#F5F4ED', dark: '#3A3A38' },
  '--dsw-alias-markdown-tag': { light: '#F0EEE6', dark: '#3A3A38' },

  // ── scrollbars ─────────────────────────────────────────────────────────────
  '--dsw-alias-scrollbar-bg-l1': { light: '#DAD9D4', dark: '#45443F' },
  '--dsw-alias-scrollbar-bg-l2': { light: '#DAD9D4', dark: '#55544E' },
  '--dsw-alias-scrollbar-hover-l1': { light: '#C2C0B6', dark: '#6B6A64' },
  '--dsw-alias-scrollbar-hover-l2': { light: '#C2C0B6', dark: '#6B6A64' },

  // ── semantic states (Anthropic's published success/danger anchors) ─────────
  '--dsw-alias-state-error-primary': { light: '#B4231F', dark: '#E88C82' },
  '--dsw-alias-state-error-secondary': { light: '#D9534F', dark: '#D9534F' },
  '--dsw-alias-state-success-primary': { light: '#265B19', dark: '#7AB948' },
  '--dsw-alias-state-success-secondary': { light: '#3E9B2E', dark: '#4ED17E' },
  '--dsw-alias-state-success-tertiary': { light: '#E8F3E2', dark: '#22381A' },
  '--dsw-alias-state-warn-primary': { light: '#B26A00', dark: '#E0A03A' },
  '--dsw-alias-state-warn-secondary': { light: '#E0A03A', dark: '#F7AD31' },
  '--dsw-alias-state-warn-tertiary': { light: '#FDF3E0', dark: '#3A2E14' },
  '--dsw-alias-state-warn-label': { light: '#8A5A00', dark: '#E0A03A' },
  '--dsw-alias-state-idle-primary': { light: '#DAD9D4', dark: '#55544E' },
  '--dsw-alias-code-diff-added': { light: 'rgba(38, 91, 25, 0.08)', dark: 'rgba(122, 185, 72, 0.12)' },
  '--dsw-alias-code-diff-deleted': { light: 'rgba(180, 35, 31, 0.08)', dark: 'rgba(232, 140, 130, 0.12)' },
  '--dsw-alias-file-diff-added-bg': { light: '#EDF6E7', dark: '#1C2E17' },
  '--dsw-alias-file-diff-added-gutter': { light: '#F5FAF1', dark: '#14230F' },
  '--dsw-alias-file-diff-added-marker': { light: '#3E9B2E', dark: '#7AB948' },
  '--dsw-alias-file-diff-deleted-bg': { light: '#FBEAE7', dark: '#3A1F1C' },
  '--dsw-alias-file-diff-deleted-gutter': { light: '#FDF1EF', dark: '#2A1512' },
  '--dsw-alias-file-diff-deleted-marker': { light: '#B4231F', dark: '#E88C82' },

  // ── conversation specifics ─────────────────────────────────────────────────
  '--dsw-specific-bubble': { light: '#F0EEE6', dark: '#30302E' },
  '--dsw-specific-bubble-highlight': { light: '#E8E6DC', dark: '#3A3A38' },
  '--dsw-specific-input-major': { light: '#FFFFFF', dark: '#30302E' },
  '--dsw-specific-login-input': { light: '#F5F4ED', dark: '#1F1E1D' },
  '--dsw-specific-selector': { light: '#F5F4ED', dark: '#30302E' },
  '--dsw-specific-sidebar-fill': { light: '#F5F4ED', dark: '#262624' },
  '--dsw-specific-sidebar-nav-item-active': { light: '#E8E6DC', dark: '#3A3A38' },
  '--dsw-specific-sidebar-nav-item-active-accent': { light: ACCENT.tintLight, dark: ACCENT.tintDark },
  '--dsw-specific-sidebar-nav-item-hover': { light: '#F0EEE6', dark: '#30302E' },
  '--dsw-specific-tip': { light: '#F5F4ED', dark: '#30302E' },
};

/**
 * Markdown typography composites.
 *
 * DSH expands every markdown face from one `font:` shorthand that ends in
 * `var(--dsw-font-family)`. Restating the shorthand is the only way to give the
 * transcript its own face without touching the UI font, so each value is the
 * shipped shorthand with the trailing family swapped for the prose variable.
 * Sizes, weights and line-height formulas are copied verbatim.
 */
const FONT_FAMILY_TAIL = 'var(--dsw-font-family)';
const PROSE_FAMILY = `var(${PROSE_FONT_VAR}, ${FONTS.serif})`;

const MARKDOWN_SHORTHANDS = {
  '--dsw-font-markdown-base':
    'var(--dsh-content-font-size,14px) / calc(24px + var(--dsh-content-font-delta))',
  '--dsw-font-markdown-base-strong':
    '600 var(--dsh-content-font-size,14px) / calc(24px + var(--dsh-content-font-delta))',
  '--dsw-font-markdown-base-italic':
    'italic var(--dsh-content-font-size,14px) / calc(24px + var(--dsh-content-font-delta))',
  '--dsw-font-markdown-base-strong-italic':
    'italic 600 var(--dsh-content-font-size,14px) / calc(24px + var(--dsh-content-font-delta))',
  '--dsw-font-markdown-h1':
    '700 calc(21px + var(--dsh-content-font-delta)) / calc(30px + var(--dsh-content-font-delta))',
  '--dsw-font-markdown-h2':
    '700 calc(19px + var(--dsh-content-font-delta)) / calc(28px + var(--dsh-content-font-delta))',
  '--dsw-font-markdown-h3':
    '700 calc(18px + var(--dsh-content-font-delta)) / calc(26px + var(--dsh-content-font-delta))',
  '--dsw-font-markdown-h4':
    '600 var(--dsh-content-font-size,14px) / calc(24px + var(--dsh-content-font-delta))',
  '--dsw-font-markdown-table':
    'var(--dsh-content-font-size-secondary,13px)/calc(22px + var(--dsh-content-font-delta-secondary,0px))',
  '--dsw-font-markdown-table-head':
    '500 var(--dsh-content-font-size-secondary,13px)/calc(22px + var(--dsh-content-font-delta-secondary,0px))',
  '--dsw-font-markdown-small': '12px/20px',
  '--dsw-font-markdown-small-strong': '600 12px/20px',
  '--dsw-font-markdown-small-italic': 'italic 12px/20px',
  '--dsw-font-markdown-small-strong-italic': 'italic 600 12px/20px',
};

/** Every markdown shorthand that carries the body family, plus its `-font-family` companion. */
function markdownTokens() {
  const out = {};
  for (const [token, shorthand] of Object.entries(MARKDOWN_SHORTHANDS)) {
    out[token] = { light: `${shorthand} ${PROSE_FAMILY}`, dark: `${shorthand} ${PROSE_FAMILY}` };
    out[`${token}-font-family`] = { light: PROSE_FAMILY, dark: PROSE_FAMILY };
  }
  return out;
}

/** Font stacks, applied in both palettes. */
const FONT_TOKENS = {
  '--dsw-font-family': { light: FONTS.sans, dark: FONTS.sans },
  '--dsw-font-family-brand': { light: FONTS.sans, dark: FONTS.sans },
  '--ds-font-family-code': { light: FONTS.mono, dark: FONTS.mono },
};

/**
 * The complete override layer handed to `ctx.theme.overrideTokens`.
 *
 * Ordering inside the object is irrelevant: CSS custom properties are resolved
 * lazily, so an alias that references `var(--dsw-static-…)` picks up the
 * re-tinted ramp whether or not this table also names the alias.
 */
export const CLAUDE_TOKENS = Object.freeze({
  ...STATIC_TOKENS,
  ...ALIAS_TOKENS,
  ...markdownTokens(),
  ...FONT_TOKENS,
});

/** Sanity check used by the build script: every value must be a `{ light, dark }` string pair. */
export function assertTokenTable(tokens = CLAUDE_TOKENS) {
  const problems = [];
  for (const [name, value] of Object.entries(tokens)) {
    if (!name.startsWith('--')) problems.push(`${name}: not a custom property`);
    if (typeof value !== 'object' || value === null) {
      problems.push(`${name}: value is not an object`);
      continue;
    }
    for (const mode of ['light', 'dark']) {
      if (typeof value[mode] !== 'string' || value[mode].length === 0) {
        problems.push(`${name}: ${mode} is not a non-empty string`);
      }
    }
  }
  return problems;
}
