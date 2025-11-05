import React, { useMemo, useState } from 'react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Select from '../../components/UI/Select';
import Table from '../../components/UI/Table';
import Modal from '../../components/UI/Modal';
import Spinner from '../../components/UI/Spinner';
import useSupabaseTable from '../../hooks/useSupabaseTable';
import { deleteProduct } from '../../lib/api/products';
import ProductForm from './Form';

/**
 * PUBLIC_INTERFACE
 * ProductsList
 * Page showing products with search, category filter, pagination, and modal add/edit.
 * Gracefully handles missing Supabase configuration or missing 'products' table.
 */
// PUBLIC_INTERFACE
export default function ProductsList() {
  /** This is a public function. */
  const {
    data,
    count,
    loading,
    error,
    search,
    category,
    page,
    pageSize,
    setSearch,
    setCategory,
    setPage,
    setPageSize,
    refresh,
  } = useSupabaseTable({ pageSize: 10 });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize));

  const columns = useMemo(() => [
    { header: 'Name', accessor: 'name' },
    { header: 'SKU', accessor: 'sku' },
    { header: 'Category', accessor: 'category' },
    { header: 'Price', accessor: 'price', render: (r) => formatCurrency(r.price) },
    { header: 'Stock', accessor: 'stock' },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" onClick={() => handleEdit(row)}>Edit</Button>
          <Button variant="ghost" onClick={() => handleDelete(row)} aria-label={`Delete ${row.name}`}>Delete</Button>
        </div>
      )
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function handleEdit(row) {
    setEditing(row);
    setModalOpen(true);
  }

  async function handleDelete(row) {
    if (!window.confirm(`Delete product "${row.name}"?`)) return;
    const res = await deleteProduct(row.id);
    if (res?.error) {
      // eslint-disable-next-line no-alert
      alert(res.error?.message || 'Failed to delete.');
      return;
    }
    refresh();
  }

  function onFormClose(changed) {
    setModalOpen(false);
    setEditing(null);
    if (changed) refresh();
  }

  const categoryOptions = [
    { value: '', label: 'All categories' },
    { value: 'Phones', label: 'Phones' },
    { value: 'Accessories', label: 'Accessories' },
    { value: 'Services', label: 'Services' },
  ];

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="page-title">Products</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onClick={openCreate}>+ Add Product</Button>
        </div>
      </div>

      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.6fr', gap: 12, alignItems: 'center' }}>
          <Input
            placeholder="Search by name or SKU…"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
          <Select
            value={category}
            onChange={(e) => {
              setPage(1);
              setCategory(e.target.value);
            }}
            options={categoryOptions}
          />
          <Select
            value={String(pageSize)}
            onChange={(e) => {
              setPage(1);
              setPageSize(Number(e.target.value) || 10);
            }}
            options={[10, 20, 50].map(n => ({ value: String(n), label: `${n} / page` }))}
          />
        </div>
      </Card>

      <Card>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Spinner />
            <span style={{ color: '#6B7280' }}>Loading products…</span>
          </div>
        ) : error ? (
          <div className="badge error" style={{ display: 'inline-block' }}>
            {getFriendlyError(error)}
          </div>
        ) : (
          <>
            <Table columns={columns} data={data} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
              <div style={{ color: '#6B7280', fontSize: 14 }}>
                {count} item{count === 1 ? '' : 's'} • Page {page} of {totalPages}
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
        title={editing ? 'Edit Product' : 'Add Product'}
        footer={null}
      >
        <ProductForm
          initialValues={editing || undefined}
          onClose={onFormClose}
        />
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
  if (/table missing/i.test(m)) {
    return 'Products table is missing in Supabase. Please create the "products" table.';
  }
  return m || 'Failed to load.';
}
