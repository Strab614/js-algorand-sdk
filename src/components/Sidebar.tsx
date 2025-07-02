import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/products', label: 'Products', icon: '📦' },
    { path: '/products/create', label: 'Add Product', icon: '➕' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <aside className="bg-algorand-primary text-white w-64 flex-shrink-0 hidden md:block">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <img src="https://algorand.com/static/algorand-logo-white-783c96b2f6b9c38a3d2c3a2af925ca95.svg" alt="Algorand Logo" className="h-8" />
          <span className="text-xl font-bold">Inventory</span>
        </div>
      </div>
      <nav className="mt-6">
        <ul>
          {navItems.map((item) => (
            <li key={item.path} className="mb-2">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-6 py-3 text-white hover:bg-gray-800 transition-colors ${
                    isActive ? 'bg-gray-800 border-l-4 border-algorand-accent' : ''
                  }`
                }
                end={item.path === '/'}
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;