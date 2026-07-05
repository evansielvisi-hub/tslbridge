'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const ALL_SIGNS = [
  ['👋','HELLO','Habari','All 5 fingers open'],
  ['☝️','YES','Ndio','Index finger only'],
  ['✌️','NO','Hapana','Index + middle'],
  ['🤟','HELP','Msaada','Index + middle + ring'],
  ['💧','WATER','Maji','4 fingers (no thumb)'],
  ['👍','GOOD','Nzuri','Thumb only'],
  ['✊','STOP','Simama','Closed fist'],
  ['🤙','I LOVE YOU','Nakupenda','Pinky only'],
  ['🙏','THANK YOU','Asante','Thumb + index'],
  ['✍️','NAME','Jina','Thumb + index + middle'],
  ['🍽️','FOOD','Chakula','Thumb + index + middle + ring'],
  ['💰','MONEY','Pesa','Thumb + middle + ring + pinky'],
  ['🏫','SCHOOL','Shule','Thumb + pinky'],
  ['🏥','DOCTOR','Daktari','Index + pinky'],
  ['👥','FRIEND','Rafiki','Middle + ring + pinky'],
  ['😔','SORRY','Samahani','Thumb + middle'],
  ['👉','COME','Kuja','Middle + ring'],
  ['🤲','PLEASE','Tafadhali','Thumb + middle + ring'],
  ['❓','WHERE','Wapi','Ring + pinky'],
  ['🏠','HOME','Nyumbani','Thumb + ring + pinky'],
];

export default function DashboardPage() {
  const { user, profile, logout } = useAuth();
  const router = useRouter();
  const [roomInput, setRoomInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { if (!user) router.push('/login'); }, [user]);

  async function handleLogout() { await logout(); router.push('/'); }
  function handleNewCall() {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    router.push(`/call/${id}`);
  }
  function handleJoin() { if (roomInput.trim()) router.push(`/call/${roomInput.trim().toUpperCase()}`); }

  const filteredSigns = ALL_SIGNS.filter(([emoji, sign, sw]) =>
    sign.toLowerCase().includes(search.toLowerCase()) ||
    sw.toLowerCase().includes(search.toLowerCase())
  );

  if (!user || !profile) return (
    <div style={{ background: '#080D1A', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #06D6A0', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ background: '#080D1A', minHeight: '100vh' }}>

      {/* NAV */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid #1E2D4A' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#F8FAFC' }}>
          TSL<span style={{ color: '#06D6A0' }}>Bridge</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 14, color: '#64748B' }}>
            Welcome, <strong style={{ color: '#F8FAFC' }}>{profile.name}</strong>
          </span>
          <span style={{ padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600,
            background: profile.role === 'deaf' ? 'rgba(6,214,160,.1)' : 'rgba(59,130,246,.1)',
            color: profile.role === 'deaf' ? '#06D6A0' : '#3B82F6',
            border: `1px solid ${profile.role === 'deaf' ? 'rgba(6,214,160,.3)' : 'rgba(59,130,246,.3)'}` }}>
            {profile.role === 'deaf' ? '🤟 Deaf User' : '🎙️ Hearing User'}
          </span>
          <button onClick={handleLogout}
            style={{ padding: '8px 16px', borderRadius: 8, background: 'transparent', border: '1px solid #1E2D4A', color: '#94A3B8', cursor: 'pointer', fontSize: 13 }}>
            Sign Out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px' }}>

        {/* Welcome */}
        <h2 style={{ fontSize: 32, fontWeight: 700, color: '#F8FAFC', marginBottom: 8 }}>
          Hello, <span style={{ color: '#06D6A0' }}>{profile.name?.split(' ')[0]}</span> 👋
        </h2>
        <p style={{ color: '#64748B', marginBottom: 40 }}>
          {profile.role === 'deaf'
            ? 'Start a call and use your hands — TSLBridge translates your signs in real time.'
            : 'Start a call and speak naturally — TSLBridge translates your words for deaf users.'}
        </p>

        {/* Call cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 40 }}>
          <div style={{ background: '#101828', border: '1px solid #1E2D4A', borderRadius: 20, padding: 32 }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>📹</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#F8FAFC', marginBottom: 8 }}>Start New Call</h3>
            <p style={{ color: '#64748B', fontSize: 14, marginBottom: 24 }}>Create a room and share the Room ID.</p>
            <button onClick={handleNewCall}
              style={{ width: '100%', padding: '13px', borderRadius: 10, background: '#06D6A0', color: '#080D1A', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}>
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
            <button onClick={handleJoin}
              style={{ width: '100%', padding: '13px', borderRadius: 10, background: '#3B82F6', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}>
              Join Room →
            </button>
          </div>
        </div>

        {/* TSL Signs Reference — 20 signs with search */}
        <div style={{ background: '#101828', border: '1px solid #1E2D4A', borderRadius: 20, padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC', marginBottom: 2 }}>
                🤟 Supported TSL Signs
                <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 600, color: '#06D6A0', background: 'rgba(6,214,160,.1)', padding: '2px 10px', borderRadius: 100, border: '1px solid rgba(6,214,160,.25)' }}>
                  {ALL_SIGNS.length} signs
                </span>
              </h3>
              <p style={{ color: '#64748B', fontSize: 13 }}>Hold each hand shape steady in front of your webcam for the system to detect it.</p>
            </div>
            {/* Search */}
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search signs…"
              style={{ background: '#0A1628', border: '1px solid #1E2D4A', borderRadius: 10, padding: '8px 14px', color: '#F8FAFC', fontSize: 13, outline: 'none', width: 160 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
            {filteredSigns.map(([emoji, sign, sw, hint]) => (
              <div key={sign}
                style={{ background: '#0A1628', border: '1px solid #1E2D4A', borderRadius: 12, padding: '14px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, marginBottom: 6 }}>{emoji}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#06D6A0' }}>{sign}</div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{sw}</div>
                <div style={{ fontSize: 10, color: '#2D3E56', marginTop: 4, lineHeight: 1.4 }}>{hint}</div>
              </div>
            ))}
            {filteredSigns.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#334155', padding: 24, fontSize: 14 }}>
                No signs found for "{search}"
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}