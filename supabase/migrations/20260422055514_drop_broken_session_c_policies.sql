-- Session C cleanup completion (run: 2026-04-22, first CLI migration).
-- Drops 4 broken auth.jwt()-based policies and the anon-read exposure
-- on customers. Adds authenticated-read policies to ensure the Sales
-- Orders Inbox continues to join customers for Gift.
--
-- Scope:
--   Drops:
--     - customers_anon_read_v04       (anon read, commercially sensitive)
--     - customers_provider_all        (non-functional auth.jwt check)
--     - stock_write_provider          (non-functional auth.jwt check)
--     - transactions_provider_only    (non-functional auth.jwt check)
--   Adds:
--     - customers_authenticated_read  (any logged-in user can read customers;
--                                      required for orders->customers join in
--                                      useSalesOrders.js)
--
-- What stays untouched: all has_role()-backed policies on orders,
-- order_items, profiles self-read, user_roles self-read, stock_read_all.

drop policy if exists "customers_anon_read_v04"    on public.customers;
drop policy if exists "customers_provider_all"     on public.customers;
drop policy if exists "stock_write_provider"       on public.stock;
drop policy if exists "transactions_provider_only" on public.transactions;

create policy "customers_authenticated_read"
  on public.customers
  for select
  to authenticated
  using (true);
