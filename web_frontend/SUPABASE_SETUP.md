# Supabase Setup (Frontend Notes)

Ensure these environment variables are set:
- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_KEY

The backend now includes:
- public.products (with id, name, sku, category, price, stock, timestamps)
- RLS enabled with authenticated read/write/update/delete policies
- updated_at trigger

No code changes are required to start using products if env vars are present. The existing API at src/lib/api/products.js will operate against the products table.

If you encounter permission errors, verify that your user is authenticated and policies are in place.
