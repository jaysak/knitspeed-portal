import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { getCurrentSession } from '../lib/session.js';
import { generateOrderRef } from '../lib/orderRef.js';

export function useCart() {
  const [lines, setLines] = useState([]);  // [{sku, shade, price_per_kg, rolls}]
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [lastOrderRef, setLastOrderRef] = useState(null);

  const addLine = useCallback((stockRow, rolls) => {
    setLines(prev => {
      const existing = prev.findIndex(l => l.sku === stockRow.sku);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = { ...next[existing], rolls: next[existing].rolls + rolls };
        return next;
      }
      return [...prev, {
        sku: stockRow.sku,
        shade: stockRow.shade,
        price_per_kg: stockRow.price_per_kg,
        rolls,
      }];
    });
  }, []);

  const updateRolls = useCallback((sku, rolls) => {
    setLines(prev =>
      prev.map(l => l.sku === sku ? { ...l, rolls } : l)
    );
  }, []);

  const removeLine = useCallback((sku) => {
    setLines(prev => prev.filter(l => l.sku !== sku));
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    setLastOrderRef(null);
    setSubmitError(null);
  }, []);

  const submit = useCallback(async ({ destination, urgency, notes }) => {
    const session = getCurrentSession();
    if (!session.customer_id) {
      throw new Error('No customer_id in session. Set it in src/lib/session.js');
    }
    if (lines.length === 0) throw new Error('Cart is empty');
    if (!destination?.trim()) throw new Error('Destination required');

    setSubmitting(true);
    setSubmitError(null);

    try {
      const orderRef = await generateOrderRef();

      // 1. Insert order
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
        // Rollback the order row since items failed
        await supabase.from('orders').delete().eq('id', order.id);
        throw itemsErr;
      }

      setLastOrderRef(orderRef);
      setLines([]);
      return orderRef;
    } catch (err) {
      setSubmitError(err.message || 'Submit failed');
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [lines]);

  return {
    lines,
    addLine,
    updateRolls,
    removeLine,
    clear,
    submit,
    submitting,
    submitError,
    lastOrderRef,
    lineCount: lines.length,
  };
}
