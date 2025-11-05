import React, { useMemo, useState } from 'react';
import Card from '../components/UI/Card';
import Badge from '../components/UI/Badge';
import Button from '../components/UI/Button';
import DateRangePicker from '../components/UI/DateRangePicker';
import Table from '../components/UI/Table';
import LineChart from '../components/Charts/LineChart';
import BarChart from '../components/Charts/BarChart';
import DonutChart from '../components/Charts/DonutChart';
import SaleModal from '../components/Sales/SaleModal';

/**
 * PUBLIC_INTERFACE
 * Dashboard
 * Dashboard page showing KPIs, sales trends, top products, and recent sales.
 * Includes a date range filter integration point. Uses mock placeholders that
 * can be replaced with real Supabase-backed data when available.
 *
 * Props: none
 * Returns: React.ReactElement
 */
// PUBLIC_INTERFACE
export default function Dashboard() {
  /** This is a public function. */
  // Date range filter state; integration point for data fetching
  const [range, setRange] = useState({
    start: getISODateNDaysAgo(7),
    end: getISODateNDaysAgo(0),
  });
  const [showSaleModal, setShowSaleModal] = useState(false);

  // Mock helpers to simulate derived metrics and lists
  const { kpis, recentSales, topProducts } = useMemo(() => {
    // In a real implementation, replace this block with data fetching logic.
    // Example stub: fetchDashboardData(range.start, range.end)
    // For now, we provide deterministic mock data that depends on the date range length.
    const days = Math.max(1, diffDays(range.start, range.end) + 1);
    const base = 1000 + days * 13;
    const k = {
      revenue: formatCurrency(base * 37.5),
      orders: base % 300,
      avgOrder: formatCurrency(37.5 + (days % 7) * 3.25),
      returningRate: `${(18 + (days % 5) * 1.2).toFixed(1)}%`,
    };

    const sales = Array.from({ length: Math.min(6, days) }).map((_, i) => ({
      id: `INV-${String(4820 + i)}`,
      date: getISODateNDaysAgo(days - i - 1),
      customer: ['Ava Roberts', 'John Miller', 'Sophia Lee', 'Liam Chen', 'Emma Davis', 'Noah Patel'][i % 6],
      items: 1 + ((i + days) % 4),
      total: formatCurrency(49 + (i * 7) % 120),
      status: ['Paid', 'Pending', 'Refunded'][i % 3],
    }));

    const products = [
      { name: 'iPhone 14 Pro Case', sku: 'CASE-IPH14P', units: 82 + (days % 17), revenue: formatCurrency(2450 + (days % 11) * 75) },
      { name: 'USB-C 20W Charger', sku: 'CHG-USBC-20', units: 121 + (days % 23), revenue: formatCurrency(1860 + (days % 9) * 62) },
      { name: 'Tempered Glass (iPhone)', sku: 'GLS-IPH-TP', units: 97 + (days % 19), revenue: formatCurrency(1325 + (days % 13) * 40) },
      { name: 'Samsung S23 Silicone Case', sku: 'CASE-S23-SLC', units: 64 + (days % 15), revenue: formatCurrency(1540 + (days % 7) * 53) },
      { name: 'Battery Replacement (Service)', sku: 'SRV-BATT', units: 28 + (days % 12), revenue: formatCurrency(2100 + (days % 5) * 90) },
    ].sort((a, b) => parseCurrency(b.revenue) - parseCurrency(a.revenue));

    return {
      kpis: k,
      recentSales: sales,
      topProducts: products,
    };
  }, [range]);

  // Columns for tables
  const recentSalesColumns = [
    { header: 'Invoice', accessor: 'id' },
    { header: 'Date', accessor: 'date' },
    { header: 'Customer', accessor: 'customer' },
    { header: 'Items', accessor: 'items' },
    { header: 'Total', accessor: 'total' },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const v = row.status === 'Paid' ? 'success' : row.status === 'Refunded' ? 'error' : 'info';
        return <Badge variant={v}>{row.status}</Badge>;
      },
    },
  ];

  const topProductsColumns = [
    { header: 'Product', accessor: 'name' },
    { header: 'SKU', accessor: 'sku' },
    { header: 'Units Sold', accessor: 'units' },
    { header: 'Revenue', accessor: 'revenue' },
  ];

  // UI
  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="page-title">Dashboard</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <DateRangePicker
            start={range.start}
            end={range.end}
            onChange={(r) => setRange(r)}
          />
          <Button variant="ghost" onClick={() => setRange({ start: getISODateNDaysAgo(7), end: getISODateNDaysAgo(0) })}>
            Last 7 days
          </Button>
          <Button variant="ghost" onClick={() => setRange({ start: getISODateNDaysAgo(30), end: getISODateNDaysAgo(0) })}>
            Last 30 days
          </Button>
          <Button onClick={() => setShowSaleModal(true)}>Create Sale</Button>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
        <KpiCard label="Revenue" value={kpis.revenue} trend="+4.3%" />
        <KpiCard label="Orders" value={kpis.orders} trend="+2.1%" />
        <KpiCard label="Avg. Order Value" value={kpis.avgOrder} trend="−1.2%" />
        <KpiCard label="Returning Rate" value={kpis.returningRate} trend="+0.5%" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1.2fr', gap: 12 }}>
        <Card>
          <SectionHeader title="Sales Trend" subtitle="Daily sales for selected period" />
          <div style={{ paddingTop: 8 }}>
            <LineChart width="100%" height={180} />
          </div>
        </Card>

        <Card>
          <SectionHeader title="Payment Methods" subtitle="Distribution by method" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <DonutChart size={160} />
            <div style={{ display: 'grid', gap: 8 }}>
              <LegendItem color="var(--color-primary)" label="Card" value="54%" />
              <LegendItem color="var(--color-secondary)" label="Cash" value="31%" />
              <LegendItem color="var(--color-success)" label="Online" value="15%" />
            </div>
          </div>
        </Card>
      </div>

      {/* Lists */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.4fr', gap: 12 }}>
        <Card>
          <SectionHeader title="Recent Sales" subtitle="Latest invoices and payments" />
          <Table columns={recentSalesColumns} data={recentSales} />
        </Card>

        <Card>
          <SectionHeader title="Top Products" subtitle="Best performers in the selected range" />
          <div style={{ paddingBottom: 12 }}>
            <BarChart width="100%" height={140} />
          </div>
          <Table columns={topProductsColumns} data={topProducts} />
        </Card>
      </div>
      <SaleModal
        open={showSaleModal}
        onClose={() => setShowSaleModal(false)}
        onSuccess={() => {
          setShowSaleModal(false);
        }}
      />
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * KpiCard
 * Simple KPI card component for Dashboard summaries.
 */
// PUBLIC_INTERFACE
function KpiCard({ label, value, trend }) {
  /** This is a public function. */
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
        </div>
        <Badge variant={trend?.startsWith('-') ? 'error' : 'success'}>{trend}</Badge>
      </div>
    </Card>
  );
}

/**
 * PUBLIC_INTERFACE
 * SectionHeader
 * Title and subtitle for sections on the Dashboard.
 */
// PUBLIC_INTERFACE
function SectionHeader({ title, subtitle }) {
  /** This is a public function. */
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontWeight: 700 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, color: '#6B7280' }}>{subtitle}</div>}
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * LegendItem
 * Legend entry with color bullet, label and value.
 */
// PUBLIC_INTERFACE
function LegendItem({ color, label, value }) {
  /** This is a public function. */
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
      <span style={{ flex: 1 }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}

/**
 * Helpers (internal)
 */
function getISODateNDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function diffDays(start, end) {
  try {
    const s = new Date(start);
    const e = new Date(end);
    return Math.round((e - s) / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

function formatCurrency(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function parseCurrency(s) {
  // Simple parser for "$1,234" like formats
  const n = String(s).replace(/[^0-9.-]+/g, '');
  const v = parseFloat(n);
  return Number.isNaN(v) ? 0 : v;
}
