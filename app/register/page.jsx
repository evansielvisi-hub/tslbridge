'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!form.name || !form.email || !form.password || !form.role) return setError('Please fill in all fields and select a role.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    try {
      setLoading(true);
      await register(form.name, form.email, form.password, form.role);
      router.push('/dashboard');
    } catch (err) {
      setError(err.code === 'auth/email-already-in-use' ? 'Email already registered.' : 'Registration failed. Try again.');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ background: '#080D1A', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#101828', border: '1px solid #1E2D4A', borderRadius: 20, padding: 40, width: '100%', maxWidth: 440 }}>
        <h1 style={{ fontFamily: 'sans-serif', fontSize: 28, fontWeight: 700, color: '#F8FAFC', marginBottom: 8 }}>
          TSL<span style={{ color: '#06D6A0' }}>Bridge</span>
        </h1>
        <p style={{ color: '#64748B', marginBottom: 32 }}>Create your free account</p>

        {error && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', color: '#FCA5A5', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 14 }}>{error}</div>}

        {[{ label: 'Full Name', key: 'name', type: 'text', placeholder: 'Your full name' },
          { label: 'Email', key: 'email', type: 'email', placeholder: 'you@example.com' },
          { label: 'Password', key: 'password', type: 'password', placeholder: 'Min. 6 characters' }
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: 13, marginBottom: 6 }}>{f.label}</label>
            <input type={f.type} value={form[f.key]} placeholder={f.placeholder}
              onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              style={{ width: '100%', background: '#0A1628', border: '1px solid #1E2D4A', borderRadius: 10, padding: '12px 16px', color: '#F8FAFC', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
        ))}

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', color: '#94A3B8', fontSize: 13, marginBottom: 10 }}>I am a:</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[{ value: 'deaf', icon: '🤟', label: 'Deaf User' }, { value: 'hearing', icon: '🎙️', label: 'Hearing User' }].map(r => (
              <button key={r.value} onClick={() => setForm(p => ({ ...p, role: r.value }))}
                style={{ padding: '16px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                  background: form.role === r.value ? 'rgba(6,214,160,.1)' : '#0A1628',
                  border: `2px solid ${form.role === r.value ? '#06D6A0' : '#1E2D4A'}` }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{r.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: form.role === r.value ? '#06D6A0' : '#94A3B8' }}>{r.label}</div>
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', padding: '14px', borderRadius: 10, background: '#06D6A0', color: '#080D1A', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}>
          {loading ? 'Creating account…' : 'Create Account →'}
        </button>

        <p style={{ textAlign: 'center', marginTop: 20, color: '#475569', fontSize: 14 }}>
          Have an account? <a href="/login" style={{ color: '#06D6A0' }}>Sign in</a>
        </p>
      </div>
    </div>
  );
}