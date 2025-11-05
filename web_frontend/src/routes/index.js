import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../router/ProtectedRoute';
import SignIn from '../pages/Auth/SignIn';
import Dashboard from '../pages/Dashboard';
import ProductsList from '../pages/Products/List';
import SalesPOS from '../pages/Sales/POS';
import SalesOrders from '../pages/Sales/Orders';
import ServiceTickets from '../pages/Services/Tickets';
import CustomersList from '../pages/Customers/List';
import WarrantyCheck from '../pages/Warranties/Check';
import WarrantyClaims from '../pages/Warranties/Claims';
import ReportsOverview from '../pages/Reports/Overview';
import SalesReport from '../pages/Reports/SalesReport';
import InventoryReport from '../pages/Reports/InventoryReport';
import ServiceReport from '../pages/Reports/ServiceReport';

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
            <ProductsList />
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
        path="/sales/pos"
        element={
          <ProtectedRoute>
            <SalesPOS />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales/orders"
        element={
          <ProtectedRoute>
            <SalesOrders />
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
        path="/services/tickets"
        element={
          <ProtectedRoute>
            <ServiceTickets />
          </ProtectedRoute>
        }
      />
      <Route
        path="/services/*"
        element={<Navigate to="/services/tickets" replace />}
      />
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <CustomersList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/warranties"
        element={
          <ProtectedRoute>
            <WarrantyCheck />
          </ProtectedRoute>
        }
      />
      <Route
        path="/warranties/claims"
        element={
          <ProtectedRoute>
            <WarrantyClaims />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <ReportsOverview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/sales"
        element={
          <ProtectedRoute>
            <SalesReport />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/inventory"
        element={
          <ProtectedRoute>
            <InventoryReport />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/services"
        element={
          <ProtectedRoute>
            <ServiceReport />
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
