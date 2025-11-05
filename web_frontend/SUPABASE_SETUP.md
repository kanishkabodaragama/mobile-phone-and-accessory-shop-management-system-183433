# Supabase Setup (Frontend Notes)

Ensure these environment variables are set:
- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_KEY

Schema alignment completed (Full backend):
- Products: added cost_price, reorder_level; unique index on sku; updated_at trigger.
- Customers: ensured primary key and index on phone.
- Sales: added/verified customer_name, optional customer_id (FK -> customers), customer_phone, payment_method default 'Cash', monetary fields subtotal, tax, total, also total_amount/tax_amount/discount_amount for compatibility, status, invoice_no with unique index; created_at index.
- Sale Items: ensured line_total, indexes on sale_id and product_id; FKs to sales (cascade) and products (restrict).
- Service Tickets: ensured device, issue, status default, assigned_tech, closed_at; FK to customers.
- Warranties and Warranty Claims: ensured typical fields; claim -> warranty FK.
- RLS enabled and basic authenticated CRUD policies across all tables.
- PostgREST schema cache reloaded.

The backend now includes:
- public.products (id, name, sku [unique], category, price, cost_price, stock, reorder_level, created_at, updated_at)
- public.customers (id, name, email, phone [indexed], address, created_at, updated_at)
- public.sales (id, invoice_no [unique], customer_id [FK], customer_name, customer_phone, payment_method, subtotal, tax, total, total_amount, tax_amount, discount_amount, status, created_at, created_by)
- public.sale_items (id, sale_id [FK], product_id [FK], quantity, unit_price, line_total, created_at)
- public.service_tickets (id, customer_id [FK], customer_name, device, issue, status, assigned_tech, created_at, updated_at, closed_at)
- public.warranties (id, imei, sku, serial, receipt_no, customer_name, customer_phone, purchase_date, warranty_period_months)
- public.warranty_claims (id, warranty_id [FK], imei, sku, receipt_no, issue_description, status, customer_name, customer_phone, created_at, updated_at)

Notes for POS flow:
- src/lib/api/sales.js createSaleWithItems expects sales and sale_items to exist and be writable by authenticated users.
- Ensure your Supabase Authentication has at least one user account; sign in via the app before testing POS.
- Sales supports captured-at-sale fields (customer_name/phone) and optional relational link (customer_id).

If you encounter permission errors, verify:
1) You are authenticated in the app.
2) RLS policies exist on the respective table(s) for the authenticated role.
3) Environment variables are correctly set.

Recommended Verification SQL:
```sql
-- Tables
select table_name from information_schema.tables 
where table_schema='public' and table_name in ('products','customers','sales','sale_items','service_tickets','warranties','warranty_claims');

-- Key columns on sales
select column_name, data_type from information_schema.columns
where table_schema='public' and table_name='sales'
  and column_name in ('invoice_no','customer_name','customer_phone','payment_method','subtotal','tax','total','total_amount','tax_amount','discount_amount','status');

-- Foreign keys presence
select conname, conrelid::regclass as table_name 
from pg_constraint 
where conname in ('sales_customer_fk','sale_items_sale_fk','sale_items_product_fk','service_tickets_customer_fk','warranty_claims_warranty_fk');

-- RLS policies
select schemaname, tablename, policyname from pg_policies
where schemaname='public' and tablename in ('products','customers','sales','sale_items','service_tickets','warranties','warranty_claims');
```

Operational Notes:
- After any schema change outside migrations, run:
```sql
select pg_notify('pgrst', 'reload schema');
```
to refresh the PostgREST schema cache used by the API gateway.
