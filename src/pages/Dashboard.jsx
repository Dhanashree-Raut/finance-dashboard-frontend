import { useEffect, useState } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';

const fmt = (n) => Number(n).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/')
      .then(r => setData(r.data))
      .catch(() => setError('Could not load dashboard. You may not have permission.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
        <h2 style={{ margin: '0 0 1.5rem', fontWeight: 500 }}>Dashboard</h2>

        {loading && <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>}
        {error  && <p style={{ color: 'var(--color-text-danger)' }}>{error}</p>}

        {data && (
          <>
            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '2rem' }}>
              {[
                { label: 'Total income',   value: fmt(data.total_income),   bg: '#E1F5EE', color: '#085041' },
                { label: 'Total expenses', value: fmt(data.total_expenses), bg: '#FCEBEB', color: '#791F1F' },
                { label: 'Net balance',    value: fmt(data.net_balance),    bg: '#E6F1FB', color: '#0C447C' },
              ].map(c => (
                <div key={c.label} style={{
                  background: c.bg, borderRadius: 'var(--border-radius-md)',
                  padding: '1rem'
                }}>
                  <p style={{ fontSize: '13px', color: c.color, margin: '0 0 4px' }}>{c.label}</p>
                  <p style={{ fontSize: '22px', fontWeight: 500, color: c.color, margin: 0 }}>{c.value}</p>
                </div>
              ))}
            </div>

            {/* Category totals */}
            <div style={{
              background: 'var(--color-background-primary)',
              border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: 'var(--border-radius-lg)', padding: '1.25rem', marginBottom: '1.5rem'
            }}>
              <h3 style={{ margin: '0 0 1rem', fontWeight: 500, fontSize: '15px' }}>Category breakdown</h3>
              {data.category_totals.map((c, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0', borderBottom: '0.5px solid var(--color-border-tertiary)'
                }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                      background: c.type === 'income' ? '#E1F5EE' : '#FCEBEB',
                      color:      c.type === 'income' ? '#085041' : '#791F1F'
                    }}>{c.type}</span>
                    <span style={{ fontSize: '14px' }}>{c.category}</span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{fmt(c.total)}</span>
                </div>
              ))}
            </div>

            {/* Recent activity */}
            <div style={{
              background: 'var(--color-background-primary)',
              border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: 'var(--border-radius-lg)', padding: '1.25rem'
            }}>
              <h3 style={{ margin: '0 0 1rem', fontWeight: 500, fontSize: '15px' }}>Recent activity</h3>
              {data.recent_activity.map((t, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '8px 0', borderBottom: '0.5px solid var(--color-border-tertiary)',
                  fontSize: '14px'
                }}>
                  <div>
                    <span style={{ fontWeight: 500 }}>{t.category}</span>
                    <span style={{ color: 'var(--color-text-secondary)', marginLeft: '8px', fontSize: '12px' }}>{t.date}</span>
                  </div>
                  <span style={{ color: t.type === 'income' ? '#085041' : '#791F1F', fontWeight: 500 }}>
                    {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}