/**
 * Authentication helper utilities for Supabase auth.
 * These helpers abstract direct calls to the Supabase client for common auth flows.
 */

import getSupabaseClient from '../supabaseClient';

/**
 * PUBLIC_INTERFACE
 * signInWithPassword
 * Sign in a user using email and password via Supabase.
 *
 * @param {Object} params - The sign-in parameters.
 * @param {string} params.email - The user's email address.
 * @param {string} params.password - The user's password.
 * @returns {Promise<{ user: import('@supabase/supabase-js').User | null, session: import('@supabase/supabase-js').Session | null, error: import('@supabase/supabase-js').AuthError | null }>}
 */
// PUBLIC_INTERFACE
export async function signInWithPassword({ email, password }) {
  /** This is a public function. */
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user: data?.user ?? null, session: data?.session ?? null, error };
}

/**
 * PUBLIC_INTERFACE
 * signUpWithPassword
 * Creates a new user using email/password via Supabase.
 *
 * Notes:
 * - If email confirmations are enabled in Supabase, session will be null and a confirmation email is sent.
 * - Uses REACT_APP_SITE_URL environment variable for emailRedirectTo to ensure correct redirect on verification.
 *
 * @param {{ email: string, password: string }} params
 * @returns {Promise<{ data: any, error: import('@supabase/supabase-js').AuthError | null, emailConfirmationSent: boolean }>}
 */
// PUBLIC_INTERFACE
export async function signUpWithPassword({ email, password }) {
  /** This is a public function. */
  const supabase = getSupabaseClient();
  const siteUrl = process.env.REACT_APP_SITE_URL || window.location.origin;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/login`,
    },
  });
  const emailConfirmationSent = !!data?.user && !data?.session;
  return { data, error, emailConfirmationSent };
}

/**
 * PUBLIC_INTERFACE
 * signOut
 * Signs out the current authenticated user.
 *
 * @returns {Promise<{ error: import('@supabase/supabase-js').AuthError | null }>}
 */
// PUBLIC_INTERFACE
export async function signOut() {
  /** This is a public function. */
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * PUBLIC_INTERFACE
 * getCurrentUser
 * Retrieves the current authenticated user from Supabase.
 *
 * @returns {Promise<{ user: import('@supabase/supabase-js').User | null, error: import('@supabase/supabase-js').AuthError | null }>}
 */
// PUBLIC_INTERFACE
export async function getCurrentUser() {
  /** This is a public function. */
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  return { user: data?.user ?? null, error };
}

/**
 * PUBLIC_INTERFACE
 * onAuthStateChange
 * Subscribes to authentication state changes.
 *
 * @param {(event: import('@supabase/supabase-js').AuthChangeEvent, session: import('@supabase/supabase-js').Session | null) => void} callback
 *  Callback invoked for each auth state change.
 * @returns {{ data: { subscription: { unsubscribe: () => void } } }}
 *  Returns an object with a subscription that can be unsubscribed to stop listening.
 */
// PUBLIC_INTERFACE
export function onAuthStateChange(callback) {
  /** This is a public function. */
  const supabase = getSupabaseClient();
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    try {
      callback(event, session);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error in onAuthStateChange callback:', err);
    }
  });
  return { data };
}

/**
 * PUBLIC_INTERFACE
 * authApi
 * Grouped export for authentication helpers.
 */
export default {
  signInWithPassword,
  signOut,
  getCurrentUser,
  onAuthStateChange,
  signUpWithPassword,
};
