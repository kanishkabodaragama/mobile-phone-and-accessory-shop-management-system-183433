import React from 'react';
import './App.css';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import AppRoutes from './routes';

// PUBLIC_INTERFACE
function App() {
  /** Root application shell with fixed sidebar and header. */
  return (
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
    </div>
  );
}

export default App;
