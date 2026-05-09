// src/integrations/supabase/client.ts

import { createClient } from '@supabase/supabase-js';
import { debugError, isDebug } from '@/lib/debug';

/**
 * Supabase configuration from environment variables
 * VITE_ prefix makes these available in the browser (safe to expose anon key with RLS)
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

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
