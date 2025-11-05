-- Idempotent schema alignment for POS app (tables, indexes, RLS, policies), safe to re-run.

-- Ensure required extension
create extension if not exists pgcrypto;

-- TABLES
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text unique,
  category text,
  price numeric(12,2) not null default 0,
  stock integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  customer_name text,
  customer_id uuid null references public.customers(id),
  subtotal numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  payment_method text
);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid references public.sales(id) on delete cascade,
  product_id uuid references public.products(id),
  quantity integer not null,
  unit_price numeric(12,2) not null,
  line_total numeric(12,2) not null
);

create table if not exists public.service_tickets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  status text,
  device text,
  issue text,
  assigned_tech text,
  customer_id uuid references public.customers(id),
  sale_id uuid references public.sales(id)
);

create table if not exists public.warranties (
  id uuid primary key default gen_random_uuid(),
  product_sku text,
  imei text,
  receipt_no text,
  customer_id uuid references public.customers(id),
  purchase_date date,
  warranty_period_months int,
  expires_at date
);

create table if not exists public.warranty_claims (
  id uuid primary key default gen_random_uuid(),
  warranty_id uuid references public.warranties(id) on delete cascade,
  status text,
  created_at timestamptz default now(),
  notes text
);

create table if not exists public.settings (
  key text primary key,
  value jsonb
);

-- ALIGNMENT

-- sales ensure columns and numeric precision
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='sales' and column_name='customer_name') then
    alter table public.sales add column customer_name text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='sales' and column_name='created_at') then
    alter table public.sales add column created_at timestamptz default now();
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='sales' and column_name='subtotal') then
    alter table public.sales alter column subtotal type numeric(12,2) using subtotal::numeric(12,2);
    alter table public.sales alter column subtotal set default 0; alter table public.sales alter column subtotal set not null;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='sales' and column_name='tax') then
    alter table public.sales alter column tax type numeric(12,2) using tax::numeric(12,2);
    alter table public.sales alter column tax set default 0; alter table public.sales alter column tax set not null;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='sales' and column_name='total') then
    alter table public.sales alter column total type numeric(12,2) using total::numeric(12,2);
    alter table public.sales alter column total set default 0; alter table public.sales alter column total set not null;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='sales' and column_name='payment_method') then
    alter table public.sales add column payment_method text;
  end if;
end $$;

-- sale_items rename qty to quantity if present
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='sale_items' and column_name='qty') then
    begin
      alter table public.sale_items rename column qty to quantity;
    exception when others then null; end;
  end if;
end $$;

alter table public.sale_items alter column unit_price type numeric(12,2) using unit_price::numeric(12,2);
alter table public.sale_items alter column line_total type numeric(12,2) using line_total::numeric(12,2);

-- products precision
alter table public.products alter column price type numeric(12,2) using price::numeric(12,2);

-- Indexes
create index if not exists idx_products_sku on public.products (sku);
create index if not exists idx_products_category on public.products (category);
create index if not exists idx_sales_customer_id on public.sales (customer_id);
create index if not exists idx_sales_created_at on public.sales (created_at);
create index if not exists idx_sale_items_sale_id on public.sale_items (sale_id);
create index if not exists idx_sale_items_product_id on public.sale_items (product_id);
create index if not exists idx_customers_name on public.customers (name);
create index if not exists idx_service_tickets_customer_id on public.service_tickets (customer_id);
create index if not exists idx_service_tickets_status on public.service_tickets (status);
create index if not exists idx_warranties_customer_id on public.warranties (customer_id);
create index if not exists idx_warranties_product_sku on public.warranties (product_sku);
create index if not exists idx_warranty_claims_warranty_id on public.warranty_claims (warranty_id);

-- RLS
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.customers enable row level security;
alter table public.service_tickets enable row level security;
alter table public.warranties enable row level security;
alter table public.warranty_claims enable row level security;
alter table public.settings enable row level security;

-- Policies (create if missing)
-- products
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='products' and policyname='products read') then
    create policy "products read" on public.products for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='products' and policyname='products insert') then
    create policy "products insert" on public.products for insert to authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='products' and policyname='products update') then
    create policy "products update" on public.products for update to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='products' and policyname='products delete') then
    create policy "products delete" on public.products for delete to authenticated using (true);
  end if;
end $$;

-- sales
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='sales' and policyname='sales read') then
    create policy "sales read" on public.sales for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='sales' and policyname='sales insert') then
    create policy "sales insert" on public.sales for insert to authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='sales' and policyname='sales update') then
    create policy "sales update" on public.sales for update to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='sales' and policyname='sales delete') then
    create policy "sales delete" on public.sales for delete to authenticated using (true);
  end if;
end $$;

-- sale_items
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='sale_items' and policyname='sale_items read') then
    create policy "sale_items read" on public.sale_items for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='sale_items' and policyname='sale_items insert') then
    create policy "sale_items insert" on public.sale_items for insert to authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='sale_items' and policyname='sale_items update') then
    create policy "sale_items update" on public.sale_items for update to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='sale_items' and policyname='sale_items delete') then
    create policy "sale_items delete" on public.sale_items for delete to authenticated using (true);
  end if;
end $$;

-- customers
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='customers' and policyname='customers read') then
    create policy "customers read" on public.customers for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='customers' and policyname='customers insert') then
    create policy "customers insert" on public.customers for insert to authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='customers' and policyname='customers update') then
    create policy "customers update" on public.customers for update to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='customers' and policyname='customers delete') then
    create policy "customers delete" on public.customers for delete to authenticated using (true);
  end if;
end $$;

-- service_tickets
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='service_tickets' and policyname='service_tickets read') then
    create policy "service_tickets read" on public.service_tickets for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='service_tickets' and policyname='service_tickets insert') then
    create policy "service_tickets insert" on public.service_tickets for insert to authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='service_tickets' and policyname='service_tickets update') then
    create policy "service_tickets update" on public.service_tickets for update to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='service_tickets' and policyname='service_tickets delete') then
    create policy "service_tickets delete" on public.service_tickets for delete to authenticated using (true);
  end if;
end $$;

-- warranties
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='warranties' and policyname='warranties read') then
    create policy "warranties read" on public.warranties for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='warranties' and policyname='warranties insert') then
    create policy "warranties insert" on public.warranties for insert to authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='warranties' and policyname='warranties update') then
    create policy "warranties update" on public.warranties for update to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='warranties' and policyname='warranties delete') then
    create policy "warranties delete" on public.warranties for delete to authenticated using (true);
  end if;
end $$;

-- warranty_claims
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='warranty_claims' and policyname='warranty_claims read') then
    create policy "warranty_claims read" on public.warranty_claims for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='warranty_claims' and policyname='warranty_claims insert') then
    create policy "warranty_claims insert" on public.warranty_claims for insert to authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='warranty_claims' and policyname='warranty_claims update') then
    create policy "warranty_claims update" on public.warranty_claims for update to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='warranty_claims' and policyname='warranty_claims delete') then
    create policy "warranty_claims delete" on public.warranty_claims for delete to authenticated using (true);
  end if;
end $$;

-- settings
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='settings' and policyname='settings read') then
    create policy "settings read" on public.settings for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='settings' and policyname='settings upsert') then
    create policy "settings upsert" on public.settings for insert to authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='settings' and policyname='settings update') then
    create policy "settings update" on public.settings for update to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='settings' and policyname='settings delete') then
    create policy "settings delete" on public.settings for delete to authenticated using (true);
  end if;
end $$;

-- Reload PostgREST schema cache
select pg_notify('pgrst','reload schema');
