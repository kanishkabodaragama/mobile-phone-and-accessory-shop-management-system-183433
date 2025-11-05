import getSupabaseClient from '../supabaseClient';

/**
 * PUBLIC_INTERFACE
 * customersApi
 * Supabase CRUD helpers for 'customers' table with graceful fallbacks. 
 * Also includes relation fetches for sales and service_tickets associated with a customer.
 */

const CUSTOMERS_TABLE = 'customers';
const SALES_TABLE = 'sales';
const SERVICE_TICKETS_TABLE = 'service_tickets';

// Utility mappers
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
 * listCustomers
 * List customers with optional search and pagination.
 */
// PUBLIC_INTERFACE
export async function listCustomers({ search = '', page = 1, pageSize = 10 } = {}) {
  /** This is a public function. */
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch {
    return { data: [], count: 0, error: normalizeError('Supabase not configured'), status: 'NO_SUPABASE' };
  }

  try {
    let query = supabase.from(CUSTOMERS_TABLE).select('*', { count: 'exact' });
    if (search) {
      // Search by name, email, or phone
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to);
    if (error) {
      if (isTableMissingError(error)) {
        return { data: [], count: 0, error: normalizeError('Customers table missing'), status: 'TABLE_MISSING' };
      }
      if (isPolicyDeniedError(error)) {
        return { data: [], count: 0, error: normalizeError('RLS policy prevents reading customers'), status: 'POLICY_BLOCKED' };
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
 * getCustomerById
 * Fetch a single customer by id.
 */
// PUBLIC_INTERFACE
export async function getCustomerById(id) {
  /** This is a public function. */
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch {
    return { data: null, error: normalizeError('Supabase not configured'), status: 'NO_SUPABASE' };
  }

  try {
    const { data, error } = await supabase.from(CUSTOMERS_TABLE).select('*').eq('id', id).single();
    if (error) {
      if (isTableMissingError(error)) {
        return { data: null, error: normalizeError('Customers table missing'), status: 'TABLE_MISSING' };
      }
      if (isPolicyDeniedError(error)) {
        return { data: null, error: normalizeError('RLS policy prevents reading customers'), status: 'POLICY_BLOCKED' };
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
 * createCustomer
 * Create a new customer.
 * Expected payload: { name, email?, phone?, address? }
 */
// PUBLIC_INTERFACE
export async function createCustomer(payload) {
  /** This is a public function. */
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch {
    return { data: null, error: normalizeError('Supabase not configured'), status: 'NO_SUPABASE' };
  }

  try {
    const row = {
      name: payload.name || '',
      email: payload.email || null,
      phone: payload.phone || null,
      address: payload.address || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from(CUSTOMERS_TABLE).insert(row).select().single();
    if (error) {
      if (isTableMissingError(error)) {
        return { data: null, error: normalizeError('Customers table missing'), status: 'TABLE_MISSING' };
      }
      if (isPolicyDeniedError(error)) {
        return { data: null, error: normalizeError('RLS policy prevents creating customers'), status: 'POLICY_BLOCKED' };
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
 * updateCustomer
 * Update an existing customer by id.
 */
// PUBLIC_INTERFACE
export async function updateCustomer(id, payload) {
  /** This is a public function. */
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch {
    return { data: null, error: normalizeError('Supabase not configured'), status: 'NO_SUPABASE' };
  }

  try {
    const row = {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      address: payload.address,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from(CUSTOMERS_TABLE).update(row).eq('id', id).select().single();
    if (error) {
      if (isTableMissingError(error)) {
        return { data: null, error: normalizeError('Customers table missing'), status: 'TABLE_MISSING' };
      }
      if (isPolicyDeniedError(error)) {
        return { data: null, error: normalizeError('RLS policy prevents updating customers'), status: 'POLICY_BLOCKED' };
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
 * deleteCustomer
 * Delete a customer by id.
 */
// PUBLIC_INTERFACE
export async function deleteCustomer(id) {
  /** This is a public function. */
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch {
    return { error: normalizeError('Supabase not configured'), status: 'NO_SUPABASE' };
  }

  try {
    const { error } = await supabase.from(CUSTOMERS_TABLE).delete().eq('id', id);
    if (error) {
      if (isTableMissingError(error)) {
        return { error: normalizeError('Customers table missing'), status: 'TABLE_MISSING' };
      }
      if (isPolicyDeniedError(error)) {
        return { error: normalizeError('RLS policy prevents deleting customers'), status: 'POLICY_BLOCKED' };
      }
      return { error, status: 'ERROR' };
    }
    return { error: null, status: 'OK' };
  } catch (err) {
    return { error: normalizeError(err), status: 'ERROR' };
  }
}

/**
 * PUBLIC_INTERFACE
 * listSalesForCustomer
 * Fetch sales made for a given customer (by id or by name/phone if id not available).
 * Params: { customer_id?: string|number, name?: string, phone?: string, limit?: number }
 */
// PUBLIC_INTERFACE
export async function listSalesForCustomer({ customer_id, name, phone, limit = 10 } = {}) {
  /** This is a public function. */
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch {
    return { data: [], error: normalizeError('Supabase not configured'), status: 'NO_SUPABASE' };
  }

  try {
    let query = supabase.from(SALES_TABLE).select('*');

    if (customer_id) {
      query = query.eq('customer_id', customer_id);
    } else if (name || phone) {
      const parts = [];
      if (name) parts.push(`customer_name.ilike.%${name}%`);
      if (phone) parts.push(`customer_phone.ilike.%${phone}%`);
      if (parts.length > 0) {
        query = query.or(parts.join(','));
      }
    }
    query = query.order('created_at', { ascending: false }).limit(limit);

    const { data, error } = await query;
    if (error) {
      if (isTableMissingError(error)) {
        return { data: [], error: normalizeError('Sales table missing'), status: 'TABLE_MISSING' };
      }
      if (isPolicyDeniedError(error)) {
        return { data: [], error: normalizeError('RLS policy prevents reading sales'), status: 'POLICY_BLOCKED' };
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
 * listServiceTicketsForCustomer
 * Fetch service tickets associated with a customer.
 * Params: { customer_id?: string|number, name?: string, limit?: number }
 */
// PUBLIC_INTERFACE
export async function listServiceTicketsForCustomer({ customer_id, name, limit = 10 } = {}) {
  /** This is a public function. */
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch {
    return { data: [], error: normalizeError('Supabase not configured'), status: 'NO_SUPABASE' };
  }

  try {
    let query = supabase.from(SERVICE_TICKETS_TABLE).select('*');
    if (customer_id) {
      query = query.eq('customer_id', customer_id);
    } else if (name) {
      query = query.ilike('customer_name', `%${name}%`);
    }
    query = query.order('created_at', { ascending: false }).limit(limit);

    const { data, error } = await query;
    if (error) {
      if (isTableMissingError(error)) {
        return { data: [], error: normalizeError('Service tickets table missing'), status: 'TABLE_MISSING' };
      }
      if (isPolicyDeniedError(error)) {
        return { data: [], error: normalizeError('RLS policy prevents reading service tickets'), status: 'POLICY_BLOCKED' };
      }
      return { data: [], error, status: 'ERROR' };
    }
    return { data: data || [], error: null, status: 'OK' };
  } catch (err) {
    return { data: [], error: normalizeError(err), status: 'ERROR' };
  }
}

const customersApi = {
  listCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  listSalesForCustomer,
  listServiceTicketsForCustomer,
};

export default customersApi;
