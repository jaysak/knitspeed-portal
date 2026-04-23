// src/components/OrderItemQtyEditModal.jsx
//
// Item 3c — Edit rolls_ordered + kg_ordered on an order_items row.
//
// Opened from OrderCard's per-item row. Provider-only (caller gates visibility).
//
// Fields:
//   - rolls (number, optional, ≥0) — current rolls_ordered
//   - kg    (number, optional, ≥0) — current kg_ordered
//   - reason (required dropdown)   — typo | shortage | customer_request | other
//   - note   (optional free text)  — appended to item.note with ISO date prefix
//
// Behavior:
//   - Submit disabled until reason is chosen AND at least one of rolls/kg differs
//     from original (prevents no-op writes).
//   - DB trigger stamps quantity_changed_at; hook writes quantity_changed_by +
//     quantity_change_reason explicitly.
//   - After successful save: onSaved(newValues) → parent handles optimistic patch
//     + refresh + toast.

import { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { updateItemQuantity, REASON_VALUES, REASON_META } from '../hooks/useOrderItemQuantity';

export default function OrderItemQtyEditModal({ item, orderRef, onClose, onSaved }) {
  // Seed from DB values (which may be null for kg on historical rows).
  // Empty string input state is how we represent "cleared"; convert back to null on save.
  const [rolls,  setRolls]  = useState(item.rolls_ordered ?? '');
  const [kg,     setKg]     = useState(item.kg_ordered ?? '');
  const [reason, setReason] = useState('');
  const [note,   setNote]   = useState('');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);

  const originalRolls = item.rolls_ordered ?? null;
  const originalKg    = item.kg_ordered ?? null;

  const changed = useMemo(() => {
    const normRolls = rolls === '' ? null : Number(rolls);
    const normKg    = kg    === '' ? null : Number(kg);
    return normRolls !== originalRolls || normKg !== originalKg;
  }, [rolls, kg, originalRolls, originalKg]);

  const canSubmit = changed && reason !== '' && !saving;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);

    const { error: err } = await updateItemQuantity(item.id, {
      rolls_ordered: rolls === '' ? null : Number(rolls),
      kg_ordered:    kg    === '' ? null : Number(kg),
      reason,
      note: note.trim() || undefined,
    });

    if (err) {
      setError(err.message || String(err));
      setSaving(false);
      return;
    }

    setSaving(false);
    onSaved?.({
      rolls_ordered: rolls === '' ? null : Number(rolls),
      kg_ordered:    kg    === '' ? null : Number(kg),
      reason,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border-2 border-stone-900 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-stone-900 text-stone-50 px-4 py-3 flex items-center justify-between">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-stone-400">
              แก้จำนวน · Edit Quantity
            </div>
            <div className="text-sm mt-0.5">
              {orderRef} · {item.shade}
              <span className="ml-2 text-xs text-stone-400 font-mono">{item.sku}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-300 hover:text-stone-50 transition"
            aria-label="Close"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Rolls + Kg inputs side-by-side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-stone-600 mb-1">
                พับ · Rolls
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={rolls}
                onChange={(e) => setRolls(e.target.value)}
                className="w-full border-2 border-stone-300 px-2 py-1.5 font-mono text-sm focus:border-stone-900 focus:outline-none"
                placeholder="—"
              />
              {originalRolls !== null && (
                <div className="text-[10px] text-stone-500 mt-0.5 font-mono">
                  เดิม · was: {originalRolls}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-stone-600 mb-1">
                กก · Kg
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={kg}
                onChange={(e) => setKg(e.target.value)}
                className="w-full border-2 border-stone-300 px-2 py-1.5 font-mono text-sm focus:border-stone-900 focus:outline-none"
                placeholder="—"
              />
              {originalKg !== null && (
                <div className="text-[10px] text-stone-500 mt-0.5 font-mono">
                  เดิม · was: {originalKg}
                </div>
              )}
            </div>
          </div>

          {/* Reason dropdown (required) */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-stone-600 mb-1">
              เหตุผล · Reason <span className="text-red-600">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border-2 border-stone-300 px-2 py-1.5 text-sm focus:border-stone-900 focus:outline-none bg-white"
            >
              <option value="">— เลือก · select —</option>
              {REASON_VALUES.map((v) => (
                <option key={v} value={v}>
                  {REASON_META[v].label} · {REASON_META[v].labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Note (optional) */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-stone-600 mb-1">
              หมายเหตุ · Note <span className="text-stone-400">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full border-2 border-stone-300 px-2 py-1.5 text-sm focus:border-stone-900 focus:outline-none resize-none"
              placeholder="เช่น: ลูกค้าแจ้งใน LINE เวลา 14:00"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 px-2 py-1.5 font-mono">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-stone-200 px-4 py-3 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-mono uppercase tracking-widest text-stone-600 hover:text-stone-900 transition"
          >
            ยกเลิก · Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-4 py-1.5 text-xs font-mono uppercase tracking-widest bg-stone-900 text-stone-50 hover:bg-stone-700 disabled:bg-stone-300 disabled:cursor-not-allowed transition"
          >
            {saving ? 'กำลังบันทึก…' : 'บันทึก · Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
