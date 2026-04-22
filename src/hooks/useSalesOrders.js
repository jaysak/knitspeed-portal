import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useSalesOrders() {
  const [orders, setOrders] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          id,
          order_ref,
          destination,
          urgency,
          status,
          notes,
          created_at,
          customers ( display_name, customer_code ),
          order_items (
            id,
            stock_sku,
            shade,
            rolls_ordered,
            kg_ordered,
            price_per_kg,
            status,
            note
          )
        `)
        .order('created_at', { ascending: false })
      if (fetchError) throw fetchError
      const shaped = (data || []).map(o => ({
        id: o.id,
        order_ref: o.order_ref,
        destination: o.destination,
        urgency: o.urgency,
        status: o.status,
        notes: o.notes,
        created_at: o.created_at,
        created_display: o.created_at
          ? new Date(o.created_at).toLocaleString('th-TH', {
              year: 'numeric', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })
          : '—',
        customer_name: o.customers?.display_name || '—',
        customer_code: o.customers?.customer_code || '',
        items: (o.order_items || []).map(it => ({
          id: it.id,
          sku: it.stock_sku,
          shade: it.shade,
          rolls: it.rolls_ordered || 0,
          kg: it.kg_ordered || 0,
          price_per_kg: it.price_per_kg || 0,
          status: it.status,
          note: it.note
        })),
        total_rolls: (o.order_items || []).reduce(
          (sum, it) => sum + (it.rolls_ordered || 0), 0
        )
      }))
      setOrders(shaped)
    } catch (err) {
      console.error('Error fetching sales orders:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrders() }, [])

  // ─────────────────────────────────────────────────────────
  // Item 2 — optimistic local patches.
  // These mutate the in-memory orders array without re-fetching.
  // Callers (StatusChip) wrap the DB write around them:
  //   1. patchItemStatus(id, newStatus)     ← optimistic UI
  //   2. await updateItemStatus(id, newStatus)
  //   3. if error: patchItemStatus(id, oldStatus) ← rollback
  //
  // Note: this does NOT recompute the parent order.status. That's
  // derived by a DB trigger (orders.status trigger from the v0.6.0
  // pivot migration). A full refresh() picks up the authoritative
  // aggregated value; between flips the parent chip may lag by one
  // click, which is acceptable.
  // ─────────────────────────────────────────────────────────
  const patchItemStatus = (itemId, newStatus) => {
    setOrders(prev => {
      if (!prev) return prev
      return prev.map(o => ({
        ...o,
        items: o.items.map(it =>
          it.id === itemId ? { ...it, status: newStatus } : it
        ),
      }))
    })
  }

  return { orders, loading, error, refresh: fetchOrders, patchItemStatus }
}
