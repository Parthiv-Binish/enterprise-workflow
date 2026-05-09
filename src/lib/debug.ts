/**
 * Structured diagnostics for Supabase + React Query.
 *
 * Enabled when any of:
 * - `import.meta.env.DEV` (local `npm run dev`)
 * - `VITE_DEBUG=true` in `.env` (production builds too — remove before shipping public builds if noisy)
 * - Browser console: `window.__EW_DEBUG__ = true`
 */

declare global {
  interface Window {
    /** Toggle verbose `[EW:*]` logs without rebuilding */
    __EW_DEBUG__?: boolean;
  }
}

const PREFIX = '[EW]';

export function isDebug(): boolean {
  return (
    import.meta.env.DEV ||
    import.meta.env.VITE_DEBUG === 'true' ||
    (typeof window !== 'undefined' && window.__EW_DEBUG__ === true)
  );
}

export function debugLog(scope: string, ...args: unknown[]): void {
  if (!isDebug()) return;
  console.log(`${PREFIX}[${scope}]`, ...args);
}

/** Serialize Auth / PostgREST / generic errors for the console */
export function serializeError(error: unknown): Record<string, unknown> {
  if (error === null || error === undefined) {
    return { raw: error };
  }
  if (error instanceof Error) {
    const o: Record<string, unknown> = {
      kind: 'Error',
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
    const x = error as Error & {
      status?: number;
      code?: string;
      details?: string;
      hint?: string;
    };
    if (typeof x.status === 'number') o.httpStatus = x.status;
    if (x.code != null) o.code = x.code;
    if (x.details != null) o.details = x.details;
    if (x.hint != null) o.hint = x.hint;
    return o;
  }
  if (typeof error === 'object') {
    return { kind: 'plain-object', payload: { ...(error as Record<string, unknown>) } };
  }
  return { kind: typeof error, raw: error };
}

export function debugError(
  scope: string,
  message: string,
  error?: unknown,
  extra?: Record<string, unknown>
): void {
  if (!isDebug()) return;
  console.error(`${PREFIX}[${scope}] ${message}`, {
    ...extra,
    ...serializeError(error),
  });
}

/** Use after `const { error } = await supabase...` — logs then rethrows */
export function throwIfSupabaseError(
  scope: string,
  operation: string,
  error: unknown,
  context?: Record<string, unknown>
): void {
  if (error == null || error === false) return;
  debugError(scope, operation, error, context);
  throw error;
}
