import React, { useEffect, useState } from 'react';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import { createCustomer, updateCustomer } from '../../lib/api/customers';

/**
 * PUBLIC_INTERFACE
 * CustomerForm
 * Create or edit a customer. Calls onClose(true) on success.
 *
 * Props:
 *  - initialValues?: existing customer
 *  - onClose: (changed: boolean) => void
 */
// PUBLIC_INTERFACE
export default function CustomerForm({ initialValues, onClose }) {
  /** This is a public function. */
  const [values, setValues] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialValues) {
      setValues({
        name: initialValues.name || '',
        email: initialValues.email || '',
        phone: initialValues.phone || '',
        address: initialValues.address || '',
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

    if (!values.name) {
      setError('Name is required.');
      setSaving(false);
      return;
    }

    const payload = {
      name: String(values.name).trim(),
      email: String(values.email || '').trim() || null,
      phone: String(values.phone || '').trim() || null,
      address: String(values.address || '').trim() || null,
    };

    try {
      let res;
      if (initialValues?.id) {
        res = await updateCustomer(initialValues.id, payload);
      } else {
        res = await createCustomer(payload);
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

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
      <label>
        <div style={{ fontSize: 14, marginBottom: 6 }}>Name</div>
        <Input value={values.name} onChange={handleChange('name')} placeholder="Customer full name" required />
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <label>
          <div style={{ fontSize: 14, marginBottom: 6 }}>Email</div>
          <Input type="email" value={values.email} onChange={handleChange('email')} placeholder="you@example.com" />
        </label>
        <label>
          <div style={{ fontSize: 14, marginBottom: 6 }}>Phone</div>
          <Input value={values.phone} onChange={handleChange('phone')} placeholder="+1 555-555-5555" />
        </label>
      </div>
      <label>
        <div style={{ fontSize: 14, marginBottom: 6 }}>Address</div>
        <Input value={values.address} onChange={handleChange('address')} placeholder="Street, City, State" />
      </label>

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
  if (/table missing/i.test(m)) return 'Customers table is missing in Supabase. Please create "customers".';
  if (/RLS policy/i.test(m)) return 'Row Level Security policy prevents this operation. Adjust Supabase policies.';
  return m || 'Request failed.';
}
