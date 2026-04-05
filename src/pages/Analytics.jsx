import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axios';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import '../styles/custom.css';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const CHART_COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316'];

const PRESETS = [
  { label: 'Last 30d', days: 30 },
  { label: 'Last 60d', days: 60 },
  { label: 'Last 90d', days: 90 },
];

const toDateStr = (d) => d.toISOString().slice(0, 10);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 6, fontSize: 11 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {fmt(p.value)}
        </div>
      ))}
    </div>
  );
};

// ─── Normalise API response ──────────────────────────────
// Handles whatever shape Django returns and maps it to what the charts need.
function normalise(raw) {
  if (!raw) return { summary: {}, daily: [], monthly: [], categories: [] };

  // ── Summary ─────────────────────────
  const s = raw.period_summary || raw.summary || raw;
  const summary = {
    total_income: parseFloat(s.total_income ?? s.income ?? 0),
    total_expenses: parseFloat(s.total_expenses ?? s.expenses ?? s.expense ?? 0),
    net_balance: parseFloat(s.net_balance ?? s.balance ?? 0),
  };

  // ── Daily (FIXED: includes line_chart) ─────────────────────────
  const dailyRaw =
    raw.line_chart ||   // ✅ MAIN FIX
    raw.daily ||
    raw.daily_data ||
    raw.income_expense_by_day ||
    [];

  // Normalize daily data
  const mappedDaily = dailyRaw.map(d => ({
    date: d.date ?? d.day ?? '',
    income: parseFloat(d.income ?? d.total_income ?? 0),
    expense: parseFloat(d.expense ?? d.total_expense ?? 0),
  }));

  // 🟢 Fill missing dates (for smooth chart)
  function fillDates(data) {
    if (!data.length) return [];

    const map = new Map(data.map(d => [d.date, d]));
    const result = [];

    let current = new Date(data[0].date);
    const end = new Date(data[data.length - 1].date);

    while (current <= end) {
      const d = current.toISOString().slice(0, 10);

      result.push({
        date: d,
        income: map.get(d)?.income || 0,
        expense: map.get(d)?.expense || 0,
      });

      current.setDate(current.getDate() + 1);
    }

    return result;
  }

  const daily = fillDates(mappedDaily);

  // ── Monthly ─────────────────────────
  const monthlyRaw =
    raw.monthly_trend ||
    raw.monthly ||
    raw.monthly_totals ||
    raw.monthly_breakdown ||
    [];

  const monthly = monthlyRaw.map(m => ({
    month: m.month ?? m.period ?? m.label ?? '',
    income: parseFloat(m.income ?? m.total_income ?? 0),
    expense: parseFloat(m.expense ?? m.total_expense ?? m.expenses ?? 0),
  }));

  // ── Categories (FIXED: merge duplicates) ─────────────────────────
  const catRaw =
    raw.categories ||
    raw.category_breakdown ||
    raw.by_category ||
    raw.category_totals ||
    [];

  // Normalize + merge categories
  const categoryMap = {};

  catRaw.forEach(c => {
    const key = (c.category ?? c.name ?? 'Other').toLowerCase();

    if (!categoryMap[key]) {
      categoryMap[key] = {
        category: key,
        total: 0,
        type: c.type ?? 'expense',
      };
    }

    categoryMap[key].total += parseFloat(c.total ?? c.amount ?? 0);
  });

  const categories = Object.values(categoryMap);

  return { summary, daily, monthly, categories };
}

