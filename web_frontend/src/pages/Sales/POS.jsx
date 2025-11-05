import React, { useEffect, useMemo, useState } from 'react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Select from '../../components/UI/Select';
import Table from '../../components/UI/Table';
import Modal from '../../components/UI/Modal';
import Spinner from '../../components/UI/Spinner';
import { listProducts } from '../../lib/api/products';
import { createSaleWithItems } from '../../lib/api/sales';
import { useCart, useUi } from '../../state/store';

/**
 * PUBLIC_INTERFACE
 * SalesPOS
 * Point of Sale page: add products to cart, adjust quantities, capture customer and payment, and complete sale.
 * Uses global cart slice from shared store.
 */
// PUBLIC_INTERFACE
export default function SalesPOS() {
  /** This is a public function. */
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState(null);

  const { items, addItem, updateItem, removeItem, clearCart, totals, setPayment } = useCart();
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [showConfirm, setShowConfirm] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);
  const { addToast } = useUi();

  // Load products to pick from
  useEffect(() => {
    let active = true;
    async function fetchProducts() {
      setLoadingProducts(true);
      setProductsError(null);
      try {
        const res = await listProducts({ search, page: 1, pageSize: 20 });
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
    return () => {
      active = false;
    };
  }, [search]);

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

  async function handleCompleteSale() {
    setShowConfirm(false);
    setSubmitting(true);
    setSubmitError('');

    const itemsPayload = items
      .filter((it) => it.qty > 0)
      .map((it) => ({
        product_id: it.id,
        quantity: it.qty,
        unit_price: Number(it.price || 0),
      }));

    if (itemsPayload.length === 0) {
      setSubmitting(false);
      setSubmitError('Cart is empty.');
      return;
    }

    try {
      setPayment({ method: paymentMethod });
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
        setLastInvoice(res.data?.invoice_no || null);
        clearCart();
        addToast({ type: 'success', message: 'Sale completed successfully.' });
        // Optionally re-fetch products so stock reflects changes
        try {
          const latest = await listProducts({ search, page: 1, pageSize: 20 });
          if (!latest.error) setProducts(latest.data || []);
        } catch {
          // ignore
        }
      }
    } catch (err) {
      setSubmitError(getFriendlyError(err));
    } finally {
      setSubmitting(false);
    }
  }

  const paymentOptions = [
    { value: 'Cash', label: 'Cash' },
    { value: 'Card', label: 'Card' },
    { value: 'Online', label: 'Online' },
  ];

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="page-title">Point of Sale</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" onClick={clearCart}>Clear Cart</Button>
          <Button onClick={() => setShowConfirm(true)} disabled={items.length === 0 || submitting}>
            {submitting ? 'Processing…' : 'Complete Sale'}
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 12 }}>
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

        <div style={{ display: 'grid', gap: 12 }}>
          <Card>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Cart</div>
            <Table columns={cartColumns} data={cartRows} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 12 }}>
              <div>Subtotal: <strong>{formatCurrency(totals.subtotal)}</strong></div>
              <div>Total: <strong>{formatCurrency(totals.total)}</strong></div>
            </div>
            {submitError && <div className="badge error" style={{ marginTop: 8 }}>{submitError}</div>}
            {lastInvoice && (
              <div className="badge success" style={{ marginTop: 8 }}>
                Sale completed. Invoice {lastInvoice}
              </div>
            )}
          </Card>

          <Card>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Customer & Payment</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input
                placeholder="Customer name"
                value={customer.name}
                onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
              />
              <Input
                placeholder="Customer phone"
                value={customer.phone}
                onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
              />
              <Select options={paymentOptions} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} />
              <div />
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirm Sale"
      >
        <div>
          <p>Are you sure you want to complete this sale?</p>
          <p>Total: <strong>{formatCurrency(totals.total)}</strong></p>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Button onClick={handleCompleteSale} disabled={submitting}>Confirm</Button>
            <Button variant="ghost" onClick={() => setShowConfirm(false)}>Cancel</Button>
          </div>
        </div>
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
