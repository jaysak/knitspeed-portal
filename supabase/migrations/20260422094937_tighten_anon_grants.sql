-- tighten_anon_grants
-- Revoke excess PostgreSQL-level grants from anon role.
-- RLS is primary gatekeeper on all 7 public tables, but the broad grants
-- (origin: prior emergency fix, left in place) would become live if RLS
-- were disabled on any table. Anon key is public — close the attack surface.
-- See: 2026-04-22_housekeeping_rls-and-grants.md

-- ===== Section 1: revoke write-class grants on all tables =====

revoke insert, update, delete, truncate on public.customers    from anon;
revoke insert, update, delete, truncate on public.order_items  from anon;
revoke insert, update, delete, truncate on public.orders       from anon;
revoke insert, update, delete, truncate on public.profiles     from anon;
revoke insert, update, delete, truncate on public.stock        from anon;
revoke insert, update, delete, truncate on public.transactions from anon;
revoke insert, update, delete, truncate on public.user_roles   from anon;

-- ===== Section 2: revoke SELECT except where pre-auth catalog is intended =====
-- Keep SELECT on stock for future "browse catalog without login" option.
-- Everything else: revoke SELECT at the grant level; RLS becomes secondary.

revoke select on public.customers    from anon;
revoke select on public.order_items  from anon;
revoke select on public.orders       from anon;
revoke select on public.profiles     from anon;
revoke select on public.transactions from anon;
revoke select on public.user_roles   from anon;

-- ===== Section 3: revoke noise-class grants (references + trigger) =====
-- No legitimate anon use for these on any table.

revoke references, trigger on public.customers    from anon;
revoke references, trigger on public.order_items  from anon;
revoke references, trigger on public.orders       from anon;
revoke references, trigger on public.profiles     from anon;
revoke references, trigger on public.stock        from anon;
revoke references, trigger on public.transactions from anon;
revoke references, trigger on public.user_roles   from anon;
