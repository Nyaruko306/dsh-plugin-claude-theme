/**
 * Host half of the Claude theme plugin.
 *
 * The browser half owns the palette; this half carries the one setting that
 * cannot be expressed as a CSS token and resolves it before the shell boots.
 *
 * `serifResponses` decides whether the assistant's prose uses Claude's
 * editorial serif face. The choice reaches the browser as a `--dcl-prose-font`
 * body variable, which the browser half's markdown shorthands read with a
 * serif fallback, so nothing has to be rebuilt to switch faces.
 *
 * The injected row is appended, never prepended, so this plugin can only ever
 * restate a decision the theme plugin already made.
 */
import z from '@deepseek-ai/schemastery';
import { FONTS, PROSE_FONT_VAR } from '../tokens.mjs';

/** Live plugin configuration, declared in the profile row as `config:`. */
export const Config = z.object({
  /**
   * Render assistant prose in the editorial serif face (Claude's transcript
   * voice). Set `false` to keep the whole UI in the single sans face.
   */
  serifResponses: z.boolean().default(true),
});

/**
 * Body script pinning the prose face for the session.
 *
 * Runs before the application scripts, exactly like the theme plugin's own
 * bootstrap: the browser half reads `--dcl-prose-font` with a serif fallback,
 * so writing the variable on `body` is enough to switch faces.
 * @returns the script text that selects the UI face for markdown prose.
 */
function sansProseScript() {
  return (
    'document.body.style.setProperty(' +
    `${JSON.stringify(PROSE_FONT_VAR)}, ${JSON.stringify(FONTS.sans)})`
  );
}

/**
 * Plugin body.
 * @param ctx - host plugin context.
 * @param config - validated plugin configuration (plain values, not refs).
 */
export function apply(ctx, config) {
  if (config?.serifResponses !== false) return;
  ctx.on('webserver/index-inject', (table) => {
    table.push({ kind: 'script', placement: 'body', text: sansProseScript() });
  });
}
