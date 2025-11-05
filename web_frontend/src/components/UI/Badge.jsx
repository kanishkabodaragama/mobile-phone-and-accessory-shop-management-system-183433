import React from 'react';

// PUBLIC_INTERFACE
export default function Badge({ children, variant = 'info', style }) {
  /** This is a public function. */
  const className = ['badge', variant].join(' ');
  return <span className={className} style={style}>{children}</span>;
}
