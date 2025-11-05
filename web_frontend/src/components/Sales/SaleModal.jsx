import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../UI/Modal';
import Card from '../UI/Card';
import Input from '../UI/Input';
import Button from '../UI/Button';
import Select from '../UI/Select';
import Table from '../UI/Table';
import Spinner from '../UI/Spinner';
import { listProducts } from '../../lib/api/products';
import { createSaleWithItems } from '../../lib/api/sales';
import { useCart, useUi } from '../../state/store';
import useDebounce from '../../hooks/useDebounce';

/**
 * PUBLIC_INTERFACE
 * SaleModal
 * A modal to create a sale: search products, manage a cart, compute totals,
 * capture customer details and payment method, and submit to backend.
 *
 * Props:
 * - open: boolean - whether the modal is visible
 * - onClose: function - called to close the modal
 * - onSuccess?: function(invoiceNo) - called when sale is successfully created
 */
// PUBLIC_INTERFACE
export default function SaleModal({ open, onClose, onSuccess }) {
  /** This is a public function. */
  const {
    items,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    totals,
  } = useCart();
  const { addToast } = useUi();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState(null);

  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Reset state when opening/closing
  useEffect(() => {
    if (!open) {
      setSearch('');
      setProducts([]);
      setProductsError(null);
      setCustomer({ name: '', phone: '' });
      setPaymentMethod('Cash');
      setSubmitting(false);
      setSubmitError('');
    }
  }, [open]);

  // Load products
  useEffect(() => {
    if (!open) return;
    let active = true;
    async function fetchProducts() {
      setLoadingProducts(true);
      setProductsError(null);
      try {
        const res = await listProducts({ search: debouncedSearch, page: 1, pageSize: 20 });
        if (!active) return;
        if (res.error && res.status !== 'OK') {
          setProductsError(res.error);
          setProducts([]);
        } else {
          setProducts(res.data || []);
        }
      } catch (err) {
        if (active) {
          setProductsError(err);
          setProducts([]);
        }
      } finally {
        if (active) setLoadingProducts(false);
      }
    }
    fetchProducts();
    return () => { active = false; };
  }, [debouncedSearch, open]);

  function addToCart(product) {
    addItem({ id: product.id, name: product.name, price: Number(product.price || 0), qty: 1 });
  }

  function updateQty(productId, qty) {
    const q = Math.max(0, Math.floor(Number(qty) || 0));
    updateItem(productId, { qty: q });
  }

  function onRemove(productId) {
    removeItem(productId);
  }

  const cartRows = useMemo(() => {
    return items.map(it => ({
      product: { id: it.id, name: it.name, sku: it.sku },
      quantity: it.qty,
      unit_price: Number(it.price || 0),
    }));
  }, [items]);

  const cartColumns = [
    { header: 'Product', accessor: 'name', render: (row) => row.product.name },
    { header: 'SKU', accessor: 'sku', render: (row) => row.product.sku ?? '-' },
    {
      header: 'Unit Price',
      accessor: 'unit_price',
      render: (row) => formatCurrency(row.unit_price),
    },
    {
      header: 'Qty',
      accessor: 'quantity',
      render: (row) => (
        <Input
          type="number"
          min="0"
          step="1"
          value={row.quantity}
          onChange={(e) => updateQty(row.product.id, e.target.value)}
          style={{ width: 80 }}
        />
      ),
    },
    {
      header: 'Line Total',
      accessor: 'line_total',
      render: (row) => formatCurrency(row.quantity * row.unit_price),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <Button variant="ghost" onClick={() => onRemove(row.product.id)}>
          Remove
        </Button>
      ),
    },
  ];

  const paymentOptions = [
    { value: 'Cash', label: 'Cash' },
    { value: 'Card', label: 'Card' },
    { value: 'Online', label: 'Online' },
  ];

  // Basic validation
  function validate() {
    if (!items || items.filter((it) => it.qty > 0).length === 0) {
      return 'Please add at least one product to the cart.';
    }
    if (totals.total <= 0) {
      return 'Total must be greater than zero.';
    }
    return '';
  }

  async function onSubmit() {
    const v = validate();
    if (v) {
      setSubmitError(v);
      return;
    }
    setSubmitting(true);
    setSubmitError('');

    const itemsPayload = items
      .filter((it) => it.qty > 0)
      .map((it) => ({
        product_id: it.id,
        quantity: it.qty,
        unit_price: Number(it.price || 0),
      }));

    try {
      const res = await createSaleWithItems({
        customer_name: customer.name || null,
        customer_phone: customer.phone || null,
        payment_method: paymentMethod,
        total_amount: totals.total,
        items: itemsPayload,
      });

      if (res.error) {
        setSubmitError(getFriendlyError(res.error));
      } else {
        addToast({ type: 'success', message: 'Sale created successfully.' });
        const invoice = res.data?.invoice_no || null;
        clearCart();
        if (typeof onSuccess === 'function') {
          onSuccess(invoice);
        }
        onClose?.();
      }
    } catch (err) {
      setSubmitError(getFriendlyError(err));
    } finally {
      setSubmitting(false);
    }
  }

  const footer = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ color: '#6B7280', fontSize: 14 }}>
        Subtotal: <strong>{formatCurrency(totals.subtotal)}</strong>
        <span style={{ marginLeft: 12 }}>Total: <strong>{formatCurrency(totals.total)}</strong></span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button onClick={onSubmit} disabled={submitting}>{submitting ? 'Submitting…' : 'Create Sale'}</Button>
      </div>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title="Create Sale" footer={footer}>
      <div style={{ display: 'grid', gap: 12 }}>
        {/* Product Search */}
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.6fr', gap: 12 }}>
            <Input placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <div />
            <div />
          </div>
          <div style={{ marginTop: 12 }}>
            {loadingProducts ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Spinner />
                <span style={{ color: '#6B7280' }}>Loading products…</span>
              </div>
            ) : productsError ? (
              <div className="badge error">{getFriendlyError(productsError)}</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12 }}>
                {products.map((p) => (
                  <div key={p.id} className="card" style={{ padding: 12 }}>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 13, color: '#6B7280' }}>{p.sku}</div>
                    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>{formatCurrency(p.price)}</span>
                      <span className="badge info">Stock: {p.stock ?? '-'}</span>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <Button onClick={() => addToCart(p)}>Add</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Cart */}
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Cart</div>
          <Table columns={cartColumns} data={cartRows} />
          {submitError && <div className="badge error" style={{ marginTop: 8 }}>{submitError}</div>}
        </Card>

        {/* Customer and Payment */}
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Customer & Payment</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Input
              placeholder="Customer name (optional)"
              value={customer.name}
              onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
            />
            <Input
              placeholder="Customer phone (optional)"
              value={customer.phone}
              onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
            />
            <Select options={paymentOptions} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} />
          </div>
        </Card>
      </div>
    </Modal>
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
  return m || 'Request failed.';
}
