// src/components/LoginForm.jsx
//
// Email + password login form for Knitspeed Stock Portal.
// Calls auth.signIn; useSession() picks up the change via the auth listener,
// so this component does NOT need to manage post-login state itself.

import { useState } from 'react';
import { signIn } from '../lib/auth';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setError(null);
    setSubmitting(true);

    const { error: signInError } = await signIn(email.trim(), password);

    if (signInError) {
      setError(signInError.message ?? 'Sign in failed.');
      setSubmitting(false);
      return;
    }

    // Success: useSession() listener handles the rest. No navigation here.
    // (Leave submitting=true so the button stays disabled until unmount.)
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>Knitspeed Stock Portal</h1>
        <p style={styles.subtitle}>Sign in to continue</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={submitting}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={submitting}
              style={styles.input}
            />
          </label>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" disabled={submitting} style={styles.button}>
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    background: '#f5f5f5',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    padding: 32,
    background: '#fff',
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 600,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 24,
    fontSize: 14,
    color: '#666',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: 13,
    fontWeight: 500,
    color: '#333',
    gap: 6,
  },
  input: {
    padding: '8px 10px',
    fontSize: 14,
    border: '1px solid #ccc',
    borderRadius: 4,
    outline: 'none',
  },
  error: {
    fontSize: 13,
    color: '#c00',
    background: '#fee',
    padding: '8px 10px',
    borderRadius: 4,
  },
  button: {
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 500,
    color: '#fff',
    background: '#1a73e8',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
  },
};
