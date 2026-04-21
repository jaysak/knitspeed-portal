// Generate next order_ref: ORD-YYMMDD-NN
// NN = count of today's orders + 1, zero-padded.

import { supabase } from './supabase.js';

export async function generateOrderRef() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const datePart = `${yy}${mm}${dd}`;

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const { count, error } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startOfDay);

  if (error) throw error;

  const nn = String((count || 0) + 1).padStart(2, '0');
  return `ORD-${datePart}-${nn}`;
}
