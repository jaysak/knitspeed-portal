// src/components/StatusChip.jsx
//
// Item 2 — Clickable status chip for order_items.
//
// Provider: click → dropdown of valid transitions → optimistic update.
// Customer: read-only pill (no interactions).
//
// Caller supplies:
//   - status     : current status string (required)
//   - canEdit    : boolean, true for provider (required)
//   - onChange   : async (newStatus) => { ok: boolean, error?: Error }
//                  Parent owns the mutation + optimistic update + rollback.
//                  Returning { ok: false } keeps the chip in its previous
//                  visual state; { ok: true } commits.
//
// Design notes:
//   - No internal DB call. Parent controls the write via onChange.
//   - During pending write: chip shows spinner overlay, menu disabled.
//   - Click-outside closes menu without firing.
//   - Escape key closes menu.

import { useState, useRef, useEffect } from 'react';
import { Loader, ChevronDown } from 'lucide-react';
import { getStatusMeta, getValidTransitions } from '../hooks/useOrderItemStatus';

export default function StatusChip({ status, canEdit, onChange }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const ref = useRef(null);

  // Click-outside + escape handling.
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const handleKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const meta = getStatusMeta(status);
  const transitions = canEdit ? getValidTransitions(status) : [];
  const hasTransitions = transitions.length > 0;

  // Read-only pill for customer or for providers on terminal-ish statuses.
  if (!canEdit || !hasTransitions) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono uppercase tracking-widest ${meta.bg} ${meta.fg}`}>
        <span>{meta.label}</span>
      </span>
    );
  }

  const handleSelect = async (nextStatus) => {
    if (pending) return;
    setOpen(false);
    setPending(true);
    try {
      const result = await onChange(nextStatus);
      if (!result?.ok) {
        // Parent handles rollback; we just surface the failure briefly.
        console.error('[StatusChip] update failed:', result?.error);
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono uppercase tracking-widest ${meta.bg} ${meta.fg} border-2 border-transparent hover:border-stone-900 transition-all disabled:opacity-50 disabled:cursor-wait`}
      >
        {pending ? (
          <Loader size={11} className="animate-spin" />
        ) : null}
        <span>{meta.label}</span>
        <ChevronDown size={11} strokeWidth={2.5} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 min-w-[140px] bg-stone-50 border-2 border-stone-900 shadow-lg z-20">
          <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-stone-500 border-b border-stone-200">
            เปลี่ยนเป็น · Move to
          </div>
          {transitions.map((nextStatus) => {
            const nextMeta = getStatusMeta(nextStatus);
            return (
              <button
                key={nextStatus}
                onClick={() => handleSelect(nextStatus)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-stone-100 transition-colors"
              >
                <span className={`w-3 h-3 shrink-0 ${nextMeta.bg}`} />
                <span className="text-sm text-stone-900">{nextMeta.label}</span>
                <span className="ml-auto text-[10px] font-mono text-stone-400 uppercase tracking-widest">
                  {nextMeta.labelEn}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
