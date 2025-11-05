import getSupabaseClient from '../supabaseClient';

/**
 * Utilities to generate consistent mock data for reports when Supabase is unavailable
 * or tables/policies are missing.
 */
function daysBetween(start, end) {
  try {
    const s = new Date(start);
    const e = new Date(end);
    return Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)));
  } catch {
    return 0;
  }
}
function formatISO(d) {
  return new Date(d).toISOString().slice(0, 10);
}
function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return formatISO(d);
}
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
function toCurrency(n) {
  const v = Number(n);
  if (Number.isNaN(v)) return '$0.00';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(v);
  } catch {
    return `$${v.toFixed(2)}`;
  }
}

/**
 * Mock generators
 */
function mockSalesSummary({ start, end }) {
  const days = Math.max(1, daysBetween(start, end) + 1);
  const series = [];
  let revenue = 0;
  let orders = 0;
  for (let i = 0; i < days; i++) {
    const date = addDays(start, i);
    const dailyOrders = 8 + ((i * 7) % 12);
    const dailyRevenue = 180 + (i % 9) * 37;
    series.push({ date, orders: dailyOrders, revenue: dailyRevenue });
    orders += dailyOrders;
    revenue += dailyRevenue;
  }
  const avgOrder = orders > 0 ? revenue / orders : 0;
  return {
    kpis: {
      totalRevenue: revenue,
      totalOrders: orders,
      avgOrderValue: avgOrder,
    },
    series,
    topProducts: [
      { name: 'USB-C 20W Charger', sku: 'CHG-USBC-20', revenue: 1860 + (days % 11) * 60, units: 120 + (days % 23) },
      { name: 'iPhone 14 Pro Case', sku: 'CASE-IPH14P', revenue: 2450 + (days % 8) * 70, units: 80 + (days % 17) },
      { name: 'Tempered Glass (iPhone)', sku: 'GLS-IPH-TP', revenue: 1325 + (days % 5) * 40, units: 90 + (days % 19) },
    ],
  };
}
function mockInventorySummary({ start, end }) {
  const days = Math.max(1, daysBetween(start, end) + 1);
  return {
    lowStock: [
      { name: 'USB-C 20W Charger', sku: 'CHG-USBC-20', stock: 4 + (days % 3), reorderLevel: 10 },
      { name: 'Samsung S23 Silicone Case', sku: 'CASE-S23-SLC', stock: 2 + (days % 2), reorderLevel: 8 },
    ],
    stockMovements: Array.from({ length: Math.min(6, days) }).map((_, i) => ({
      date: addDays(start, i),
      received: (i % 3) * 5,
      sold: 8 + ((i + days) % 7),
      adjustments: (i % 2) ? -1 : 0,
    })),
    valuation: {
      totalItems: 350 + (days % 40),
      totalCost: 12500 + (days % 9) * 300,
      totalRetail: 19800 + (days % 9) * 450,
    },
  };
}
function mockServiceSummary({ start, end }) {
  const days = Math.max(1, daysBetween(start, end) + 1);
  const opened = 10 + (days % 7) * 2;
  const completed = 6 + (days % 6) * 2;
  const turnaround = 2.4 + (days % 5) * 0.2;
  return {
    kpis: {
      opened,
      completed,
      avgTurnaroundDays: turnaround,
      openBacklog: Math.max(0, opened - completed),
    },
    byStatus: [
      { status: 'New', count: 4 + (days % 3) },
      { status: 'In Progress', count: 6 + (days % 4) },
      { status: 'Ready', count: 2 + (days % 2) },
      { status: 'Completed', count: completed },
      { status: 'Cancelled', count: (days % 2) },
    ],
    technicians: [
      { technician: 'Alex', tickets: 12 + (days % 4), avgDays: 2.1 + (days % 3) * 0.3 },
      { technician: 'Priya', tickets: 10 + (days % 5), avgDays: 2.7 + (days % 2) * 0.3 },
      { technician: 'Marco', tickets: 8 + (days % 6), avgDays: 3.0 + (days % 2) * 0.2 },
    ],
  };
}

/**
 * PUBLIC_INTERFACE
 * getSalesSummary
 * Returns sales KPIs and time series between date_start and date_end.
 *
 * @param {{ date_start: string, date_end: string }} params
 * @returns {Promise<{ data: any, error: Error|null, status: string }>}
 */
