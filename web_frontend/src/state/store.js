import React, { createContext, useContext, useMemo, useReducer } from 'react';

/**
 * Global application state using React Context + useReducer.
 * Slices:
 * - ui: theme/layout state (sidebar collapsed), toasts
 * - user: auth session/user profile
 * - cart: POS cart data
 *
 * Avoids external deps. Can be migrated to Redux Toolkit later with minimal changes.
 */

// UI SLICE
const initialUiState = {
  sidebarCollapsed: false,
  toasts: [], // { id, type: 'success'|'error'|'info'|'warning', message, duration }
};

function uiReducer(state, action) {
  switch (action.type) {
    case 'ui/toggleSidebar':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    case 'ui/setSidebar':
      return { ...state, sidebarCollapsed: !!action.payload };
    case 'ui/addToast': {
      const toast = {
        id: action.payload?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: action.payload?.type || 'info',
        message: action.payload?.message || '',
        duration: action.payload?.duration ?? 3000,
      };
      return { ...state, toasts: [...state.toasts, toast] };
    }
    case 'ui/removeToast':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
    case 'ui/clearToasts':
      return { ...state, toasts: [] };
    default:
      return state;
  }
}

// USER SLICE
const initialUserState = {
  session: null, // Supabase session object
  profile: null, // additional user info (optional)
  loading: false,
  error: null,
};

function userReducer(state, action) {
  switch (action.type) {
    case 'user/setSession':
      return { ...state, session: action.payload ?? null };
    case 'user/setProfile':
      return { ...state, profile: action.payload ?? null };
    case 'user/setLoading':
      return { ...state, loading: !!action.payload };
    case 'user/setError':
      return { ...state, error: action.payload ?? null };
    case 'user/signOut':
      return { ...initialUserState, session: null, profile: null };
    default:
      return state;
  }
}

// CART SLICE (for POS)
const initialCartState = {
  items: [], // [{id, sku, name, price, qty, discount, meta}]
  customer: null, // {id, name, ...}
  note: '',
  taxRate: 0, // percent
  discount: 0, // absolute or percent depending on business rules
  payment: {
    method: 'cash', // 'cash' | 'card' | 'mixed' | 'mobile'
    amountReceived: 0,
  },
};

function calculateTotals(items, taxRate, discount) {
  const subtotal = items.reduce((sum, it) => {
    const line = (it.price ?? 0) * (it.qty ?? 1);
    const lineDiscount = it.discount ? (typeof it.discount === 'number' ? it.discount : 0) : 0;
    return sum + Math.max(0, line - lineDiscount);
  }, 0);
  const tax = (subtotal * (taxRate ?? 0)) / 100;
  const totalBeforeDiscount = subtotal + tax;
  const finalTotal = Math.max(0, totalBeforeDiscount - (discount ?? 0));
  return { subtotal, tax, total: finalTotal };
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'cart/addItem': {
      const item = action.payload;
      if (!item || !item.id) return state;
      const existing = state.items.find(i => i.id === item.id);
      let items;
      if (existing) {
        items = state.items.map(i =>
          i.id === item.id ? { ...i, qty: (i.qty ?? 1) + (item.qty ?? 1) } : i
        );
      } else {
        items = [...state.items, { ...item, qty: item.qty ?? 1 }];
      }
      return { ...state, items };
    }
    case 'cart/updateItem': {
      const { id, changes } = action.payload || {};
      if (!id) return state;
      const items = state.items.map(i => (i.id === id ? { ...i, ...changes } : i));
      return { ...state, items };
    }
    case 'cart/removeItem': {
      const id = action.payload;
      const items = state.items.filter(i => i.id !== id);
      return { ...state, items };
    }
    case 'cart/clear':
      return { ...state, items: [], customer: null, note: '', discount: 0, payment: { method: 'cash', amountReceived: 0 } };
    case 'cart/setCustomer':
      return { ...state, customer: action.payload ?? null };
    case 'cart/setNote':
      return { ...state, note: action.payload ?? '' };
    case 'cart/setTaxRate':
      return { ...state, taxRate: Number(action.payload) || 0 };
    case 'cart/setDiscount':
      return { ...state, discount: Number(action.payload) || 0 };
    case 'cart/setPayment':
      return { ...state, payment: { ...state.payment, ...(action.payload || {}) } };
    default:
      return state;
  }
}

// Root reducer and store
const initialState = {
  ui: initialUiState,
  user: initialUserState,
  cart: initialCartState,
};

function rootReducer(state, action) {
  return {
    ui: uiReducer(state.ui, action),
    user: userReducer(state.user, action),
    cart: cartReducer(state.cart, action),
  };
}

const StoreContext = createContext(undefined);

// PUBLIC_INTERFACE
export function StoreProvider({ children, preloadedState }) {
  /** Provides global state to the app. Optionally accepts preloadedState for SSR/hydration. */
  const [state, dispatch] = useReducer(rootReducer, { ...initialState, ...(preloadedState || {}) });
  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

// PUBLIC_INTERFACE
export function useStore() {
  /** Access the entire store { state, dispatch } */
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return ctx;
}

// PUBLIC_INTERFACE
export function useUi() {
  /** Convenience hook to access UI slice */
  const { state, dispatch } = useStore();
  const { sidebarCollapsed, toasts } = state.ui;
  return {
    sidebarCollapsed,
    toasts,
    toggleSidebar: () => dispatch({ type: 'ui/toggleSidebar' }),
    setSidebar: (val) => dispatch({ type: 'ui/setSidebar', payload: val }),
    addToast: (toast) => dispatch({ type: 'ui/addToast', payload: toast }),
    removeToast: (id) => dispatch({ type: 'ui/removeToast', payload: id }),
    clearToasts: () => dispatch({ type: 'ui/clearToasts' }),
  };
}

// PUBLIC_INTERFACE
export function useUser() {
  /** Convenience hook to access User slice */
  const { state, dispatch } = useStore();
  const { session, profile, loading, error } = state.user;
  return {
    session,
    profile,
    loading,
    error,
    setSession: (s) => dispatch({ type: 'user/setSession', payload: s }),
    setProfile: (p) => dispatch({ type: 'user/setProfile', payload: p }),
    setLoading: (l) => dispatch({ type: 'user/setLoading', payload: l }),
    setError: (e) => dispatch({ type: 'user/setError', payload: e }),
    signOutLocal: () => dispatch({ type: 'user/signOut' }),
  };
}

// PUBLIC_INTERFACE
export function useCart() {
  /** Convenience hook to access Cart slice plus derived totals */
  const { state, dispatch } = useStore();
  const { items, customer, note, taxRate, discount, payment } = state.cart;
  const totals = useMemo(() => calculateTotals(items, taxRate, discount), [items, taxRate, discount]);

  return {
    items,
    customer,
    note,
    taxRate,
    discount,
    payment,
    totals,
    addItem: (item) => dispatch({ type: 'cart/addItem', payload: item }),
    updateItem: (id, changes) => dispatch({ type: 'cart/updateItem', payload: { id, changes } }),
    removeItem: (id) => dispatch({ type: 'cart/removeItem', payload: id }),
    clearCart: () => dispatch({ type: 'cart/clear' }),
    setCustomer: (c) => dispatch({ type: 'cart/setCustomer', payload: c }),
    setNote: (n) => dispatch({ type: 'cart/setNote', payload: n }),
    setTaxRate: (r) => dispatch({ type: 'cart/setTaxRate', payload: r }),
    setDiscount: (d) => dispatch({ type: 'cart/setDiscount', payload: d }),
    setPayment: (p) => dispatch({ type: 'cart/setPayment', payload: p }),
  };
}
