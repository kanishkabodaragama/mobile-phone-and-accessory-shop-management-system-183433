import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import logo from '../../assets/logo.svg';
import { useUi } from '../../state/store';
import useAuth from '../../hooks/useAuth';

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
  /** This is a public function. Sidebar navigation for the app with collapse control. */
  const { sidebarCollapsed, toggleSidebar } = useUi();
  const { user } = useAuth();

  return (
    <div className={`sidebar-inner ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="brand flex items-center gap-2 px-4 py-3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src={logo} width="24" height="24" alt="Logo" />
          {!sidebarCollapsed && <span className="font-semibold text-blue-900">Ocean POS</span>}
        </div>
        <button aria-label="Toggle sidebar" className="toggle-btn" onClick={toggleSidebar}>
          {sidebarCollapsed ? '»' : '«'}
        </button>
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
            {!sidebarCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}

        <div className="pt-4 mt-4 border-t border-gray-200">
          {!sidebarCollapsed && <div className="px-4 pb-2 text-xs font-semibold text-gray-500 uppercase">Settings</div>}
          {settingsNav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-4 py-2 rounded-md hover:bg-blue-50 ${isActive ? 'bg-blue-100 text-blue-800' : 'text-gray-700'}`
              }
            >
              {!sidebarCollapsed && item.label}
            </NavLink>
          ))}
        </div>

        {!user && (
          <div className="px-2 pt-4 mt-4 border-t border-gray-200">
            <Link
              to="/login"
              className="block px-4 py-2 rounded-md hover:bg-blue-50 text-gray-700"
            >
              {!sidebarCollapsed && 'Login'}
            </Link>
          </div>
        )}
      </nav>
    </div>
  );
}