// PUBLIC_INTERFACE
export async function getSalesSummary({ date_start, date_end }) {
  /** This is a public function. Fetch sales summary or provide mock fallback. */
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch {
    return { data: mockSalesSummary({ start: date_start, end: date_end }), error: null, status: 'MOCK' };
  }

  try {
    // Aggregate from sales table
    const { data, error } = await supabase
      .from('sales')
      .select('created_at,total_amount')
      .gte('created_at', `${date_start}T00:00:00`)
      .lte('created_at', `${date_end}T23:59:59.999`);

    if (error) {
      if (isTableMissingError(error) || isPolicyDeniedError(error)) {
        return { data: mockSalesSummary({ start: date_start, end: date_end }), error: null, status: 'MOCK' };
      }
      return { data: null, error, status: 'ERROR' };
    }

    // Build series per day
    const days = Math.max(1, daysBetween(date_start, date_end) + 1);
    const map = {};
    for (let i = 0; i < days; i++) {
      const d = addDays(date_start, i);
      map[d] = { date: d, orders: 0, revenue: 0 };
    }
    (data || []).forEach((row) => {
      const d = String(row.created_at).slice(0, 10);
      if (!map[d]) map[d] = { date: d, orders: 0, revenue: 0 };
      map[d].orders += 1;
      map[d].revenue += Number(row.total_amount || 0);
    });
    const series = Object.values(map).sort((a, b) => (a.date < b.date ? -1 : 1));
    const kpis = series.reduce(
      (acc, cur) => {
        acc.totalRevenue += cur.revenue;
        acc.totalOrders += cur.orders;
        return acc;
      },
      { totalRevenue: 0, totalOrders: 0 }
    );
    const avgOrder = kpis.totalOrders > 0 ? kpis.totalRevenue / kpis.totalOrders : 0;

    // Top products via sale_items join if available; fallback mock if blocked
    let topProducts = [];
    try {
      const { data: items, error: itemsErr } = await supabase
        .from('sale_items')
        .select('product_id,quantity,unit_price,products(name,sku)')
        .gte('created_at', `${date_start}T00:00:00`)
        .lte('created_at', `${date_end}T23:59:59.999`);

      if (!itemsErr && items) {
        const agg = {};
        items.forEach((it) => {
          const key = it.products?.sku || it.product_id;
          const name = it.products?.name || `#${it.product_id}`;
          agg[key] = agg[key] || { name, sku: key, revenue: 0, units: 0 };
          const rev = Number(it.quantity || 0) * Number(it.unit_price || 0);
          agg[key].revenue += rev;
          agg[key].units += Number(it.quantity || 0);
        });
        topProducts = Object.values(agg)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);
      } else {
        topProducts = mockSalesSummary({ start: date_start, end: date_end }).topProducts;
      }
    } catch {
      topProducts = mockSalesSummary({ start: date_start, end: date_end }).topProducts;
    }

    return {
      data: { kpis: { ...kpis, avgOrderValue: avgOrder }, series, topProducts },
      error: null,
      status: 'OK',
    };
  } catch (err) {
    return { data: mockSalesSummary({ start: date_start, end: date_end }), error: normalizeError(err), status: 'MOCK' };
  }
}

/**
 * PUBLIC_INTERFACE
 * getInventorySummary
 * Returns low stock list, stock movement summary, and inventory valuation for range.
 *
 * @param {{ date_start: string, date_end: string }} params
 * @returns {Promise<{ data: any, error: Error|null, status: string }>}
 */
// PUBLIC_INTERFACE
export async function getInventorySummary({ date_start, date_end }) {
  /** This is a public function. Fetch inventory summary or provide mock fallback. */
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch {
    return { data: mockInventorySummary({ start: date_start, end: date_end }), error: null, status: 'MOCK' };
  }

  try {
    // Low stock: products with stock <= reorder_level or a small threshold if field missing
    let lowStock = [];
    try {
      const { data: prods, error: prodErr } = await supabase
        .from('products')
        .select('name,sku,stock,reorder_level')
        .lte('stock', 10)
        .order('stock', { ascending: true })
        .limit(10);

      if (!prodErr && prods) {
        lowStock = prods.map((p) => ({
          name: p.name,
          sku: p.sku,
          stock: p.stock ?? 0,
          reorderLevel: p.reorder_level ?? 10,
        }));
      } else {
        lowStock = mockInventorySummary({ start: date_start, end: date_end }).lowStock;
      }
    } catch {
      lowStock = mockInventorySummary({ start: date_start, end: date_end }).lowStock;
    }

    // Stock movements: infer from sale_items (sold) and purchases (if have table)
    const days = Math.max(1, daysBetween(date_start, date_end) + 1);
    const stockMovementsMap = {};
    for (let i = 0; i < days; i++) {
      const d = addDays(date_start, i);
      stockMovementsMap[d] = { date: d, received: 0, sold: 0, adjustments: 0 };
    }
    try {
      const { data: soldItems, error: soldErr } = await supabase
        .from('sale_items')
        .select('quantity,created_at')
        .gte('created_at', `${date_start}T00:00:00`)
        .lte('created_at', `${date_end}T23:59:59.999`);
      if (!soldErr && soldItems) {
        soldItems.forEach((it) => {
          const d = String(it.created_at).slice(0, 10);
          if (stockMovementsMap[d]) stockMovementsMap[d].sold += Number(it.quantity || 0);
        });
      } else {
        // fill mock sold
        const mock = mockInventorySummary({ start: date_start, end: date_end }).stockMovements;
        mock.forEach((row) => {
          if (stockMovementsMap[row.date]) {
            stockMovementsMap[row.date].sold = row.sold;
            stockMovementsMap[row.date].received = row.received;
            stockMovementsMap[row.date].adjustments = row.adjustments;
          }
        });
      }
    } catch {
      const mock = mockInventorySummary({ start: date_start, end: date_end }).stockMovements;
      mock.forEach((row) => {
        if (stockMovementsMap[row.date]) {
          stockMovementsMap[row.date].sold = row.sold;
          stockMovementsMap[row.date].received = row.received;
          stockMovementsMap[row.date].adjustments = row.adjustments;
        }
      });
    }
    const stockMovements = Object.values(stockMovementsMap).sort((a, b) => (a.date < b.date ? -1 : 1));

    // Valuation approximation: sum(stock * cost) if cost exists; fallback mock
    let valuation = null;
    try {
      const { data: inv, error: invErr } = await supabase
        .from('products')
        .select('stock,cost_price,price');
      if (!invErr && inv) {
        const totalItems = inv.reduce((sum, p) => sum + Number(p.stock || 0), 0);
        const totalCost = inv.reduce((sum, p) => sum + Number(p.stock || 0) * Number(p.cost_price || 0), 0);
        const totalRetail = inv.reduce((sum, p) => sum + Number(p.stock || 0) * Number(p.price || 0), 0);
        valuation = { totalItems, totalCost, totalRetail };
      } else {
        valuation = mockInventorySummary({ start: date_start, end: date_end }).valuation;
      }
    } catch {
      valuation = mockInventorySummary({ start: date_start, end: date_end }).valuation;
    }

    return { data: { lowStock, stockMovements, valuation }, error: null, status: 'OK' };
  } catch (err) {
    return { data: mockInventorySummary({ start: date_start, end: date_end }), error: normalizeError(err), status: 'MOCK' };
  }
}

