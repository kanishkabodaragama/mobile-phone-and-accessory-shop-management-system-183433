import React, { useEffect } from 'react';
import { useUi } from '../../state/store';

/**
 * PUBLIC_INTERFACE
 * Toasts
 * Renders application toasts using the UI slice from the global store.
 *
 * Behavior:
 *  - Displays toasts stacked at the bottom-right.
 *  - Automatically dismisses each toast after its duration.
 *  - Allows manual dismissal by clicking the close button.
 *
 * Toast object shape in state.ui.toasts:
 *  { id, type: 'success'|'error'|'info'|'warning', message, duration }
 */
// PUBLIC_INTERFACE
export default function Toasts() {
  /** This is a public function. */
  const { toasts, removeToast } = useUi();

  useEffect(() => {
    // Set up timers for auto-dismiss for each toast
    const timers = toasts.map(t => {
      const duration = Number.isFinite(t.duration) ? t.duration : 3000;
      const id = setTimeout(() => removeToast(t.id), duration);
      return id;
    });
    return () => {
      timers.forEach(id => clearTimeout(id));
    };
  }, [toasts, removeToast]);

  if (!toasts?.length) return null;

  return (
    <div style={styles.container} aria-live="polite" aria-atomic="true">
      {toasts.map(t => (
        <div key={t.id} style={{ ...styles.toast, ...typeStyle(t.type) }}>
          <div style={styles.message}>{t.message}</div>
          <button
            onClick={() => removeToast(t.id)}
            style={styles.close}
            aria-label="Dismiss notification"
            title="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

function typeStyle(type) {
  switch (type) {
    case 'success':
      return { borderLeftColor: '#059669', background: '#ECFDF5' };
    case 'error':
      return { borderLeftColor: '#DC2626', background: '#FEF2F2' };
    case 'warning':
      return { borderLeftColor: '#F59E0B', background: '#FFFBEB' };
    default:
      return { borderLeftColor: '#1E3A8A', background: '#EFF6FF' };
  }
}

const styles = {
  container: {
    position: 'fixed',
    right: 16,
    bottom: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    zIndex: 1000,
  },
  toast: {
    minWidth: 260,
    maxWidth: 380,
    padding: '10px 12px',
    borderRadius: 8,
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
    borderLeft: '4px solid',
    color: '#111827',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  message: { fontSize: 14, lineHeight: 1.3, flex: 1 },
  close: {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 18,
    color: '#6B7280',
    lineHeight: 1,
  },
};
