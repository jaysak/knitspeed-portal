-- fabric_location_pivot
-- Pivots order_items.status from lifecycle-stage enum to fabric-location enum.
-- Adds orders.status aggregation trigger.
-- Adds audit columns on order_items for status + quantity changes.
--
-- Ruling: /Sofia/APR26/2026-04-22_decision_fabric-location-schema-pivot.md
-- Interview basis: /Sofia/APR26/2026-04-22_handoff_gift-min-interview-prep.md
--
-- Migration phases (all atomic in one transaction):
--   1. Drop old check constraints on order_items.status and orders.status
--   2. Backfill order_items.status values to new enum
--   3. Re-add order_items check constraint with 8-value enum
--   4. Re-add orders check constraint unchanged (6-value enum)
--   5. Add audit columns on order_items
--   6. Create fn_recompute_order_status trigger function
--   7. Create trg_order_items_status_aggregate trigger
--   8. Backfill orders.status from newly renamed order_items.status
--
-- Known-harmless edge case: old 'waiting' rows that were actually 'raw_short'
-- will be tagged 'at_dyeing' after backfill. Gift re-classifies in UI.

-- ===== Phase 1: drop old constraints =====

alter table public.order_items drop constraint if exists order_items_status_check;
alter table public.orders      drop constraint if exists orders_status_check;

-- ===== Phase 2: backfill order_items.status to new enum values =====

update public.order_items set status = 'in_stock'  where status = 'ready';
update public.order_items set status = 'at_dyeing' where status = 'waiting';
-- 'partial' and 'shipped' keep the same name — no update needed.

-- ===== Phase 3: re-add order_items check with the 8-value enum =====

alter table public.order_items
  add constraint order_items_status_check
  check (status = any (array[
    'ordered'::text,
    'in_stock'::text,
    'at_dyeing'::text,
    'raw_short'::text,
    'partial'::text,
    'shipped'::text,
    'delivered'::text,
    'cancelled'::text
  ]));

-- Update the default too: new line items start as 'ordered'
-- (they haven't been triaged against stock yet).
alter table public.order_items alter column status set default 'ordered'::text;

-- ===== Phase 4: re-add orders check unchanged =====

alter table public.orders
  add constraint orders_status_check
  check (status = any (array[
    'pending'::text,
    'confirmed'::text,
    'partial'::text,
    'shipped'::text,
    'completed'::text,
    'cancelled'::text
  ]));

-- ===== Phase 5: audit columns on order_items =====

alter table public.order_items
  add column if not exists status_changed_at    timestamptz,
  add column if not exists status_changed_by    uuid references public.profiles(id),
  add column if not exists quantity_changed_at  timestamptz,
  add column if not exists quantity_changed_by  uuid references public.profiles(id),
  add column if not exists quantity_change_reason text
    check (quantity_change_reason is null or quantity_change_reason = any (array[
      'typo'::text,
      'shortage'::text,
      'customer_request'::text,
      'other'::text
    ]));

-- ===== Phase 6: trigger function =====

create or replace function public.fn_recompute_order_status(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_total          int;
  v_delivered      int;
  v_shipped_plus   int;  -- shipped OR delivered
  v_cancelled      int;
  v_raw_short      int;
  v_ordered_only   int;  -- items still in 'ordered' (not yet triaged)
  v_new_status     text;
begin
  select
    count(*),
    count(*) filter (where status = 'delivered'),
    count(*) filter (where status in ('shipped', 'delivered')),
    count(*) filter (where status = 'cancelled'),
    count(*) filter (where status = 'raw_short'),
    count(*) filter (where status = 'ordered')
  into
    v_total, v_delivered, v_shipped_plus, v_cancelled, v_raw_short, v_ordered_only
  from public.order_items
  where order_id = p_order_id;

  if v_total = 0 then
    -- No items left. Leave status alone (order may be about to be deleted).
    return;
  end if;

  if v_delivered = v_total then
    v_new_status := 'completed';
  elsif v_shipped_plus = v_total then
    v_new_status := 'shipped';
  elsif v_shipped_plus > 0 then
    v_new_status := 'partial';
  elsif v_cancelled = v_total then
    v_new_status := 'cancelled';
  elsif v_raw_short > 0 then
    v_new_status := 'pending';
  elsif v_ordered_only = v_total then
    v_new_status := 'pending';
  else
    v_new_status := 'confirmed';
  end if;

  update public.orders
  set status = v_new_status
  where id = p_order_id
    and status is distinct from v_new_status;
end;
$$;

-- ===== Phase 7: trigger =====

create or replace function public.trg_fn_order_items_status_aggregate()
returns trigger
language plpgsql
as $$
begin
  -- Stamp status_changed_at on status transitions.
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    new.status_changed_at := now();
  elsif tg_op = 'INSERT' then
    new.status_changed_at := now();
  end if;

  -- Stamp quantity_changed_at when rolls_ordered or kg_ordered changes.
  if tg_op = 'UPDATE' and (
       new.rolls_ordered is distinct from old.rolls_ordered
    or new.kg_ordered    is distinct from old.kg_ordered
  ) then
    new.quantity_changed_at := now();
  end if;

  return new;
end;
$$;

-- BEFORE trigger stamps the audit columns on the row being written.
drop trigger if exists trg_order_items_stamp_audit on public.order_items;
create trigger trg_order_items_stamp_audit
  before insert or update on public.order_items
  for each row
  execute function public.trg_fn_order_items_status_aggregate();

-- AFTER trigger recomputes orders.status from the aggregate.
create or replace function public.trg_fn_order_items_recompute_parent()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.fn_recompute_order_status(old.order_id);
    return old;
  else
    perform public.fn_recompute_order_status(new.order_id);
    return new;
  end if;
end;
$$;

drop trigger if exists trg_order_items_status_aggregate on public.order_items;
create trigger trg_order_items_status_aggregate
  after insert or update or delete on public.order_items
  for each row
  execute function public.trg_fn_order_items_recompute_parent();

-- ===== Phase 8: one-shot backfill of orders.status =====

do $$
declare
  r record;
begin
  for r in select id from public.orders loop
    perform public.fn_recompute_order_status(r.id);
  end loop;
end;
$$;
