import { useEffect, useState, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import api from '../api/axios';
import Navbar from '../components/Navbar';

const fmt = (n) =>
  Number(n).toLocaleString('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  });

const today = () => new Date().toISOString().split('T')[0];
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

const PRESET_RANGES = [
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 60 days', days: 60 },
  { label: 'Last 90 days', days: 90 },
];

const PIE_COLORS = [
  '#1D9E75', '#378ADD', '#D85A30', '#BA7517',
  '#7F77DD', '#D4537E', '#639922', '#E24B4A',
];

const card = {
  background: 'var(--color-background-primary)',
  border: '0.5px solid var(--color-border-tertiary)',
  borderRadius: 'var(--border-radius-lg)',
  padding: '1.25rem',
  marginBottom: '1.25rem',
};

const tooltipStyle = {
  background: 'var(--color-background-primary)',
  border: '0.5px solid var(--color-border-tertiary)',
  borderRadius: '8px',
  fontSize: '13px',
};

export default function Analytics() {
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [activePreset, setPreset] = useState(30);
  const [dateFrom, setDateFrom]   = useState(daysAgo(30));
  const [dateTo, setDateTo]       = useState(today());

  const load = useCallback((from, to) => {
    setLoading(true);
    setError('');
    api.get('/analytics/', { params: { date_from: from, date_to: to } })
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load analytics data.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(dateFrom, dateTo); }, []);

  const applyPreset = (days) => {
    const from = daysAgo(days);
    const to   = today();
    setPreset(days);
    setDateFrom(from);
    setDateTo(to);
    load(from, to);
  };

  const applyCustom = () => {
    setPreset(null);
    load(dateFrom, dateTo);
  };

  const incomeColor  = '#1D9E75';
  const expenseColor = '#D85A30';
  const balanceColor = '#378ADD';

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>

        {/* Page header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ margin: '0 0 4px', fontWeight: 500 }}>Analytics</h2>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Financial insights and trends for the selected period
          </p>
        </div>

        {/* Date range controls */}
        <div style={{
          background: 'var(--color-background-secondary)',
          borderRadius: 'var(--border-radius-lg)',
          padding: '14px 16px',
          marginBottom: '1.5rem',
          display: 'flex', flexWrap: 'wrap',
          alignItems: 'center', gap: '10px',
        }}>
          {/* Preset buttons */}
          {PRESET_RANGES.map(p => (
            <button
              key={p.days}
              onClick={() => applyPreset(p.days)}
              style={{
                fontSize: '13px', padding: '5px 14px',
                borderRadius: 'var(--border-radius-md)',
                border: activePreset === p.days
                  ? '1.5px solid #1D9E75'
                  : '0.5px solid var(--color-border-secondary)',
                background: activePreset === p.days ? '#E1F5EE' : 'transparent',
                color: activePreset === p.days ? '#085041' : 'var(--color-text-secondary)',
                cursor: 'pointer', fontWeight: activePreset === p.days ? 500 : 400,
              }}>
              {p.label}
            </button>
          ))}

          {/* Divider */}
          <div style={{ width: '0.5px', height: '24px', background: 'var(--color-border-tertiary)' }} />

          {/* Custom date range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>From</span>
            <input type="date" value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPreset(null); }}
              style={{ fontSize: '13px' }} />
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>To</span>
            <input type="date" value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPreset(null); }}
              style={{ fontSize: '13px' }} />
            <button onClick={applyCustom} style={{ fontSize: '13px', padding: '5px 14px' }}>
              Apply
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: '#FCEBEB', color: '#791F1F', padding: '10px 14px', borderRadius: 'var(--border-radius-md)', marginBottom: '1rem', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            Loading analytics...
          </div>
        )}

        {data && !loading && (
          <>
            {/* Period label */}
            <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: '1.25rem' }}>
              Showing data from {data.period.from} to {data.period.to}
            </p>

            {/* Summary stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
              {[
                { label: 'Total income',   value: fmt(data.summary.total_income),   bg: '#E1F5EE', color: '#085041' },
                { label: 'Total expenses', value: fmt(data.summary.total_expenses), bg: '#FCEBEB', color: '#791F1F' },
                { label: 'Net balance',
                  value: fmt(Math.abs(data.summary.net_balance)),
                  bg:    data.summary.net_balance >= 0 ? '#E6F1FB' : '#FCEBEB',
                  color: data.summary.net_balance >= 0 ? '#0C447C' : '#791F1F',
                  prefix: data.summary.net_balance >= 0 ? '+' : '-',
                },
              ].map(c => (
                <div key={c.label} style={{ background: c.bg, borderRadius: 'var(--border-radius-md)', padding: '1rem' }}>
                  <p style={{ fontSize: '12px', color: c.color, margin: '0 0 4px' }}>{c.label}</p>
                  <p style={{ fontSize: '22px', fontWeight: 500, color: c.color, margin: 0 }}>
                    {c.prefix || ''}{c.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Chart 1 — Income vs Expense line chart */}
            <div style={card}>
              <h3 style={{ margin: '0 0 1.25rem', fontWeight: 500, fontSize: '15px' }}>
                Income vs expenses — daily
              </h3>
              {data.line_chart.length === 0 ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={data.line_chart} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [fmt(v), n]} />
                    <Legend wrapperStyle={{ fontSize: '13px' }} />
                    <Line type="monotone" dataKey="income"  stroke={incomeColor}  strokeWidth={2} dot={false} name="Income" />
                    <Line type="monotone" dataKey="expense" stroke={expenseColor} strokeWidth={2} dot={false} name="Expense" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Chart 2 — Net balance over time */}
            <div style={card}>
              <h3 style={{ margin: '0 0 1.25rem', fontWeight: 500, fontSize: '15px' }}>
                Net balance over time
              </h3>
              {data.line_chart.length === 0 ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={data.line_chart} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [fmt(v), 'Net balance']} />
                    <Line
                      type="monotone" dataKey="balance" stroke={balanceColor}
                      strokeWidth={2.5} dot={false} name="Net balance"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Chart 3 + Chart 4 — side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>

              {/* Monthly trend bar chart */}
              <div style={{ ...card, marginBottom: 0 }}>
                <h3 style={{ margin: '0 0 1.25rem', fontWeight: 500, fontSize: '15px' }}>
                  Monthly trend
                </h3>
                {data.monthly_trend.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={data.monthly_trend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [fmt(v), n]} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="income"  fill={incomeColor}  radius={[3,3,0,0]} name="Income" />
                      <Bar dataKey="expense" fill={expenseColor} radius={[3,3,0,0]} name="Expense" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Category pie chart */}
              <div style={{ ...card, marginBottom: 0 }}>
                <h3 style={{ margin: '0 0 1.25rem', fontWeight: 500, fontSize: '15px' }}>
                  Spending by category
                </h3>
                {data.category_totals.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={data.category_totals}
                          dataKey="total"
                          nameKey="category"
                          cx="50%" cy="50%"
                          outerRadius={80}
                          innerRadius={40}
                        >
                          {data.category_totals.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [fmt(v), n]} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Legend below pie */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                      {data.category_totals.slice(0, 6).map((c, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                          <span style={{ color: 'var(--color-text-secondary)' }}>{c.category}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Category breakdown table */}
            <div style={card}>
              <h3 style={{ margin: '0 0 1rem', fontWeight: 500, fontSize: '15px' }}>
                Category breakdown
              </h3>
              {data.category_totals.length === 0 ? (
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>No data for this period.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-background-secondary)' }}>
                      {['Category', 'Type', 'Total', 'Share'].map(h => (
                        <th key={h} style={{
                          padding: '8px 12px', textAlign: 'left', fontWeight: 500,
                          color: 'var(--color-text-secondary)',
                          borderBottom: '0.5px solid var(--color-border-tertiary)',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.category_totals.map((c, i) => {
                      const grandTotal = data.category_totals.reduce((s, x) => s + x.total, 0);
                      const pct = grandTotal > 0 ? ((c.total / grandTotal) * 100).toFixed(1) : '0';
                      return (
                        <tr key={i} style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                          <td style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length] }} />
                            {c.category}
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{
                              fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                              background: c.type === 'income' ? '#E1F5EE' : '#FCEBEB',
                              color:      c.type === 'income' ? '#085041' : '#791F1F',
                            }}>{c.type}</span>
                          </td>
                          <td style={{ padding: '8px 12px', fontWeight: 500, color: c.type === 'income' ? '#085041' : '#791F1F' }}>
                            {fmt(c.total)}
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ flex: 1, height: '4px', background: 'var(--color-background-secondary)', borderRadius: '2px' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: PIE_COLORS[i % PIE_COLORS.length], borderRadius: '2px' }} />
                              </div>
                              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', minWidth: '36px' }}>{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function EmptyChart() {
  return (
    <div style={{
      height: '200px', display: 'flex', alignItems: 'center',
      justifyContent: 'center', color: 'var(--color-text-tertiary)',
      fontSize: '13px', border: '0.5px dashed var(--color-border-tertiary)',
      borderRadius: 'var(--border-radius-md)',
    }}>
      No data for this period
    </div>
  );
}