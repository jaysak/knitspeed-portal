// src/hooks/useCart.js
// Cart submission hook for buyer-side order placement.
// Writes to orders + order_items tables in Supabase.

import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getCurrentSession } from '../lib/session';
import { generateOrderRef } from '../lib/orderRef';

// cartKey helpers — single source of truth for how cart keys encode stock rows
export const makeCartKey = (sku, shade, price) =>
  `${sku}__${shade}__${price ?? ''}`;

export const parseCartKey = (key) => {
  const [sku, shade, price] = key.split('__');
  return { sku, shade, price: price ? parseFloat(price) : null };
};

export function useCartSubmit() {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [lastOrderRef, setLastOrderRef] = useState(null);

  const submit = useCallback(async ({ cart, destination, urgency, notes }) => {
    const session = getCurrentSession();
    if (!session.customer_id) {
      throw new Error('No customer_id in session. Set it in src/lib/session.js');
    }
    if (!destination?.trim()) throw new Error('Destination required');

    // Flatten cart object to line items
    const lines = Object.entries(cart)
      .filter(([_, rolls]) => rolls > 0)
      .map(([key, rolls]) => {
        const { sku, shade, price } = parseCartKey(key);
        return { sku, shade, price_per_kg: price, rolls };
      });

    if (lines.length === 0) throw new Error('Cart is empty');

    setSubmitting(true);
    setSubmitError(null);

    try {
      const orderRef = await generateOrderRef();

      // 1. Insert order header
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          order_ref: orderRef,
          customer_id: session.customer_id,
          destination: destination.trim(),
          urgency: urgency || 'normal',
          notes: notes?.trim() || null,
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      // 2. Insert order_items
      const itemsPayload = lines.map(l => ({
        order_id: order.id,
        stock_sku: l.sku,
        shade: l.shade,
        rolls_ordered: l.rolls,
        price_per_kg: l.price_per_kg,
      }));

      const { error: itemsErr } = await supabase
        .from('order_items')
        .insert(itemsPayload);

      if (itemsErr) {
        // Rollback: try to delete the orphaned order row
        await supabase.from('orders').delete().eq('id', order.id);
        throw itemsErr;
      }

      setLastOrderRef(orderRef);
      return orderRef;
    } catch (err) {
      const msg = err.message || 'Submit failed';
      setSubmitError(msg);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setSubmitError(null);
    setLastOrderRef(null);
  }, []);

  return { submit, submitting, submitError, lastOrderRef, reset };
}
