import React from 'react';
import Button from '../UI/Button';
import Input from '../UI/Input';

// PUBLIC_INTERFACE
export default function Header() {
  /** This is a public function. App header with search and action buttons. */
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>Ocean POS</div>
        <Input placeholder="Quick search..." style={{ width: 280 }} />
      </div>
      <div className="actions">
        <Button variant="ghost">New Sale</Button>
        <Button>+ Add Product</Button>
      </div>
    </>
  );
}
