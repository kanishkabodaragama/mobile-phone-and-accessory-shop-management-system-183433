import React from 'react';

// PUBLIC_INTERFACE
export default function Spinner({ size = 18, color = 'var(--color-primary)' }) {
  /** This is a public function. */
  const style = {
    width: size,
    height: size,
    border: `${Math.max(2, Math.round(size/9))}px solid rgba(17,24,39,0.12)`,
    borderTopColor: color,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };
  return <span style={style} role="progressbar" aria-label="loading" />;
}
