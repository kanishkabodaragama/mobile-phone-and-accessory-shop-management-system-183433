export const theme = {
  name: "Ocean Professional",
  colors: {
    primary: "#1E3A8A",
    secondary: "#F59E0B",
    success: "#059669",
    error: "#DC2626",
    background: "#F3F4F6",
    surface: "#FFFFFF",
    text: "#111827",
    gradientSoft: "linear-gradient(135deg, rgba(30,58,138,0.10), rgba(245,158,11,0.10))"
  },
  radii: {
    sm: 6,
    md: 10,
    lg: 14
  },
  shadows: {
    sm: "0 1px 2px rgba(17, 24, 39, 0.05)",
    md: "0 8px 30px rgba(17, 24, 39, 0.08)",
    lg: "0 12px 40px rgba(17, 24, 39, 0.12)"
  }
};

/**
 * PUBLIC_INTERFACE
 * createSupabaseClient
 * Create and return a Supabase client instance. Requires env variables:
 * - REACT_APP_SUPABASE_URL
 * - REACT_APP_SUPABASE_KEY
 */
export function createSupabaseClient() {
  /** This is a public function. */
  const url = process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.REACT_APP_SUPABASE_KEY;
  if (!url || !key) {
    // Non-fatal: allow app to boot without auth wiring yet
    // eslint-disable-next-line no-console
    console.warn("Supabase env vars missing. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY to enable backend connectivity.");
    return null;
  }
  // Lazy import to avoid issues if package missing in some environments
  const { createClient } = require("@supabase/supabase-js");
  return createClient(url, key);
}
