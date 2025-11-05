# Supabase Setup (Frontend Notes)

Ensure these environment variables are set:
- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_KEY

The backend now includes:
- public.products (with id, name, sku, category, price, stock, timestamps)
- public.sales (invoice_no, customer fields, payment_method, totals, created_at)
- public.sale_items (sale_id, product_id, quantity, unit_price, line_total, created_at)
- Indexes on sales.created_at, sales.created_by, sale_items.sale_id, sale_items.product_id
- Foreign keys guarded: sale_items.sale_id -> sales.id, sale_items.product_id -> products.id (if products exists), sales.created_by -> auth.users.id
- RLS enabled with authenticated CRUD policies for products, sales, and sale_items
- updated_at trigger on products

Notes for POS flow:
- src/lib/api/sales.js createSaleWithItems expects sales and sale_items to exist and be writable by authenticated users.
- Ensure your Supabase Authentication has at least one user account; sign in via the app before testing POS.
- If you also maintain a customers table, an optional FK from sales.customer_id to public.customers(id) is created when that table exists.

If you encounter permission errors, verify:
1) You are authenticated in the app.
2) RLS policies exist on sales and sale_items for authenticated role.
3) Environment variables are correctly set.

Verification SQL (optional):
```sql
select table_name from information_schema.tables where table_schema='public' and table_name in ('sales','sale_items');
select * from pg_policies where schemaname='public' and tablename in ('sales','sale_items');
```
