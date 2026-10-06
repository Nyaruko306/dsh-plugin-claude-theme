# Changelog

## 1.0.0

First public release.

### Added

- **Palette** — 202 DSH theme tokens re-tinted to Claude's published values: warm ivory canvas
  (`#FAF9F5` / `#141413`), `#F5F4ED` / `#262624` sidebar, `#FFFFFF` / `#30302E` raised surfaces,
  ink-warm hairlines, and the terracotta accent (`#D97757` brand, `#C6613F` solid primary action).
- **Typography** — Anthropic Sans UI stack, Anthropic Serif / Tiempos editorial stack for the
  transcript, Anthropic Mono for code. The 14 markdown shorthands are restated with DSH's shipped
  size and line-height formulas so nothing reflows.
- **`serifResponses`** — row option; `false` renders the transcript in the UI face instead.
- **Theme-layer integration** — one `ctx.theme.overrideTokens` layer, so Settings → Appearance →
  Light / Dark / System keeps working and each choice resolves to Claude's own palette.
- **Bundle packaging** — `dsh.bundle.patch` plus a `dsh.client` web bundle, so
  `dsh plugin --profile <profile> add dsh-plugin-claude-theme` is the whole installation.
- **Display metadata** — `locale/en.json`, `locale/zh.json` and `assets/icon.svg` for the Plugins page.
- **Tooling** — `scripts/build.mjs` (single source of truth for the token table), `scripts/check.mjs`
  (self-consistency gate, CI), `scripts/verify.mjs` (cross-platform mount probe) and
  `scripts/specimen.mjs` (typography specimen).
