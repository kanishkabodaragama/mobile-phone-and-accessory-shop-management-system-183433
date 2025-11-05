import React, { useEffect, useState } from 'react';
import Card from '../../components/UI/Card';
import Input from '../../components/UI/Input';
import Select from '../../components/UI/Select';
import Button from '../../components/UI/Button';
import Spinner from '../../components/UI/Spinner';
import { getShopSettings, updateShopSettings } from '../../lib/api/settings';

/**
 * General Settings page
 * Allows editing shop info, tax rate, and currency with graceful fallbacks if backend not available.
 */
const currencyOptions = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'INR', label: 'INR - Indian Rupee' },
];

export default function GeneralSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    shop_name: '',
    address: '',
    phone: '',
    email: '',
    tax_rate: 0,
    currency: 'USD',
  });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await getShopSettings();
      if (mounted) {
        setForm({
          shop_name: data.shop_name || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          tax_rate: typeof data.tax_rate === 'number' ? data.tax_rate : 0,
          currency: data.currency || 'USD',
        });
        setLoading(false);
        if (data._fallback) {
          setMessage('Using local defaults. Configure Supabase table "shop_settings" with id=1 to persist changes.');
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: name === 'tax_rate' ? parseFloat(value || 0) : value }));
  };

  const handleCurrencyChange = (val) => setForm((s) => ({ ...s, currency: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const saved = await updateShopSettings(form);
    setSaving(false);
    setForm({
      shop_name: saved.shop_name || '',
      address: saved.address || '',
      phone: saved.phone || '',
      email: saved.email || '',
      tax_rate: typeof saved.tax_rate === 'number' ? saved.tax_rate : 0,
      currency: saved.currency || 'USD',
    });
    if (saved._fallback) {
      setMessage('Settings updated locally. To persist, ensure "shop_settings" table exists and RLS allows upsert for id=1.');
    } else {
      setMessage('Settings saved successfully.');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card title="General Settings" subtitle="Update shop information and defaults">
        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <div className="text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded p-2">
              {message}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Shop Name" name="shop_name" value={form.shop_name} onChange={handleChange} required />
            <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} />
            <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} />
            <Input label="Address" name="address" value={form.address} onChange={handleChange} />
            <Input label="Tax Rate (%)" name="tax_rate" type="number" min="0" step="0.01" value={form.tax_rate} onChange={handleChange} />
            <Select
              label="Currency"
              value={form.currency}
              onChange={handleCurrencyChange}
              options={currencyOptions}
            />
          </div>
          <div className="pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