/**
 * PUBLIC_INTERFACE
 * getServiceSummary
 * Returns service KPIs, status distribution and technician performance in range.
 *
 * @param {{ date_start: string, date_end: string }} params
 * @returns {Promise<{ data: any, error: Error|null, status: string }>}
 */
// PUBLIC_INTERFACE
export async function getServiceSummary({ date_start, date_end }) {
  /** This is a public function. Fetch service summary or provide mock fallback. */
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch {
    return { data: mockServiceSummary({ start: date_start, end: date_end }), error: null, status: 'MOCK' };
  }

  try {
    const { data, error } = await supabase
      .from('service_tickets')
      .select('status,assigned_tech,created_at,closed_at')
      .gte('created_at', `${date_start}T00:00:00`)
      .lte('created_at', `${date_end}T23:59:59.999`);

    if (error) {
      if (isTableMissingError(error) || isPolicyDeniedError(error)) {
        return { data: mockServiceSummary({ start: date_start, end: date_end }), error: null, status: 'MOCK' };
      }
      return { data: null, error, status: 'ERROR' };
    }

    const kpis = { opened: 0, completed: 0, avgTurnaroundDays: 0, openBacklog: 0 };
    const byStatusMap = {};
    const techMap = {};
    let turnaroundSum = 0;
    let turnaroundCount = 0;

    (data || []).forEach((t) => {
      kpis.opened += 1;
      const st = t.status || 'New';
      byStatusMap[st] = (byStatusMap[st] || 0) + 1;

      const tech = t.assigned_tech || 'Unassigned';
      techMap[tech] = techMap[tech] || { tickets: 0, durations: [] };
      techMap[tech].tickets += 1;

      if (t.closed_at) {
        kpis.completed += 1;
        const startDate = new Date(t.created_at);
        const endDate = new Date(t.closed_at);
        const days = Math.max(0, (endDate - startDate) / (1000 * 60 * 60 * 24));
        turnaroundSum += days;
        turnaroundCount += 1;
        techMap[tech].durations.push(days);
      }
    });

    kpis.openBacklog = Math.max(0, kpis.opened - kpis.completed);
    kpis.avgTurnaroundDays = turnaroundCount > 0 ? turnaroundSum / turnaroundCount : 0;

    const byStatus = Object.entries(byStatusMap).map(([status, count]) => ({ status, count }));
    const technicians = Object.entries(techMap).map(([technician, info]) => ({
      technician,
      tickets: info.tickets,
      avgDays: info.durations.length ? info.durations.reduce((a, b) => a + b, 0) / info.durations.length : 0,
    }));

    return { data: { kpis, byStatus, technicians }, error: null, status: 'OK' };
  } catch (err) {
    return { data: mockServiceSummary({ start: date_start, end: date_end }), error: normalizeError(err), status: 'MOCK' };
  }
}

/**
 * PUBLIC_INTERFACE
 * exportToCsv
 * Utility to export array of objects to CSV and trigger client download.
 *
 * @param {string} filename
 * @param {Array<Object>} rows
 */
// PUBLIC_INTERFACE
export function exportToCsv(filename, rows) {
  /** This is a public function. */
  if (!Array.isArray(rows) || rows.length === 0) return;
  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row || {}).forEach((k) => set.add(k));
      return set;
    }, new Set())
  );
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => esc(r[h])).join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const reportsApi = {
  getSalesSummary,
  getInventorySummary,
  getServiceSummary,
  exportToCsv,
};

export default reportsApi;
