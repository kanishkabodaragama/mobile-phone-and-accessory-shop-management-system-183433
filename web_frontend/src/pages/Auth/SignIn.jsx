import React from 'react';
import Login from './Login';

/**
 * PUBLIC_INTERFACE
 * SignIn (compat wrapper)
 * Thin wrapper that renders the new Login component to maintain backward compatibility.
 */
// PUBLIC_INTERFACE
export default function SignIn() {
  /** This is a public function. */
  return <Login />;
}
