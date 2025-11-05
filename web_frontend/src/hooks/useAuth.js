import { useEffect, useState } from 'react';
import { getCurrentUser, onAuthStateChange } from '../lib/api/auth';

/**
 * PUBLIC_INTERFACE
 * useAuth
 * React hook to provide the current authenticated user and a loading state.
 *
 * Returns:
 *  - user: the authenticated user object or null
 *  - loading: boolean indicating whether auth state is being resolved
 */
// PUBLIC_INTERFACE
export default function useAuth() {
  /** This is a public function. */
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        const { user: current } = await getCurrentUser();
        if (active) setUser(current);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to get current user', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    init();

    const { data } = onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      try {
        data?.subscription?.unsubscribe?.();
      } catch {
        // ignore
      }
    };
  }, []);

  return { user, loading };
}
