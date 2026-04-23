// src/components/ToastProvider.jsx
//
// App-wide toast bus. Any descendant component can call useToast() → showToast(msg, kind, duration).
// Renders one toast at a time in a fixed top-right region.
// Auto-dismisses after `duration` ms (default 3000 for success/info, 5000 for error).
//
// Kinds:
//   'success' — green check, 3s default
//   'error'   — red alert, 5s default
//   'info'    — neutral, 3s default
//
// Usage:
//   const { showToast } = useToast();
//   showToast('บันทึกแล้ว · Saved', 'success');
//   showToast('บันทึกไม่สำเร็จ: ' + err.message, 'error');

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Check, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Graceful fallback: if called outside provider, log and no-op instead of crashing.
    console.warn('[useToast] called outside <ToastProvider>. Toast ignored.');
    return { showToast: () => {}, dismiss: () => {} };
  }
  return ctx;
}

export default function ToastProvider({ children }) {
  const [toast, setToast] = useState(null); // { id, message, kind }
  const timerRef = useRef(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const dismiss = useCallback(() => {
    clearTimer();
    setToast(null);
  }, []);

  const showToast = useCallback((message, kind = 'info', duration = null) => {
    clearTimer();
    const id = Date.now();
    setToast({ id, message, kind });
    const autoMs = duration ?? (kind === 'error' ? 5000 : 3000);
    timerRef.current = setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr));
    }, autoMs);
  }, []);

  useEffect(() => () => clearTimer(), []);

  return (
    <ToastContext.Provider value={{ showToast, dismiss }}>
      {children}
      <ToastRegion toast={toast} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastRegion({ toast, onDismiss }) {
  if (!toast) return null;
  const { message, kind } = toast;

  const kindStyles = {
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-700',
      text: 'text-emerald-900',
      iconColor: 'text-emerald-700',
      Icon: Check,
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-700',
      text: 'text-red-900',
      iconColor: 'text-red-700',
      Icon: AlertTriangle,
    },
    info: {
      bg: 'bg-stone-50',
      border: 'border-stone-700',
      text: 'text-stone-900',
      iconColor: 'text-stone-700',
      Icon: Info,
    },
  };

  const s = kindStyles[kind] || kindStyles.info;
  const { Icon } = s;

  return (
    <div
      className="fixed top-4 right-4 z-[100] animate-slide-in-right"
      role="status"
      aria-live="polite"
    >
      <div
        className={`flex items-start gap-3 px-4 py-3 border-2 ${s.bg} ${s.border} ${s.text} shadow-lg min-w-[280px] max-w-md`}
      >
        <Icon size={18} strokeWidth={2} className={`shrink-0 mt-0.5 ${s.iconColor}`} />
        <div className="flex-1 text-sm font-medium">{message}</div>
        <button
          onClick={onDismiss}
          className={`shrink-0 ${s.iconColor} hover:opacity-70 transition`}
          aria-label="Dismiss"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>
      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right { animation: slide-in-right 0.25s ease-out; }
      `}</style>
    </div>
  );
}
