# Supabase Setup (Frontend) — Schema Alignment and Verification

The backend schema has been aligned for the POS sale flow (cart, items, totals, invoice). Use this guide to verify or re-apply.

Required environment variables (in web_frontend/.env):
- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_KEY

If missing, the app will boot with mock/fallback data in many modules.

Tables and columns ensured (POS-related)
- products: id uuid pk default gen_random_uuid(), name text not null, sku text, category text, price numeric(12,2) not null default 0, stock integer not null default 0, created_at timestamptz default now(), updated_at timestamptz default now()
- customers: id uuid pk default gen_random_uuid(), name text, phone text, email text, address text, notes text, created_at timestamptz default now(), updated_at timestamptz default now()
- sales: id uuid pk default gen_random_uuid(), invoice_no text, customer_name text, customer_phone text, customer_id uuid null references customers(id) on update cascade on delete set null, subtotal numeric(12,2) not null default 0, tax numeric(12,2) not null default 0, total numeric(12,2) not null default 0, payment_method text, created_at timestamptz default now()
- sale_items: id uuid pk default gen_random_uuid(), sale_id uuid references sales(id) on delete cascade, product_id uuid references products(id), quantity integer not null default 1, unit_price numeric(12,2) not null, line_total numeric(12,2) not null, created_at timestamptz default now()

Other tables (services, warranties, settings) remain as before.

RLS and policies
- RLS enabled on sales and sale_items.
- Policies created (if missing) to allow authenticated role to SELECT/INSERT/UPDATE/DELETE with using(true)/with check(true).
  Tighten for production per your needs.

Indexes and FKs
- sales(customer_id, created_at, invoice_no)
- sale_items(sale_id, product_id)
- customers(phone, email)

Triggers and helper functions
- Invoice: public.gen_invoice_no() + BEFORE INSERT trigger set_invoice_no_before_insert on sales
- Line total: BEFORE INSERT/UPDATE on sale_items computes line_total = round(unit_price * quantity, 2)
- Stock: AFTER INSERT/UPDATE/DELETE on sale_items adjusts products.stock using NEW.quantity / OLD.quantity

PostgREST reload
- select pg_notify('pgrst','reload schema');

Verification checklist (SQL editor)
- Tables presence:
  select table_name from information_schema.tables where table_schema='public' and table_name in ('products','customers','sales','sale_items');

- Columns example:
  select column_name, data_type, is_nullable, column_default from information_schema.columns where table_schema='public' and table_name='sales';

- Triggers on sale_items:
  select tg.tgname, pg_get_triggerdef(tg.oid) as trigger_def
  from pg_trigger tg
  join pg_class c on c.oid = tg.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname='public' and c.relname='sale_items' and not tg.tgisinternal;

- Invoice generator present:
  select p.oid::regprocedure, pg_get_functiondef(p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('gen_invoice_no','trg_sales_set_invoice');

Notes
- If you add OAuth providers, configure redirect URLs in Supabase (development and production).
- Frontend uses supabase-js and environment variables; never hardcode URLs.
- Reporting APIs gracefully degrade to mock data if schema or permissions deny access.

Migration file reference
- See supabase/migrations/2025-11-05-align-schema.sql for the idempotent DDL used by automation.

Status
- Alignment applied via SupabaseTools in this run; proceed to end-to-end testing in the POS flow (create sale, add items) to confirm stock adjustments and invoice generation.
