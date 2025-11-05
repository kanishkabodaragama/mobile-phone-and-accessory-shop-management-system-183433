import React, { useEffect, useState } from 'react';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Select from '../../components/UI/Select';
import { createProduct, updateProduct } from '../../lib/api/products';

/**
 * PUBLIC_INTERFACE
 * ProductForm
 * Modal form for adding or editing a product. On success calls onClose(true).
 *
 * Props:
 *  - initialValues?: product object when editing
 *  - onClose: (changed: boolean) => void
 */
// PUBLIC_INTERFACE
export default function ProductForm({ initialValues, onClose }) {
  /** This is a public function. */
  const [values, setValues] = useState({
    name: '',
    sku: '',
    category: '',
    price: '',
    stock: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialValues) {
      setValues({
        name: initialValues.name || '',
        sku: initialValues.sku || '',
        category: initialValues.category || '',
        price: initialValues.price ?? '',
        stock: initialValues.stock ?? '',
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

    // Basic validation
    if (!values.name || !values.sku) {
      setError('Name and SKU are required.');
      setSaving(false);
      return;
    }

    const payload = {
      name: String(values.name).trim(),
      sku: String(values.sku).trim(),
      category: String(values.category || '').trim() || null,
      price: values.price === '' ? null : Number(values.price),
      stock: values.stock === '' ? null : Number(values.stock),
    };

    try {
      let res;
      if (initialValues?.id) {
        res = await updateProduct(initialValues.id, payload);
      } else {
        res = await createProduct(payload);
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

  const categoryOptions = [
    { value: '', label: 'Select category' },
    { value: 'Phones', label: 'Phones' },
    { value: 'Accessories', label: 'Accessories' },
    { value: 'Services', label: 'Services' },
  ];

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
      <label>
        <div style={{ fontSize: 14, marginBottom: 6 }}>Name</div>
        <Input value={values.name} onChange={handleChange('name')} placeholder="e.g., iPhone 14 Pro Case" required />
      </label>
      <label>
        <div style={{ fontSize: 14, marginBottom: 6 }}>SKU</div>
        <Input value={values.sku} onChange={handleChange('sku')} placeholder="e.g., CASE-IPH14P" required />
      </label>
      <label>
        <div style={{ fontSize: 14, marginBottom: 6 }}>Category</div>
        <Select value={values.category} onChange={handleChange('category')} options={categoryOptions} />
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <label>
          <div style={{ fontSize: 14, marginBottom: 6 }}>Price</div>
          <Input
            type="number"
            step="0.01"
            value={values.price}
            onChange={handleChange('price')}
            placeholder="0.00"
          />
        </label>
        <label>
          <div style={{ fontSize: 14, marginBottom: 6 }}>Stock</div>
          <Input
            type="number"
            step="1"
            value={values.stock}
            onChange={handleChange('stock')}
            placeholder="0"
          />
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
  if (/Supabase not configured/i.test(m)) {
    return 'Supabase is not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY.';
  }
  if (/table missing/i.test(m) || /Could not find the table/i.test(m)) {
    return 'Products table is missing in Supabase. Please create the "products" table.';
  }
  return m || 'Request failed.';
}
