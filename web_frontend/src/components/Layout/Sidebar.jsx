import React from 'react';
import { NavLink } from 'react-router-dom';
import logo from '../../assets/logo.svg';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/products', label: 'Products', icon: '📦' },
  { to: '/sales/pos', label: 'Sales (POS)', icon: '🧾' },
  { to: '/sales/orders', label: 'Sales Orders', icon: '🗂️' },
  { to: '/services', label: 'Services', icon: '🛠️' },
  { to: '/customers', label: 'Customers', icon: '👥' },
  { to: '/warranties', label: 'Warranties', icon: '🛡️' },
  { to: '/reports', label: 'Reports', icon: '📈' },
  { to: '/settings', label: 'Settings', icon: '⚙️' }
];

// PUBLIC_INTERFACE
export default function Sidebar() {
  /** This is a public function. Sidebar navigation for the app. */
  return (
    <>
      <div className="brand">
        <img src={logo} width="24" height="24" alt="Logo" />
        <span>Ocean POS</span>
      </div>
      <nav className="nav">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => isActive ? 'active' : undefined}
          >
            <span aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
