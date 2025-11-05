import React, { useEffect, useMemo, useState } from 'react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Table from '../../components/UI/Table';
import DateRangePicker from '../../components/UI/DateRangePicker';
import Spinner from '../../components/UI/Spinner';
import { getServiceSummary, exportToCsv } from '../../lib/api/reports';

/**
 * PUBLIC_INTERFACE
 * ServiceReport
 * Displays service KPIs, status distribution, and technician performance for a date range.
 * Includes CSV export.
 */
// PUBLIC_INTERFACE
export default function ServiceReport() {
  /** This is a public function. */
  const [range, setRange] = useState({ start: getISODateNDaysAgo(30), end: getISODateNDaysAgo(0) });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [data, setData] = useState({ kpis: { opened: 0, completed: 0, avgTurnaroundDays: 0, openBacklog: 0 }, byStatus: [], technicians: [] });

  async function fetchData() {
    setLoading(true);
    setErr(null);
    try {
      const res = await getServiceSummary({ date_start: range.start, date_end: range.end });
      if (res.error && res.status !== 'OK' && res.status !== 'MOCK') {
        setErr(res.error);
        setData({ kpis: { opened: 0, completed: 0, avgTurnaroundDays: 0, openBacklog: 0 }, byStatus: [], technicians: [] });
      } else {
        setData(res.data || {});
      }
    } catch (e) {
      setErr(e);
      setData({ kpis: { opened: 0, completed: 0, avgTurnaroundDays: 0, openBacklog: 0 }, byStatus: [], technicians: [] });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.start, range.end]);

  const statusColumns = useMemo(() => ([
    { header: 'Status', accessor: 'status' },
    { header: 'Count', accessor: 'count' },
  ]), []);
  const techColumns = useMemo(() => ([
    { header: 'Technician', accessor: 'technician' },
    { header: 'Tickets', accessor: 'tickets' },
    { header: 'Avg Days', accessor: 'avgDays', render: (r) => r.avgDays?.toFixed(2) },
  ]), []);

  const kpis = data.kpis || { opened: 0, completed: 0, avgTurnaroundDays: 0, openBacklog: 0 };

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="page-title">Service Report</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DateRangePicker start={range.start} end={range.end} onChange={setRange} />
          <Button variant="ghost" onClick={() => setRange({ start: getISODateNDaysAgo(30), end: getISODateNDaysAgo(0) })}>Last 30 days</Button>
          <Button onClick={() => exportToCsv(`service_status_${range.start}_to_${range.end}.csv`, data.byStatus || [])}>Export CSV</Button>
        </div>
      </div>

      <Card>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Spinner />
            <span style={{ color: '#6B7280' }}>Loading service summary…</span>
          </div>
        ) : err ? (
          <div className="badge error">{String(err?.message || err || 'Failed to load')}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12 }}>
            <Kpi label="Opened" value={kpis.opened} />
            <Kpi label="Completed" value={kpis.completed} />
            <Kpi label="Avg Turnaround (days)" value={Number(kpis.avgTurnaroundDays || 0).toFixed(2)} />
            <Kpi label="Open Backlog" value={kpis.openBacklog} />
          </div>
        )}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 12 }}>
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>By Status</div>
          {loading ? <LoadingLine /> : <Table columns={statusColumns} data={data.byStatus || []} />}
        </Card>
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Technician Performance</div>
          {loading ? <LoadingLine /> : <Table columns={techColumns} data={data.technicians || []} />}
        </Card>
      </div>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * Kpi
 * small KPI display
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
