import React, { useEffect, useMemo, useState } from 'react';
import Card from '../../components/UI/Card';
import Input from '../../components/UI/Input';
import Select from '../../components/UI/Select';
import Button from '../../components/UI/Button';
import Table from '../../components/UI/Table';
import Spinner from '../../components/UI/Spinner';
import Modal from '../../components/UI/Modal';
import { listServiceTickets, deleteServiceTicket } from '../../lib/api/services';
import ServiceForm from './Form';

/**
 * PUBLIC_INTERFACE
 * ServiceTickets
 * List and manage service/repair tickets with search, filters (status, date, tech) and pagination.
 * Gracefully handles missing Supabase config, table, or RLS policies.
 */
// PUBLIC_INTERFACE
export default function ServiceTickets() {
  /** This is a public function. */
  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [assignedTech, setAssignedTech] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Data state
  const [data, setData] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  async function fetchData() {
    setLoading(true);
    setErr(null);
    try {
      const res = await listServiceTickets({
        search,
        status,
        assigned_tech: assignedTech,
        date_start: dateStart,
        date_end: dateEnd,
        page,
        pageSize,
      });
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
  }, [search, status, assignedTech, dateStart, dateEnd, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize));

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  function handleEdit(row) {
    setEditing(row);
    setModalOpen(true);
  }
  async function handleDelete(row) {
    if (!window.confirm(`Delete ticket #${row.id}?`)) return;
    const res = await deleteServiceTicket(row.id);
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

  const statusOptions = [
    { value: '', label: 'All statuses' },
    { value: 'New', label: 'New' },
    { value: 'Diagnosing', label: 'Diagnosing' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Ready', label: 'Ready' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
  ];
  const pageSizeOptions = [10, 20, 50].map(n => ({ value: String(n), label: `${n} / page` }));

  const columns = useMemo(() => [
    { header: 'ID', accessor: 'id' },
    { header: 'Device', accessor: 'device' },
    { header: 'Issue', accessor: 'issue' },
    { header: 'Status', accessor: 'status' },
    { header: 'Technician', accessor: 'assigned_tech' },
    { header: 'Customer', accessor: 'customer_name' },
    { header: 'Created', accessor: 'created_at' },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" onClick={() => handleEdit(row)}>Edit</Button>
          <Button variant="ghost" onClick={() => handleDelete(row)}>Delete</Button>
        </div>
      )
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="page-title">Service Tickets</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onClick={openCreate}>+ New Ticket</Button>
        </div>
      </div>

      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr 0.8fr 0.7fr 0.7fr 0.6fr', gap: 12, alignItems: 'center' }}>
          <Input
            placeholder="Search device or issue…"
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          />
          <Select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} options={statusOptions} />
          <Input
            placeholder="Technician"
            value={assignedTech}
            onChange={(e) => { setPage(1); setAssignedTech(e.target.value); }}
          />
          <Input type="date" value={dateStart} onChange={(e) => { setPage(1); setDateStart(e.target.value); }} />
          <Input type="date" value={dateEnd} onChange={(e) => { setPage(1); setDateEnd(e.target.value); }} />
          <Select
            value={String(pageSize)}
            onChange={(e) => { setPage(1); setPageSize(Number(e.target.value) || 10); }}
            options={pageSizeOptions}
          />
        </div>
      </Card>

      <Card>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Spinner />
            <span style={{ color: '#6B7280' }}>Loading tickets…</span>
          </div>
        ) : err ? (
          <div className="badge error">{getFriendlyError(err)}</div>
        ) : (
          <>
            <Table columns={columns} data={data} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
              <div style={{ color: '#6B7280', fontSize: 14 }}>
                {count} ticket{count === 1 ? '' : 's'} • Page {page} of {totalPages}
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
        title={editing ? 'Edit Ticket' : 'New Ticket'}
        footer={null}
      >
        <ServiceForm initialValues={editing || undefined} onClose={onFormClose} />
      </Modal>
    </div>
  );
}

function getFriendlyError(err) {
  const m = String(err?.message || err);
  if (/Supabase not configured/i.test(m)) return 'Supabase is not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY.';
  if (/table(s)? missing/i.test(m)) return 'Service tickets table is missing in Supabase. Please create "service_tickets".';
  if (/RLS policy/i.test(m)) return 'Row Level Security policy prevents this operation. Adjust Supabase policies.';
  return m || 'Failed to load.';
}
