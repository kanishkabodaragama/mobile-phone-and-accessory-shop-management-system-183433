import React, { useState } from 'react';
import Card from '../../components/UI/Card';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import Table from '../../components/UI/Table';
import Spinner from '../../components/UI/Spinner';
import { checkWarranty } from '../../lib/api/warranties';

/**
 * PUBLIC_INTERFACE
 * WarrantyCheck
 * Page to check warranty by IMEI, SKU, or receipt number. Optional customer phone filter.
 * Gracefully handles missing Supabase configuration, tables, or RLS policies.
 */
// PUBLIC_INTERFACE
export default function WarrantyCheck() {
  /** This is a public function. */
  const [form, setForm] = useState({ imei: '', sku: '', receipt_no: '', customer_phone: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [data, setData] = useState([]);

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setData([]);
    try {
      const res = await checkWarranty({
        imei: form.imei.trim(),
        sku: form.sku.trim(),
        receipt_no: form.receipt_no.trim(),
        customer_phone: form.customer_phone.trim(),
      });
      if (res.error && res.status !== 'OK') {
        setErr(res.error);
        setData([]);
      } else {
        setData(res.data || []);
      }
    } catch (ex) {
      setErr(ex);
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    { header: 'IMEI', accessor: 'imei' },
    { header: 'SKU', accessor: 'sku' },
    { header: 'Receipt #', accessor: 'receipt_no' },
    { header: 'Customer', accessor: 'customer_name' },
    { header: 'Phone', accessor: 'customer_phone' },
    { header: 'Purchase Date', accessor: 'purchase_date' },
    { header: 'Warranty Months', accessor: 'warranty_months' },
    { header: 'Status', accessor: 'status' },
  ];

  return (
    <div className="page">
      <div className="page-title">Warranty Check</div>

      <Card>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 12 }}>
          <Input placeholder="IMEI" value={form.imei} onChange={handleChange('imei')} />
          <Input placeholder="SKU" value={form.sku} onChange={handleChange('sku')} />
          <Input placeholder="Receipt #" value={form.receipt_no} onChange={handleChange('receipt_no')} />
          <Input placeholder="Customer phone (optional)" value={form.customer_phone} onChange={handleChange('customer_phone')} />
          <Button type="submit" style={{ whiteSpace: 'nowrap' }}>Search</Button>
        </form>
        <div style={{ color: '#6B7280', fontSize: 13, marginTop: 8 }}>
          Enter any of IMEI, SKU, or receipt number. You can narrow by customer phone.
        </div>
      </Card>

      <Card>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Spinner />
            <span style={{ color: '#6B7280' }}>Checking warranties…</span>
          </div>
        ) : err ? (
          <div className="badge error">{getFriendlyError(err)}</div>
        ) : (
          <Table columns={columns} data={data} />
        )}
      </Card>
    </div>
  );
}

function getFriendlyError(err) {
  const m = String(err?.message || err);
  if (/Supabase not configured/i.test(m)) return 'Supabase is not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY.';
  if (/table(s)? missing/i.test(m)) return 'Warranties table is missing in Supabase. Please create "warranties".';
  if (/RLS policy/i.test(m)) return 'Row Level Security policy prevents this operation. Adjust Supabase policies.';
  return m || 'Failed to check warranty.';
}
