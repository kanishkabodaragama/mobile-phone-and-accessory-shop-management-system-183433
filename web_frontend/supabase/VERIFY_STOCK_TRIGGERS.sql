-- Verification script for sale_items stock adjustment triggers

-- 1) Columns
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema='public' and table_name='sale_items'
order by ordinal_position;

-- 2) Function definition
select p.oid::regprocedure as func_name, pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname='public' and p.proname='fn_adjust_stock_on_sale_items';

-- 3) Triggers attached to sale_items
select tg.tgname, pg_get_triggerdef(tg.oid) as trigger_def
from pg_trigger tg
join pg_class c on c.oid = tg.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname='public' and c.relname='sale_items' and not tg.tgisinternal;

-- 4) Transactional dry run (safe to rollback)
begin;

-- Create a temp product for test
insert into public.products (id, name, sku, price, cost_price, stock) 
values (gen_random_uuid(), 'Trigger Test Product', 'TT-001', 10, 5, 100)
returning id into strict pg_temp.test_product_id;

-- Create a temp sale and insert item
insert into public.sales (id, customer_id, total_amount) 
values (gen_random_uuid(), null, 10)
returning id into strict pg_temp.test_sale_id;

-- Insert a sale item with quantity 2
insert into public.sale_items (sale_id, product_id, quantity, unit_price) 
values (pg_temp.test_sale_id, pg_temp.test_product_id, 2, 10);

-- Verify stock decreased by 2
select stock as after_insert_stock from public.products where id = pg_temp.test_product_id;

-- Update sale item quantity to 5
update public.sale_items 
set quantity = 5 
where sale_id = pg_temp.test_sale_id and product_id = pg_temp.test_product_id;

-- Verify stock decreased net by 3 more
select stock as after_update_stock from public.products where id = pg_temp.test_product_id;

-- Delete sale item
delete from public.sale_items 
where sale_id = pg_temp.test_sale_id and product_id = pg_temp.test_product_id;

-- Verify stock restored to original 100
select stock as after_delete_stock from public.products where id = pg_temp.test_product_id;

rollback;
