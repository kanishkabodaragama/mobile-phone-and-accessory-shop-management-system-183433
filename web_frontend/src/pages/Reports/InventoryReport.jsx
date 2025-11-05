import React, { useEffect, useMemo, useState } from 'react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Table from '../../components/UI/Table';
import DateRangePicker from '../../components/UI/DateRangePicker';
import Spinner from '../../components/UI/Spinner';
import { getInventorySummary, exportToCsv } from '../../lib/api/reports';

/**
 * PUBLIC_INTERFACE
 * InventoryReport
 * Shows low stock items, stock movements, and inventory valuation for the period.
 * Includes CSV export.
 */
// PUBLIC_INTERFACE
export default function InventoryReport() {
  /** This is a public function. */
  const [range, setRange] = useState({ start: getISODateNDaysAgo(30), end: getISODateNDaysAgo(0) });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [data, setData] = useState({ lowStock: [], stockMovements: [], valuation: { totalItems: 0, totalCost: 0, totalRetail: 0 } });

  async function fetchData() {
    setLoading(true);
    setErr(null);
    try {
      const res = await getInventorySummary({ date_start: range.start, date_end: range.end });
      if (res.error && res.status !== 'OK' && res.status !== 'MOCK') {
        setErr(res.error);
        setData({ lowStock: [], stockMovements: [], valuation: { totalItems: 0, totalCost: 0, totalRetail: 0 } });
      } else {
        setData(res.data || {});
      }
    } catch (e) {
      setErr(e);
      setData({ lowStock: [], stockMovements: [], valuation: { totalItems: 0, totalCost: 0, totalRetail: 0 } });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.start, range.end]);

  const lowColumns = useMemo(() => ([
    { header: 'Product', accessor: 'name' },
    { header: 'SKU', accessor: 'sku' },
    { header: 'Stock', accessor: 'stock' },
    { header: 'Reorder Level', accessor: 'reorderLevel' },
  ]), []);
  const moveColumns = useMemo(() => ([
    { header: 'Date', accessor: 'date' },
    { header: 'Received', accessor: 'received' },
    { header: 'Sold', accessor: 'sold' },
    { header: 'Adjustments', accessor: 'adjustments' },
  ]), []);

  const valuation = data.valuation || { totalItems: 0, totalCost: 0, totalRetail: 0 };

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="page-title">Inventory Report</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DateRangePicker start={range.start} end={range.end} onChange={setRange} />
          <Button variant="ghost" onClick={() => setRange({ start: getISODateNDaysAgo(30), end: getISODateNDaysAgo(0) })}>Last 30 days</Button>
          <Button onClick={() => exportToCsv(`inventory_movements_${range.start}_to_${range.end}.csv`, data.stockMovements || [])}>Export CSV</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 12 }}>
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Low Stock</div>
          {loading ? <LoadingLine /> : <Table columns={lowColumns} data={data.lowStock || []} />}
        </Card>
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Inventory Valuation</div>
          {loading ? (
            <LoadingLine />
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              <Kpi label="Total Items" value={valuation.totalItems} />
              <Kpi label="Total Cost" value={toCurrency(valuation.totalCost)} />
              <Kpi label="Total Retail" value={toCurrency(valuation.totalRetail)} />
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Stock Movements</div>
        {loading ? <LoadingLine /> : <Table columns={moveColumns} data={data.stockMovements || []} />}
      </Card>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * Kpi
 * small KPI line
 */
// PUBLIC_INTERFACE
function Kpi({ label, value }) {
  /** This is a public function. */
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(17,24,39,0.08)' }}>
      <span style={{ color: '#6B7280' }}>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
function LoadingLine() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Spinner />
      <span style={{ color: '#6B7280' }}>Loading…</span>
    </div>
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
