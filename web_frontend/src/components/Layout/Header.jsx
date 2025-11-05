import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../UI/Button';
import Input from '../UI/Input';
import { useUi } from '../../state/store';
import useAuth from '../../hooks/useAuth';
import { signOut } from '../../lib/api/auth';

// PUBLIC_INTERFACE
export default function Header() {
  /** This is a public function. App header with search and action buttons, plus toasts area. */
  const { toasts, removeToast, addToast } = useUi();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        addToast({ type: 'error', message: error.message || 'Failed to sign out' });
      } else {
        addToast({ type: 'success', message: 'Signed out' });
        navigate('/login');
      }
    } catch (err) {
      addToast({ type: 'error', message: err?.message || 'Failed to sign out' });
    }
  };

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
        {!user ? (
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <Button variant="ghost">Login</Button>
          </Link>
        ) : (
          <Button variant="ghost" onClick={handleSignOut}>Sign out</Button>
        )}
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
