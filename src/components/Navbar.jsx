import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/custom.css';

const NAV_ITEMS = [
  { to: '/transactions', icon: '↔', label: 'Transactions', roles: ['viewer','analyst','admin','superadmin'] },
  { to: '/dashboard',   icon: '◉', label: 'Dashboard',    roles: ['analyst','admin','superadmin'] },
  { to: '/analytics',   icon: '▣', label: 'Analytics',    roles: ['analyst','admin','superadmin'] },
  { to: '/users',       icon: '♟', label: 'Users',        roles: ['superadmin'] },
];

const ROLE_DISPLAY = {
  viewer:     'Viewer',
  analyst:    'Analyst',
  admin:      'Admin',
  superadmin: 'Super Admin',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  

  const role = user?.role || 'viewer';
  const username = user?.name || 'User';
  const initials = username.slice(0, 2).toUpperCase();

  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">💹</div>
        <div className="sidebar-brand-text">Fin<span>Flow</span></div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-label">Main Menu</div>
        {visibleItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              'sidebar-link' + (isActive ? ' active' : '')
            }
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        <div className="sidebar-label" style={{ marginTop: 20 }}>Account</div>
        <button
          className="sidebar-link"
          onClick={handleLogout}
          style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}
        >
          <span className="sidebar-link-icon">⎋</span>
          Logout
        </button>
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-username">{username}</div>
            <span className={`role-badge role-${role}`}>
              {ROLE_DISPLAY[role]}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}