# Mobile Phone & Accessory Shop Management System — Web Frontend

## Overview
This is the React-based frontend for a point-of-sale (POS) and service management system designed for a mobile phone and accessory shop. It provides modules for managing products, sales, services (repairs), customers, warranties, reports, and settings, along with a dashboard summarizing business KPIs. The frontend integrates with Supabase for authentication and data storage, with graceful fallbacks and mock data behavior when the backend isn’t fully configured yet.

## Tech Stack
- React 18 with React Router for client-side routing
- Supabase JavaScript client (@supabase/supabase-js) for authentication and data access
- Lightweight, component-driven UI (custom UI components, no heavy UI framework)
- Context + Reducer-based global state management (see src/state/store.js)
- Ocean Professional theme (see src/config/theme.js) with a Classic, polished layout

## Ocean Professional Theme
The application follows the Ocean Professional theme, a clean, classic, business-oriented aesthetic:
- Primary color: #1E3A8A
- Secondary accent: #F59E0B
- Success: #059669
- Error: #DC2626
- Background: #F3F4F6
- Surface: #FFFFFF
- Text: #111827
- Soft gradient: linear-gradient(135deg, rgba(30,58,138,0.10), rgba(245,158,11,0.10))

These values are defined in src/config/theme.js. Components and pages adopt structured layouts with subtle shadows, clear cards, and minimalist corporate styling consistent with the “Classic” application style.

## Directory Structure
High-level structure of the frontend:

- src/
  - App.js — root layout, sidebar/header, and route outlet
  - index.js — app entry, React Router setup
  - index.css, App.css — global styles
  - config/
    - theme.js — Ocean Professional theme and helper to create a Supabase client
  - router/
    - ProtectedRoute.jsx — gatekeeper for authenticated routes
  - routes/
    - index.js — central route map
  - state/
    - store.js — global state store (UI/theme, auth/session, cart)
  - hooks/
    - useAuth.js — auth state from Supabase session
    - useDebounce.js — debounced value hook (search, etc.)
    - usePagination.js — client-side pagination state
    - useSupabaseTable.js — reusable data fetching from Supabase tables
  - lib/
    - supabaseClient.js — singleton Supabase client initializer using env vars
    - api/
      - auth.js — sign-in, sign-out, session helpers
      - customers.js — customer CRUD + related history
      - products.js — product CRUD
      - sales.js — sales listing and sale creation (with items)
      - services.js — service tickets CRUD
      - warranties.js — warranty check and claims CRUD
      - reports.js — reporting utilities with mock fallbacks
      - settings.js — shop settings, users (read-only), and integration check
    - index.js — API barrel
  - components/
    - Layout/
      - Header.jsx — top bar with quick search, actions, toasts entry
      - Sidebar.jsx — fixed sidebar navigation
    - Charts/
      - BarChart.jsx, LineChart.jsx, DonutChart.jsx — chart placeholders
    - UI/
      - Button.jsx, Card.jsx, Modal.jsx, Table.jsx, Input.jsx, Select.jsx, Badge.jsx, Tabs.jsx, Spinner.jsx, DateRangePicker.jsx, Toasts.jsx
  - pages/
    - Auth/SignIn.jsx
    - Dashboard.jsx
    - Products/List.jsx, Products/Form.jsx
    - Sales/POS.jsx, Sales/Orders.jsx
    - Services/Tickets.jsx, Services/Form.jsx
    - Customers/List.jsx, Customers/Form.jsx
    - Warranties/Check.jsx, Warranties/Claims.jsx
    - Reports/Overview.jsx, Reports/SalesReport.jsx, Reports/InventoryReport.jsx, Reports/ServiceReport.jsx
    - Settings/General.jsx, Settings/Users.jsx, Settings/Integrations.jsx

## Running Locally
1) Install dependencies:
- Ensure Node.js 18+ is available.
- From web_frontend directory:
  - npm install

2) Set environment variables:
- Create a .env file in web_frontend with the following:
  - REACT_APP_SUPABASE_URL=your_supabase_project_url
  - REACT_APP_SUPABASE_KEY=your_supabase_anon_key

3) Start the app:
- npm start
- Open http://localhost:3000

4) Tests (optional):
- CI=true npm test

Build:
- npm run build

## Environment Variables
The frontend expects the following to be defined (in .env or runtime environment):
- REACT_APP_SUPABASE_URL — your Supabase project URL
- REACT_APP_SUPABASE_KEY — your Supabase anon key

Notes:
- src/lib/supabaseClient.js throws a clear error if these are missing. All API helpers catch and convert these into graceful fallbacks (e.g., mock data where applicable) so the UI can still render.
- src/config/theme.js also includes a createSupabaseClient() helper which returns null if env vars are missing, intended for non-fatal boot in certain contexts.

## Authentication and Optional Redirect Notes
- Routes for core modules are protected via src/router/ProtectedRoute.jsx.
- If the user is not authenticated, they are redirected to /signin with a from state, so a successful sign-in can return the user to the intended route.
- SignIn.jsx uses email/password via Supabase auth helpers in src/lib/api/auth.js.
- If you use external OAuth providers, configure them in Supabase and optionally set up redirect URLs accordingly. The ProtectedRoute logic does not assume providers; it only checks session state.

## Supabase Setup Expectations
The app expects the following tables and typical fields to be present in Supabase. Names are inferred from API code; adapt columns to your schema as needed:
- products: id, name, sku, price, cost_price, stock, reorder_level, created_at, updated_at
- customers: id, first_name, last_name, phone, email, created_at, updated_at
- sales: id, customer_id, total_amount, created_at
- sale_items: id, sale_id, product_id, quantity, unit_price, created_at
- service_tickets: id, customer_id, device_model, issue_description, status, assigned_tech, created_at, closed_at
- warranties: id, product_sku, serial, purchase_date, warranty_period_months
- warranty_claims: id, warranty_id, customer_id, status, notes, created_at, updated_at
- settings (single row): id, shop_name, tax_rate, currency

