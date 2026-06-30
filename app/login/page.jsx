'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email || !password) return setError('Please fill in all fields.');
    try {
      setLoading(true);
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ background: '#080D1A', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#101828', border: '1px solid #1E2D4A', borderRadius: 20, padding: 40, width: '100%', maxWidth: 420 }}>
        <h1 style={{ fontFamily: 'sans-serif', fontSize: 28, fontWeight: 700, color: '#F8FAFC', marginBottom: 8 }}>
          TSL<span style={{ color: '#06D6A0' }}>Bridge</span>
        </h1>
        <p style={{ color: '#64748B', marginBottom: 32 }}>Sign in to your account</p>

        {error && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', color: '#FCA5A5', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 14 }}>{error}</div>}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', color: '#94A3B8', fontSize: 13, marginBottom: 6 }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
            style={{ width: '100%', background: '#0A1628', border: '1px solid #1E2D4A', borderRadius: 10, padding: '12px 16px', color: '#F8FAFC', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', color: '#94A3B8', fontSize: 13, marginBottom: 6 }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={{ width: '100%', background: '#0A1628', border: '1px solid #1E2D4A', borderRadius: 10, padding: '12px 16px', color: '#F8FAFC', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', padding: '14px', borderRadius: 10, background: '#3B82F6', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}>
          {loading ? 'Signing in…' : 'Sign In →'}
        </button>

        <p style={{ textAlign: 'center', marginTop: 20, color: '#475569', fontSize: 14 }}>
          No account? <a href="/register" style={{ color: '#06D6A0' }}>Register here</a>
        </p>
      </div>
    </div>
  );
}