# Supabase Setup (Frontend) — Schema Alignment and Verification

The backend schema has been audited and aligned by automation. Use this section to verify or re-apply changes if needed.

Environment variables required (in web_frontend/.env):
- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_KEY

If missing, the app will boot with mock/fallback data in many modules.

Tables and columns ensured
- products: id, name, sku unique (nullable), category, price, stock, created_at, updated_at
- customers: id, name, phone, email, address, notes, created_at, updated_at
- sales: id, created_at, customer_name, customer_id (FK customers), subtotal, tax, total (trigger-filled), payment_method
- sale_items: id, sale_id (FK sales), product_id (FK products), qty (or quantity mapped), unit_price, line_total (trigger-filled), created_at
- service_tickets: id, device, issue, status, assigned_tech, customer_id (FK customers), created_at, updated_at, closed_at
- warranties: id, product_sku, imei, warranty_period_months, purchase_date, customer_id (FK customers)
- warranty_claims: id, warranty_id (FK warranties), status, claim_date, resolution_note, created_at, updated_at
- settings: id, shop_name, tax_rate, currency, created_at, updated_at

RLS and policies
- RLS enabled on all above tables with basic authenticated policies for select/insert/update.

Indexes and FKs
- Unique partial index on products(sku) where sku is not null
- Common indexes on FK columns and frequently filtered fields (created_at, status)
- FKs:
  - sales.customer_id -> customers(id)
  - sale_items.sale_id -> sales(id) ON DELETE CASCADE
  - sale_items.product_id -> products(id)
  - service_tickets.customer_id -> customers(id)
  - warranties.customer_id -> customers(id)
  - warranty_claims.warranty_id -> warranties(id) ON DELETE CASCADE

PostgREST reload
- select pg_notify('pgrst','reload schema');

Verification checklist
Run these in Supabase SQL editor:

- Presence of tables:
  select table_name from information_schema.tables where table_schema='public' and table_name in ('products','customers','sales','sale_items','service_tickets','warranties','warranty_claims','settings');

- Columns example:
  select column_name, data_type from information_schema.columns where table_schema='public' and table_name='sales';

- Indexes example:
  select indexname, indexdef from pg_indexes where schemaname='public' and tablename='products';

- FKs example:
  select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid='public.sale_items'::regclass;

- RLS enabled:
  select relname, relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and relname in ('products','customers','sales','sale_items','service_tickets','warranties','warranty_claims','settings');

- Policies:
  select polname, polcmd, polroles, polqual, polwithcheck from pg_policy where schemaname='public' and tablename in ('products','customers','sales','sale_items','service_tickets','warranties','warranty_claims','settings');

Notes
- If you add OAuth providers, configure redirect URLs in Supabase.
- Frontend uses supabase-js and environment variables; never hardcode URLs.
- Reports gracefully degrade to mock data if schema or permissions deny access.