Row-Level Security (RLS)
- Enable RLS on all tables for production.
- Create policies to allow authenticated users to read and write according to your business rules.
- The app’s reporting functions are defensive: if a table is missing or a policy denies access, the reporting APIs (src/lib/api/reports.js) will fall back to mock data to keep the UI functional. You can use this to iterate on schema and policies without blocking the UI.

Relationships and Views (optional)
- Some features expect joins (e.g., sale_items -> products for top products in reports). If RLS or relationships block those, the code gracefully returns mock data.

## Feature Walkthrough

### Dashboard
- src/pages/Dashboard.jsx
- Shows high-level KPIs, sales trends, recent sales, and top products.
- Uses reporting APIs; can display mock metrics if backend data is unavailable.

### Products
- src/pages/Products/List.jsx, src/pages/Products/Form.jsx
- List, search, filter by category (as applicable), paginate, and CRUD products.
- Interacts with src/lib/api/products.js and uses UI components for forms and tables.

### Sales (POS and Orders)
- src/pages/Sales/POS.jsx
  - Point of Sale interface for adding products to a cart, adjusting quantities, entering customer details, and completing a sale.
  - Creates sales with items via src/lib/api/sales.js.
- src/pages/Sales/Orders.jsx
  - Lists sales orders with search and pagination.
  - Uses src/lib/api/sales.js for fetching and error handling.

### Services (Repairs)
- src/pages/Services/Tickets.jsx and src/pages/Services/Form.jsx
- Manage service/repair tickets: list, search/filter, create, edit, delete.
- Uses src/lib/api/services.js and offers technician assignment and status flow.

### Customers
- src/pages/Customers/List.jsx and src/pages/Customers/Form.jsx
- Manage customer records with search, create/edit functionality, and review related sales and service history.
- Uses src/lib/api/customers.js.

### Warranties
- src/pages/Warranties/Check.jsx
  - Check warranty status by inputs like SKU/serial or purchase date.
- src/pages/Warranties/Claims.jsx
  - Manage warranty claims list and CRUD.
- Backed by src/lib/api/warranties.js.

### Reports
- src/pages/Reports/Overview.jsx
  - Landing for reports module with links to sub-reports.
- src/pages/Reports/SalesReport.jsx
  - KPIs, daily sales series, and top products.
- src/pages/Reports/InventoryReport.jsx
  - Low stock, stock movements, inventory valuation.
- src/pages/Reports/ServiceReport.jsx
  - Service KPIs, status distribution, technician performance.
- Data layer: src/lib/api/reports.js. These functions attempt to query Supabase and, if blocked by missing tables or policies, they return mock datasets with a status of 'MOCK'. Pages can optionally surface when MOCK data is used.

### Settings
- src/pages/Settings/General.jsx
  - Edit shop information, tax rate, currency; stored via settings API.
- src/pages/Settings/Users.jsx
  - Read-only users list from Supabase auth; gracefully handles missing permissions with placeholders.
- src/pages/Settings/Integrations.jsx
  - Surface Supabase connection status (from src/lib/api/settings.js).

## Routing and Protection
- src/routes/index.js defines all routes and uses ProtectedRoute for authenticated modules.
- Public route: /signin
- Authenticated routes include /dashboard, /products, /sales, /services, /customers, /warranties, /reports, /settings and their subpaths.
- Not found routes default to a simple placeholder Page component.

## Graceful Fallbacks and Mock Data Behavior
The app is designed to remain usable even when the backend is not fully wired:
- Missing environment variables (REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_KEY):
  - getSupabaseClient() throws; API helpers catch and substitute mock or placeholder data.
  - createSupabaseClient() in theme.js returns null and logs a warning; this is non-fatal.
- Missing tables or RLS policy denials:
  - Reporting APIs (src/lib/api/reports.js) detect missing relations (code 42P01) and permission errors (e.g., policy violations). In these cases, they return deterministic mock datasets with status: 'MOCK'.
  - Product, sales, services, customers, and warranties APIs attempt to handle errors consistently: where safe, list pages display empty states or inline error messages; forms still render and validate on the client side.
- Loading states and placeholders:
  - Many pages use spinners, toast notifications, and placeholder text to maintain a smooth UX during network delays or fallbacks.

## Supabase Auth Redirects (Optional)
- After successful sign-in, the app redirects to the route indicated by location.state.from if present or defaults to /dashboard.
- For OAuth providers in Supabase, configure Redirect URLs in the Supabase project settings to point to your app URL (e.g., http://localhost:3000 during development). The SignIn page and ProtectedRoute pattern work with those flows if you implement provider sign-in buttons.

## Development Tips
- Start without Supabase: The UI will still boot and reports will show mock data. This helps iterate on the UI quickly.
- Turn on Supabase incrementally: Add tables and RLS policies as you go. When data becomes available, reports and lists will automatically use real data.
- Debugging:
  - Check console warnings for Supabase env var issues.
  - Look for API toast messages and inline error banners on pages.
- Styling:
  - Use theme.js colors and maintain Classic layout patterns: card-based sections, clear typography, minimal but informative visuals.

## License
Internal project documentation for the shop management system frontend.

---
Sources used to assemble this README:
- src/config/theme.js
- src/lib/supabaseClient.js
- src/router/ProtectedRoute.jsx
- src/routes/index.js
- src/lib/api/reports.js
