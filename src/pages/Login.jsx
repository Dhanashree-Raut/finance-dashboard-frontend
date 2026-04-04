import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form.username, form.password);
      navigate('/dashboard');
    } catch {
      setError('Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-background-tertiary)'
    }}>
      <div style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '2rem', width: '100%', maxWidth: '360px'
      }}>
        <h2 style={{ margin: '0 0 1.5rem', fontWeight: 500 }}>Sign in</h2>
        {error && (
          <div style={{
            background: 'var(--color-background-danger)',
            color: 'var(--color-text-danger)',
            padding: '8px 12px', borderRadius: 'var(--border-radius-md)',
            fontSize: '13px', marginBottom: '1rem'
          }}>{error}</div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Username</label>
            <input
              type="text" value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              placeholder="admin" style={{ width: '100%' }} required
            />
          </div>
          <div>
            <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Password</label>
            <input
              type="password" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••" style={{ width: '100%' }} required
            />
          </div>
          <button type="submit" disabled={loading} style={{ marginTop: '8px', width: '100%' }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}