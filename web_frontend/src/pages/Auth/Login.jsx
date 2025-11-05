import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';
import { signInWithPassword } from '../../lib/api/auth';
import { useUi } from '../../state/store';

/**
 * PUBLIC_INTERFACE
 * Login
 * Dedicated login page for email/password sign-in using Supabase.
 *
 * Behavior:
 * - On success, redirects to the `from` location or /dashboard and shows a success toast.
 * - On error, shows an inline error message and an error toast.
 * - Provides a link to /signup for new users.
 */
// PUBLIC_INTERFACE
export default function Login() {
  /** This is a public function. */
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useUi();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const { error } = await signInWithPassword({ email, password });
      if (error) {
        const msg = error.message || 'Failed to sign in.';
        setErrorMsg(msg);
        addToast({ type: 'error', message: msg });
      } else {
        addToast({ type: 'success', message: 'Signed in successfully.' });
        navigate(from, { replace: true });
      }
    } catch (err) {
      const msg = err?.message || 'Unexpected error.';
      setErrorMsg(msg);
      addToast({ type: 'error', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 480, margin: '10vh auto' }}>
      <div className="page-title">Login</div>
      <Card>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <label>
            <div style={{ fontSize: 14, marginBottom: 6 }}>Email</div>
            <Input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </label>
          <label>
            <div style={{ fontSize: 14, marginBottom: 6 }}>Password</div>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {errorMsg && (
            <div className="badge error" style={{ alignSelf: 'start' }}>
              {errorMsg}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate('/')}>
              Cancel
            </Button>
          </div>
        </form>

        <div style={{ marginTop: 12, fontSize: 14 }}>
          <span style={{ color: '#6B7280' }}>New here?</span>{' '}
          <Link to="/signup" style={{ color: 'var(--color-primary)' }}>
            Create an account
          </Link>
        </div>
      </Card>
    </div>
  );
}
