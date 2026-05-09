// src/integrations/supabase/client.ts

import { createClient } from '@supabase/supabase-js';
import { debugError, isDebug } from '@/lib/debug';

/** Project URL — replace when pointing at another Supabase project. */
const SUPABASE_URL = 'https://yoztfkxjyqoctrauuwow.supabase.co';

/**
 * Public anon key (browser-safe). RLS still applies.
 * Never put the service_role key in frontend code.
 */
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvenRma3hqeXFvY3RyYXV1d293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNzgyMzEsImV4cCI6MjA5Mzg1NDIzMX0.TNbkzSjcbDcTynrVj-d5e9Xh9XRhVAaEmX7RvvLd1ZE';

/**
 * `fetchWithAuth` skips setting `apikey` when an empty header exists.
 * Ensure a non-blank `apikey` before each request.
 */
function fetchWithMandatoryApikey(anonKey: string): typeof fetch {
  const base = fetch.bind(globalThis);

  return async (input, init) => {
    const headers = new Headers(init?.headers);
    const current = headers.get('apikey')?.trim();
    if (!current) {
      headers.set('apikey', anonKey);
    }
    const res = await base(input, { ...init, headers });

    if (isDebug() && !res.ok) {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof Request
            ? input.url
            : String(input);
      const host = (() => {
        try {
          return new URL(url, SUPABASE_URL).hostname;
        } catch {
          return '';
        }
      })();
      const looksLikeSupabase =
        host.endsWith('supabase.co') ||
        host === '127.0.0.1' ||
        host === 'localhost';

      if (looksLikeSupabase && res.status >= 400) {
        const body = await res
          .clone()
          .text()
          .catch(() => '(could not read body)');
        debugError('supabase.fetch', `HTTP ${res.status} ${res.statusText}`, undefined, {
          url,
          bodyPreview: body.slice(0, 800),
        });
      }
    }

    return res;
  };
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    fetch: fetchWithMandatoryApikey(SUPABASE_ANON_KEY),
    headers: {
      apikey: SUPABASE_ANON_KEY,
    },
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export default supabase;
