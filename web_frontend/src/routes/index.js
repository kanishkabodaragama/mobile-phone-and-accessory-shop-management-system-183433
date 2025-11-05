import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../router/ProtectedRoute';
import SignIn from '../pages/Auth/SignIn';
import Dashboard from '../pages/Dashboard';

// PUBLIC_INTERFACE
export default function AppRoutes() {
  /** This is a public function. Renders application routes with auth protection on core modules. */
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Public route */}
      <Route path="/signin" element={<SignIn />} />

      {/* Protected application routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <Page title="Products" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales"
        element={
          <ProtectedRoute>
            <Page title="Sales" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/services"
        element={
          <ProtectedRoute>
            <Page title="Services & Repairs" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <Page title="Customers" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/warranties"
        element={
          <ProtectedRoute>
            <Page title="Warranties" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Page title="Reports & Analytics" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Page title="Settings" />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
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
