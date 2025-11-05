import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

/**
 * PUBLIC_INTERFACE
 * ProtectedRoute
 * Guards routes that require authentication. If not authenticated, redirects to /signin.
 *
 * Props:
 *  - children: React.ReactNode to render if authenticated
 *
 * Behavior:
 *  - While loading auth state, renders a minimal loading indicator.
 *  - If unauthenticated, redirects to /signin with `from` state for post-login redirect.
 *  - If authenticated, renders children.
 */
// PUBLIC_INTERFACE
export default function ProtectedRoute({ children }) {
  /** This is a public function. */
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="page">
        <div className="card">
          <p style={{ color: '#6B7280' }}>Checking authentication…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  return children;
}
