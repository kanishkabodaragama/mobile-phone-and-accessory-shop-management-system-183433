import React from 'react';
import './App.css';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import AppRoutes from './routes';
import { StoreProvider } from './state/store';
import Toasts from './components/UI/Toasts';

// PUBLIC_INTERFACE
function App() {
  /** Root application shell with fixed sidebar and header, wrapped with StoreProvider. */
  return (
    <StoreProvider>
      <div className="app-shell">
        <aside className="sidebar">
          <Sidebar />
        </aside>
        <header className="header">
          <Header />
        </header>
        <main className="content">
          <AppRoutes />
        </main>
        <Toasts />
      </div>
    </StoreProvider>
  );
}

export default App;
