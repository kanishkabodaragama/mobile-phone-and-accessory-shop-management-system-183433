-- Documentation copy: Schema alignment applied by automation.
-- You can run this in Supabase SQL editor if you need to re-apply or verify locally.
-- NOTE: The running system has already executed an equivalent idempotent script.

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  shop_name text,
  tax_rate numeric default 0,
  currency text default 'USD',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- PRODUCTS
alter table public.products alter column sku drop not null;
create unique index if not exists products_sku_key on public.products (sku) where sku is not null;
alter table public.products add column if not exists category text;
alter table public.products add column if not exists updated_at timestamptz default now();

-- CUSTOMERS
alter table public.customers add column if not exists notes text;

-- SALES
alter table public.sales add column if not exists customer_name text;
alter table public.sales add column if not exists customer_id uuid;
alter table public.sales add column if not exists subtotal numeric default 0;
alter table public.sales add column if not exists tax numeric default 0;
alter table public.sales add column if not exists total numeric;
alter table public.sales add column if not exists payment_method text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='sales_customer_id_fkey') then
    alter table public.sales
      add constraint sales_customer_id_fkey foreign key (customer_id) references public.customers(id) on delete set null;
  end if;
end $$;

create index if not exists idx_sales_customer_id on public.sales(customer_id);
create index if not exists idx_sales_created_at on public.sales(created_at);

-- SALE_ITEMS
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='sale_items' and column_name='quantity') then
    alter table public.sale_items rename column quantity to qty;
  end if;
end $$;

alter table public.sale_items add column if not exists line_total numeric;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='sale_items_sale_id_fkey') then
    alter table public.sale_items
      add constraint sale_items_sale_id_fkey foreign key (sale_id) references public.sales(id) on delete cascade;
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='sale_items_product_id_fkey') then
    alter table public.sale_items
      add constraint sale_items_product_id_fkey foreign key (product_id) references public.products(id) on delete restrict;
  end if;
end $$;

create index if not exists idx_sale_items_sale_id on public.sale_items(sale_id);
create index if not exists idx_sale_items_product_id on public.sale_items(product_id);

-- SERVICE_TICKETS
alter table public.service_tickets add column if not exists updated_at timestamptz default now();

do $$ begin
  if not exists (select 1 from pg_constraint where conname='service_tickets_customer_id_fkey') then
    alter table public.service_tickets
      add constraint service_tickets_customer_id_fkey foreign key (customer_id) references public.customers(id) on delete set null;
  end if;
end $$;

create index if not exists idx_service_tickets_customer_id on public.service_tickets(customer_id);
create index if not exists idx_service_tickets_status on public.service_tickets(status);

-- WARRANTIES
alter table public.warranties add column if not exists product_sku text;
alter table public.warranties add column if not exists imei text;
alter table public.warranties add column if not exists warranty_period_months int;
alter table public.warranties add column if not exists purchase_date date;
alter table public.warranties add column if not exists customer_id uuid;

create index if not exists idx_warranties_product_sku on public.warranties(product_sku);
create index if not exists idx_warranties_imei on public.warranties(imei);

do $$ begin
  if not exists (select 1 from pg_constraint where conname='warranties_customer_id_fkey') then
    alter table public.warranties
      add constraint warranties_customer_id_fkey foreign key (customer_id) references public.customers(id) on delete set null;
  end if;
end $$;

-- WARRANTY_CLAIMS
alter table public.warranty_claims add column if not exists warranty_id uuid;
alter table public.warranty_claims add column if not exists status text default 'Open';
alter table public.warranty_claims add column if not exists claim_date date default now();
alter table public.warranty_claims add column if not exists resolution_note text;

create index if not exists idx_warranty_claims_warranty_id on public.warranty_claims(warranty_id);

do $$ begin
  if not exists (select 1 from pg_constraint where conname='warranty_claims_warranty_id_fkey') then
    alter table public.warranty_claims
      add constraint warranty_claims_warranty_id_fkey foreign key (warranty_id) references public.warranties(id) on delete cascade;
  end if;
end $$;