export default function Analytics() {
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [preset, setPreset] = useState(30);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDebug, setShowDebug] = useState(false);

  const fetchAnalytics = async (from, to) => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get('/analytics/', { params: { date_from: from, date_to: to } });
      setRawData(res.data);
    } catch (err) {
      console.error('Analytics API error:', err?.response || err);
      setError(
        err?.response?.status === 403
          ? 'Access denied — Analyst role or above required.'
          : `Failed to load analytics. Status: ${err?.response?.status ?? 'network error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const to = toDateStr(new Date());
    const from = toDateStr(new Date(Date.now() - preset * 86400000));
    setDateFrom(from);
    setDateTo(to);
    fetchAnalytics(from, to);
  }, [preset]);

  const handleCustomApply = () => {
    if (dateFrom && dateTo) fetchAnalytics(dateFrom, dateTo);
  };

  console.log(rawData)
  const { summary, daily, monthly, categories } = normalise(rawData);
  const maxCatTotal = Math.max(...categories.map(c => c.total), 1);

  return (
    <div>
      {/* ── Header ── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Trends, breakdowns, and insights</p>
        </div>

        {/* Date Controls */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {PRESETS.map(p => (
            <button
              key={p.days}
              className={`date-pill${preset === p.days ? ' active' : ''}`}
              onClick={() => setPreset(p.days)}
            >
              {p.label}
            </button>
          ))}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="date" className="fd-input" style={{ width: 140 }}
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPreset(null); }} />
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <input type="date" className="fd-input" style={{ width: 140 }}
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPreset(null); }} />
            <button className="btn-fd-primary" style={{ padding: '9px 14px' }} onClick={handleCustomApply}>Go</button>
          </div>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '14px 18px', color: '#fca5a5', marginBottom: 20 }}>
          ⚠ {error}
        </div>
      )}

      {/* ── Loading ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
          <div className="spinner-border text-success mb-3" /><br />Crunching numbers…
        </div>
      ) : (
        <>
          {/* ── Debug panel (toggle) ── */}
          <div style={{ marginBottom: 16 }}>
            <button
              className="btn-fd-secondary"
              style={{ fontSize: 12, padding: '5px 12px' }}
              onClick={() => setShowDebug(v => !v)}
            >
              {showDebug ? '▲ Hide' : '▼ Show'} API Debug
            </button>
            {showDebug && (
              <pre style={{
                marginTop: 8,
                background: '#0d1117',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                padding: 14,
                fontSize: 11,
                color: '#7dd3fc',
                overflowX: 'auto',
                maxHeight: 300,
              }}>
                {JSON.stringify(rawData, null, 2)}
              </pre>
            )}
          </div>

          {/* ── Summary Cards ── */}
          <div className="row g-3 mb-4">
            {[
              { label: 'Total Income', value: fmt(summary.total_income), cls: 'income', icon: '📈' },
              { label: 'Total Expenses', value: fmt(summary.total_expenses), cls: 'expense', icon: '📉' },
              {
                label: 'Net Balance', value: fmt(summary.net_balance),
                cls: summary.net_balance >= 0 ? 'balance' : 'expense', icon: '⚖'
              },
            ].map(card => (
              <div className="col-12 col-md-4" key={card.label}>
                <div className="stat-card">
                  <div className={`stat-icon ${card.cls === 'balance' ? 'balance' : card.cls}`}>{card.icon}</div>
                  <div className="stat-body">
                    <div className="stat-label">{card.label}</div>
                    <div className={`stat-value ${card.cls}`}>{card.value}</div>
                    <div className="stat-meta">Selected period</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Line Chart ── */}
          <div className="fd-card mb-3">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h5 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Income vs Expenses — Daily</h5>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{daily.length} data points</span>
            </div>
            {daily.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">📈</div><div className="empty-state-text">No daily data. Check the API debug panel above.</div></div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={daily} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false}
                    tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 13, color: '#94a3b8' }} />
                  <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2.5} dot={false} name="Income" />
                  <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2.5} dot={false} name="Expenses" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="row g-3 mb-3">
            {/* ── Bar Chart ── */}
            <div className="col-12 col-lg-7">
              <div className="fd-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h5 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Monthly Breakdown</h5>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{monthly.length} months</span>
                </div>
                {monthly.length === 0 ? (
                  <div className="empty-state"><div className="empty-state-icon">📊</div><div className="empty-state-text">No monthly data available.</div></div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={monthly} margin={{ top: 5, right: 20, bottom: 5, left: 0 }} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false}
                        tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 13, color: '#94a3b8' }} />
                      <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
                      <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* ── Pie Chart ── */}
            <div className="col-12 col-lg-5">
              <div className="fd-card">
                <h5 style={{ marginBottom: 20, fontSize: 15, fontWeight: 700 }}>Category Split</h5>
                {categories.length === 0 ? (
                  <div className="empty-state"><div className="empty-state-icon">🥧</div><div className="empty-state-text">No category data available.</div></div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={categories}
                        dataKey="total"
                        nameKey="category"
                        cx="50%" cy="50%"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={3}
                      >
                        {categories.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => fmt(value)}
                        labelFormatter={(label, payload) => {
                          const category = payload?.[0]?.payload?.category || '';
                          return category.charAt(0).toUpperCase() + category.slice(1);
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* ── Category Table ── */}
          <div className="fd-card">
            <h5 style={{ marginBottom: 20, fontSize: 15, fontWeight: 700 }}>Category Breakdown</h5>
            {categories.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-text">No category data for selected period.</div>
              </div>
            ) : (
              <div>
                {categories.map((cat, i) => (
                  <div key={i} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{cat.category}</span>
                        {cat.type === 'income'
                          ? <span className="badge-income" style={{ fontSize: 10, padding: '1px 7px' }}>Income</span>
                          : <span className="badge-expense" style={{ fontSize: 10, padding: '1px 7px' }}>Expense</span>}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: cat.type === 'income' ? 'var(--accent-primary)' : 'var(--accent-red)' }}>
                        {fmt(cat.total)}
                        <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6 }}>
                          ({Math.round((cat.total / maxCatTotal) * 100)}%)
                        </span>
                      </span>
                    </div>
                    <div className="fd-progress">
                      <div
                        className={`fd-progress-bar ${cat.type === 'income' ? 'income' : 'expense'}`}
                        style={{ width: `${Math.round((cat.total / maxCatTotal) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}