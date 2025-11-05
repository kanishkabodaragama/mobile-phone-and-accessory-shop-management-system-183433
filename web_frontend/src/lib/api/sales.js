import getSupabaseClient from '../supabaseClient';

/**
 * PUBLIC_INTERFACE
 * salesApi
 * Supabase helpers for 'sales' and 'sale_items' tables with graceful fallbacks.
 * Includes transactional-like logic to decrement product stock when a sale is completed.
 */
const SALES_TABLE = 'sales';
const SALE_ITEMS_TABLE = 'sale_items';
const PRODUCTS_TABLE = 'products';

/**
 * Map Supabase or JS errors to friendly messages while preserving codes where available.
 */
function normalizeError(err, fallback = 'Request failed') {
  const msg = String(err?.message || err || fallback);
  return new Error(msg);
}

/**
 * Detect if a Supabase error is due to missing table or RLS policy.
 */
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
 * listSales
 * List sales with optional search by invoice or customer name and pagination.
 */
// PUBLIC_INTERFACE
export async function listSales({ search = '', page = 1, pageSize = 10 } = {}) {
  /** This is a public function. */
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (err) {
    return { data: [], count: 0, error: normalizeError('Supabase not configured'), status: 'NO_SUPABASE' };
  }

  try {
    let query = supabase.from(SALES_TABLE).select('*', { count: 'exact' });
    if (search) {
      query = query.or(`invoice_no.ilike.%${search}%,customer_name.ilike.%${search}%`);
    }
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to);

    if (error) {
      if (isTableMissingError(error)) {
        return { data: [], count: 0, error: normalizeError('Sales tables missing'), status: 'TABLE_MISSING' };
      }
      if (isPolicyDeniedError(error)) {
        return { data: [], count: 0, error: normalizeError('RLS policy prevents reading sales'), status: 'POLICY_BLOCKED' };
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
 * getSaleWithItems
 * Retrieve a sale along with its items.
 */
// PUBLIC_INTERFACE
export async function getSaleWithItems(saleId) {
  /** This is a public function. */
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (err) {
    return { data: null, items: [], error: normalizeError('Supabase not configured'), status: 'NO_SUPABASE' };
  }

  try {
    const { data: sale, error: saleErr } = await supabase.from(SALES_TABLE).select('*').eq('id', saleId).single();
    if (saleErr) {
      if (isTableMissingError(saleErr)) {
        return { data: null, items: [], error: normalizeError('Sales tables missing'), status: 'TABLE_MISSING' };
      }
      return { data: null, items: [], error: saleErr, status: 'ERROR' };
    }
    const { data: items, error: itemsErr } = await supabase.from(SALE_ITEMS_TABLE).select('*').eq('sale_id', saleId);
    if (itemsErr) {
      if (isTableMissingError(itemsErr)) {
        return { data: sale, items: [], error: normalizeError('Sales items table missing'), status: 'TABLE_MISSING' };
      }
      return { data: sale, items: [], error: itemsErr, status: 'ERROR' };
    }
    return { data: sale, items: items || [], error: null, status: 'OK' };
  } catch (err) {
    return { data: null, items: [], error: normalizeError(err), status: 'ERROR' };
  }
}

/**
 * PUBLIC_INTERFACE
 * createSaleWithItems
 * Creates a sale and associated sale_items, then decrements product stock.
 * Attempts to be atomic from the client perspective: if any step fails, best-effort cleanup runs.
 *
 * Expected payload:
 * {
 *   customer_name?: string,
 *   customer_phone?: string,
 *   payment_method?: 'Cash'|'Card'|'Online'|string,
 *   total_amount: number,
 *   items: Array<{ product_id: string|number, quantity: number, unit_price: number }>
 * }
 */
// PUBLIC_INTERFACE
export async function createSaleWithItems(payload) {
  /** This is a public function. */
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (err) {
    return { data: null, error: normalizeError('Supabase not configured'), status: 'NO_SUPABASE' };
  }

  const now = new Date();
  const invoiceNo = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}-${Date.now().toString().slice(-6)}`;

  const saleRow = {
    invoice_no: invoiceNo,
    customer_name: payload.customer_name || null,
    customer_phone: payload.customer_phone || null,
    payment_method: payload.payment_method || 'Cash',
    total_amount: Number(payload.total_amount || 0),
  };

  let createdSale = null;
  try {
    // Insert sale
    const { data: sale, error: saleErr } = await supabase.from(SALES_TABLE).insert(saleRow).select().single();
    if (saleErr) {
      if (isTableMissingError(saleErr)) {
        return { data: null, error: normalizeError('Sales tables missing'), status: 'TABLE_MISSING' };
      }
      if (isPolicyDeniedError(saleErr)) {
        return { data: null, error: normalizeError('RLS policy prevents creating sales'), status: 'POLICY_BLOCKED' };
      }
      return { data: null, error: saleErr, status: 'ERROR' };
    }
    createdSale = sale;

    // Insert items
    const itemsPayload = (payload.items || []).map((it) => ({
      sale_id: sale.id,
      product_id: it.product_id,
      quantity: Number(it.quantity || 0),
      unit_price: Number(it.unit_price || 0),
      line_total: Number(it.quantity || 0) * Number(it.unit_price || 0),
    }));

    if (itemsPayload.length > 0) {
      const { error: itemsErr } = await supabase.from(SALE_ITEMS_TABLE).insert(itemsPayload);
      if (itemsErr) {
        // cleanup sale to avoid orphaned sale without items
        try {
          await supabase.from(SALES_TABLE).delete().eq('id', sale.id);
        } catch {
          // ignore cleanup failure
        }
        if (isTableMissingError(itemsErr)) {
          return { data: null, error: normalizeError('Sales items table missing'), status: 'TABLE_MISSING' };
        }
        if (isPolicyDeniedError(itemsErr)) {
          return { data: null, error: normalizeError('RLS policy prevents creating sale items'), status: 'POLICY_BLOCKED' };
        }
        return { data: null, error: itemsErr, status: 'ERROR' };
      }
    }

    // Decrement product stocks
    for (const it of itemsPayload) {
      const qty = Number(it.quantity || 0);
      if (!it.product_id || qty <= 0) continue;

      // Fetch current stock
      const { data: prod, error: prodErr } = await supabase
        .from(PRODUCTS_TABLE)
        .select('id, stock')
        .eq('id', it.product_id)
        .single();

      if (prodErr) {
        // If product table missing, fail but keep sale; surface friendly error
        if (isTableMissingError(prodErr)) {
          return { data: sale, error: normalizeError('Products table missing for stock update'), status: 'TABLE_MISSING' };
        }
        if (isPolicyDeniedError(prodErr)) {
          return { data: sale, error: normalizeError('RLS policy prevents reading products for stock update'), status: 'POLICY_BLOCKED' };
        }
        // Non-fatal: report but do not rollback entire sale
        // eslint-disable-next-line no-console
        console.warn('Failed to read product for stock update', prodErr);
        continue;
      }

      const currentStock = Number(prod?.stock ?? 0);
      const newStock = currentStock - qty;

      const { error: updErr } = await supabase
        .from(PRODUCTS_TABLE)
        .update({ stock: newStock })
        .eq('id', it.product_id);

      if (updErr) {
        // Non-fatal: report but keep sale
        // eslint-disable-next-line no-console
        console.warn('Failed to update product stock', updErr);
      }
    }

    return { data: createdSale, error: null, status: 'OK' };
  } catch (err) {
    // Try to cleanup created sale on unexpected errors
    if (createdSale?.id) {
      try {
        await supabase.from(SALES_TABLE).delete().eq('id', createdSale.id);
      } catch {
        // ignore
      }
    }
    return { data: null, error: normalizeError(err), status: 'ERROR' };
  }
}

/**
 * PUBLIC_INTERFACE
 * salesApi
 * Grouped export for sales helpers.
 */
const salesApi = {
  listSales,
  getSaleWithItems,
  createSaleWithItems,
};

export default salesApi;
