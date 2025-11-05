import React, { useEffect, useMemo, useState } from 'react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Select from '../../components/UI/Select';
import Table from '../../components/UI/Table';
import Spinner from '../../components/UI/Spinner';
import Modal from '../../components/UI/Modal';
import { listCustomers, deleteCustomer, listSalesForCustomer, listServiceTicketsForCustomer } from '../../lib/api/customers';
import CustomerForm from './Form';

/**
 * PUBLIC_INTERFACE
 * CustomersList
 * Page to manage customers: list, search, add/edit/delete. Selecting a row shows
 * related panels for recent sales and service history.
 */
// PUBLIC_INTERFACE
export default function CustomersList() {
  /** This is a public function. */
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [data, setData] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [selected, setSelected] = useState(null);
  const [relatedSales, setRelatedSales] = useState({ data: [], error: null, loading: false });
  const [relatedTickets, setRelatedTickets] = useState({ data: [], error: null, loading: false });

  async function fetchData() {
    setLoading(true);
    setErr(null);
    try {
      const res = await listCustomers({ search, page, pageSize });
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

  useEffect(() => {
    if (!selected) return;
    // Load related sales and tickets
    setRelatedSales((s) => ({ ...s, loading: true, error: null }));
    setRelatedTickets((s) => ({ ...s, loading: true, error: null }));

    (async () => {
      try {
        const salesRes = await listSalesForCustomer({ customer_id: selected.id, name: selected.name, limit: 5 });
        setRelatedSales({ data: salesRes.data || [], error: salesRes.error || null, loading: false });
      } catch (e) {
        setRelatedSales({ data: [], error: e, loading: false });
      }
      try {
        const ticketsRes = await listServiceTicketsForCustomer({ customer_id: selected.id, name: selected.name, limit: 5 });
        setRelatedTickets({ data: ticketsRes.data || [], error: ticketsRes.error || null, loading: false });
      } catch (e) {
        setRelatedTickets({ data: [], error: e, loading: false });
      }
    })();
  }, [selected]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  function handleEdit(row) {
    setEditing(row);
    setModalOpen(true);
  }
  async function handleDelete(row) {
    if (!window.confirm(`Delete customer "${row.name}"?`)) return;
    const res = await deleteCustomer(row.id);
    if (res?.error) {
      // eslint-disable-next-line no-alert
      alert(getFriendlyError(res.error));
      return;
    }
    if (selected?.id === row.id) setSelected(null);
    fetchData();
  }
  function onFormClose(changed) {
    setModalOpen(false);
    setEditing(null);
    if (changed) fetchData();
  }

  const columns = useMemo(
    () => [
      { header: 'Name', accessor: 'name', render: (r) => renderSelectable(r, r.name) },
      { header: 'Email', accessor: 'email', render: (r) => renderSelectable(r, r.email || '-') },
      { header: 'Phone', accessor: 'phone', render: (r) => renderSelectable(r, r.phone || '-') },
      { header: 'Address', accessor: 'address', render: (r) => renderSelectable(r, r.address || '-') },
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
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected]
  );

  function renderSelectable(row, content) {
    const isSel = selected?.id === row.id;
    return (
      <button
        onClick={() => setSelected(isSel ? null : row)}
        style={{
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: isSel ? 'var(--color-primary)' : 'inherit',
          fontWeight: isSel ? 700 : 400,
        }}
        aria-label={`Select customer ${row.name}`}
        title="Click to view related history"
      >
        {content}
      </button>
    );
  }

  const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize));
  const pageSizeOptions = [10, 20, 50].map((n) => ({ value: String(n), label: `${n} / page` }));

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="page-title">Customers</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onClick={openCreate}>+ New Customer</Button>
        </div>
      </div>

      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.6fr', gap: 12 }}>
          <Input placeholder="Search name, email, or phone…" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
          <Select value={String(pageSize)} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value) || 10); }} options={pageSizeOptions} />
        </div>
      </Card>

      <Card>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Spinner />
            <span style={{ color: '#6B7280' }}>Loading customers…</span>
          </div>
        ) : err ? (
          <div className="badge error">{getFriendlyError(err)}</div>
        ) : (
          <>
            <Table columns={columns} data={data} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
              <div style={{ color: '#6B7280', fontSize: 14 }}>
                {count} customer{count === 1 ? '' : 's'} • Page {page} of {totalPages}
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

      {/* Related panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Recent Sales</div>
          {!selected ? (
            <div style={{ color: '#6B7280' }}>Select a customer to view sales.</div>
          ) : relatedSales.loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Spinner />
              <span style={{ color: '#6B7280' }}>Loading sales…</span>
            </div>
          ) : relatedSales.error ? (
            <div className="badge error">{getFriendlyError(relatedSales.error)}</div>
          ) : (
            <Table
              columns={[
                { header: 'Invoice', accessor: 'invoice_no' },
                { header: 'Amount', accessor: 'total_amount', render: (r) => formatCurrency(r.total_amount) },
                { header: 'Payment', accessor: 'payment_method' },
                { header: 'Date', accessor: 'created_at' },
              ]}
              data={relatedSales.data}
            />
          )}
        </Card>

        <Card>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Service History</div>
          {!selected ? (
            <div style={{ color: '#6B7280' }}>Select a customer to view service history.</div>
          ) : relatedTickets.loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Spinner />
              <span style={{ color: '#6B7280' }}>Loading service history…</span>
            </div>
          ) : relatedTickets.error ? (
            <div className="badge error">{getFriendlyError(relatedTickets.error)}</div>
          ) : (
            <Table
              columns={[
                { header: 'Ticket #', accessor: 'id' },
                { header: 'Device', accessor: 'device' },
                { header: 'Issue', accessor: 'issue' },
                { header: 'Status', accessor: 'status' },
                { header: 'Created', accessor: 'created_at' },
              ]}
              data={relatedTickets.data}
            />
          )}
        </Card>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => onFormClose(false)}
        title={editing ? 'Edit Customer' : 'New Customer'}
        footer={null}
      >
        <CustomerForm initialValues={editing || undefined} onClose={onFormClose} />
      </Modal>
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
  if (/Supabase not configured/i.test(m)) return 'Supabase is not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY.';
  if (/table(s)? missing/i.test(m)) return 'Required table is missing in Supabase. Ensure "customers", "sales", and "service_tickets" exist.';
  if (/RLS policy/i.test(m)) return 'Row Level Security policy prevents this operation. Adjust Supabase policies.';
  return m || 'Failed to load.';
}
