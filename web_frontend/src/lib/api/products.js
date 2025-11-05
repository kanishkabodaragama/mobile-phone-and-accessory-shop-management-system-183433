import getSupabaseClient from '../supabaseClient';

/**
 * PUBLIC_INTERFACE
 * productsApi
 * Supabase CRUD helpers for 'products' table with graceful fallbacks when Supabase
 * is not configured or the table is missing. All methods return a consistent shape.
 */
const TABLE = 'products';

// PUBLIC_INTERFACE
export async function listProducts({ search = '', category = '', page = 1, pageSize = 10 } = {}) {
  /** This is a public function. Lists products with optional search, category filter, and pagination. */
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (err) {
    // Env missing: return empty results gracefully
    return { data: [], count: 0, error: new Error('Supabase not configured'), status: 'NO_SUPABASE' };
  }

  try {
    let query = supabase.from(TABLE).select('*', { count: 'exact' });

    if (search) {
      // Search by name or sku
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
    }
    if (category) {
      query = query.eq('category', category);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to);

    // Handle table missing gracefully
    if (error?.code === '42P01' || /relation .* does not exist/i.test(error?.message || '')) {
      return { data: [], count: 0, error: new Error('Products table missing'), status: 'TABLE_MISSING' };
    }

    return { data: data || [], count: count || 0, error: error || null, status: 'OK' };
  } catch (err) {
    return { data: [], count: 0, error: err, status: 'ERROR' };
  }
}

// PUBLIC_INTERFACE
export async function getProductById(id) {
  /** This is a public function. Fetch a single product by id. */
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (err) {
    return { data: null, error: new Error('Supabase not configured'), status: 'NO_SUPABASE' };
  }

  try {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();

    if (error?.code === '42P01' || /relation .* does not exist/i.test(error?.message || '')) {
      return { data: null, error: new Error('Products table missing'), status: 'TABLE_MISSING' };
    }

    return { data: data || null, error: error || null, status: 'OK' };
  } catch (err) {
    return { data: null, error: err, status: 'ERROR' };
  }
}

// PUBLIC_INTERFACE
export async function createProduct(payload) {
  /** This is a public function. Insert a new product. */
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (err) {
    return { data: null, error: new Error('Supabase not configured'), status: 'NO_SUPABASE' };
  }

  try {
    const { data, error } = await supabase.from(TABLE).insert(payload).select().single();

    if (error?.code === '42P01' || /relation .* does not exist/i.test(error?.message || '')) {
      return { data: null, error: new Error('Products table missing'), status: 'TABLE_MISSING' };
    }

    return { data: data || null, error: error || null, status: 'OK' };
  } catch (err) {
    return { data: null, error: err, status: 'ERROR' };
  }
}

// PUBLIC_INTERFACE
export async function updateProduct(id, payload) {
  /** This is a public function. Update an existing product by id. */
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (err) {
    return { data: null, error: new Error('Supabase not configured'), status: 'NO_SUPABASE' };
  }

  try {
    const { data, error } = await supabase.from(TABLE).update(payload).eq('id', id).select().single();

    if (error?.code === '42P01' || /relation .* does not exist/i.test(error?.message || '')) {
      return { data: null, error: new Error('Products table missing'), status: 'TABLE_MISSING' };
    }

    return { data: data || null, error: error || null, status: 'OK' };
  } catch (err) {
    return { data: null, error: err, status: 'ERROR' };
  }
}

// PUBLIC_INTERFACE
export async function deleteProduct(id) {
  /** This is a public function. Delete a product by id. */
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (err) {
    return { error: new Error('Supabase not configured'), status: 'NO_SUPABASE' };
  }

  try {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);

    if (error?.code === '42P01' || /relation .* does not exist/i.test(error?.message || '')) {
      return { error: new Error('Products table missing'), status: 'TABLE_MISSING' };
    }

    return { error: error || null, status: 'OK' };
  } catch (err) {
    return { error: err, status: 'ERROR' };
  }
}

const productsApi = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};

export default productsApi;
