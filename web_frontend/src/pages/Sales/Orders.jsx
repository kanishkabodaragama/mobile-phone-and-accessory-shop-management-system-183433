import React, { useEffect, useState } from 'react';
import Card from '../../components/UI/Card';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import Table from '../../components/UI/Table';
import Spinner from '../../components/UI/Spinner';
import { listSales } from '../../lib/api/sales';
import SaleModal from '../../components/Sales/SaleModal';

/**
 * PUBLIC_INTERFACE
 * SalesOrders
 * Lists sales orders with search by invoice or customer name and simple pagination.
 * Gracefully handles cases where Supabase, tables, or policies are blocking.
 */
// PUBLIC_INTERFACE
export default function SalesOrders() {
  /** This is a public function. */
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const [data, setData] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  async function fetchData() {
    setLoading(true);
    setErr(null);
    try {
      const res = await listSales({ search, page, pageSize });
      if (res.error && res.status !== 'OK') {
        setErr(res.error);
        setData([]);
        setCount(0);
      } else {
        setData(res.data || []);
        setCount(res.count || 0);
      }
    } catch (e) {
      setErr(e);
      setData([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize));

  const columns = [
    { header: 'Invoice', accessor: 'invoice_no' },
    { header: 'Customer', accessor: 'customer_name' },
    { header: 'Phone', accessor: 'customer_phone' },
    { header: 'Payment', accessor: 'payment_method' },
    { header: 'Amount', accessor: 'total', render: (r) => formatCurrency(r.total) },
    { header: 'Date', accessor: 'created_at' },
  ];

  const [showSaleModal, setShowSaleModal] = useState(false);

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="page-title">Sales Orders</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onClick={() => setShowSaleModal(true)}>Create Sale</Button>
        </div>
      </div>

      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.6fr', gap: 12 }}>
          <Input placeholder="Search invoice or customer…" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
          <div />
        </div>
      </Card>

      <Card>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Spinner />
            <span style={{ color: '#6B7280' }}>Loading sales…</span>
          </div>
        ) : err ? (
          <div className="badge error">{getFriendlyError(err)}</div>
        ) : (
          <>
            <Table columns={columns} data={data} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
              <div style={{ color: '#6B7280', fontSize: 14 }}>
                {count} sale{count === 1 ? '' : 's'} • Page {page} of {totalPages}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="ghost" onClick={() => setPage(1)} disabled={page <= 1}>First</Button>
                <Button variant="ghost" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>Prev</Button>
                <Button variant="ghost" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>Next</Button>
                <Button variant="ghost" onClick={() => setPage(totalPages)} disabled={page >= totalPages}>Last</Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <SaleModal
        open={showSaleModal}
        onClose={() => setShowSaleModal(false)}
        onSuccess={() => {
          setShowSaleModal(false);
          setPage(1);
          fetchData();
        }}
      />
    </div>
  );
}

function formatCurrency(n) {
  const v = Number(n);
  if (Number.isNaN(v)) return '-';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(v);
}

function getFriendlyError(err) {
  const m = String(err?.message || err);
  if (/Supabase not configured/i.test(m)) {
    return 'Supabase is not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY.';
  }
  if (/tables missing/i.test(m) || /table missing/i.test(m)) {
    return 'Sales tables are missing in Supabase. Please create the "sales" and "sale_items" tables.';
  }
  if (/RLS policy/i.test(m)) {
    return 'Row Level Security policy prevents this operation. Adjust Supabase policies.';
  }
  return m || 'Failed to load.';
}
