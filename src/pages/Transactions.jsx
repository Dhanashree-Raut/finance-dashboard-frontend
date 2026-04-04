import { useEffect, useState } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const fmt = (n) =>
  Number(n).toLocaleString('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  });

const empty = { amount: '', type: 'income', category: '', date: '', notes: '' };

export default function Transactions() {
  const { user } = useAuth();
  const canWrite = ['admin', 'superadmin'].includes(user?.role);
  const isReadOnly = ['viewer', 'analyst'].includes(user?.role);

  const [txns, setTxns]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filters, setFilters]   = useState({ type: '', category: '', date_from: '', date_to: '' });
  const [form, setForm]         = useState(empty);
  const [editId, setEditId]     = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError]       = useState('');
  const [msg, setMsg]           = useState('');

  const load = () => {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    api.get('/transactions/', { params })
      .then(r => setTxns(r.data.results ?? r.data))
      .catch(() => setError('Failed to load transactions.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filters]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      if (editId) {
        await api.patch(`/transactions/${editId}/`, form);
        setMsg('Transaction updated.');
      } else {
        await api.post('/transactions/', form);
        setMsg('Transaction created.');
      }
      setForm(empty); setEditId(null); setShowForm(false); load();
    } catch (err) {
      setError(err.response?.data?.amount?.[0] ?? 'Failed to save.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    await api.delete(`/transactions/${id}/`);
    setMsg('Deleted.'); load();
  };

  const startEdit = (t) => {
    setForm({ amount: t.amount, type: t.type, category: t.category, date: t.date, notes: t.notes || '' });
    setEditId(t.id); setShowForm(true); setError('');
  };

  const roleMeta = {
    viewer:     { bg: '#F1EFE8', color: '#444441' },
    analyst:    { bg: '#E6F1FB', color: '#0C447C' },
    admin:      { bg: '#FAEEDA', color: '#633806' },
    superadmin: { bg: '#E1F5EE', color: '#085041' },
  };
  const badge = roleMeta[user?.role] || roleMeta.viewer;

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>

        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '1.5rem'
        }}>
          <h2 style={{ margin: 0, fontWeight: 500 }}>Transactions</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{
              fontSize: '12px', padding: '4px 12px', borderRadius: '20px',
              background: badge.bg, color: badge.color, fontWeight: 500,
            }}>{user?.role}</span>
            {canWrite && (
              <button onClick={() => { setShowForm(true); setEditId(null); setForm(empty); }}>
                + Add transaction
              </button>
            )}
          </div>
        </div>

        {/* Read-only info banner */}
        {isReadOnly && (
          <div style={{
            background: '#E6F1FB', borderRadius: 'var(--border-radius-md)',
            padding: '10px 14px', marginBottom: '1.5rem',
            fontSize: '13px', color: '#0C447C',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="8" cy="8" r="7" stroke="#0C447C" strokeWidth="1.2"/>
              <path d="M8 7v4M8 5.5h.01" stroke="#0C447C" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            {user?.role === 'viewer'
              ? 'You have read-only access. Contact an admin to modify transactions.'
              : 'You have Analyst access — you can view transactions and the dashboard.'}
          </div>
        )}

        {msg && <div style={{ background: '#E1F5EE', color: '#085041', padding: '8px 12px', borderRadius: 'var(--border-radius-md)', fontSize: '13px', marginBottom: '1rem' }}>{msg}</div>}
        {error && <div style={{ background: '#FCEBEB', color: '#791F1F', padding: '8px 12px', borderRadius: 'var(--border-radius-md)', fontSize: '13px', marginBottom: '1rem' }}>{error}</div>}

        {/* Add/Edit form — admin + superadmin only */}
        {showForm && canWrite && (
          <div style={{
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '1.25rem', marginBottom: '1.5rem'
          }}>
            <h3 style={{ margin: '0 0 1rem', fontWeight: 500, fontSize: '15px' }}>
              {editId ? 'Edit transaction' : 'New transaction'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Amount *</label>
                  <input type="number" step="0.01" min="0.01" required value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Type *</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ width: '100%' }}>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Category *</label>
                  <input required value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })} style={{ width: '100%' }} placeholder="e.g. salary, rent" />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Date *</label>
                  <input type="date" required value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })} style={{ width: '100%' }} />
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Notes</label>
                <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ width: '100%' }} placeholder="Optional" />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit">{editId ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div style={{
          background: 'var(--color-background-secondary)',
          borderRadius: 'var(--border-radius-md)', padding: '12px 16px',
          display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
          gap: '10px', marginBottom: '1.5rem'
        }}>
          <select value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}>
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <input placeholder="Category" value={filters.category}
            onChange={e => setFilters({ ...filters, category: e.target.value })} />
          <input type="date" value={filters.date_from}
            onChange={e => setFilters({ ...filters, date_from: e.target.value })} />
          <input type="date" value={filters.date_to}
            onChange={e => setFilters({ ...filters, date_to: e.target.value })} />
        </div>

        {/* Table */}
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
                  {['Date', 'Category', 'Type', 'Amount', 'Notes', canWrite ? 'Actions' : null]
                    .filter(Boolean).map(h => (
                      <th key={h} style={{
                        padding: '10px 14px', textAlign: 'left', fontWeight: 500,
                        fontSize: '13px', color: 'var(--color-text-secondary)',
                        borderBottom: '0.5px solid var(--color-border-tertiary)'
                      }}>{h}</th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {txns.length === 0 ? (
                  <tr><td colSpan={canWrite ? 6 : 5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No transactions found.</td></tr>
                ) : txns.map(t => (
                  <tr key={t.id} style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                    <td style={{ padding: '10px 14px' }}>{t.date}</td>
                    <td style={{ padding: '10px 14px' }}>{t.category}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                        background: t.type === 'income' ? '#E1F5EE' : '#FCEBEB',
                        color:      t.type === 'income' ? '#085041' : '#791F1F',
                      }}>{t.type}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 500, color: t.type === 'income' ? '#085041' : '#791F1F' }}>
                      {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>{t.notes || '—'}</td>
                    {canWrite && (
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => startEdit(t)} style={{ fontSize: '12px', padding: '3px 10px' }}>Edit</button>
                          <button onClick={() => handleDelete(t.id)} style={{ fontSize: '12px', padding: '3px 10px', color: 'var(--color-text-danger)', borderColor: 'var(--color-border-danger)' }}>Delete</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}