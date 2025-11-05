import React from 'react';

// PUBLIC_INTERFACE
export default function Card({ children, style, ...props }) {
  /** This is a public function. */
  return (
    <div className="card" style={style} {...props}>
      {children}
    </div>
  );
}
