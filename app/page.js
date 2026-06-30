export default function HomePage() {
  return (
    <div style={{ background: '#080D1A', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '0 24px' }}>
        <h1 style={{ fontFamily: 'sans-serif', fontSize: 56, fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
          TSL<span style={{ color: '#06D6A0' }}>Bridge</span>
        </h1>
        <p style={{ color: '#64748B', marginTop: 16, fontSize: 18 }}>
          AI-Powered Tanzanian Sign Language Communication
        </p>
        <div style={{ marginTop: 40, display: 'flex', gap: 16, justifyContent: 'center' }}>
          <a href="/register" style={{ padding: '14px 36px', borderRadius: 12, background: '#06D6A0', color: '#080D1A', fontWeight: 700, textDecoration: 'none', fontSize: 16 }}>
            Get Started
          </a>
          <a href="/login" style={{ padding: '14px 36px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', color: '#F8FAFC', textDecoration: 'none', fontSize: 16 }}>
            Sign In
          </a>
        </div>
      </div>
    </div>
  );
}