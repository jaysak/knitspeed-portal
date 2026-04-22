drop extension if exists "pg_net";


  create table "public"."customers" (
    "id" uuid not null default gen_random_uuid(),
    "customer_code" text not null,
    "display_name" text not null,
    "customer_type" text,
    "location" text,
    "first_transaction_date" date,
    "last_transaction_date" date,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."customers" enable row level security;


  create table "public"."order_items" (
    "id" uuid not null default gen_random_uuid(),
    "order_id" uuid not null,
    "stock_sku" text not null,
    "shade" text not null,
    "rolls_ordered" integer not null,
    "rolls_fulfilled" integer not null default 0,
    "kg_ordered" numeric(10,2),
    "kg_fulfilled" numeric(10,2),
    "price_per_kg" numeric(8,2),
    "status" text not null default 'waiting'::text,
    "note" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."order_items" enable row level security;


  create table "public"."orders" (
    "id" uuid not null default gen_random_uuid(),
    "order_ref" text not null,
    "customer_id" uuid not null,
    "destination" text not null,
    "urgency" text not null default 'normal'::text,
    "status" text not null default 'pending'::text,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."orders" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "email" text not null,
    "tenant_id" uuid not null,
    "customer_id" uuid,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."profiles" enable row level security;


  create table "public"."stock" (
    "id" uuid not null default gen_random_uuid(),
    "sku" text not null,
    "group_id" text not null,
    "item_type" text not null,
    "rib_sku_ref" text,
    "shade" text not null,
    "shade_en" text,
    "dye_code" text,
    "price_per_kg" numeric(8,2),
    "yarn_spec" text,
    "width_inches" numeric(4,1),
    "ready_rolls" integer not null default 0,
    "ready_kg" numeric(10,2),
    "dye_rolls" integer not null default 0,
    "dye_kg" numeric(10,2),
    "eta_date" date,
    "ratio" text default 'ok'::text,
    "note" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."stock" enable row level security;


  create table "public"."transactions" (
    "id" uuid not null default gen_random_uuid(),
    "invoice_ref" text,
    "customer_id" uuid,
    "transaction_date" date not null,
    "tx_year" integer generated always as ((EXTRACT(year FROM transaction_date))::integer) stored,
    "tx_month" integer generated always as ((EXTRACT(month FROM transaction_date))::integer) stored,
    "tx_quarter" integer generated always as ((EXTRACT(quarter FROM transaction_date))::integer) stored,
    "tx_thai_year" integer generated always as (((EXTRACT(year FROM transaction_date) + (543)::numeric))::integer) stored,
    "sku" text,
    "group_id" text,
    "shade" text,
    "dye_code" text,
    "rolls" integer,
    "kg" numeric(10,2),
    "price_per_kg" numeric(8,2),
    "total_thb" numeric(12,2),
    "destination" text,
    "partial" boolean default false,
    "source" text not null default 'xlsx_import'::text,
    "import_batch" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."transactions" enable row level security;


  create table "public"."user_roles" (
    "user_id" uuid not null,
    "role" text not null,
    "scope_id" uuid not null,
    "granted_at" timestamp with time zone not null default now()
      );


alter table "public"."user_roles" enable row level security;

CREATE UNIQUE INDEX customers_customer_code_key ON public.customers USING btree (customer_code);

CREATE UNIQUE INDEX customers_pkey ON public.customers USING btree (id);

CREATE INDEX idx_order_items_order ON public.order_items USING btree (order_id);

CREATE INDEX idx_order_items_sku ON public.order_items USING btree (stock_sku);

CREATE INDEX idx_orders_created ON public.orders USING btree (created_at);

CREATE INDEX idx_orders_customer ON public.orders USING btree (customer_id);

CREATE INDEX idx_orders_status ON public.orders USING btree (status);

CREATE INDEX idx_stock_group ON public.stock USING btree (group_id);

CREATE INDEX idx_stock_ratio ON public.stock USING btree (ratio);

CREATE INDEX idx_stock_type ON public.stock USING btree (item_type);

CREATE INDEX idx_tx_customer ON public.transactions USING btree (customer_id);

CREATE INDEX idx_tx_date ON public.transactions USING btree (transaction_date);

CREATE INDEX idx_tx_group ON public.transactions USING btree (group_id);

CREATE INDEX idx_tx_sku ON public.transactions USING btree (sku);

CREATE INDEX idx_tx_year_month ON public.transactions USING btree (tx_year, tx_month);

CREATE UNIQUE INDEX order_items_pkey ON public.order_items USING btree (id);

CREATE UNIQUE INDEX orders_order_ref_key ON public.orders USING btree (order_ref);

CREATE UNIQUE INDEX orders_pkey ON public.orders USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX stock_pkey ON public.stock USING btree (id);

CREATE UNIQUE INDEX stock_sku_key ON public.stock USING btree (sku);

CREATE UNIQUE INDEX transactions_pkey ON public.transactions USING btree (id);

CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (user_id, role, scope_id);

alter table "public"."customers" add constraint "customers_pkey" PRIMARY KEY using index "customers_pkey";

alter table "public"."order_items" add constraint "order_items_pkey" PRIMARY KEY using index "order_items_pkey";

alter table "public"."orders" add constraint "orders_pkey" PRIMARY KEY using index "orders_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."stock" add constraint "stock_pkey" PRIMARY KEY using index "stock_pkey";

alter table "public"."transactions" add constraint "transactions_pkey" PRIMARY KEY using index "transactions_pkey";

alter table "public"."user_roles" add constraint "user_roles_pkey" PRIMARY KEY using index "user_roles_pkey";

alter table "public"."customers" add constraint "customers_customer_code_key" UNIQUE using index "customers_customer_code_key";

alter table "public"."order_items" add constraint "order_items_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE not valid;

alter table "public"."order_items" validate constraint "order_items_order_id_fkey";

alter table "public"."order_items" add constraint "order_items_status_check" CHECK ((status = ANY (ARRAY['ready'::text, 'waiting'::text, 'partial'::text, 'shipped'::text]))) not valid;

alter table "public"."order_items" validate constraint "order_items_status_check";

alter table "public"."order_items" add constraint "order_items_stock_sku_fkey" FOREIGN KEY (stock_sku) REFERENCES public.stock(sku) not valid;

alter table "public"."order_items" validate constraint "order_items_stock_sku_fkey";

alter table "public"."orders" add constraint "orders_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) not valid;

alter table "public"."orders" validate constraint "orders_customer_id_fkey";

alter table "public"."orders" add constraint "orders_order_ref_key" UNIQUE using index "orders_order_ref_key";

alter table "public"."orders" add constraint "orders_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'partial'::text, 'shipped'::text, 'completed'::text, 'cancelled'::text]))) not valid;

alter table "public"."orders" validate constraint "orders_status_check";

alter table "public"."orders" add constraint "orders_urgency_check" CHECK ((urgency = ANY (ARRAY['normal'::text, 'urgent'::text]))) not valid;

alter table "public"."orders" validate constraint "orders_urgency_check";

alter table "public"."profiles" add constraint "profiles_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) not valid;

alter table "public"."profiles" validate constraint "profiles_customer_id_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."stock" add constraint "stock_item_type_check" CHECK ((item_type = ANY (ARRAY['fabric'::text, 'rib'::text]))) not valid;

alter table "public"."stock" validate constraint "stock_item_type_check";

alter table "public"."stock" add constraint "stock_ratio_check" CHECK ((ratio = ANY (ARRAY['ok'::text, 'short'::text, 'out'::text]))) not valid;

alter table "public"."stock" validate constraint "stock_ratio_check";

alter table "public"."stock" add constraint "stock_rib_sku_ref_fkey" FOREIGN KEY (rib_sku_ref) REFERENCES public.stock(sku) DEFERRABLE INITIALLY DEFERRED not valid;

alter table "public"."stock" validate constraint "stock_rib_sku_ref_fkey";

alter table "public"."stock" add constraint "stock_sku_key" UNIQUE using index "stock_sku_key";

alter table "public"."transactions" add constraint "transactions_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) not valid;

alter table "public"."transactions" validate constraint "transactions_customer_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_role_check" CHECK ((role = ANY (ARRAY['provider'::text, 'customer'::text, 'admin'::text]))) not valid;

alter table "public"."user_roles" validate constraint "user_roles_role_check";

alter table "public"."user_roles" add constraint "user_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."user_roles" validate constraint "user_roles_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, email, tenant_id)
  values (new.id, new.email, public.knitspeed_tenant_id());

  insert into public.user_roles (user_id, role, scope_id)
  values (new.id, 'customer', public.knitspeed_tenant_id());

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.has_role(check_role text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = check_role
  );
$function$
;

CREATE OR REPLACE FUNCTION public.knitspeed_tenant_id()
 RETURNS uuid
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select '9350c9c5-0e30-4ba5-9451-b89e27ce3074'::uuid;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin new.updated_at = now(); return new; end;
$function$
;

create or replace view "public"."v_customer_profile" as  SELECT c.customer_code,
    c.customer_type,
    c.location,
    count(t.id) AS tx_count,
    sum(t.kg) AS total_kg,
    sum(t.total_thb) AS total_thb,
    min(t.transaction_date) AS first_tx,
    max(t.transaction_date) AS last_tx,
    count(DISTINCT t.sku) AS distinct_skus
   FROM (public.customers c
     LEFT JOIN public.transactions t ON ((t.customer_id = c.id)))
  GROUP BY c.id, c.customer_code, c.customer_type, c.location;


create or replace view "public"."v_monthly_demand" as  SELECT tx_year,
    tx_month,
    group_id,
    sku,
    count(*) AS tx_count,
    sum(rolls) AS total_rolls,
    sum(kg) AS total_kg,
    sum(total_thb) AS total_thb,
    avg(price_per_kg) AS avg_price_per_kg
   FROM public.transactions
  GROUP BY tx_year, tx_month, group_id, sku;


create or replace view "public"."v_sku_performance" as  SELECT sku,
    group_id,
    shade,
    count(*) AS tx_count,
    count(DISTINCT customer_id) AS unique_customers,
    sum(rolls) AS total_rolls,
    sum(kg) AS total_kg,
    sum(total_thb) AS total_thb,
    min(transaction_date) AS first_seen,
    max(transaction_date) AS last_seen
   FROM public.transactions
  GROUP BY sku, group_id, shade;


grant delete on table "public"."customers" to "anon";

grant insert on table "public"."customers" to "anon";

grant references on table "public"."customers" to "anon";

grant select on table "public"."customers" to "anon";

grant trigger on table "public"."customers" to "anon";

grant truncate on table "public"."customers" to "anon";

grant update on table "public"."customers" to "anon";

grant delete on table "public"."customers" to "authenticated";

grant insert on table "public"."customers" to "authenticated";

grant references on table "public"."customers" to "authenticated";

grant select on table "public"."customers" to "authenticated";

grant trigger on table "public"."customers" to "authenticated";

grant truncate on table "public"."customers" to "authenticated";

grant update on table "public"."customers" to "authenticated";

grant delete on table "public"."customers" to "service_role";

grant insert on table "public"."customers" to "service_role";

grant references on table "public"."customers" to "service_role";

grant select on table "public"."customers" to "service_role";

grant trigger on table "public"."customers" to "service_role";

grant truncate on table "public"."customers" to "service_role";

grant update on table "public"."customers" to "service_role";

grant delete on table "public"."order_items" to "anon";

grant insert on table "public"."order_items" to "anon";

grant references on table "public"."order_items" to "anon";

grant select on table "public"."order_items" to "anon";

grant trigger on table "public"."order_items" to "anon";

grant truncate on table "public"."order_items" to "anon";

grant update on table "public"."order_items" to "anon";

grant delete on table "public"."order_items" to "authenticated";

grant insert on table "public"."order_items" to "authenticated";

grant references on table "public"."order_items" to "authenticated";

grant select on table "public"."order_items" to "authenticated";

grant trigger on table "public"."order_items" to "authenticated";

grant truncate on table "public"."order_items" to "authenticated";

grant update on table "public"."order_items" to "authenticated";

grant delete on table "public"."order_items" to "service_role";

grant insert on table "public"."order_items" to "service_role";

grant references on table "public"."order_items" to "service_role";

grant select on table "public"."order_items" to "service_role";

grant trigger on table "public"."order_items" to "service_role";

grant truncate on table "public"."order_items" to "service_role";

grant update on table "public"."order_items" to "service_role";

grant delete on table "public"."orders" to "anon";

grant insert on table "public"."orders" to "anon";

grant references on table "public"."orders" to "anon";

grant select on table "public"."orders" to "anon";

grant trigger on table "public"."orders" to "anon";

grant truncate on table "public"."orders" to "anon";

grant update on table "public"."orders" to "anon";

grant delete on table "public"."orders" to "authenticated";

grant insert on table "public"."orders" to "authenticated";

grant references on table "public"."orders" to "authenticated";

grant select on table "public"."orders" to "authenticated";

grant trigger on table "public"."orders" to "authenticated";

grant truncate on table "public"."orders" to "authenticated";

grant update on table "public"."orders" to "authenticated";

grant delete on table "public"."orders" to "service_role";

grant insert on table "public"."orders" to "service_role";

grant references on table "public"."orders" to "service_role";

grant select on table "public"."orders" to "service_role";

grant trigger on table "public"."orders" to "service_role";

grant truncate on table "public"."orders" to "service_role";

grant update on table "public"."orders" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."stock" to "anon";

grant insert on table "public"."stock" to "anon";

grant references on table "public"."stock" to "anon";

grant select on table "public"."stock" to "anon";

grant trigger on table "public"."stock" to "anon";

grant truncate on table "public"."stock" to "anon";

grant update on table "public"."stock" to "anon";

grant delete on table "public"."stock" to "authenticated";

grant insert on table "public"."stock" to "authenticated";

grant references on table "public"."stock" to "authenticated";

grant select on table "public"."stock" to "authenticated";

grant trigger on table "public"."stock" to "authenticated";

grant truncate on table "public"."stock" to "authenticated";

grant update on table "public"."stock" to "authenticated";

grant delete on table "public"."stock" to "service_role";

grant insert on table "public"."stock" to "service_role";

grant references on table "public"."stock" to "service_role";

grant select on table "public"."stock" to "service_role";

grant trigger on table "public"."stock" to "service_role";

grant truncate on table "public"."stock" to "service_role";

grant update on table "public"."stock" to "service_role";

grant delete on table "public"."transactions" to "anon";

grant insert on table "public"."transactions" to "anon";

grant references on table "public"."transactions" to "anon";

grant select on table "public"."transactions" to "anon";

grant trigger on table "public"."transactions" to "anon";

grant truncate on table "public"."transactions" to "anon";

grant update on table "public"."transactions" to "anon";

grant delete on table "public"."transactions" to "authenticated";

grant insert on table "public"."transactions" to "authenticated";

grant references on table "public"."transactions" to "authenticated";

grant select on table "public"."transactions" to "authenticated";

grant trigger on table "public"."transactions" to "authenticated";

grant truncate on table "public"."transactions" to "authenticated";

grant update on table "public"."transactions" to "authenticated";

grant delete on table "public"."transactions" to "service_role";

grant insert on table "public"."transactions" to "service_role";

grant references on table "public"."transactions" to "service_role";

grant select on table "public"."transactions" to "service_role";

grant trigger on table "public"."transactions" to "service_role";

grant truncate on table "public"."transactions" to "service_role";

grant update on table "public"."transactions" to "service_role";

grant delete on table "public"."user_roles" to "anon";

grant insert on table "public"."user_roles" to "anon";

grant references on table "public"."user_roles" to "anon";

grant select on table "public"."user_roles" to "anon";

grant trigger on table "public"."user_roles" to "anon";

grant truncate on table "public"."user_roles" to "anon";

grant update on table "public"."user_roles" to "anon";

grant delete on table "public"."user_roles" to "authenticated";

grant insert on table "public"."user_roles" to "authenticated";

grant references on table "public"."user_roles" to "authenticated";

grant select on table "public"."user_roles" to "authenticated";

grant trigger on table "public"."user_roles" to "authenticated";

grant truncate on table "public"."user_roles" to "authenticated";

grant update on table "public"."user_roles" to "authenticated";

grant delete on table "public"."user_roles" to "service_role";

grant insert on table "public"."user_roles" to "service_role";

grant references on table "public"."user_roles" to "service_role";

grant select on table "public"."user_roles" to "service_role";

grant trigger on table "public"."user_roles" to "service_role";

grant truncate on table "public"."user_roles" to "service_role";

grant update on table "public"."user_roles" to "service_role";


  create policy "customers_anon_read_v04"
  on "public"."customers"
  as permissive
  for select
  to anon
using (true);



  create policy "customers_provider_all"
  on "public"."customers"
  as permissive
  for all
  to public
using (((auth.jwt() ->> 'role'::text) = 'provider'::text))
with check (((auth.jwt() ->> 'role'::text) = 'provider'::text));



  create policy "order_items_customer_insert_own"
  on "public"."order_items"
  as permissive
  for insert
  to authenticated
with check ((public.has_role('customer'::text) AND (order_id IN ( SELECT orders.id
   FROM public.orders
  WHERE (orders.customer_id = ( SELECT profiles.customer_id
           FROM public.profiles
          WHERE (profiles.id = auth.uid())))))));



  create policy "order_items_customer_read_own"
  on "public"."order_items"
  as permissive
  for select
  to authenticated
using ((public.has_role('customer'::text) AND (order_id IN ( SELECT orders.id
   FROM public.orders
  WHERE (orders.customer_id = ( SELECT profiles.customer_id
           FROM public.profiles
          WHERE (profiles.id = auth.uid())))))));



  create policy "order_items_provider_full"
  on "public"."order_items"
  as permissive
  for all
  to authenticated
using (public.has_role('provider'::text))
with check (public.has_role('provider'::text));



  create policy "orders_customer_insert_own"
  on "public"."orders"
  as permissive
  for insert
  to authenticated
with check ((public.has_role('customer'::text) AND (customer_id = ( SELECT profiles.customer_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid())))));



  create policy "orders_customer_read_own"
  on "public"."orders"
  as permissive
  for select
  to authenticated
using ((public.has_role('customer'::text) AND (customer_id = ( SELECT profiles.customer_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid())))));



  create policy "orders_provider_full"
  on "public"."orders"
  as permissive
  for all
  to authenticated
using (public.has_role('provider'::text))
with check (public.has_role('provider'::text));



  create policy "profiles_self_read"
  on "public"."profiles"
  as permissive
  for select
  to public
using ((id = auth.uid()));



  create policy "Public read access"
  on "public"."stock"
  as permissive
  for select
  to anon
using (true);



  create policy "stock_read_all"
  on "public"."stock"
  as permissive
  for select
  to public
using (true);



  create policy "stock_write_provider"
  on "public"."stock"
  as permissive
  for all
  to public
using (((auth.jwt() ->> 'role'::text) = 'provider'::text))
with check (((auth.jwt() ->> 'role'::text) = 'provider'::text));



  create policy "transactions_provider_only"
  on "public"."transactions"
  as permissive
  for all
  to public
using (((auth.jwt() ->> 'role'::text) = 'provider'::text))
with check (((auth.jwt() ->> 'role'::text) = 'provider'::text));



  create policy "user_roles_self_read"
  on "public"."user_roles"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));


CREATE TRIGGER customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER stock_updated_at BEFORE UPDATE ON public.stock FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


