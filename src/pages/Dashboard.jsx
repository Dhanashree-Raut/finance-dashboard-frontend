import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axios';
import '../styles/custom.css';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const CATEGORY_ICONS = {
  salary: '💼', rent: '🏠', food: '🍽', transport: '🚗',
  entertainment: '🎬', utilities: '⚡', healthcare: '💊',
  education: '📚', freelance: '🖥', investment: '📈',
  bonus: '🎁', gym: '🏋', insurance: '🛡', default: '📁',
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axiosInstance.get('/dashboard/')
      .then(res => setData(res.data))
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
      <div className="spinner-border text-success me-3" />
      Loading dashboard…
    </div>
  );

  if (error) return (
    <div className="alert-danger p-3 rounded">{error}</div>
  );

  const {
    total_income,
    total_expenses,
    net_balance,
    // transaction_count,
    categories,
    recent_transactions,
    monthly_trend
  } = normalizeDashboard(data);

  const incomeCategories = [...(categories || [])]
    .filter(c => c.type === 'income')
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
  const spendingCategories = [...(categories || [])]
    .filter(c => c.type === 'expense')
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
  const maxIncome = incomeCategories[0]?.total || 1;
  const maxSpending = spendingCategories[0]?.total || 1;

  // ✅ Normalize dashboard data (IMPORTANT)
  function normalizeDashboard(raw) {
    if (!raw) return {};

    // ── Summary ─────────────────────────
    const total_income = parseFloat(raw.total_income ?? 0);
    const total_expenses = parseFloat(raw.total_expenses ?? 0);
    const net_balance = parseFloat(raw.net_balance ?? 0);

    // ── Categories (merge + fix case) ─────────────────────────
    const catRaw = raw.categories || raw.category_totals || [];

    const categoryMap = {};

    catRaw.forEach(c => {
      const key = (c.category ?? 'other').toLowerCase();

      if (!categoryMap[key]) {
        categoryMap[key] = {
          category: key,
          total: 0,
          type: c.type ?? 'expense',
        };
      }

      categoryMap[key].total += parseFloat(c.total ?? 0);
    });

    const categories = Object.values(categoryMap);

    // ── Recent Transactions (FIX name mismatch) ─────────────────────────
    const recent_transactions = (raw.recent_transactions || raw.recent_activity || []).map(txn => ({
      ...txn,
      category: txn.category ?? 'Other',
      amount: parseFloat(txn.amount ?? 0),
    }));

    // ── Monthly Trend (GROUP by month) ─────────────────────────
    const monthlyRaw = raw.monthly_trend || [];

    const monthlyMap = {};

    monthlyRaw.forEach(m => {
      const key = m.month;

      if (!monthlyMap[key]) {
        monthlyMap[key] = {
          month: new Date(key).toLocaleDateString('en-IN', {
            month: 'short',
            year: 'numeric',
          }),
          income: 0,
          expense: 0,
        };
      }

      if (m.type === 'income') {
        monthlyMap[key].income += parseFloat(m.total ?? 0);
      } else {
        monthlyMap[key].expense += parseFloat(m.total ?? 0);
      }
    });

    const monthly_trend = Object.values(monthlyMap);

    return {
      total_income,
      total_expenses,
      net_balance,
      transaction_count: recent_transactions.length,
      categories,
      recent_transactions,
      monthly_trend,
    };
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Financial snapshot for your organisation</p>
      </div>

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Income', value: fmt(total_income), cls: 'income', icon: '📈', iconCls: 'income' },
          { label: 'Total Expenses', value: fmt(total_expenses), cls: 'expense', icon: '📉', iconCls: 'expense' },
          { label: 'Net Balance', value: fmt(net_balance), cls: net_balance >= 0 ? 'balance' : 'expense', icon: '⚖', iconCls: 'balance' },
          // { label: 'Transactions', value: transaction_count, cls: 'gold', icon: '🔢', iconCls: 'txn' },
        ].map(card => (
          <div className="col-12 col-sm-6 col-xl-4" key={card.label}>
            <div className="stat-card">
              <div className={`stat-icon ${card.iconCls}`}>{card.icon}</div>
              <div className="stat-body">
                <div className="stat-label">{card.label}</div>
                <div className={`stat-value ${card.cls}`}>{card.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Row 1 — Recent Transactions (full width) */}
      <div className="row g-3 mb-3">
        <div className="col-12">
          <div className="fd-card" style={{ padding: '0' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h5 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Recent Transactions</h5>
              <a href="/transactions" style={{ fontSize: 13, color: 'var(--accent-primary)' }}>View all →</a>
            </div>
            <div className="fd-table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table className="fd-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recent_transactions.length === 0 ? (
                    <tr><td colSpan={4}><div className="empty-state">No recent transactions.</div></td></tr>
                  ) : recent_transactions.slice(0, 8).map((txn, i) => (
                    <tr key={i}>
                      <td>
                        <span style={{ marginRight: 8 }}>
                          {CATEGORY_ICONS[txn.category?.toLowerCase()] || CATEGORY_ICONS.default}
                        </span>
                        {txn.category}
                      </td>
                      <td>{txn.date}</td>
                      <td>
                        {txn.type === 'income'
                          ? <span className="badge-income">↑ Income</span>
                          : <span className="badge-expense">↓ Expense</span>}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={txn.type === 'income' ? 'amount-income' : 'amount-expense'}>
                          {txn.type === 'income' ? '+' : '−'}{fmt(txn.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 — Monthly Trend (full width, below transactions) */}
      {monthly_trend?.length > 0 && (
        <div className="row g-3 mb-3">
          <div className="col-12">
            <div className="fd-card">
              <h5 style={{ marginBottom: 16, fontSize: 15, fontWeight: 700 }}>Monthly Trend</h5>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 80 }}>
                {monthly_trend.slice(-6).map((m, i) => {
                  const maxVal = Math.max(...monthly_trend.map(x => x.income + x.expense));
                  const h = Math.max(8, Math.round(((m.income + m.expense) / maxVal) * 72));
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{
                        width: '100%', height: h,
                        background: 'linear-gradient(180deg, var(--accent-primary), rgba(16,185,129,0.3))',
                        borderRadius: 4,
                      }} title={`${m.month}: ${fmt(m.income + m.expense)}`} />
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {m.month?.slice(0, 3)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Row 3 — Top Income & Spending Categories side by side */}
      <div className="row g-3">
        {/* Income Categories */}
        <div className="col-12 col-lg-6">
          <div className="fd-card h-100">
            <h5 style={{ marginBottom: 20, fontSize: 15, fontWeight: 700, color: 'var(--accent-primary)' }}>
              📈 Top Income Categories
            </h5>
            {incomeCategories.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">📊</div><div className="empty-state-text">No income data available</div></div>
            ) : incomeCategories.map((cat, i) => (
              <div key={i} style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {CATEGORY_ICONS[cat.category?.toLowerCase()] || CATEGORY_ICONS.default}
                    {cat.category}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-primary)' }}>
                    {fmt(cat.total)}
                  </span>
                </div>
                <div className="fd-progress">
                  <div className="fd-progress-bar income" style={{ width: `${Math.round((cat.total / maxIncome) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Spending Categories */}
        <div className="col-12 col-lg-6">
          <div className="fd-card h-100">
            <h5 style={{ marginBottom: 20, fontSize: 15, fontWeight: 700, color: 'var(--accent-red)' }}>
              📉 Top Spending Categories
            </h5>
            {spendingCategories.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">📊</div><div className="empty-state-text">No spending data available</div></div>
            ) : spendingCategories.map((cat, i) => (
              <div key={i} style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {CATEGORY_ICONS[cat.category?.toLowerCase()] || CATEGORY_ICONS.default}
                    {cat.category}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-red)' }}>
                    {fmt(cat.total)}
                  </span>
                </div>
                <div className="fd-progress">
                  <div className="fd-progress-bar expense" style={{ width: `${Math.round((cat.total / maxSpending) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}