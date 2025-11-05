import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';
import { signInWithPassword } from '../../lib/api/auth';

/**
 * PUBLIC_INTERFACE
 * SignIn
 * Simple email/password sign-in page that uses Supabase auth helpers.
 *
 * On successful sign-in, navigates to the route provided in location.state.from
 * or defaults to /dashboard.
 */
// PUBLIC_INTERFACE
export default function SignIn() {
  /** This is a public function. */
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const { error } = await signInWithPassword({ email, password });
      if (error) {
        setErrorMsg(error.message || 'Failed to sign in.');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Unexpected error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 480, margin: '10vh auto' }}>
      <div className="page-title">Sign in</div>
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
        <div style={{ marginTop: 12, fontSize: 14, color: '#6B7280' }}>
          Forgot password? <Link to="#" style={{ color: 'var(--color-primary)' }}>Contact admin</Link>
        </div>
      </Card>
    </div>
  );
}