-- RLS enable
alter table if exists public.products enable row level security;
alter table if exists public.customers enable row level security;
alter table if exists public.sales enable row level security;
alter table if exists public.sale_items enable row level security;
alter table if exists public.service_tickets enable row level security;
alter table if exists public.warranties enable row level security;
alter table if exists public.warranty_claims enable row level security;
alter table if exists public.settings enable row level security;

-- Policies (basic authenticated)
create policy if not exists products_select_auth on public.products for select to authenticated using (true);
create policy if not exists products_insert_auth on public.products for insert to authenticated with check (true);
create policy if not exists products_update_auth on public.products for update to authenticated using (true) with check (true);

create policy if not exists customers_select_auth on public.customers for select to authenticated using (true);
create policy if not exists customers_insert_auth on public.customers for insert to authenticated with check (true);
create policy if not exists customers_update_auth on public.customers for update to authenticated using (true) with check (true);

create policy if not exists sales_select_auth on public.sales for select to authenticated using (true);
create policy if not exists sales_insert_auth on public.sales for insert to authenticated with check (true);
create policy if not exists sales_update_auth on public.sales for update to authenticated using (true) with check (true);

create policy if not exists sale_items_select_auth on public.sale_items for select to authenticated using (true);
create policy if not exists sale_items_insert_auth on public.sale_items for insert to authenticated with check (true);
create policy if not exists sale_items_update_auth on public.sale_items for update to authenticated using (true) with check (true);

create policy if not exists service_tickets_select_auth on public.service_tickets for select to authenticated using (true);
create policy if not exists service_tickets_insert_auth on public.service_tickets for insert to authenticated with check (true);
create policy if not exists service_tickets_update_auth on public.service_tickets for update to authenticated using (true) with check (true);

create policy if not exists warranties_select_auth on public.warranties for select to authenticated using (true);
create policy if not exists warranties_insert_auth on public.warranties for insert to authenticated with check (true);
create policy if not exists warranties_update_auth on public.warranties for update to authenticated using (true) with check (true);

create policy if not exists warranty_claims_select_auth on public.warranty_claims for select to authenticated using (true);
create policy if not exists warranty_claims_insert_auth on public.warranty_claims for insert to authenticated with check (true);
create policy if not exists warranty_claims_update_auth on public.warranty_claims for update to authenticated using (true) with check (true);

create policy if not exists settings_select_auth on public.settings for select to authenticated using (true);
create policy if not exists settings_insert_auth on public.settings for insert to authenticated with check (true);
create policy if not exists settings_update_auth on public.settings for update to authenticated using (true) with check (true);

-- Triggers
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin
  if new.updated_at is distinct from now() then
    new.updated_at = now();
  end if;
  return new;
end $$;

do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname='public' loop
    if exists (select 1 from information_schema.columns where table_schema='public' and table_name=r.tablename and column_name='updated_at') then
      if not exists (
        select 1 from pg_trigger t
        join pg_class c on c.oid = t.tgrelid
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname='public' and c.relname=r.tablename and t.tgname=format('set_%s_updated_at', r.tablename)
      ) then
        execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at();',
          format('set_%s_updated_at', r.tablename), r.tablename);
      end if;
    end if;
  end loop;
end $$;

create or replace function public.set_sales_totals() returns trigger language plpgsql as $$
begin
  if new.total is null then
    new.total := coalesce(new.subtotal,0) + coalesce(new.tax,0);
  end if;
  return new;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname='sales' and t.tgname='set_sales_totals_before_ins_upd'
  ) then
    create trigger set_sales_totals_before_ins_upd before insert or update on public.sales
    for each row execute function public.set_sales_totals();
  end if;
end $$;

create or replace function public.set_sale_items_line_total() returns trigger language plpgsql as $$
begin
  new.line_total := coalesce(new.qty,0) * coalesce(new.unit_price,0);
  return new;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname='sale_items' and t.tgname='set_sale_items_line_total_before'
  ) then
    create trigger set_sale_items_line_total_before before insert or update on public.sale_items
    for each row execute function public.set_sale_items_line_total();
  end if;
end $$;

-- PostgREST reload
select pg_notify('pgrst','reload schema');
