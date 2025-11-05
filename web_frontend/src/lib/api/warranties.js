import getSupabaseClient from '../supabaseClient';

/**
 * PUBLIC_INTERFACE
 * warrantiesApi
 * Helpers for 'warranties' and 'warranty_claims' tables.
 * Includes warranty checks by IMEI/SKU/receipt and CRUD for claims.
 * All methods return a consistent shape and handle missing tables/policies gracefully.
 */

const WARRANTIES_TABLE = 'warranties';
const WARRANTY_CLAIMS_TABLE = 'warranty_claims';

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

/**
 * PUBLIC_INTERFACE
 * checkWarranty
 * Check warranty by one of: imei, sku, receipt_no. Optional customer_phone filter.
 * Returns matching warranty rows (could be multiple in edge cases).
 */
// PUBLIC_INTERFACE
export async function checkWarranty({ imei = '', sku = '', receipt_no = '', customer_phone = '' } = {}) {
  /** This is a public function. */
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch {
    return { data: [], error: normalizeError('Supabase not configured'), status: 'NO_SUPABASE' };
  }

  try {
    let query = supabase.from(WARRANTIES_TABLE).select('*');

    const ors = [];
    if (imei) ors.push(`imei.eq.${imei}`);
    if (sku) ors.push(`sku.eq.${sku}`);
    if (receipt_no) ors.push(`receipt_no.eq.${receipt_no}`);

    if (ors.length > 0) {
      query = query.or(ors.join(','));
    }

    if (customer_phone) {
      query = query.eq('customer_phone', customer_phone);
    }

    const { data, error } = await query.order('purchase_date', { ascending: false }).limit(25);
    if (error) {
      if (isTableMissingError(error)) {
        return { data: [], error: normalizeError('Warranties table missing'), status: 'TABLE_MISSING' };
      }
      if (isPolicyDeniedError(error)) {
        return { data: [], error: normalizeError('RLS policy prevents reading warranties'), status: 'POLICY_BLOCKED' };
      }
      return { data: [], error, status: 'ERROR' };
    }
    return { data: data || [], error: null, status: 'OK' };
  } catch (err) {
    return { data: [], error: normalizeError(err), status: 'ERROR' };
  }
}

/**
 * PUBLIC_INTERFACE
 * listWarrantyClaims
 * List warranty claims with optional filters and pagination.
 */
// PUBLIC_INTERFACE
export async function listWarrantyClaims({ search = '', status = '', page = 1, pageSize = 10 } = {}) {
  /** This is a public function. */
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch {
    return { data: [], count: 0, error: normalizeError('Supabase not configured'), status: 'NO_SUPABASE' };
  }

  try {
    let query = supabase.from(WARRANTY_CLAIMS_TABLE).select('*', { count: 'exact' });

    if (search) {
      // search by imei, sku, receipt_no, customer_name
      query = query.or(`imei.ilike.%${search}%,sku.ilike.%${search}%,receipt_no.ilike.%${search}%,customer_name.ilike.%${search}%`);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to);
    if (error) {
      if (isTableMissingError(error)) {
        return { data: [], count: 0, error: normalizeError('Warranty claims table missing'), status: 'TABLE_MISSING' };
      }
      if (isPolicyDeniedError(error)) {
        return { data: [], count: 0, error: normalizeError('RLS policy prevents reading warranty claims'), status: 'POLICY_BLOCKED' };
      }
      return { data: [], count: 0, error, status: 'ERROR' };
    }
    return { data: data || [], count: count || 0, error: null, status: 'OK' };
  } catch (err) {
    return { data: [], count: 0, error: normalizeError(err), status: 'ERROR' };
  }
}

/**
 * PUBLIC_INTERFACE
 * createWarrantyClaim
 * Create a new warranty claim.
 * Expected payload: { imei?, sku?, receipt_no?, issue_description, status?, customer_name?, customer_phone? }
 */
// PUBLIC_INTERFACE
export async function createWarrantyClaim(payload) {
  /** This is a public function. */
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch {
    return { data: null, error: normalizeError('Supabase not configured'), status: 'NO_SUPABASE' };
  }

  try {
    const now = new Date().toISOString();
    const row = {
      imei: payload.imei || null,
      sku: payload.sku || null,
      receipt_no: payload.receipt_no || null,
      issue_description: payload.issue_description || '',
      status: payload.status || 'Open',
      customer_name: payload.customer_name || null,
      customer_phone: payload.customer_phone || null,
      created_at: now,
      updated_at: now,
    };
    const { data, error } = await supabase.from(WARRANTY_CLAIMS_TABLE).insert(row).select().single();
    if (error) {
      if (isTableMissingError(error)) {
        return { data: null, error: normalizeError('Warranty claims table missing'), status: 'TABLE_MISSING' };
      }
      if (isPolicyDeniedError(error)) {
        return { data: null, error: normalizeError('RLS policy prevents creating warranty claims'), status: 'POLICY_BLOCKED' };
      }
      return { data: null, error, status: 'ERROR' };
    }
    return { data: data || null, error: null, status: 'OK' };
  } catch (err) {
    return { data: null, error: normalizeError(err), status: 'ERROR' };
  }
}

/**
 * PUBLIC_INTERFACE
 * updateWarrantyClaim
 * Update an existing warranty claim by id.
 */
// PUBLIC_INTERFACE
export async function updateWarrantyClaim(id, payload) {
  /** This is a public function. */
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch {
    return { data: null, error: normalizeError('Supabase not configured'), status: 'NO_SUPABASE' };
  }

  try {
    const row = {
      imei: payload.imei,
      sku: payload.sku,
      receipt_no: payload.receipt_no,
      issue_description: payload.issue_description,
      status: payload.status,
      customer_name: payload.customer_name,
      customer_phone: payload.customer_phone,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from(WARRANTY_CLAIMS_TABLE).update(row).eq('id', id).select().single();
    if (error) {
      if (isTableMissingError(error)) {
        return { data: null, error: normalizeError('Warranty claims table missing'), status: 'TABLE_MISSING' };
      }
      if (isPolicyDeniedError(error)) {
        return { data: null, error: normalizeError('RLS policy prevents updating warranty claims'), status: 'POLICY_BLOCKED' };
      }
      return { data: null, error, status: 'ERROR' };
    }
    return { data: data || null, error: null, status: 'OK' };
  } catch (err) {
    return { data: null, error: normalizeError(err), status: 'ERROR' };
  }
}

/**
 * PUBLIC_INTERFACE
 * deleteWarrantyClaim
 * Delete claim by id.
 */
// PUBLIC_INTERFACE
export async function deleteWarrantyClaim(id) {
  /** This is a public function. */
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch {
    return { error: normalizeError('Supabase not configured'), status: 'NO_SUPABASE' };
  }

  try {
    const { error } = await supabase.from(WARRANTY_CLAIMS_TABLE).delete().eq('id', id);
    if (error) {
      if (isTableMissingError(error)) {
        return { error: normalizeError('Warranty claims table missing'), status: 'TABLE_MISSING' };
      }
      if (isPolicyDeniedError(error)) {
        return { error: normalizeError('RLS policy prevents deleting warranty claims'), status: 'POLICY_BLOCKED' };
      }
      return { error, status: 'ERROR' };
    }
    return { error: null, status: 'OK' };
  } catch (err) {
    return { error: normalizeError(err), status: 'ERROR' };
  }
}

const warrantiesApi = {
  checkWarranty,
  listWarrantyClaims,
  createWarrantyClaim,
  updateWarrantyClaim,
  deleteWarrantyClaim,
};

export default warrantiesApi;
