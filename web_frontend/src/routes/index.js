import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// PUBLIC_INTERFACE
export default function AppRoutes() {
  /** This is a public function. Renders route placeholders for core modules. */
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Page title="Dashboard" />} />
      <Route path="/products" element={<Page title="Products" />} />
      <Route path="/sales" element={<Page title="Sales" />} />
      <Route path="/services" element={<Page title="Services & Repairs" />} />
      <Route path="/customers" element={<Page title="Customers" />} />
      <Route path="/warranties" element={<Page title="Warranties" />} />
      <Route path="/reports" element={<Page title="Reports & Analytics" />} />
      <Route path="/settings" element={<Page title="Settings" />} />
      <Route path="*" element={<Page title="Not Found" />} />
    </Routes>
  );
}

function Page({ title }) {
  return (
    <div className="page">
      <div className="page-title">{title}</div>
      <div className="card">
        <p>Placeholder content for {title}.</p>
      </div>
    </div>
  );
}
