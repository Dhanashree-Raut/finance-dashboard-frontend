import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isViewer = user?.role === 'viewer';
  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'superadmin';
  const canSeeDashboard = ['analyst', 'admin', 'superadmin'].includes(user?.role);

  const roleMeta = {
    viewer: { bg: '#F1EFE8', color: '#444441', label: 'Viewer' },
    analyst: { bg: '#E6F1FB', color: '#0C447C', label: 'Analyst' },
    admin: { bg: '#FAEEDA', color: '#633806', label: 'Admin' },
    superadmin: { bg: '#E1F5EE', color: '#085041', label: 'Super Admin' },
  };
  const badge = roleMeta[user?.role] || roleMeta.viewer;

  const linkStyle = {
    fontSize: '14px',
    color: 'var(--color-text-secondary)',
    textDecoration: 'none',
  };
  console.log(user)

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', height: '56px',
      borderBottom: '0.5px solid var(--color-border-tertiary)',
      background: 'var(--color-background-primary)'
    }}>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <span style={{ fontWeight: 500, fontSize: '15px' }}>
          Finance Dashboard
        </span>

        {/* Analytics — analyst, admin, superadmin */}
        {['analyst', 'admin', 'superadmin'].includes(user?.role) && (
          <Link to="/analytics" style={linkStyle}>Analytics</Link>
        )}

        {/* Transactions — all roles */}
        <Link to="/transactions" style={linkStyle}>Transactions</Link>

        {/* Dashboard — analyst, admin, superadmin */}
        {canSeeDashboard && (
          <Link to="/dashboard" style={linkStyle}>Dashboard</Link>
        )}

        {/* Users — superadmin only */}
        {isSuperAdmin && (
          <Link to="/users" style={linkStyle}>Users</Link>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{
          // fontSize: '12px', padding: '3px 12px',
          // borderRadius: '20px',
          // background: badge.bg, color: badge.color,
          // fontWeight: 500,
        }}>
          Hi, {user.name}
        </span>

        <span style={{
          fontSize: '12px', padding: '3px 12px',
          borderRadius: '20px',
          background: badge.bg, color: badge.color,
          fontWeight: 500,
        }}>
          {badge.label}
        </span>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          style={{ fontSize: '13px' }}>
          Logout
        </button>
      </div>
    </nav>
  );
}