// src/hooks/useOrderItemQuantity.js
//
// Item 3c — Quantity-edit mutation hook for order_items.
//
// Exposes:
//   - updateItemQuantity(itemId, { rolls_ordered, kg_ordered, reason, note })
//       → writes to DB (optimistic caller)
//   - REASON_META     : Thai/EN labels per reason enum value
//   - REASON_VALUES   : array of enum keys for building dropdowns
//   - isStatusEditable(status) : whether a line item in this status can be qty-edited
//
// DB behavior (per migration 20260422145837_fabric_location_pivot.sql):
//   - The BEFORE-trigger stamps quantity_changed_at = now() when
//     rolls_ordered OR kg_ordered changes.
//   - quantity_changed_by is NOT stamped by the trigger; the client writes it.
//   - quantity_change_reason has a CHECK constraint enforcing the 4-value enum.
//
// Callers are expected to do their own local optimistic update + rollback
// on error (see useSalesOrders.patchItemQty).
// This hook is pure DB-write; it doesn't hold state.

import { supabase } from '../lib/supabase';

// ─────────────────────────────────────────────────────────────
// Reason metadata — single source of truth for dropdown rendering.
// Matches DB check constraint on quantity_change_reason.
// ─────────────────────────────────────────────────────────────
export const REASON_META = {
  typo:             { label: 'พิมพ์ผิด',         labelEn: 'Typo' },
  shortage:         { label: 'สต็อกไม่พอ',       labelEn: 'Shortage — reduced to available' },
  customer_request: { label: 'ลูกค้าขอเปลี่ยน',   labelEn: 'Customer request' },
  other:            { label: 'อื่นๆ',              labelEn: 'Other' },
};

export const REASON_VALUES = Object.keys(REASON_META);

// ─────────────────────────────────────────────────────────────
// Edit-eligibility rule.
//
// Rationale: once a line item is shipped, delivered, or cancelled, the
// physical state of the fabric is no longer in sync with the order_items
// record. Editing quantity at that point corrupts the audit trail. Recovery
// path for mistakes on shipped items is a new compensating order.
//
// Active-edit states: ordered, in_stock, at_dyeing, raw_short, partial.
// Blocked states:     shipped, delivered, cancelled.
// ─────────────────────────────────────────────────────────────
const LOCKED_STATUSES = new Set(['shipped', 'delivered', 'cancelled']);

export function isStatusEditable(status) {
  return !LOCKED_STATUSES.has(status);
}

/**
 * Returns the full reason meta object, falling back to a raw-value display
 * so the UI never crashes on an unknown enum value.
 */
export function getReasonMeta(reason) {
  return REASON_META[reason] ?? {
    label: reason,
    labelEn: reason,
  };
}

/**
 * Write quantity changes to an order_items row.
 * Also writes quantity_changed_by = current auth user for audit trail.
 * The DB trigger stamps quantity_changed_at automatically when rolls_ordered
 * or kg_ordered changes.
 *
 * @param {string} itemId — uuid of the order_items row
 * @param {object} payload
 * @param {number|null} payload.rolls_ordered — new rolls count (null clears)
 * @param {number|null} payload.kg_ordered    — new kg count (null clears)
 * @param {string} payload.reason             — must be a key of REASON_META
 * @param {string} [payload.note]             — optional free-text appended to item.note
 * @returns {Promise<{ error: Error|null }>}
 */
export async function updateItemQuantity(itemId, { rolls_ordered, kg_ordered, reason, note }) {
  // ─── Validation ─────────────────────────────────────────────
  if (!REASON_META[reason]) {
    return { error: new Error(`Invalid reason: ${reason}`) };
  }

  // Normalize: empty string or undefined → null. Otherwise must be a non-negative number.
  const normRolls = normalizeQty(rolls_ordered);
  const normKg    = normalizeQty(kg_ordered);

  if (normRolls.error) return { error: new Error(`rolls_ordered: ${normRolls.error}`) };
  if (normKg.error)    return { error: new Error(`kg_ordered: ${normKg.error}`) };

  // ─── Auth ─────────────────────────────────────────────────
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) return { error: sessionError };

  const userId = sessionData?.session?.user?.id ?? null;
  if (!userId) return { error: new Error('Not signed in') };

  // ─── Write ────────────────────────────────────────────────
  const update = {
    rolls_ordered: normRolls.value,
    kg_ordered: normKg.value,
    quantity_changed_by: userId,
    quantity_change_reason: reason,
  };

  // Optional note append — only touch note column if caller provided one.
  // We append rather than overwrite so existing provenance (e.g. urgency flags)
  // is preserved. Caller can pass a cleared-context note if they want replacement.
  if (note !== undefined && note !== null) {
    // Fetch current note to append. One extra round-trip; acceptable for edit frequency.
    const { data: current, error: fetchErr } = await supabase
      .from('order_items')
      .select('note')
      .eq('id', itemId)
      .single();
    if (fetchErr) return { error: fetchErr };

    const existingNote = current?.note?.trim() ?? '';
    const newNote = note.trim();
    update.note = existingNote
      ? `${existingNote}\n[${new Date().toISOString().slice(0, 10)}] ${newNote}`
      : newNote;
  }

  const { error } = await supabase
    .from('order_items')
    .update(update)
    .eq('id', itemId);

  return { error };
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function normalizeQty(raw) {
  if (raw === null || raw === undefined || raw === '') {
    return { value: null };
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    return { error: 'must be a number' };
  }
  if (n < 0) {
    return { error: 'must be ≥ 0' };
  }
  return { value: n };
}
