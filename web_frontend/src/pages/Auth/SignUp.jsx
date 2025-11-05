import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';
import { signUpWithPassword } from '../../lib/api/auth';
import { useUi } from '../../state/store';

/**
 * PUBLIC_INTERFACE
 * SignUp
 * Email/password sign-up with confirm password. Uses Supabase auth.
 *
 * Behavior:
 * - Displays success toast and guidance on email verification (if enabled).
 * - On successful sign-up, navigates to /login.
 * - Shows friendly errors inline and via toast.
 */
// PUBLIC_INTERFACE
export default function SignUp() {
  /** This is a public function. */
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const navigate = useNavigate();
  const { addToast } = useUi();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    if (password !== confirm) {
      const msg = 'Passwords do not match.';
      setErrorMsg(msg);
      addToast({ type: 'error', message: msg });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error, emailConfirmationSent } = await signUpWithPassword({
        email,
        password,
      });

      if (error) {
        const msg = error.message || 'Failed to sign up.';
        setErrorMsg(msg);
        addToast({ type: 'error', message: msg });
      } else {
        if (emailConfirmationSent) {
          const msg =
            'Account created. Please check your email to confirm your address before logging in.';
          setInfoMsg(msg);
          addToast({ type: 'success', message: 'Sign-up successful. Verification email sent.' });
        } else {
          addToast({ type: 'success', message: 'Sign-up successful.' });
        }
        // Navigate to login regardless; user may need to verify before login.
        setTimeout(() => navigate('/login'), 600);
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
      <div className="page-title">Create your account</div>
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
              minLength={6}
            />
          </label>
          <label>
            <div style={{ fontSize: 14, marginBottom: 6 }}>Confirm password</div>
            <Input
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
            />
          </label>

          {errorMsg && (
            <div className="badge error" style={{ alignSelf: 'start' }}>
              {errorMsg}
            </div>
          )}
          {infoMsg && (
            <div className="badge" style={{ alignSelf: 'start', background: '#EFF6FF', color: '#1E3A8A' }}>
              {infoMsg}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Sign up'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate('/login')}>
              Back to login
            </Button>
          </div>
        </form>

        <div style={{ marginTop: 12, fontSize: 14, color: '#6B7280' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary)' }}>
            Sign in
          </Link>
        </div>
      </Card>
    </div>
  );
}
