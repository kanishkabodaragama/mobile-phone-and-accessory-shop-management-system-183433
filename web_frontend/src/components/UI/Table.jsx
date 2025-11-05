import React from 'react';

// PUBLIC_INTERFACE
export default function Table({ columns = [], data = [] }) {
  /** This is a public function. */
  return (
    <table className="table">
      <thead>
        <tr>
          {columns.map(col => (
            <th key={col.key || col.accessor}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan={columns.length} style={{ textAlign: 'center', color: '#6B7280' }}>
              No data
            </td>
          </tr>
        ) : data.map((row, idx) => (
          <tr key={idx}>
            {columns.map(col => (
              <td key={col.key || col.accessor}>
                {typeof col.render === 'function' ? col.render(row) : row[col.accessor]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
