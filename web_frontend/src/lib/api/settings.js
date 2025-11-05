import getSupabaseClient from '../supabaseClient';
const supabase = (() => {
  try {
    return getSupabaseClient();
  } catch (e) {
    // If envs are missing during build or runtime, create a shim object that returns errors gracefully.
    return {
      from() {
        return {
          select: async () => ({ data: null, error: new Error('Supabase not configured') }),
          upsert: async () => ({ data: null, error: new Error('Supabase not configured') }),
          eq: () => ({ single: async () => ({ data: null, error: new Error('Supabase not configured') }) }),
          limit: () => ({ data: null, error: new Error('Supabase not configured') }),
        };
      },
    };
  }
})();

/**
 * Utility: check if a table exists in Supabase
 */
async function tableExists(tableName) {
  try {
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    if (error) {
      // If error is due to permission/rpc policy, we still treat table as existing but inaccessible
      // For our use we need to avoid throwing; return null to indicate unknown or inaccessible
      return null;
    }
    return Array.isArray(data);
  } catch (e) {
    return null;
  }
}

/**
 * Default shop settings fallback when table or row is not available.
 */
const DEFAULT_SETTINGS = {
  shop_name: 'My Mobile Shop',
  address: '',
  phone: '',
  email: '',
  tax_rate: 0,
  currency: 'USD',
};

/**
 * PUBLIC_INTERFACE
 * Get shop settings. Returns a default object if table/row not available.
 * Attempts to read a singleton settings row with id=1 from 'shop_settings' table.
 */
export async function getShopSettings() {
  /** Returns { shop_name, address, phone, email, tax_rate, currency } with graceful fallbacks. */
  try {
    const exists = await tableExists('shop_settings');
    if (exists === false) {
      // explicit false means select worked but no table, fallback
      return { ...DEFAULT_SETTINGS, _fallback: true };
    }
    const { data, error } = await supabase.from('shop_settings').select('*').eq('id', 1).single();
    if (error || !data) {
      return { ...DEFAULT_SETTINGS, _fallback: true };
    }
    // Normalize fields
    return {
      shop_name: data.shop_name ?? DEFAULT_SETTINGS.shop_name,
      address: data.address ?? DEFAULT_SETTINGS.address,
      phone: data.phone ?? DEFAULT_SETTINGS.phone,
      email: data.email ?? DEFAULT_SETTINGS.email,
      tax_rate: typeof data.tax_rate === 'number' ? data.tax_rate : DEFAULT_SETTINGS.tax_rate,
      currency: data.currency ?? DEFAULT_SETTINGS.currency,
      _fallback: false,
    };
  } catch (_e) {
    return { ...DEFAULT_SETTINGS, _fallback: true };
  }
}

/**
 * PUBLIC_INTERFACE
 * Update shop settings. Creates or upserts id=1 row in 'shop_settings'.
 * Returns the saved settings or default with _fallback=true when not permitted.
 */
export async function updateShopSettings(settings) {
  /** Accepts { shop_name, address, phone, email, tax_rate, currency } */
  try {
    const payload = {
      id: 1,
      shop_name: settings.shop_name ?? DEFAULT_SETTINGS.shop_name,
      address: settings.address ?? DEFAULT_SETTINGS.address,
      phone: settings.phone ?? DEFAULT_SETTINGS.phone,
      email: settings.email ?? DEFAULT_SETTINGS.email,
      tax_rate: typeof settings.tax_rate === 'number' ? settings.tax_rate : DEFAULT_SETTINGS.tax_rate,
      currency: settings.currency ?? DEFAULT_SETTINGS.currency,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('shop_settings').upsert(payload, { onConflict: 'id' }).select().single();
    if (error || !data) {
      // Likely missing table or missing permission. Return fallback but echo desired settings.
      return { ...payload, _fallback: true };
    }
    return {
      shop_name: data.shop_name,
      address: data.address,
      phone: data.phone,
      email: data.email,
      tax_rate: data.tax_rate,
      currency: data.currency,
      _fallback: false,
    };
  } catch (_e) {
    return { ...settings, _fallback: true };
  }
}

/**
 * PUBLIC_INTERFACE
 * Get users list (read-only placeholder). Attempts to read 'profiles' or 'users' view.
 * Falls back to a static array with masked emails when unavailable.
 */
export async function getUsersList() {
  /** Returns array of users: [{ id, email, role, created_at }] */
  try {
    // Try a common public 'profiles' table first
    const profilesExists = await tableExists('profiles');
    if (profilesExists) {
      const { data, error } = await supabase.from('profiles').select('id,email,role,created_at').limit(50);
      if (!error && Array.isArray(data)) return data;
    }
    // Try auth users via rpc or view if available (commonly secured, may fail)
    const usersExists = await tableExists('users');
    if (usersExists) {
      const { data, error } = await supabase.from('users').select('id,email,role,created_at').limit(50);
      if (!error && Array.isArray(data)) return data;
    }
  } catch (_e) {
    // ignore
  }
  // Fallback placeholder
  return [
    { id: 'u_demo_1', email: 'manager@example.com', role: 'manager', created_at: null, _placeholder: true },
    { id: 'u_demo_2', email: 'cashier@example.com', role: 'cashier', created_at: null, _placeholder: true },
  ];
}

/**
 * PUBLIC_INTERFACE
 * Check Supabase configuration status using environment variables and a quick ping call.
 */
export async function getSupabaseStatus() {
  /** Returns { configured: boolean, url?: string, canRead?: boolean } */
  const url = process.env.REACT_APP_SUPABASE_URL || '';
  const key = process.env.REACT_APP_SUPABASE_KEY || '';
  const configured = Boolean(url && key);
  let canRead = false;
  try {
    const { error } = await supabase.from('shop_settings').select('id').limit(1);
    canRead = !error;
  } catch {
    canRead = false;
  }
  return { configured, url, canRead };
}
