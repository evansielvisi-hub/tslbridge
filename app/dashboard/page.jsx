'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { user, profile, logout } = useAuth();
  const router = useRouter();
  const [roomInput, setRoomInput] = useState('');

  useEffect(() => { if (!user) router.push('/login'); }, [user]);

  async function handleLogout() { await logout(); router.push('/'); }
  function handleNewCall() {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    router.push(`/call/${id}`);
  }
  function handleJoin() { if (roomInput.trim()) router.push(`/call/${roomInput.trim().toUpperCase()}`); }

  if (!user || !profile) return (
    <div style={{ background: '#080D1A', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #06D6A0', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ background: '#080D1A', minHeight: '100vh' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid #1E2D4A' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#F8FAFC' }}>TSL<span style={{ color: '#06D6A0' }}>Bridge</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 14, color: '#64748B' }}>Welcome, <strong style={{ color: '#F8FAFC' }}>{profile.name}</strong></span>
          <span style={{ padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, background: profile.role === 'deaf' ? 'rgba(6,214,160,.1)' : 'rgba(59,130,246,.1)', color: profile.role === 'deaf' ? '#06D6A0' : '#3B82F6', border: `1px solid ${profile.role === 'deaf' ? 'rgba(6,214,160,.3)' : 'rgba(59,130,246,.3)'}` }}>
            {profile.role === 'deaf' ? '🤟 Deaf User' : '🎙️ Hearing User'}
          </span>
          <button onClick={handleLogout} style={{ padding: '8px 16px', borderRadius: 8, background: 'transparent', border: '1px solid #1E2D4A', color: '#94A3B8', cursor: 'pointer', fontSize: 13 }}>Sign Out</button>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: '#F8FAFC', marginBottom: 8 }}>
          Hello, <span style={{ color: '#06D6A0' }}>{profile.name?.split(' ')[0]}</span> 👋
        </h2>
        <p style={{ color: '#64748B', marginBottom: 40 }}>Ready to communicate? Start or join a call below.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 40 }}>
          <div style={{ background: '#101828', border: '1px solid #1E2D4A', borderRadius: 20, padding: 32 }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>📹</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#F8FAFC', marginBottom: 8 }}>Start New Call</h3>
            <p style={{ color: '#64748B', fontSize: 14, marginBottom: 24 }}>Create a room and share the Room ID with the person you want to call.</p>
            <button onClick={handleNewCall} style={{ width: '100%', padding: '13px', borderRadius: 10, background: '#06D6A0', color: '#080D1A', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}>
              Create Call Room →
            </button>
          </div>

          <div style={{ background: '#101828', border: '1px solid #1E2D4A', borderRadius: 20, padding: 32 }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>🔗</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#F8FAFC', marginBottom: 8 }}>Join a Call</h3>
            <p style={{ color: '#64748B', fontSize: 14, marginBottom: 16 }}>Enter the Room ID shared by the other person.</p>
            <input value={roomInput} onChange={e => setRoomInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="Enter Room ID e.g. AB12C3"
              style={{ width: '100%', background: '#0A1628', border: '1px solid #1E2D4A', borderRadius: 10, padding: '12px 16px', color: '#F8FAFC', fontSize: 14, outline: 'none', marginBottom: 12, boxSizing: 'border-box', letterSpacing: '0.1em' }} />
            <button onClick={handleJoin} style={{ width: '100%', padding: '13px', borderRadius: 10, background: '#3B82F6', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}>
              Join Room →
            </button>
          </div>
        </div>

        <div style={{ background: '#101828', border: '1px solid #1E2D4A', borderRadius: 20, padding: 28 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC', marginBottom: 16 }}>🤟 Supported TSL Signs</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[['👋','HELLO','Habari'],['☝️','YES','Ndio'],['✌️','NO','Hapana'],['🤟','HELP','Msaada'],
              ['💧','WATER','Maji'],['👍','GOOD','Nzuri'],['✊','STOP','Simama'],['🤙','I LOVE YOU','Nakupenda']
            ].map(([emoji, sign, sw]) => (
              <div key={sign} style={{ background: '#0A1628', border: '1px solid #1E2D4A', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 24 }}>{emoji}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#06D6A0', marginTop: 6 }}>{sign}</div>
                <div style={{ fontSize: 11, color: '#475569' }}>{sw}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}