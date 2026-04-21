// src/App.jsx
//
// Top-level gate. Reads useSession() and decides what to render:
//   loading   → spinner
//   no user   → <LoginForm />
//   signed in → <KnitspeedPortal session={session} />

import { useSession } from './lib/session';
import LoginForm from './components/LoginForm';
import KnitspeedPortal from './StockPortal.jsx';

export default function App() {
  const session = useSession();

  if (session.loading) {
    return (
      <div style={loadingStyle}>
        <div>Loading…</div>
      </div>
    );
  }

  if (!session.userId) {
    return <LoginForm />;
  }

  return <KnitspeedPortal session={session} />;
}

const loadingStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 14,
  color: '#666',
  fontFamily: 'system-ui, sans-serif',
};
