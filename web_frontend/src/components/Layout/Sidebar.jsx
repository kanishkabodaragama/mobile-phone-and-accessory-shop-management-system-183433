import React from 'react';
import { NavLink } from 'react-router-dom';
import logo from '../../assets/logo.svg';

const mainNav = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/products', label: 'Products', icon: '📦' },
  { to: '/sales/pos', label: 'Sales (POS)', icon: '🧾' },
  { to: '/sales/orders', label: 'Sales Orders', icon: '🗂️' },
  { to: '/services/tickets', label: 'Services', icon: '🛠️' },
  { to: '/customers', label: 'Customers', icon: '👥' },
  { to: '/warranties', label: 'Warranties', icon: '🛡️' },
  { to: '/reports', label: 'Reports', icon: '📈' },
];

const settingsNav = [
  { to: '/settings', label: 'General' },
  { to: '/settings/users', label: 'Users' },
  { to: '/settings/integrations', label: 'Integrations' },
];

// PUBLIC_INTERFACE
export default function Sidebar() {
  /** This is a public function. Sidebar navigation for the app. */
  return (
    <>
      <div className="brand flex items-center gap-2 px-4 py-3">
        <img src={logo} width="24" height="24" alt="Logo" />
        <span className="font-semibold text-blue-900">Ocean POS</span>
      </div>
      <nav className="nav flex flex-col gap-1 px-2">
        {mainNav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-md hover:bg-blue-50 ${isActive ? 'bg-blue-100 text-blue-800' : 'text-gray-700'}`
            }
          >
            <span aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div className="pt-4 mt-4 border-t border-gray-200">
          <div className="px-4 pb-2 text-xs font-semibold text-gray-500 uppercase">Settings</div>
          {settingsNav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-4 py-2 rounded-md hover:bg-blue-50 ${isActive ? 'bg-blue-100 text-blue-800' : 'text-gray-700'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
