import React from 'react';

// PUBLIC_INTERFACE
export default function Button({ children, variant = 'primary', style, ...props }) {
  /** This is a public function. */
  const className = ['btn', variant === 'secondary' ? 'secondary' : '', variant === 'ghost' ? 'ghost' : '']
    .filter(Boolean)
    .join(' ');
  return (
    <button className={className} style={style} {...props}>
      {children}
    </button>
  );
}
