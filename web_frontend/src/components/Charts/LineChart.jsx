import React from 'react';

// PUBLIC_INTERFACE
export default function LineChart({ width = 320, height = 160 }) {
  /** This is a public function. Placeholder chart area. */
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 12,
        border: '1px dashed rgba(17,24,39,0.15)',
        background: 'var(--color-surface)',
        display: 'grid',
        placeItems: 'center',
        color: '#6B7280'
      }}
    >
      Line Chart Placeholder
    </div>
  );
}
