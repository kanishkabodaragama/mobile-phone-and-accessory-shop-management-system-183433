import React from 'react';

// PUBLIC_INTERFACE
export default function Input({ style, ...props }) {
  /** This is a public function. */
  return <input className="input" style={style} {...props} />;
}
