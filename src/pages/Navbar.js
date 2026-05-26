import React, { useState, useEffect } from 'react';

const C = { green: '#1B4332', gold: '#F59E0B', dim: '#4CAF50' };

export default function Navbar({ page, setPage, onLogout }) {
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const tabs = ['OVERVIEW', 'FARMERS', 'ALERTS', 'PREDICT'];

  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      background: 'rgba(6,13,10,0.97)',
      borderBottom: '1px solid #1B4332',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>

      {/* Logo */}
      <div style={{ color: C.gold, fontSize: 15, fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: 2, marginRight: 24, padding: '16px 0' }}>
        🌱 FARMERXENTIAL
      </div>

      {/* Tabs */}
      {tabs.map(t => (
        <button key={t} onClick={() => setPage(t)} style={{
          background: page === t ? 'rgba(27,67,50,0.5)' : 'transparent',
          border: page === t ? `1px solid ${C.gold}` : '1px solid transparent',
          color: page === t ? C.gold : C.dim,
          padding: '8px 16px', borderRadius: 4,
          fontFamily: 'monospace', fontSize: 11,
          letterSpacing: 1, cursor: 'pointer'
        }}>{t}</button>
      ))}

      <div style={{ flex: 1 }} />

      {/* Live clock */}
      <div style={{ color: C.dim, fontSize: 9, fontFamily: 'monospace', marginRight: 16 }}>
        ● SYSTEM ONLINE &nbsp;|&nbsp; {time}
      </div>

      <button onClick={onLogout} style={{
        background: 'transparent', border: '1px solid #1B4332',
        color: C.dim, padding: '6px 14px', borderRadius: 4,
        fontFamily: 'monospace', fontSize: 10, cursor: 'pointer'
      }}>LOGOUT</button>
    </div>
  );
}