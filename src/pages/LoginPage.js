import React, { useState } from 'react';
import { login } from '../api/farmerxential';

const C = {
  green: '#1B4332', gold: '#F59E0B', bg: '#060D0A',
  text: '#E8F5E9', dim: '#4CAF50', high: '#E24B4A'
};

export default function LoginPage({ onLogin }) {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true); setError('');
    try { await login(name, key); onLogin(); }
    catch { setError('Invalid credentials. Check client name and API key.'); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', position: 'relative', overflow: 'hidden' }}>

      {/* Grid background */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${C.green}18 1px, transparent 1px), linear-gradient(90deg, ${C.green}18 1px, transparent 1px)`, backgroundSize: '40px 40px' }}/>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, #0D2B1E 0%, #060D0A 70%)' }}/>

      <div style={{ position: 'relative', zIndex: 1, width: 420, padding: 40, background: 'rgba(6,13,10,0.95)', border: '1px solid #1B4332', borderRadius: 12, boxShadow: '0 0 60px rgba(27,67,50,0.4)' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>🌱</div>
          <div style={{ color: C.gold, fontSize: 28, fontWeight: 'bold', letterSpacing: 3 }}>FARMERXENTIAL</div>
          <div style={{ color: C.dim, fontSize: 11, letterSpacing: 2, marginTop: 6 }}>IDENTIFYING THE FARMERS WHO NEED HELP MOST</div>
          <div style={{ color: '#1B4332', fontSize: 9, marginTop: 8, letterSpacing: 1 }}>BY LALISHANK HOLDINGS LIMITED</div>
        </div>

        {/* Fields */}
        <div style={{ color: C.dim, fontSize: 10, letterSpacing: 2, marginBottom: 6 }}>CLIENT_ID</div>
        <input value={name} onChange={e => setName(e.target.value)}
          placeholder="Enter client name"
          style={{ width: '100%', background: 'rgba(27,67,50,0.2)', border: '1px solid #1B4332', borderRadius: 6, padding: '10px 14px', color: C.text, fontSize: 13, fontFamily: 'monospace', marginBottom: 16, boxSizing: 'border-box', outline: 'none' }}
        />

        <div style={{ color: C.dim, fontSize: 10, letterSpacing: 2, marginBottom: 6 }}>ACCESS_KEY</div>
        <input value={key} onChange={e => setKey(e.target.value)} type="password"
          placeholder="Enter API key"
          style={{ width: '100%', background: 'rgba(27,67,50,0.2)', border: '1px solid #1B4332', borderRadius: 6, padding: '10px 14px', color: C.text, fontSize: 13, fontFamily: 'monospace', marginBottom: 20, boxSizing: 'border-box', outline: 'none' }}
        />

        {error && <div style={{ color: C.high, fontSize: 12, marginBottom: 12, textAlign: 'center' }}>{error}</div>}

        <button onClick={handleLogin} disabled={loading} style={{
          width: '100%', padding: 12,
          background: loading ? '#1B4332' : 'linear-gradient(135deg, #1B4332, #2D6A4F)',
          border: `1px solid ${C.gold}`, borderRadius: 6, color: C.gold,
          fontSize: 14, fontFamily: 'monospace', fontWeight: 'bold',
          letterSpacing: 2, cursor: loading ? 'not-allowed' : 'pointer'
        }}>
          {loading ? 'AUTHENTICATING...' : 'INITIATE ACCESS'}
        </button>

        <p style={{ color: '#1B4332', fontSize: 9, textAlign: 'center', marginTop: 20, letterSpacing: 1 }}>
          FARMERXENTIAL v3.0 — LALISHANK HOLDINGS LIMITED
        </p>
      </div>
    </div>
  );
}