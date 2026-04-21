// src/AuthSmokeTest.jsx
// THROWAWAY — delete after Session B verification.

import { useState } from 'react';
import { signIn, signOut, getSession, getProfile, getRoles } from './lib/auth';
import { useSession } from './lib/session';

export default function AuthSmokeTest() {
  const session = useSession();
  const [email, setEmail] = useState('jaysak+knitspeed-gift@gmail.com');
  const [password, setPassword] = useState('');
  const [log, setLog] = useState([]);

  const append = (label, value) => {
    setLog((prev) => [
      ...prev,
      `${label}: ${JSON.stringify(value, null, 2)}`,
    ]);
  };

  const handleSignIn = async () => {
    setLog([]);
    const result = await signIn(email, password);
    append('signIn', result);

    const raw = await getSession();
    append('getSession', raw);

    if (raw?.user) {
      const profile = await getProfile(raw.user.id);
      const roles = await getRoles(raw.user.id);
      append('profile', profile);
      append('roles', roles);
    }
  };

  const handleSignOut = async () => {
    const result = await signOut();
    append('signOut', result);
  };

  return (
    <div style={{ padding: 20, fontFamily: 'monospace', maxWidth: 700 }}>
      <h2>Auth Smoke Test</h2>

      <div style={{ marginBottom: 12 }}>
        <strong>useSession() →</strong>
        <pre style={{ background: '#f4f4f4', padding: 8 }}>
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: 12 }}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', marginBottom: 4 }}
          placeholder="email"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', marginBottom: 4 }}
          placeholder="password"
        />
        <button onClick={handleSignIn}>Sign In</button>
        <button onClick={handleSignOut} style={{ marginLeft: 8 }}>
          Sign Out
        </button>
      </div>

      <pre style={{ background: '#222', color: '#0f0', padding: 8, fontSize: 12 }}>
        {log.join('\n\n')}
      </pre>
    </div>
  );
}
