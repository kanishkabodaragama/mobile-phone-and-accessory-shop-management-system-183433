import getSupabaseClient from '../supabaseClient';

const TABLE = 'shop_settings';

// Internal helpers for consistency
function normalizeError(err, fallback = 'Request failed') {
  const msg = String(err?.message || err || fallback);
  return new Error(msg);
}
function isTableMissingError(error) {
  const msg = String(error?.message || '');
  return error?.code === '42P01' || /relation .* does not exist/i.test(msg);
}
function isPolicyDeniedError(error) {
  const msg = String(error?.message || '');
  return error?.code === '42501' || /permission denied/i.test(msg) || /violates row-level security policy/i.test(msg);
}

function getClientOrNull() {
  try {
    return getSupabaseClient();
  } catch {
    return null;
  }
}

// Default singleton settings shape as graceful fallback
const DEFAULT_SETTINGS = {
  shop_name: 'My Mobile Shop',
  address: '',
  phone: '',
  email: '',
  tax_rate: 0,
  currency: 'USD',
};

// PUBLIC_INTERFACE
export async function getShopSettings() {
  /** This is a public function. Reads singleton settings (id=1) or returns fallback when unavailable. */
  const supabase = getClientOrNull();
  if (!supabase) {
    return { data: { ...DEFAULT_SETTINGS }, error: normalizeError('Supabase not configured'), status: 'NO_SUPABASE' };
  }
  try {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', 1).single();
    if (error) {
      if (isTableMissingError(error)) {
        return { data: { ...DEFAULT_SETTINGS }, error: normalizeError('Settings table missing'), status: 'TABLE_MISSING' };
      }
      if (isPolicyDeniedError(error)) {
        return { data: { ...DEFAULT_SETTINGS }, error: normalizeError('RLS policy prevents reading settings'), status: 'POLICY_BLOCKED' };
      }
      return { data: { ...DEFAULT_SETTINGS }, error, status: 'ERROR' };
    }
    const normalized = {
      shop_name: data?.shop_name ?? DEFAULT_SETTINGS.shop_name,
      address: data?.address ?? DEFAULT_SETTINGS.address,
      phone: data?.phone ?? DEFAULT_SETTINGS.phone,
      email: data?.email ?? DEFAULT_SETTINGS.email,
      tax_rate: typeof data?.tax_rate === 'number' ? data.tax_rate : DEFAULT_SETTINGS.tax_rate,
      currency: data?.currency ?? DEFAULT_SETTINGS.currency,
    };
    return { data: normalized, error: null, status: 'OK' };
  } catch (err) {
    return { data: { ...DEFAULT_SETTINGS }, error: normalizeError(err), status: 'ERROR' };
  }
}

// PUBLIC_INTERFACE
export async function updateShopSettings(settings) {
  /** This is a public function. Upserts singleton settings (id=1) and returns saved row or fallback. */
  const supabase = getClientOrNull();
  if (!supabase) {
    return { data: { ...DEFAULT_SETTINGS, ...settings }, error: normalizeError('Supabase not configured'), status: 'NO_SUPABASE' };
  }
  try {
    const payload = {
      id: 1,
      shop_name: settings?.shop_name ?? DEFAULT_SETTINGS.shop_name,
      address: settings?.address ?? DEFAULT_SETTINGS.address,
      phone: settings?.phone ?? DEFAULT_SETTINGS.phone,
      email: settings?.email ?? DEFAULT_SETTINGS.email,
      tax_rate: typeof settings?.tax_rate === 'number' ? settings.tax_rate : DEFAULT_SETTINGS.tax_rate,
      currency: settings?.currency ?? DEFAULT_SETTINGS.currency,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from(TABLE).upsert(payload, { onConflict: 'id' }).select().single();
    if (error) {
      if (isTableMissingError(error)) {
        return { data: { ...payload }, error: normalizeError('Settings table missing'), status: 'TABLE_MISSING' };
      }
      if (isPolicyDeniedError(error)) {
        return { data: { ...payload }, error: normalizeError('RLS policy prevents updating settings'), status: 'POLICY_BLOCKED' };
      }
      return { data: { ...payload }, error, status: 'ERROR' };
    }
    const normalized = {
      shop_name: data?.shop_name ?? DEFAULT_SETTINGS.shop_name,
      address: data?.address ?? DEFAULT_SETTINGS.address,
      phone: data?.phone ?? DEFAULT_SETTINGS.phone,
      email: data?.email ?? DEFAULT_SETTINGS.email,
      tax_rate: typeof data?.tax_rate === 'number' ? data.tax_rate : DEFAULT_SETTINGS.tax_rate,
      currency: data?.currency ?? DEFAULT_SETTINGS.currency,
    };
    return { data: normalized, error: null, status: 'OK' };
  } catch (err) {
    return { data: { ...DEFAULT_SETTINGS, ...settings }, error: normalizeError(err), status: 'ERROR' };
  }
}

// PUBLIC_INTERFACE
export async function getUsersList() {
  /** This is a public function. Attempts to list users via common tables, falls back to placeholders. */
  const supabase = getClientOrNull();
  if (!supabase) {
    return { data: [
      { id: 'u_demo_1', email: 'manager@example.com', role: 'manager', created_at: null, _placeholder: true },
      { id: 'u_demo_2', email: 'cashier@example.com', role: 'cashier', created_at: null, _placeholder: true },
    ], error: normalizeError('Supabase not configured'), status: 'NO_SUPABASE' };
  }
  // Try 'profiles' then 'users' view
  try {
    let { data, error } = await supabase.from('profiles').select('id,email,role,created_at').limit(50);
    if (!error && Array.isArray(data)) {
      return { data, error: null, status: 'OK' };
    }
    ({ data, error } = await supabase.from('users').select('id,email,role,created_at').limit(50));
    if (!error && Array.isArray(data)) {
      return { data, error: null, status: 'OK' };
    }
  } catch (err) {
    // ignore, continue to fallback
  }
  return {
    data: [
      { id: 'u_demo_1', email: 'manager@example.com', role: 'manager', created_at: null, _placeholder: true },
      { id: 'u_demo_2', email: 'cashier@example.com', role: 'cashier', created_at: null, _placeholder: true },
    ],
    error: null,
    status: 'MOCK',
  };
}

// PUBLIC_INTERFACE
export async function getSupabaseStatus() {
  /** This is a public function. Returns { configured, url, canRead }. */
  const url = process.env.REACT_APP_SUPABASE_URL || '';
  const key = process.env.REACT_APP_SUPABASE_KEY || '';
  const configured = Boolean(url && key);
  const supabase = getClientOrNull();
  let canRead = false;
  if (supabase) {
    try {
      const { error } = await supabase.from(TABLE).select('id').limit(1);
      canRead = !error;
    } catch {
      canRead = false;
    }
  }
  return { configured, url, canRead };
}

// Grouped default export to keep parity with other api helpers
const settingsApi = {
  getShopSettings,
  updateShopSettings,
  getUsersList,
  getSupabaseStatus,
};

export default settingsApi;
