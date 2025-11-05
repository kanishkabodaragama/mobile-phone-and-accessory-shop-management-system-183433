import { createClient } from '@supabase/supabase-js';

/**
 * PUBLIC_INTERFACE
 * getSupabaseClient
 * Returns a singleton Supabase client instance configured using environment variables:
 * - REACT_APP_SUPABASE_URL
 * - REACT_APP_SUPABASE_KEY
 *
 * Note: Ensure these variables are provided in the environment (.env). Do not commit secrets.
 */
// PUBLIC_INTERFACE
export function getSupabaseClient() {
  /** This is a public function. Initializes and returns a Supabase client or throws a clear error if env vars are missing. */
  const url = process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.REACT_APP_SUPABASE_KEY;

  if (!url || !key) {
    // Provide a clear error for developers; avoid hard-coding secrets.
    // We throw here to surface misconfiguration during development/build.
    throw new Error(
      'Supabase configuration missing. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY in the environment.'
    );
  }

  // Store client on window.__SUPABASE_CLIENT to keep a single instance across hot reloads.
  if (!window.__SUPABASE_CLIENT) {
    window.__SUPABASE_CLIENT = createClient(url, key);
  }
  return window.__SUPABASE_CLIENT;
}

export default getSupabaseClient;
