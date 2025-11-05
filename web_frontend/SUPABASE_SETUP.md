# Supabase Setup (Frontend Notes)

Ensure these environment variables are set:
- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_KEY

Schema alignment completed (Sales):
- sales now includes customer_name (text), optional customer_id (uuid, FK -> customers), monetary fields (subtotal, tax, total_amount or total), payment_method (text), created_at (timestamptz).
- sale_items links to sales and products via FKs; indexes present.

The backend now includes:
- public.products (id, name, sku, category, price, cost_price, stock, reorder_level, timestamps)
- public.customers (id, name, email, phone, address, timestamps)
- public.sales (invoice_no, optional customer_id + customer_name/phone, payment_method, total/tax/discount, status, created_at)
- public.sale_items (sale_id, product_id, quantity, unit_price, line_total, created_at)
- public.service_tickets (customer_id, customer_name, device, issue, status, assigned_tech, timestamps)
- public.warranties (imei, sku, serial, receipt_no, customer_name/phone, purchase_date, warranty_period_months)
- public.warranty_claims (warranty_id, imei/sku/receipt_no, issue_description, status, customer fields, timestamps)
- Indexes on sales.created_at, sale_items.sale_id, sale_items.product_id, and unique index on sales.invoice_no
- Foreign keys guarded: 
  - sales.customer_id -> customers.id
  - sale_items.sale_id -> sales.id
  - sale_items.product_id -> products.id
  - service_tickets.customer_id -> customers.id
  - warranty_claims.warranty_id -> warranties.id
- RLS enabled with authenticated CRUD policies for all above tables
- updated_at trigger on products

Notes for POS flow:
- src/lib/api/sales.js createSaleWithItems expects sales and sale_items to exist and be writable by authenticated users.
- Ensure your Supabase Authentication has at least one user account; sign in via the app before testing POS.
- sales includes customer_name (text, nullable) and optional customer_id (uuid). Frontend supports both captured-at-sale name and linked customer.

If you encounter permission errors, verify:
1) You are authenticated in the app.
2) RLS policies exist on the respective table(s) for the authenticated role.
3) Environment variables are correctly set.

Verification SQL (optional):
```sql
select table_name from information_schema.tables 
where table_schema='public' and table_name in ('products','customers','sales','sale_items','service_tickets','warranties','warranty_claims');

select schemaname, tablename, policyname from pg_policies
where schemaname='public' and tablename in ('products','customers','sales','sale_items','service_tickets','warranties','warranty_claims');
```
