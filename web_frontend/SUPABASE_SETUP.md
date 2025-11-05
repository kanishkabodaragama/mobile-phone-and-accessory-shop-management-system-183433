# Supabase Setup (Frontend) — Schema Alignment and Verification

The backend schema has been audited and aligned by automation. Use this to verify or re-apply changes if needed.

Required environment variables (in web_frontend/.env):
- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_KEY

If missing, the app will boot with mock/fallback data in many modules.

Tables and columns ensured
- products: id uuid pk default gen_random_uuid(), name text not null, sku text unique, category text, price numeric(12,2) default 0 not null, stock integer default 0 not null, created_at timestamptz default now(), updated_at timestamptz default now()
- customers: id uuid pk default gen_random_uuid(), name text not null, phone text, email text, address text, notes text, created_at timestamptz default now()
- sales: id uuid pk default gen_random_uuid(), created_at timestamptz default now(), customer_name text, customer_id uuid null references customers(id), subtotal numeric(12,2) default 0 not null, tax numeric(12,2) default 0 not null, total numeric(12,2) default 0 not null, payment_method text
- sale_items: id uuid pk default gen_random_uuid(), sale_id uuid references sales(id) on delete cascade, product_id uuid references products(id), quantity integer not null, unit_price numeric(12,2) not null, line_total numeric(12,2) not null
- service_tickets: id uuid pk default gen_random_uuid(), created_at timestamptz default now(), status text, device text, issue text, assigned_tech text, customer_id uuid references customers(id), sale_id uuid references sales(id)
- warranties: id uuid pk default gen_random_uuid(), product_sku text, imei text, receipt_no text, customer_id uuid references customers(id), purchase_date date, warranty_period_months int, expires_at date
- warranty_claims: id uuid pk default gen_random_uuid(), warranty_id uuid references warranties(id) on delete cascade, status text, created_at timestamptz default now(), notes text
- settings: key text primary key, value jsonb

RLS and policies
- RLS enabled on all above tables.
- Policies created (if missing) to allow authenticated role to SELECT/INSERT/UPDATE/DELETE with using(true)/with check(true).
  Tighten for production per your needs.

Indexes and FKs
- products(sku, category)
- sales(customer_id, created_at)
- sale_items(sale_id, product_id)
- customers(name)
- service_tickets(customer_id, status)
- warranties(customer_id, product_sku)
- warranty_claims(warranty_id)

PostgREST reload
- select pg_notify('pgrst','reload schema');

Verification checklist (SQL editor)
- Presence of tables:
  select table_name from information_schema.tables where table_schema='public' and table_name in ('products','customers','sales','sale_items','service_tickets','warranties','warranty_claims','settings');

- Columns example:
  select column_name, data_type, is_nullable, column_default from information_schema.columns where table_schema='public' and table_name='sales';

- Indexes example:
  select indexname, indexdef from pg_indexes where schemaname='public' and tablename='products';

- FKs example:
  select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid='public.sale_items'::regclass;

- RLS enabled:
  select relname, relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and relname in ('products','customers','sales','sale_items','service_tickets','warranties','warranty_claims','settings');

- Policies:
  select polname, polcmd, polroles, polqual, polwithcheck from pg_policy where schemaname='public' and tablename in ('products','customers','sales','sale_items','service_tickets','warranties','warranty_claims','settings');

Notes
- If you add OAuth providers, configure redirect URLs in Supabase (development and production).
- Frontend uses supabase-js and environment variables; never hardcode URLs.
- Reporting APIs gracefully degrade to mock data if schema or permissions deny access.

Migration file reference
- See supabase/migrations/2025-11-05-align-schema.sql for the idempotent DDL used by automation.
