import React, { useEffect, useState } from 'react';
import Input from '../../components/UI/Input';
import Select from '../../components/UI/Select';
import Button from '../../components/UI/Button';
import { createServiceTicket, updateServiceTicket } from '../../lib/api/services';

/**
 * PUBLIC_INTERFACE
 * ServiceForm
 * Create or edit service tickets. Calls onClose(true) on successful save.
 *
 * Props:
 *  - initialValues?: existing ticket object when editing
 *  - onClose: (changed: boolean) => void
 */
// PUBLIC_INTERFACE
export default function ServiceForm({ initialValues, onClose }) {
  /** This is a public function. */
  const [values, setValues] = useState({
    device: '',
    issue: '',
    status: 'New',
    assigned_tech: '',
    customer_name: '',
    customer_id: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialValues) {
      setValues({
        device: initialValues.device || '',
        issue: initialValues.issue || '',
        status: initialValues.status || 'New',
        assigned_tech: initialValues.assigned_tech || '',
        customer_name: initialValues.customer_name || '',
        customer_id: initialValues.customer_id || '',
      });
    }
  }, [initialValues]);

  function handleChange(field, transform = (v) => v) {
    return (e) => setValues((prev) => ({ ...prev, [field]: transform(e.target.value) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (!values.device || !values.issue) {
      setError('Device and Issue are required.');
      setSaving(false);
      return;
    }

    const payload = {
      device: String(values.device).trim(),
      issue: String(values.issue).trim(),
      status: values.status || 'New',
      assigned_tech: values.assigned_tech || null,
      customer_name: values.customer_name || null,
      customer_id: values.customer_id || null,
    };

    try {
      let res;
      if (initialValues?.id) {
        res = await updateServiceTicket(initialValues.id, payload);
      } else {
        res = await createServiceTicket(payload);
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
    { value: 'New', label: 'New' },
    { value: 'Diagnosing', label: 'Diagnosing' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Ready', label: 'Ready' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
  ];

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
      <label>
        <div style={{ fontSize: 14, marginBottom: 6 }}>Device</div>
        <Input value={values.device} onChange={handleChange('device')} placeholder="e.g., iPhone 12 Pro" required />
      </label>

      <label>
        <div style={{ fontSize: 14, marginBottom: 6 }}>Issue</div>
        <Input value={values.issue} onChange={handleChange('issue')} placeholder="e.g., Screen cracked" required />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <label>
          <div style={{ fontSize: 14, marginBottom: 6 }}>Status</div>
          <Select value={values.status} onChange={handleChange('status')} options={statusOptions} />
        </label>

        <label>
          <div style={{ fontSize: 14, marginBottom: 6 }}>Assigned Technician</div>
          <Input value={values.assigned_tech} onChange={handleChange('assigned_tech')} placeholder="e.g., Alex" />
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <label>
          <div style={{ fontSize: 14, marginBottom: 6 }}>Customer Name</div>
          <Input value={values.customer_name} onChange={handleChange('customer_name')} placeholder="Customer full name" />
        </label>

        <label>
          <div style={{ fontSize: 14, marginBottom: 6 }}>Customer ID (optional link)</div>
          <Input value={values.customer_id} onChange={handleChange('customer_id')} placeholder="UUID or numeric ID" />
        </label>
      </div>

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
  if (/table missing/i.test(m)) return 'Service tickets table is missing in Supabase. Please create "service_tickets".';
  if (/RLS policy/i.test(m)) return 'Row Level Security policy prevents this operation. Adjust Supabase policies.';
  return m || 'Request failed.';
}
