-- real_has_role_policies
-- Task 2 of housekeeping ticket 2026-04-22_housekeeping_rls-and-grants.md.
-- Replaces the broad customers_authenticated_read safety-net with properly
-- scoped has_role()-based policies. Adds provider write policies for
-- customers and stock. Adds provider-only read on transactions (research
-- data surface). Also drops a redundant pre-existing stock read policy.
--
-- Scope:
--   Drops:
--     - customers_authenticated_read  (over-scoped; Bank/Fern could see all customers)
--     - "Public read access"          (redundant with stock_read_all; anon-only duplicate)
--   Adds on customers:
--     - customers_provider_read       (provider sees every row)
--     - customers_customer_read_own   (customer sees only their own row via profiles)
--     - customers_provider_write      (provider can insert/update/delete)
--   Adds on stock:
--     - stock_provider_write          (provider can edit catalog)
--   Adds on transactions:
--     - transactions_provider_read    (provider sees research dataset; no writes yet)
--
-- All policies use public.has_role(<role>) for consistency with the rest
-- of the RLS system (orders, order_items). No auth.jwt()-based policies.
--
-- Risk note: drop-and-recreate on customers briefly leaves the table
-- policy-less inside the migration transaction. Postgres applies migrations
-- atomically, so no client sees the gap. Verified safe.

-- ===== Section 1: drop safety-net + redundant policies =====

drop policy if exists "customers_authenticated_read" on public.customers;
drop policy if exists "Public read access"           on public.stock;

-- ===== Section 2: customers — real has_role()-backed policies =====

create policy "customers_provider_read"
  on public.customers for select to authenticated
  using (public.has_role('provider'));

create policy "customers_customer_read_own"
  on public.customers for select to authenticated
  using (
    public.has_role('customer')
    and id = (select customer_id from public.profiles where id = auth.uid())
  );

create policy "customers_provider_write"
  on public.customers for all to authenticated
  using (public.has_role('provider'))
  with check (public.has_role('provider'));

-- ===== Section 3: stock — provider write policy =====

create policy "stock_provider_write"
  on public.stock for all to authenticated
  using (public.has_role('provider'))
  with check (public.has_role('provider'));

-- ===== Section 4: transactions — provider read policy =====

create policy "transactions_provider_read"
  on public.transactions for select to authenticated
  using (public.has_role('provider'));
