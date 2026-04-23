// src/App.jsx
//
// Top-level gate. Reads useSession() and decides what to render:
//   loading   → spinner
//   no user   → <LoginForm />
//   signed in → <KnitspeedPortal session={session} />
//
// v0.7.4: ToastProvider wraps everything so any descendant can call useToast().

import { useSession } from './lib/session';
import LoginForm from './components/LoginForm';
import KnitspeedPortal from './StockPortal.jsx';
import ToastProvider from './components/ToastProvider';

export default function App() {
  const session = useSession();

  if (session.loading) {
    return (
      <div style={loadingStyle}>
        <div>Loading…</div>
      </div>
    );
  }

  return (
    <ToastProvider>
      {!session.userId ? <LoginForm /> : <KnitspeedPortal session={session} />}
    </ToastProvider>
  );
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
