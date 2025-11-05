import React from 'react';

// PUBLIC_INTERFACE
export default function Select({ options = [], style, ...props }) {
  /** This is a public function. */
  return (
    <select className="select" style={style} {...props}>
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
