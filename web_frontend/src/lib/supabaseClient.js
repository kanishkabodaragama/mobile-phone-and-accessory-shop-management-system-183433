import { createClient } from '@supabase/supabase-js';

/**
 * PUBLIC_INTERFACE
 * getSupabaseClient
 * Returns a singleton Supabase client instance configured using environment variables:
 * - REACT_APP_SUPABASE_URL
 * - REACT_APP_SUPABASE_KEY
 *
 * Behavior:
 * - Throws an Error if variables are missing; API helpers catch this and return graceful fallbacks.
 * - Uses a single instance cached on window.__SUPABASE_CLIENT to survive hot reloads.
 *
 * Security:
 * - Do not commit secrets. Set values in .env (mapped in CI/CD).
 */
// PUBLIC_INTERFACE
export function getSupabaseClient() {
  /** This is a public function. Initializes and returns a Supabase client or throws a clear error if env vars are missing. */
  const url = process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.REACT_APP_SUPABASE_KEY;

  if (!url || !key) {
    throw new Error(
      'Supabase configuration missing. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY in the environment.'
    );
  }

  if (!window.__SUPABASE_CLIENT) {
    window.__SUPABASE_CLIENT = createClient(url, key);
  }
  return window.__SUPABASE_CLIENT;
}

export default getSupabaseClient;
