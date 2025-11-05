/**
 * Debounce a changing value by a specified delay.
 * Useful for search inputs to prevent excessive API calls.
 */

// PUBLIC_INTERFACE
import { useEffect, useState } from 'react';

export default function useDebounce(value, delay = 300) {
  /** Returns a debounced version of `value` that updates after `delay` ms. */
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}
