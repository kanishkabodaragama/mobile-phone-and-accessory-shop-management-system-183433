# Supabase Setup Guide (Frontend)

This app uses Supabase for data. If you see messages like “Supabase not configured” or “Products table is missing,” follow this guide.

1) Environment variables
   - Create a .env file in the web_frontend folder with:
     REACT_APP_SUPABASE_URL=<your_supabase_project_url>
     REACT_APP_SUPABASE_KEY=<your_supabase_anon_key>

   Restart the dev server after adding/updating .env.

2) Minimum schema to start
   Create these tables using SQL in Supabase SQL Editor.

   -- products
   create table if not exists public.products (
     id uuid primary key default gen_random_uuid(),
     name text not null,
     sku text not null unique,
     category text,
     price numeric(12,2),
     stock integer,
     created_at timestamp with time zone default now(),
     updated_at timestamp with time zone default now()
   );

   -- Optional modules (create as needed for full functionality)
   -- customers
   create table if not exists public.customers (
     id uuid primary key default gen_random_uuid(),
     name text not null,
     email text,
     phone text,
     address text,
     created_at timestamp with time zone default now(),
     updated_at timestamp with time zone default now()
   );

   -- sales
   create table if not exists public.sales (
     id uuid primary key default gen_random_uuid(),
     invoice_no text not null,
     customer_name text,
     customer_phone text,
     payment_method text,
     total_amount numeric(12,2) not null default 0,
     created_at timestamp with time zone default now()
   );

   -- sale_items
   create table if not exists public.sale_items (
     id uuid primary key default gen_random_uuid(),
     sale_id uuid not null references public.sales(id) on delete cascade,
     product_id uuid references public.products(id),
     quantity integer not null default 0,
     unit_price numeric(12,2) not null default 0,
     line_total numeric(12,2) not null default 0
   );

   -- service_tickets
   create table if not exists public.service_tickets (
     id uuid primary key default gen_random_uuid(),
     device text not null,
     issue text not null,
     status text not null default 'New',
     assigned_tech text,
     customer_id uuid references public.customers(id),
     customer_name text,
     created_at timestamp with time zone default now(),
     updated_at timestamp with time zone default now()
   );

3) Row Level Security (RLS)
   Enable RLS and add policies to allow authenticated users to read/write as needed. Example:

   -- Enable RLS
   alter table public.products enable row level security;

   -- Allow authenticated users
   create policy "products_read" on public.products
     for select using ( auth.role() = 'authenticated' );

   create policy "products_write" on public.products
     for insert with check ( auth.role() = 'authenticated' );

   create policy "products_update" on public.products
     for update using ( auth.role() = 'authenticated' ) with check ( auth.role() = 'authenticated' );

4) Rebuild the schema cache
   If you still see “Could not find the table ... in the schema cache”:
   - Try running a simple SELECT in SQL editor on the table, or
   - Use Supabase dashboard’s “Reset cache” when available, or
   - Wait a minute and retry (cache may lag briefly after table creation).

5) Troubleshooting
   - Ensure your .env values are correct and the app restarted.
   - Check browser console for detailed error messages.
   - Verify RLS policies aren’t blocking reads/writes.
