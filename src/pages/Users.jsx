import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';
import '../styles/custom.css';

const ROLES = ['viewer', 'analyst', 'admin', 'superadmin'];

const ROLE_LABEL = {
  viewer: 'Viewer', analyst: 'Analyst', admin: 'Admin', superadmin: 'Super Admin',
};

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // New user modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]   = useState({ username: '', password: '', role: 'viewer', email: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/users/');
      setUsers(res.data.results || res.data);
    } catch {
      setError('Could not load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axiosInstance.patch(`/users/${userId}/set_role/`, { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch {
      alert('Failed to update role.');
    }
  };

  const handleToggleStatus = async (userId, currentActive) => {
    try {
      await axiosInstance.patch(`/users/${userId}/toggle_status/`);
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: !currentActive } : u));
    } catch {
      alert('Failed to toggle status.');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.username || !form.password) {
      setFormError('Username and password are required.');
      return;
    }
    setSaving(true);
    try {
      await axiosInstance.post('/users/', form);
      setShowModal(false);
      setForm({ username: '', password: '', role: 'viewer', email: '' });
      fetchUsers();
    } catch (err) {
      setFormError(err?.response?.data?.detail || 'Could not create user.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage accounts, roles, and access control</p>
        </div>
        <button className="btn-fd-primary" onClick={() => { setShowModal(true); setFormError(''); }}>
          ＋ New User
        </button>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Users',  value: users.length,                             color: 'var(--accent-blue)' },
          { label: 'Active',       value: users.filter(u => u.is_active).length,    color: 'var(--accent-primary)' },
          { label: 'Inactive',     value: users.filter(u => !u.is_active).length,   color: 'var(--text-muted)' },
          { label: 'Admins+',      value: users.filter(u => ['admin','superadmin'].includes(u.role)).length, color: 'var(--accent-gold)' },
        ].map(s => (
          <div className="col-6 col-md-3" key={s.label}>
            <div className="stat-card" style={{ padding: '18px 20px' }}>
              <div className="stat-body">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ color: s.color, fontSize: 30 }}>{s.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="fd-card" style={{ padding: 0 }}>
        {error && <div className="alert-danger m-3 p-3 rounded">{error}</div>}

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="spinner-border text-success mb-2" /><br />Loading users…
          </div>
        ) : (
          <div className="fd-table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="fd-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <div className="empty-state-icon">👥</div>
                        <div className="empty-state-text">No users found.</div>
                      </div>
                    </td>
                  </tr>
                ) : users.map((u, i) => {
                  const isSelf = currentUser?.username === u.username;

                  return (
                  <tr key={u.id} style={isSelf ? { opacity: 0.6, background: 'rgba(255,255,255,0.02)' } : {}}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-blue))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                        }}>
                          {u.username.slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600 }}>{u.username}</span>
                        {isSelf && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                            background: 'rgba(16,185,129,0.15)', color: 'var(--accent-primary)',
                            border: '1px solid rgba(16,185,129,0.3)', letterSpacing: 0.3,
                          }}>You</span>
                        )}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{u.email || '—'}</td>
                    <td>
                      <select
                        className="fd-select"
                        style={{ padding: '5px 10px', fontSize: 12, opacity: isSelf ? 0.5 : 1, cursor: isSelf ? 'not-allowed' : 'pointer' }}
                        value={u.role}
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                        disabled={isSelf}
                      >
                        {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                      </select>
                    </td>
                    <td>
                      {u.is_active ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--accent-primary)' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-primary)', display: 'inline-block' }} />
                          Active
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', display: 'inline-block' }} />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {u.date_joined ? new Date(u.date_joined).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className={u.is_active ? 'btn-fd-danger' : 'btn-fd-secondary'}
                        style={{ fontSize: 12, padding: '6px 12px', opacity: isSelf ? 0.4 : 1, cursor: isSelf ? 'not-allowed' : 'pointer' }}
                        onClick={() => !isSelf && handleToggleStatus(u.id, u.is_active)}
                        disabled={isSelf}
                        title={isSelf ? "You can't deactivate your own account" : ''}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="fd-modal-backdrop" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="fd-modal">
            <div className="fd-modal-header">
              <h5 className="fd-modal-title">Create New User</h5>
              <button className="fd-modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {formError && <div className="login-error mb-3"><span>⚠</span> {formError}</div>}

            <form onSubmit={handleCreateUser}>
              <div className="row g-3">
                <div className="col-6">
                  <label className="fd-label">Username *</label>
                  <input className="fd-input" placeholder="e.g. john_doe"
                    value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
                </div>
                <div className="col-6">
                  <label className="fd-label">Password *</label>
                  <input type="password" className="fd-input" placeholder="Strong password"
                    value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                </div>
                <div className="col-12">
                  <label className="fd-label">Email (optional)</label>
                  <input type="email" className="fd-input" placeholder="user@example.com"
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="col-12">
                  <label className="fd-label">Role *</label>
                  <select className="fd-select w-100"
                    value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                  </select>
                </div>
              </div>

              {/* Role info */}
              <div style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                {form.role === 'viewer'     && '👁  Viewer: Read-only access to transactions.'}
                {form.role === 'analyst'    && '📊 Analyst: View transactions, dashboard, and analytics.'}
                {form.role === 'admin'      && '⚙  Admin: Full CRUD on transactions + analytics.'}
                {form.role === 'superadmin' && '👑 Super Admin: Full access including user management.'}
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" className="btn-fd-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-fd-primary" disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm me-2" />Creating…</> : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}