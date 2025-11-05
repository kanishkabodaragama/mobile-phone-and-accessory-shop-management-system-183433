import React from 'react';

// PUBLIC_INTERFACE
export default function Modal({ open, onClose, title, children, footer }) {
  /** This is a public function. */
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        {title && <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>}
        <div>{children}</div>
        {footer && <div style={{ marginTop: 12 }}>{footer}</div>}
        <button className="btn ghost" style={{ marginTop: 12 }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
