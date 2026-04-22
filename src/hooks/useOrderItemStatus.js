// src/hooks/useOrderItemStatus.js
//
// Item 2 — Status-write mutation hook for order_items.
//
// Exposes:
//   - updateItemStatus(itemId, newStatus) → writes to DB (optimistic caller)
//   - STATUS_META : color + Thai label per status value
//   - VALID_TRANSITIONS : allowed next-statuses per current status
//
// DB behavior (per migration 20260422145837_fabric_location_pivot.sql):
//   - The BEFORE-trigger stamps status_changed_at = now() on status change.
//   - status_changed_by is NOT stamped by the trigger; the client writes it.
//
// Callers are expected to do their own local optimistic update + rollback
// on error (see useSalesOrders.patchItemStatus + StatusChip.jsx).
// This hook is pure DB-write; it doesn't hold state.

import { supabase } from '../lib/supabase';

// ─────────────────────────────────────────────────────────────
// Status metadata — single source of truth for chip rendering.
// ─────────────────────────────────────────────────────────────
export const STATUS_META = {
  ordered:    { label: 'สั่งแล้ว',    labelEn: 'Ordered',    bg: 'bg-stone-400',   fg: 'text-stone-50' },
  at_dyeing:  { label: 'อยู่โรงย้อม', labelEn: 'At dyeing',  bg: 'bg-rose-400',    fg: 'text-stone-900' },
  raw_short:  { label: 'ด้ายขาด',     labelEn: 'Raw short',  bg: 'bg-red-700',     fg: 'text-stone-50' },
  in_stock:   { label: 'พร้อมส่ง',    labelEn: 'In stock',   bg: 'bg-emerald-600', fg: 'text-stone-50' },
  partial:    { label: 'บางส่วน',     labelEn: 'Partial',    bg: 'bg-amber-500',   fg: 'text-stone-900' },
  shipped:    { label: 'ส่งแล้ว',     labelEn: 'Shipped',    bg: 'bg-sky-700',     fg: 'text-stone-50' },
  delivered:  { label: 'ถึงลูกค้า',   labelEn: 'Delivered',  bg: 'bg-stone-900',   fg: 'text-stone-50' },
  cancelled:  { label: 'ยกเลิก',      labelEn: 'Cancelled',  bg: 'bg-stone-300',   fg: 'text-stone-600' },
};

// ─────────────────────────────────────────────────────────────
// Transition rules — FORWARD-ONLY.
//
// Rationale: status_changed_at is a research-grade audit signal feeding
// the PhD validation pillar. Undo paths corrupt that signal — a "delivered"
// timestamp from a click that gets undone 30 seconds later lies about
// when delivery actually happened.
//
// Mistakes are recovered by:
//   - Cancel + new order (most cases)
//   - Manual DB fix by admin (rare, 3-staff shop)
//
// Exception: at_dyeing ↔ raw_short is bidirectional. Both represent
// "fabric is being prepared," and dye-house workflow legitimately moves
// between them when raw materials arrive late.
// ─────────────────────────────────────────────────────────────
export const VALID_TRANSITIONS = {
  ordered:   ['at_dyeing', 'raw_short', 'cancelled'],
  at_dyeing: ['in_stock', 'raw_short', 'cancelled'],
  raw_short: ['at_dyeing', 'cancelled'],
  in_stock:  ['shipped', 'partial', 'cancelled'],
  partial:   ['shipped', 'delivered'],
  shipped:   ['delivered'],
  delivered: [],   // terminal
  cancelled: [],   // terminal
};

/**
 * Returns the full meta object for a status, falling back to a neutral
 * gray for unknown values so the UI never crashes on a rogue string.
 */
export function getStatusMeta(status) {
  return STATUS_META[status] ?? {
    label: status,
    labelEn: status,
    bg: 'bg-stone-200',
    fg: 'text-stone-600',
  };
}

/**
 * Returns the list of valid next-statuses for the current status.
 * Empty array if the status is unknown or terminal.
 */
export function getValidTransitions(currentStatus) {
  return VALID_TRANSITIONS[currentStatus] ?? [];
}

/**
 * Write a new status to an order_items row.
 * Also writes status_changed_by = current auth user for audit trail.
 * The DB trigger stamps status_changed_at automatically.
 *
 * @param {string} itemId    — uuid of the order_items row
 * @param {string} newStatus — must be a key of STATUS_META
 * @returns {Promise<{ error: Error|null }>}
 */
export async function updateItemStatus(itemId, newStatus) {
  if (!STATUS_META[newStatus]) {
    return { error: new Error(`Invalid status: ${newStatus}`) };
  }

  // Get current user id for audit trail.
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) return { error: sessionError };

  const userId = sessionData?.session?.user?.id ?? null;
  if (!userId) return { error: new Error('Not signed in') };

  const { error } = await supabase
    .from('order_items')
    .update({
      status: newStatus,
      status_changed_by: userId,
    })
    .eq('id', itemId);

  return { error };
}
