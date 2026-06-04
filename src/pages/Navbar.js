import React, { useState, useEffect } from 'react';

const C = { green: '#1B4332', gold: '#F59E0B', dim: '#4CAF50' };

export default function Navbar({ page, setPage, onLogout, isSlowLoading }) {
  const [time, setTime]                         = useState(new Date().toLocaleTimeString());
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // INTERVENTIONS added between ALERTS and PREDICT
  const tabs = ['OVERVIEW', 'FARMERS', 'ALERTS', 'INTERVENTIONS', 'PREDICT'];

  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
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
        <div style={{
          color: C.gold, fontSize: 15, fontWeight: 'bold',
          fontFamily: 'monospace', letterSpacing: 2,
          marginRight: 24, padding: '16px 0'
        }}>
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

        {/* Logout with confirmation */}
        {!showLogoutConfirm ? (
          <button onClick={() => setShowLogoutConfirm(true)} style={{
            background: 'transparent', border: '1px solid #1B4332',
            color: C.dim, padding: '6px 14px', borderRadius: 4,
            fontFamily: 'monospace', fontSize: 10, cursor: 'pointer'
          }}>LOGOUT</button>
        ) : (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ color: C.dim, fontSize: 9, fontFamily: 'monospace' }}>SURE?</span>
            <button onClick={onLogout} style={{
              background: 'rgba(226,75,74,0.15)', border: '1px solid #E24B4A',
              color: '#E24B4A', padding: '6px 12px', borderRadius: 4,
              fontFamily: 'monospace', fontSize: 10, cursor: 'pointer'
            }}>YES</button>
            <button onClick={() => setShowLogoutConfirm(false)} style={{
              background: 'transparent', border: '1px solid #1B4332',
              color: C.dim, padding: '6px 12px', borderRadius: 4,
              fontFamily: 'monospace', fontSize: 10, cursor: 'pointer'
            }}>NO</button>
          </div>
        )}
      </div>

      {/* Slow connection banner */}
      {isSlowLoading && (
        <div style={{
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderTop: 'none', padding: '8px 24px',
          display: 'flex', alignItems: 'center', gap: 10,
          fontFamily: 'monospace', fontSize: 11
        }}>
          <span style={{
            display: 'inline-block', width: 8, height: 8,
            borderRadius: '50%', background: C.gold,
            animation: 'pulse 1s infinite', flexShrink: 0
          }}/>
          <span style={{ color: C.gold }}>
            Connecting to server — this may take up to 30 seconds on first load. Please wait...
          </span>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>
    </>
  );
}