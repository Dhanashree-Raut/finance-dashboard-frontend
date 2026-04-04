import { useEffect, useState } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';

const empty = { username: '', email: '', password: '', role: 'viewer' };

export default function Users() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(empty);
  const [msg, setMsg]           = useState('');
  const [error, setError]       = useState('');

  const load = () => {
    setLoading(true);
    api.get('/users/')
      .then(r => setUsers(r.data.results ?? r.data))
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setError('');
    try {
      await api.post('/users/', form);
      setMsg(`User "${form.username}" created as ${form.role}.`);
      setForm(empty); setShowForm(false); load();
    } catch (err) {
      setError(err.response?.data?.username?.[0] ?? 'Failed to create user.');
    }
  };

  const changeRole = async (id, role) => {
    try {
      await api.patch(`/users/${id}/set_role/`, { role });
      setMsg(`Role updated to ${role}.`); load();
    } catch { setError('Failed to update role.'); }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.patch(`/users/${id}/toggle_status/`);
      setMsg(`User ${currentStatus ? 'deactivated' : 'activated'}.`); load();
    } catch { setError('Failed to update status.'); }
  };

  const roleMeta = {
    viewer:     { bg: '#F1EFE8', color: '#444441' },
    analyst:    { bg: '#E6F1FB', color: '#0C447C' },
    admin:      { bg: '#FAEEDA', color: '#633806' },
    superadmin: { bg: '#E1F5EE', color: '#085041' },
  };

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontWeight: 500 }}>User management</h2>
          <button onClick={() => { setShowForm(!showForm); setError(''); }}>
            + Create user
          </button>
        </div>

        {msg && <div style={{ background: '#E1F5EE', color: '#085041', padding: '8px 12px', borderRadius: 'var(--border-radius-md)', fontSize: '13px', marginBottom: '1rem' }}>{msg}</div>}
        {error && <div style={{ background: '#FCEBEB', color: '#791F1F', padding: '8px 12px', borderRadius: 'var(--border-radius-md)', fontSize: '13px', marginBottom: '1rem' }}>{error}</div>}

        {/* Create user form */}
        {showForm && (
          <div style={{
            background: 'var(--color-background-primary)',
            border: '2px solid var(--color-border-info)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '1.25rem', marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontWeight: 500, fontSize: '15px' }}>Create new user</h3>
              <span style={{ fontSize: '11px', padding: '2px 10px', borderRadius: '20px', background: '#E1F5EE', color: '#085041' }}>
                Superadmin only
              </span>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Username *</label>
                  <input required value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                    style={{ width: '100%' }} placeholder="john_doe" />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Email</label>
                  <input type="email" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    style={{ width: '100%' }} placeholder="john@example.com" />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Password *</label>
                  <input type="password" required minLength={6} value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    style={{ width: '100%' }} placeholder="Min 6 characters" />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Role *</label>
                  <select value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                    style={{ width: '100%' }}>
                    <option value="viewer">Viewer — read only</option>
                    <option value="analyst">Analyst — view + dashboard</option>
                    <option value="admin">Admin — full transaction access</option>
                    <option value="superadmin">Superadmin — full system access</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit">Create user</button>
                <button type="button" onClick={() => { setShowForm(false); setForm(empty); }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Users table */}
        {loading ? (
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
        ) : (
          <div style={{
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 'var(--border-radius-lg)', overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ background: 'var(--color-background-secondary)' }}>
                  {['Username', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left', fontWeight: 500,
                      fontSize: '13px', color: 'var(--color-text-secondary)',
                      borderBottom: '0.5px solid var(--color-border-tertiary)'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const m = roleMeta[u.role] || roleMeta.viewer;
                  return (
                    <tr key={u.id} style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 500 }}>{u.username}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>{u.email || '—'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <select value={u.role}
                          onChange={e => changeRole(u.id, e.target.value)}
                          style={{
                            fontSize: '12px', padding: '3px 8px',
                            borderRadius: '6px',
                            border: '0.5px solid var(--color-border-secondary)',
                            background: m.bg, color: m.color,
                          }}>
                          <option value="viewer">viewer</option>
                          <option value="analyst">analyst</option>
                          <option value="admin">admin</option>
                          <option value="superadmin">superadmin</option>
                        </select>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                          background: u.is_active ? '#E1F5EE' : '#FCEBEB',
                          color:      u.is_active ? '#085041' : '#791F1F',
                        }}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <button
                          onClick={() => toggleStatus(u.id, u.is_active)}
                          style={{
                            fontSize: '12px', padding: '3px 10px',
                            color:       u.is_active ? 'var(--color-text-danger)' : '#085041',
                            borderColor: u.is_active ? 'var(--color-border-danger)' : '#5DCAA5',
                          }}>
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
    </>
  );
}