import React, { useEffect } from 'react';
import Button from '../UI/Button';
import Input from '../UI/Input';
import { useUi } from '../../state/store';

// PUBLIC_INTERFACE
export default function Header() {
  /** This is a public function. App header with search and action buttons, plus toasts area. */
  const { toasts, removeToast } = useUi();

  useEffect(() => {
    const timers = toasts.map(t =>
      setTimeout(() => removeToast(t.id), t.duration ?? 3000)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, removeToast]);

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

      <div className="toasts" style={{ position: 'fixed', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 9999 }}>
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`} style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', borderRadius: 6, padding: '8px 12px' }}>
            {t.message}
          </div>
        ))}
      </div>
    </>
  );
}
