'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const { user, profile, logout } = useAuth();
  const router = useRouter();

  const [name,    setName]    = useState('');
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (profile) setName(profile.name || '');
  }, [user, profile]);

  async function handleSave() {
    if (!name.trim()) return setError('Name cannot be empty.');
    setError('');
    try {
      setSaving(true);
      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), { name: name.trim() });
      // Update Firebase Auth display name
      await updateProfile(auth.currentUser, { displayName: name.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() { await logout(); router.push('/'); }

  if (!user || !profile) return (
    <div style={{ background: '#080D1A', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #06D6A0', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const isDeaf = profile.role === 'deaf';

  return (
    <div style={{ background: '#080D1A', minHeight: '100vh' }}>

      {/* NAV */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid #1E2D4A' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#F8FAFC', cursor: 'pointer' }}
          onClick={() => router.push('/dashboard')}>
          TSL<span style={{ color: '#06D6A0' }}>Bridge</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => router.push('/dashboard')}
            style={{ padding: '8px 16px', borderRadius: 8, background: 'transparent', border: '1px solid #1E2D4A', color: '#94A3B8', cursor: 'pointer', fontSize: 13 }}>
            ← Dashboard
          </button>
          <button onClick={() => router.push('/profile')}
  style={{ padding: '8px 16px', borderRadius: 8, background: 'transparent', border: '1px solid #1E2D4A', color: '#94A3B8', cursor: 'pointer', fontSize: 13 }}>
  👤 Profile
</button>
          <button onClick={handleLogout}
            style={{ padding: '8px 16px', borderRadius: 8, background: 'transparent', border: '1px solid #1E2D4A', color: '#94A3B8', cursor: 'pointer', fontSize: 13 }}>
            Sign Out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '60px 24px' }}>

        {/* Header */}
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#F8FAFC', marginBottom: 6,
          fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-.02em' }}>
          My Profile
        </h1>
        <p style={{ color: '#64748B', marginBottom: 40 }}>Manage your account information.</p>

        {/* Avatar circle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, #06D6A0, #3B82F6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 40, fontWeight: 700, color: '#080D1A', boxShadow: '0 0 0 4px rgba(6,214,160,.2)' }}>
            {profile.name?.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Role badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px',
            borderRadius: 100, fontWeight: 600, fontSize: 14,
            background: isDeaf ? 'rgba(6,214,160,.1)' : 'rgba(59,130,246,.1)',
            color: isDeaf ? '#06D6A0' : '#3B82F6',
            border: `1px solid ${isDeaf ? 'rgba(6,214,160,.3)' : 'rgba(59,130,246,.3)'}` }}>
            {isDeaf ? '🤟' : '🎙️'}
            {isDeaf ? 'Deaf User' : 'Hearing User'}
          </div>
        </div>

        {/* Profile card */}
        <div style={{ background: '#101828', border: '1px solid #1E2D4A', borderRadius: 20, padding: 32 }}>

          {/* Error */}
          {error && (
            <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)',
              color: '#FCA5A5', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 14 }}>
              ⚠️ {error}
            </div>
          )}

          {/* Success */}
          {saved && (
            <div style={{ background: 'rgba(6,214,160,.1)', border: '1px solid rgba(6,214,160,.3)',
              color: '#06D6A0', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 14 }}>
              ✅ Profile saved successfully!
            </div>
          )}

          {/* Display Name */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              Display Name
            </label>
            <input value={name} onChange={e => { setName(e.target.value); setError(''); setSaved(false); }}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="Your full name"
              style={{ width: '100%', background: '#0A1628', border: '1px solid #1E2D4A', borderRadius: 10,
                padding: '12px 16px', color: '#F8FAFC', fontSize: 15, outline: 'none', boxSizing: 'border-box',
                transition: 'border-color .15s' }}
              onFocus={e => e.target.style.borderColor = '#3B82F6'}
              onBlur={e  => e.target.style.borderColor = '#1E2D4A'} />
          </div>

          {/* Email (read only) */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              Email Address
              <span style={{ marginLeft: 8, fontSize: 11, color: '#334155', fontWeight: 400 }}>(cannot be changed)</span>
            </label>
            <div style={{ width: '100%', background: '#080D1A', border: '1px solid #1E2D4A', borderRadius: 10,
              padding: '12px 16px', color: '#475569', fontSize: 15, boxSizing: 'border-box' }}>
              {profile.email}
            </div>
          </div>

          {/* Role (read only) */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              Account Role
              <span style={{ marginLeft: 8, fontSize: 11, color: '#334155', fontWeight: 400 }}>(set at registration)</span>
            </label>
            <div style={{ width: '100%', background: '#080D1A', border: '1px solid #1E2D4A', borderRadius: 10,
              padding: '12px 16px', color: '#475569', fontSize: 15, boxSizing: 'border-box' }}>
              {isDeaf ? '🤟 Deaf User' : '🎙️ Hearing User'}
            </div>
          </div>

          {/* Account created */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              Member Since
            </label>
            <div style={{ width: '100%', background: '#080D1A', border: '1px solid #1E2D4A', borderRadius: 10,
              padding: '12px 16px', color: '#475569', fontSize: 15, boxSizing: 'border-box' }}>
              {profile.createdAt
                ? new Date(profile.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                : 'N/A'}
            </div>
          </div>

          {/* Save button */}
          <button onClick={handleSave} disabled={saving}
            style={{ width: '100%', padding: '14px', borderRadius: 10, fontWeight: 700, fontSize: 15,
              border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
              background: saving ? '#064E3B' : '#06D6A0',
              color: '#080D1A', opacity: saving ? .7 : 1, transition: 'opacity .15s' }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginTop: 20 }}>
          {[
            { label: 'UID',   value: user.uid.substring(0, 8) + '…' },
            { label: 'Role',  value: isDeaf ? 'Deaf' : 'Hearing' },
            { label: 'Status', value: '✅ Active' },
          ].map(s => (
            <div key={s.label} style={{ background: '#101828', border: '1px solid #1E2D4A', borderRadius: 14, padding: '18px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#94A3B8' }}>{s.value}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}