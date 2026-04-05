import React, { useEffect, useState, useContext } from 'react';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';
import '../styles/custom.css';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const EMPTY_FORM = { amount: '', type: 'income', category: '', date: '', notes: '' };

export default function Transactions() {
  const { user } = useAuth();
  const canEdit = ['admin', 'superadmin'].includes(user?.role);

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch]     = useState('');
  const [typeFilter, setType]   = useState('');
  const [catFilter, setCat]     = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editTxn, setEditTxn]     = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');

  const fetchData = async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p };
      if (search)     params.search   = search;
      if (typeFilter) params.type     = typeFilter;
      if (catFilter)  params.category = catFilter;
      if (dateFrom)   params.date_from = dateFrom;
      if (dateTo)     params.date_to   = dateTo;

      const res = await axiosInstance.get('/transactions/', { params });
      setTransactions(res.data.results || res.data);
      if (res.data.count) setTotalPages(Math.ceil(res.data.count / 20));
    } catch {
      setError('Could not load transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(page); }, [page]);

  const handleFilter = (e) => { e.preventDefault(); setPage(1); fetchData(1); };

  const openAdd = () => {
    setEditTxn(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (txn) => {
    setEditTxn(txn);
    setForm({ amount: txn.amount, type: txn.type, category: txn.category, date: txn.date, notes: txn.notes || '' });
    setFormError('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Soft-delete this transaction?')) return;
    try {
      await axiosInstance.delete(`/transactions/${id}/`);
      fetchData(page);
    } catch {
      alert('Delete failed.');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.amount || !form.category || !form.date) {
      setFormError('Amount, category, and date are required.');
      return;
    }
    setSaving(true);
    try {
      if (editTxn) {
        await axiosInstance.patch(`/transactions/${editTxn.id}/`, form);
      } else {
        await axiosInstance.post('/transactions/', form);
      }
      setShowModal(false);
      fetchData(page);
    } catch (err) {
      setFormError(err?.response?.data?.detail || 'Save failed. Check your inputs.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">View and manage all financial records</p>
        </div>
        {canEdit && (
          <button className="btn-fd-primary" onClick={openAdd}>
            ＋ Add Transaction
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="fd-card mb-3" style={{ padding: '16px 20px' }}>
        <form onSubmit={handleFilter}>
          <div className="row g-2 align-items-end">
            <div className="col-12 col-md-4">
              <input className="fd-input" placeholder="🔍  Search category or notes…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="col-6 col-md-2">
              <select className="fd-select w-100" value={typeFilter} onChange={e => setType(e.target.value)}>
                <option value="">All types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div className="col-6 col-md-2">
              <input className="fd-input" placeholder="Category" value={catFilter} onChange={e => setCat(e.target.value)} />
            </div>
            <div className="col-6 col-md-2">
              <input type="date" className="fd-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="col-6 col-md-2">
              <input type="date" className="fd-input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <div className="col-12 d-flex gap-2">
              <button type="submit" className="btn-fd-primary">Apply Filters</button>
              <button type="button" className="btn-fd-secondary" onClick={() => {
                setSearch(''); setType(''); setCat(''); setDateFrom(''); setDateTo('');
                setPage(1); fetchData(1);
              }}>Clear</button>
            </div>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="fd-card" style={{ padding: 0 }}>
        {error && <div className="alert-danger m-3 p-3 rounded">{error}</div>}

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="spinner-border text-success mb-2" /><br />Loading transactions…
          </div>
        ) : (
          <>
            <div className="fd-table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table className="fd-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Notes</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    {canEdit && <th style={{ textAlign: 'center' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={canEdit ? 7 : 6}>
                        <div className="empty-state">
                          <div className="empty-state-icon">📋</div>
                          <div className="empty-state-text">No transactions found.</div>
                        </div>
                      </td>
                    </tr>
                  ) : transactions.map((txn, i) => (
                    <tr key={txn.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {(page - 1) * 20 + i + 1}
                      </td>
                      <td>{txn.date}</td>
                      <td>{txn.category}</td>
                      <td>
                        {txn.type === 'income'
                          ? <span className="badge-income">↑ Income</span>
                          : <span className="badge-expense">↓ Expense</span>}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {txn.notes || '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={txn.type === 'income' ? 'amount-income' : 'amount-expense'}>
                          {txn.type === 'income' ? '+' : '−'}{fmt(txn.amount)}
                        </span>
                      </td>
                      {canEdit && (
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            <button className="btn-icon" onClick={() => openEdit(txn)} title="Edit">✎</button>
                            <button className="btn-icon" onClick={() => handleDelete(txn.id)} title="Delete"
                              style={{ color: 'var(--accent-red)', borderColor: 'rgba(239,68,68,0.2)' }}>🗑</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ padding: '16px 20px' }}>
                <div className="fd-pagination">
                  <button className="fd-page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                    <button key={p} className={`fd-page-btn${page === p ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                  ))}
                  <button className="fd-page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fd-modal-backdrop" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="fd-modal">
            <div className="fd-modal-header">
              <h5 className="fd-modal-title">{editTxn ? 'Edit Transaction' : 'New Transaction'}</h5>
              <button className="fd-modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {formError && <div className="login-error mb-3"><span>⚠</span> {formError}</div>}

            <form onSubmit={handleSave}>
              <div className="row g-3">
                <div className="col-6">
                  <label className="fd-label">Amount (₹) *</label>
                  <input type="number" className="fd-input" min="0.01" step="0.01"
                    value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div className="col-6">
                  <label className="fd-label">Type *</label>
                  <select className="fd-select w-100"
                    value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="fd-label">Category *</label>
                  <input className="fd-input" placeholder="e.g. salary, rent"
                    value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
                </div>
                <div className="col-6">
                  <label className="fd-label">Date *</label>
                  <input type="date" className="fd-input"
                    value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="col-12">
                  <label className="fd-label">Notes</label>
                  <textarea className="fd-input" rows={3} placeholder="Optional description…"
                    value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" className="btn-fd-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-fd-primary" disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</> : (editTxn ? 'Save Changes' : 'Add Transaction')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
