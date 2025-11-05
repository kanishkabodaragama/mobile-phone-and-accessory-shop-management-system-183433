import getSupabaseClient from '../supabaseClient';

/**
 * PUBLIC_INTERFACE
 * servicesApi
 * Supabase CRUD helpers for 'service_tickets' with graceful fallbacks for missing configuration,
 * tables, or RLS policies. All methods return a consistent shape.
 */
const TABLE = 'service_tickets';

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
 * listServiceTickets
 * List tickets with optional filters and pagination.
 *
 * @param {Object} params
 * @param {string} [params.search] search across device and issue fields
 * @param {string} [params.status] filter by status
 * @param {string} [params.assigned_tech] filter by assigned technician
 * @param {string} [params.date_start] ISO date string to filter created_at from
 * @param {string} [params.date_end] ISO date string to filter created_at to
 * @param {number} [params.page=1]
 * @param {number} [params.pageSize=10]
 * @returns {Promise<{ data: Array, count: number, error: Error|null, status: string }>}
 */
// PUBLIC_INTERFACE
export async function listServiceTickets({
  search = '',
  status = '',
  assigned_tech = '',
  date_start = '',
  date_end = '',
  page = 1,
  pageSize = 10,
} = {}) {
  /** This is a public function. */
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (err) {
    return { data: [], count: 0, error: normalizeError('Supabase not configured'), status: 'NO_SUPABASE' };
  }

  try {
    let query = supabase.from(TABLE).select('*', { count: 'exact' });

    if (search) {
      query = query.or(`device.ilike.%${search}%,issue.ilike.%${search}%`);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (assigned_tech) {
      query = query.eq('assigned_tech', assigned_tech);
    }
    if (date_start) {
      query = query.gte('created_at', `${date_start}T00:00:00`);
    }
    if (date_end) {
      query = query.lte('created_at', `${date_end}T23:59:59.999`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to);
    if (error) {
      if (isTableMissingError(error)) {
        return { data: [], count: 0, error: normalizeError('Service tickets table missing'), status: 'TABLE_MISSING' };
      }
      if (isPolicyDeniedError(error)) {
        return { data: [], count: 0, error: normalizeError('RLS policy prevents reading service tickets'), status: 'POLICY_BLOCKED' };
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
 * getServiceTicketById
 * Fetch a single service ticket by id.
 */
// PUBLIC_INTERFACE
export async function getServiceTicketById(id) {
  /** This is a public function. */
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (err) {
    return { data: null, error: normalizeError('Supabase not configured'), status: 'NO_SUPABASE' };
  }

  try {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
    if (error) {
      if (isTableMissingError(error)) {
        return { data: null, error: normalizeError('Service tickets table missing'), status: 'TABLE_MISSING' };
      }
      if (isPolicyDeniedError(error)) {
        return { data: null, error: normalizeError('RLS policy prevents reading service tickets'), status: 'POLICY_BLOCKED' };
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
 * createServiceTicket
 * Create a new service ticket.
 *
 * Expected payload: { device, issue, status, assigned_tech, customer_id?, customer_name? }
 */
// PUBLIC_INTERFACE
export async function createServiceTicket(payload) {
  /** This is a public function. */
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (err) {
    return { data: null, error: normalizeError('Supabase not configured'), status: 'NO_SUPABASE' };
  }

  try {
    const now = new Date().toISOString();
    const row = {
      device: payload.device || '',
      issue: payload.issue || '',
      status: payload.status || 'New',
      assigned_tech: payload.assigned_tech || null,
      customer_id: payload.customer_id || null,
      customer_name: payload.customer_name || null,
      created_at: now,
      updated_at: now,
    };
    const { data, error } = await supabase.from(TABLE).insert(row).select().single();
    if (error) {
      if (isTableMissingError(error)) {
        return { data: null, error: normalizeError('Service tickets table missing'), status: 'TABLE_MISSING' };
      }
      if (isPolicyDeniedError(error)) {
        return { data: null, error: normalizeError('RLS policy prevents creating service tickets'), status: 'POLICY_BLOCKED' };
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
 * updateServiceTicket
 * Update an existing service ticket by id.
 */
// PUBLIC_INTERFACE
export async function updateServiceTicket(id, payload) {
  /** This is a public function. */
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (err) {
    return { data: null, error: normalizeError('Supabase not configured'), status: 'NO_SUPABASE' };
  }

  try {
    const row = {
      device: payload.device,
      issue: payload.issue,
      status: payload.status,
      assigned_tech: payload.assigned_tech,
      customer_id: payload.customer_id,
      customer_name: payload.customer_name,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from(TABLE).update(row).eq('id', id).select().single();
    if (error) {
      if (isTableMissingError(error)) {
        return { data: null, error: normalizeError('Service tickets table missing'), status: 'TABLE_MISSING' };
      }
      if (isPolicyDeniedError(error)) {
        return { data: null, error: normalizeError('RLS policy prevents updating service tickets'), status: 'POLICY_BLOCKED' };
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
 * deleteServiceTicket
 * Delete a service ticket by id.
 */
// PUBLIC_INTERFACE
export async function deleteServiceTicket(id) {
  /** This is a public function. */
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (err) {
    return { error: normalizeError('Supabase not configured'), status: 'NO_SUPABASE' };
  }

  try {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) {
      if (isTableMissingError(error)) {
        return { error: normalizeError('Service tickets table missing'), status: 'TABLE_MISSING' };
      }
      if (isPolicyDeniedError(error)) {
        return { error: normalizeError('RLS policy prevents deleting service tickets'), status: 'POLICY_BLOCKED' };
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
 * servicesApi
 * Grouped export for service tickets helpers.
 */
const servicesApi = {
  listServiceTickets,
  getServiceTicketById,
  createServiceTicket,
  updateServiceTicket,
  deleteServiceTicket,
};

export default servicesApi;
