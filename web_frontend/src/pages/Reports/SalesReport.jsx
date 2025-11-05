import React, { useEffect, useMemo, useState } from 'react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Table from '../../components/UI/Table';
import DateRangePicker from '../../components/UI/DateRangePicker';
import Spinner from '../../components/UI/Spinner';
import { getSalesSummary, exportToCsv } from '../../lib/api/reports';

/**
 * PUBLIC_INTERFACE
 * SalesReport
 * Displays sales KPIs, daily series, and top products for a given date range.
 * Supports CSV export.
 */
// PUBLIC_INTERFACE
export default function SalesReport() {
  /** This is a public function. */
  const [range, setRange] = useState({ start: getISODateNDaysAgo(7), end: getISODateNDaysAgo(0) });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [data, setData] = useState({ kpis: { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 }, series: [], topProducts: [] });

  async function fetchData() {
    setLoading(true);
    setErr(null);
    try {
      const res = await getSalesSummary({ date_start: range.start, date_end: range.end });
      if (res.error && res.status !== 'OK' && res.status !== 'MOCK') {
        setErr(res.error);
        setData({ kpis: { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 }, series: [], topProducts: [] });
      } else {
        setData(res.data || {});
      }
    } catch (e) {
      setErr(e);
      setData({ kpis: { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 }, series: [], topProducts: [] });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.start, range.end]);

  const kpis = data.kpis || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 };
  const seriesColumns = useMemo(() => ([
    { header: 'Date', accessor: 'date' },
    { header: 'Orders', accessor: 'orders' },
    { header: 'Revenue', accessor: 'revenue', render: (r) => toCurrency(r.revenue) },
  ]), []);
  const topColumns = useMemo(() => ([
    { header: 'Product', accessor: 'name' },
    { header: 'SKU', accessor: 'sku' },
    { header: 'Units', accessor: 'units' },
    { header: 'Revenue', accessor: 'revenue', render: (r) => toCurrency(r.revenue) },
  ]), []);

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="page-title">Sales Report</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DateRangePicker start={range.start} end={range.end} onChange={setRange} />
          <Button variant="ghost" onClick={() => setRange({ start: getISODateNDaysAgo(7), end: getISODateNDaysAgo(0) })}>Last 7 days</Button>
          <Button variant="ghost" onClick={() => setRange({ start: getISODateNDaysAgo(30), end: getISODateNDaysAgo(0) })}>Last 30 days</Button>
          <Button onClick={() => exportToCsv(`sales_series_${range.start}_to_${range.end}.csv`, data.series || [])}>Export CSV</Button>
        </div>
      </div>

      <Card>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Spinner />
            <span style={{ color: '#6B7280' }}>Loading sales summary…</span>
          </div>
        ) : err ? (
          <div className="badge error">{String(err?.message || err || 'Failed to load')}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12 }}>
            <Kpi label="Total Revenue" value={toCurrency(kpis.totalRevenue)} />
            <Kpi label="Total Orders" value={kpis.totalOrders} />
            <Kpi label="Avg Order Value" value={toCurrency(kpis.avgOrderValue)} />
          </div>
        )}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.4fr', gap: 12 }}>
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Daily Series</div>
          {loading ? <span style={{ color: '#6B7280' }}>Loading…</span> : <Table columns={seriesColumns} data={data.series || []} />}
        </Card>
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Top Products</div>
          {loading ? <span style={{ color: '#6B7280' }}>Loading…</span> : <Table columns={topColumns} data={data.topProducts || []} />}
        </Card>
      </div>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * Kpi
 * basic KPI display
 */
// PUBLIC_INTERFACE
function Kpi({ label, value }) {
  /** This is a public function. */
  return (
    <Card>
      <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
    </Card>
  );
}

function getISODateNDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function toCurrency(n) {
  const v = Number(n);
  if (Number.isNaN(v)) return '$0.00';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(v);
}
