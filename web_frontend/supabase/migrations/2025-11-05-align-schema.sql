-- Supabase schema alignment for Mobile Shop POS
-- Run order-safe and idempotent where possible

-- 1) Extensions
create extension if not exists pgcrypto;

-- 2) Ensure required tables exist (customers, service_tickets, warranties, warranty_claims)
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  phone text,
  address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.service_tickets (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid,
  customer_name text,
  device text not null,
  issue text not null,
  status text default 'New',
  assigned_tech text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  closed_at timestamptz
);

create table if not exists public.warranties (
  id uuid primary key default gen_random_uuid(),
  imei text,
  sku text,
  serial text,
  receipt_no text,
  customer_name text,
  customer_phone text,
  purchase_date date,
  warranty_period_months integer default 12
);

create table if not exists public.warranty_claims (
  id uuid primary key default gen_random_uuid(),
  warranty_id uuid,
  imei text,
  sku text,
  receipt_no text,
  issue_description text not null,
  status text default 'Open',
  customer_name text,
  customer_phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3) Align sales table columns required by frontend
alter table public.sales add column if not exists customer_name text;
alter table public.sales add column if not exists customer_id uuid;
alter table public.sales add column if not exists customer_phone text;
alter table public.sales add column if not exists payment_method text;
alter table public.sales alter column payment_method set default 'Cash';
alter table public.sales add column if not exists total_amount numeric(12,2);
alter table public.sales alter column total_amount set default 0;
alter table public.sales add column if not exists tax_amount numeric(12,2);
alter table public.sales alter column tax_amount set default 0;
alter table public.sales add column if not exists discount_amount numeric(12,2);
alter table public.sales alter column discount_amount set default 0;
alter table public.sales add column if not exists status text;
alter table public.sales alter column status set default 'completed';
alter table public.sales add column if not exists invoice_no text;
create unique index if not exists sales_invoice_no_uidx on public.sales(invoice_no);
alter table public.sales add column if not exists created_by uuid;
create index if not exists idx_sales_created_at on public.sales (created_at desc);

-- 4) Foreign keys (guarded)
DO $$
BEGIN
  -- ensure customers has PK
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema='public' AND table_name='customers' AND constraint_type='PRIMARY KEY'
  ) THEN
    ALTER TABLE public.customers ADD PRIMARY KEY (id);
  END IF;

  -- sales.customer_id -> customers.id
  BEGIN
    ALTER TABLE public.sales
      ADD CONSTRAINT sales_customer_fk
      FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- sale_items.sale_id -> sales.id (exists from base)
  BEGIN
    ALTER TABLE public.sale_items
      ADD CONSTRAINT sale_items_sale_fk
      FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- sale_items.product_id -> products.id (guarded)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='products') THEN
    BEGIN
      ALTER TABLE public.sale_items
        ADD CONSTRAINT sale_items_product_fk
        FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;

  -- service_tickets.customer_id -> customers.id
  BEGIN
    ALTER TABLE public.service_tickets
      ADD CONSTRAINT service_tickets_customer_fk
      FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- warranty_claims.warranty_id -> warranties.id
  BEGIN
    ALTER TABLE public.warranty_claims
      ADD CONSTRAINT warranty_claims_warranty_fk
      FOREIGN KEY (warranty_id) REFERENCES public.warranties(id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END$$;

-- 5) Helpful indexes
create index if not exists idx_sale_items_sale_id on public.sale_items (sale_id);
create index if not exists idx_sale_items_product_id on public.sale_items (product_id);

-- 6) RLS enablement
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.service_tickets enable row level security;
alter table public.warranties enable row level security;
alter table public.warranty_claims enable row level security;

