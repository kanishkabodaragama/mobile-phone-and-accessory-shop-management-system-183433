import React, { useEffect, useMemo, useState } from 'react';
import Card from '../../components/UI/Card';
import Input from '../../components/UI/Input';
import Select from '../../components/UI/Select';
import Button from '../../components/UI/Button';
import Table from '../../components/UI/Table';
import Spinner from '../../components/UI/Spinner';
import Modal from '../../components/UI/Modal';
import { listWarrantyClaims, createWarrantyClaim, updateWarrantyClaim, deleteWarrantyClaim } from '../../lib/api/warranties';

/**
 * PUBLIC_INTERFACE
 * WarrantyClaims
 * Manage warranty claims: list, search, filter by status, pagination, and add/edit/delete.
 * Gracefully handles missing configuration, tables, or RLS policies.
 */
// PUBLIC_INTERFACE
export default function WarrantyClaims() {
  /** This is a public function. */
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [data, setData] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  async function fetchData() {
    setLoading(true);
    setErr(null);
    try {
      const res = await listWarrantyClaims({ search, status, page, pageSize });
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
  }, [search, status, page, pageSize]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  function handleEdit(row) {
    setEditing(row);
    setModalOpen(true);
  }
  async function handleDelete(row) {
    if (!window.confirm(`Delete claim #${row.id}?`)) return;
    const res = await deleteWarrantyClaim(row.id);
    if (res?.error) {
      // eslint-disable-next-line no-alert
      alert(getFriendlyError(res.error));
      return;
    }
    fetchData();
  }
  function onFormClose(changed) {
    setModalOpen(false);
    setEditing(null);
    if (changed) fetchData();
  }

  const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize));
  const statusOptions = [
    { value: '', label: 'All statuses' },
    { value: 'Open', label: 'Open' },
    { value: 'In Review', label: 'In Review' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' },
    { value: 'Completed', label: 'Completed' },
  ];

  const columns = useMemo(() => [
    { header: 'ID', accessor: 'id' },
    { header: 'IMEI', accessor: 'imei' },
    { header: 'SKU', accessor: 'sku' },
    { header: 'Receipt #', accessor: 'receipt_no' },
    { header: 'Customer', accessor: 'customer_name' },
    { header: 'Phone', accessor: 'customer_phone' },
    { header: 'Status', accessor: 'status' },
    { header: 'Created', accessor: 'created_at' },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" onClick={() => handleEdit(row)}>Edit</Button>
          <Button variant="ghost" onClick={() => handleDelete(row)}>Delete</Button>
        </div>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="page-title">Warranty Claims</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onClick={openCreate}>+ New Claim</Button>
        </div>
      </div>

      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.6fr', gap: 12 }}>
          <Input placeholder="Search IMEI, SKU, receipt or customer…" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
          <Select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} options={statusOptions} />
          <Select
            value={String(pageSize)}
            onChange={(e) => { setPage(1); setPageSize(Number(e.target.value) || 10); }}
            options={[10, 20, 50].map(n => ({ value: String(n), label: `${n} / page` }))}
          />
        </div>
      </Card>

      <Card>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Spinner />
            <span style={{ color: '#6B7280' }}>Loading claims…</span>
          </div>
        ) : err ? (
          <div className="badge error">{getFriendlyError(err)}</div>
        ) : (
          <>
            <Table columns={columns} data={data} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
              <div style={{ color: '#6B7280', fontSize: 14 }}>
                {count} claim{count === 1 ? '' : 's'} • Page {page} of {totalPages}
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

      <Modal
        open={modalOpen}
        onClose={() => onFormClose(false)}
        title={editing ? 'Edit Claim' : 'New Claim'}
        footer={null}
      >
        <ClaimForm initialValues={editing || undefined} onClose={onFormClose} />
      </Modal>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * ClaimForm
 * Minimal form to create or edit a warranty claim.
 */
// PUBLIC_INTERFACE
function ClaimForm({ initialValues, onClose }) {
  /** This is a public function. */
  const [values, setValues] = useState({
    imei: '',
    sku: '',
    receipt_no: '',
    customer_name: '',
    customer_phone: '',
    issue_description: '',
    status: 'Open',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (initialValues) {
      setValues({
        imei: initialValues.imei || '',
        sku: initialValues.sku || '',
        receipt_no: initialValues.receipt_no || '',
        customer_name: initialValues.customer_name || '',
        customer_phone: initialValues.customer_phone || '',
        issue_description: initialValues.issue_description || '',
        status: initialValues.status || 'Open',
      });
    }
  }, [initialValues]);

  function handleChange(field) {
    return (e) => setValues((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (!values.issue_description) {
      setError('Issue description is required.');
      setSaving(false);
      return;
    }

    const payload = {
      imei: values.imei || null,
      sku: values.sku || null,
      receipt_no: values.receipt_no || null,
      customer_name: values.customer_name || null,
      customer_phone: values.customer_phone || null,
      issue_description: values.issue_description,
      status: values.status || 'Open',
    };

    try {
      let res;
      if (initialValues?.id) {
        res = await updateWarrantyClaim(initialValues.id, payload);
      } else {
        res = await createWarrantyClaim(payload);
      }
      if (res?.error) {
        setError(getFriendlyError(res.error));
      } else {
        onClose?.(true);
      }
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  const statusOptions = [
    { value: 'Open', label: 'Open' },
    { value: 'In Review', label: 'In Review' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' },
    { value: 'Completed', label: 'Completed' },
  ];

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input placeholder="IMEI" value={values.imei} onChange={handleChange('imei')} />
        <Input placeholder="SKU" value={values.sku} onChange={handleChange('sku')} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input placeholder="Receipt #" value={values.receipt_no} onChange={handleChange('receipt_no')} />
        <Input placeholder="Customer phone" value={values.customer_phone} onChange={handleChange('customer_phone')} />
      </div>
      <Input placeholder="Customer name" value={values.customer_name} onChange={handleChange('customer_name')} />
      <Input placeholder="Issue description" value={values.issue_description} onChange={handleChange('issue_description')} />
      <Select options={statusOptions} value={values.status} onChange={handleChange('status')} />

      {error && <div className="badge error" style={{ alignSelf: 'start' }}>{error}</div>}

      <div style={{ display: 'flex', gap: 8 }}>
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : (initialValues?.id ? 'Save Changes' : 'Create')}</Button>
        <Button type="button" variant="ghost" onClick={() => onClose?.(false)}>Cancel</Button>
      </div>
    </form>
  );
}

function getFriendlyError(err) {
  const m = String(err?.message || err);
  if (/Supabase not configured/i.test(m)) return 'Supabase is not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY.';
  if (/table(s)? missing/i.test(m)) return 'Warranty claims table is missing in Supabase. Please create "warranty_claims".';
  if (/RLS policy/i.test(m)) return 'Row Level Security policy prevents this operation. Adjust Supabase policies.';
  return m || 'Request failed.';
}