-- 7) Authenticated CRUD policies (idempotent)
DO $$
BEGIN
  -- products
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='products' AND policyname='products_select_authenticated') THEN
    CREATE POLICY products_select_authenticated ON public.products FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='products' AND policyname='products_insert_authenticated') THEN
    CREATE POLICY products_insert_authenticated ON public.products FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='products' AND policyname='products_update_authenticated') THEN
    CREATE POLICY products_update_authenticated ON public.products FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='products' AND policyname='products_delete_authenticated') THEN
    CREATE POLICY products_delete_authenticated ON public.products FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
  END IF;

  -- customers
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='customers' AND policyname='customers_select_authenticated') THEN
    CREATE POLICY customers_select_authenticated ON public.customers FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='customers' AND policyname='customers_insert_authenticated') THEN
    CREATE POLICY customers_insert_authenticated ON public.customers FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='customers' AND policyname='customers_update_authenticated') THEN
    CREATE POLICY customers_update_authenticated ON public.customers FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='customers' AND policyname='customers_delete_authenticated') THEN
    CREATE POLICY customers_delete_authenticated ON public.customers FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
  END IF;

  -- sales
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sales' AND policyname='sales_select_authenticated') THEN
    CREATE POLICY sales_select_authenticated ON public.sales FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sales' AND policyname='sales_insert_authenticated') THEN
    CREATE POLICY sales_insert_authenticated ON public.sales FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sales' AND policyname='sales_update_authenticated') THEN
    CREATE POLICY sales_update_authenticated ON public.sales FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sales' AND policyname='sales_delete_authenticated') THEN
    CREATE POLICY sales_delete_authenticated ON public.sales FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
  END IF;

  -- sale_items
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sale_items' AND policyname='sale_items_select_authenticated') THEN
    CREATE POLICY sale_items_select_authenticated ON public.sale_items FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sale_items' AND policyname='sale_items_insert_authenticated') THEN
    CREATE POLICY sale_items_insert_authenticated ON public.sale_items FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sale_items' AND policyname='sale_items_update_authenticated') THEN
    CREATE POLICY sale_items_update_authenticated ON public.sale_items FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sale_items' AND policyname='sale_items_delete_authenticated') THEN
    CREATE POLICY sale_items_delete_authenticated ON public.sale_items FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
  END IF;

  -- service_tickets
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='service_tickets' AND policyname='service_tickets_select_authenticated') THEN
    CREATE POLICY service_tickets_select_authenticated ON public.service_tickets FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='service_tickets' AND policyname='service_tickets_insert_authenticated') THEN
    CREATE POLICY service_tickets_insert_authenticated ON public.service_tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='service_tickets' AND policyname='service_tickets_update_authenticated') THEN
    CREATE POLICY service_tickets_update_authenticated ON public.service_tickets FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='service_tickets' AND policyname='service_tickets_delete_authenticated') THEN
    CREATE POLICY service_tickets_delete_authenticated ON public.service_tickets FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
  END IF;

  -- warranties
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='warranties' AND policyname='warranties_select_authenticated') THEN
    CREATE POLICY warranties_select_authenticated ON public.warranties FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='warranties' AND policyname='warranties_insert_authenticated') THEN
    CREATE POLICY warranties_insert_authenticated ON public.warranties FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='warranties' AND policyname='warranties_update_authenticated') THEN
    CREATE POLICY warranties_update_authenticated ON public.warranties FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='warranties' AND policyname='warranties_delete_authenticated') THEN
    CREATE POLICY warranties_delete_authenticated ON public.warranties FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
  END IF;

  -- warranty_claims
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='warranty_claims' AND policyname='warranty_claims_select_authenticated') THEN
    CREATE POLICY warranty_claims_select_authenticated ON public.warranty_claims FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='warranty_claims' AND policyname='warranty_claims_insert_authenticated') THEN
    CREATE POLICY warranty_claims_insert_authenticated ON public.warranty_claims FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='warranty_claims' AND policyname='warranty_claims_update_authenticated') THEN
    CREATE POLICY warranty_claims_update_authenticated ON public.warranty_claims FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='warranty_claims' AND policyname='warranty_claims_delete_authenticated') THEN
    CREATE POLICY warranty_claims_delete_authenticated ON public.warranty_claims FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
  END IF;
END$$;

-- 8) Optional trigger to maintain updated_at on products
create or replace function public.set_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_timestamp_updated_at on public.products;

create trigger set_timestamp_updated_at
before update on public.products
for each row
execute procedure public.set_timestamp_updated_at();
