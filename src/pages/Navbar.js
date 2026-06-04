import React, { useState, useEffect } from 'react';

const C = { green: '#1B4332', gold: '#F59E0B', dim: '#4CAF50' };

export default function Navbar({ page, setPage, onLogout, isSlowLoading }) {
  const [time, setTime]                           = useState(new Date().toLocaleTimeString());
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isMobile, setIsMobile]                   = useState(window.innerWidth < 900);

  const tabs = ['OVERVIEW', 'FARMERS', 'ALERTS', 'INTERVENTIONS', 'PREDICT'];

  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <>
      <div style={{
        background: 'rgba(6,13,10,0.97)',
        borderBottom: '1px solid #1B4332',
        padding: '0 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        overflowX: 'auto',  // scrollable on mobile
        WebkitOverflowScrolling: 'touch'
      }}>
        {/* Logo */}
        <div style={{
          color: C.gold, fontSize: isMobile ? 12 : 15,
          fontWeight: 'bold', fontFamily: 'monospace',
          letterSpacing: 2, marginRight: 12, padding: '14px 0',
          flexShrink: 0
        }}>
          🌱 {isMobile ? 'FX' : 'FARMERXENTIAL'}
        </div>

        {/* Tabs */}
        {tabs.map(t => (
          <button key={t} onClick={() => setPage(t)} style={{
            background: page === t ? 'rgba(27,67,50,0.5)' : 'transparent',
            border: page === t ? `1px solid ${C.gold}` : '1px solid transparent',
            color: page === t ? C.gold : C.dim,
            padding: isMobile ? '6px 10px' : '8px 16px',
            borderRadius: 4, fontFamily: 'monospace',
            fontSize: isMobile ? 9 : 11,
            letterSpacing: 1, cursor: 'pointer',
            flexShrink: 0, whiteSpace: 'nowrap'
          }}>{t}</button>
        ))}

        <div style={{ flex: 1, minWidth: 8 }} />

        {/* Clock — hidden on mobile to save space */}
        {!isMobile && (
          <div style={{ color: C.dim, fontSize: 9, fontFamily: 'monospace', marginRight: 16, flexShrink: 0 }}>
            ● SYSTEM ONLINE &nbsp;|&nbsp; {time}
          </div>
        )}

        {/* Logout */}
        {!showLogoutConfirm ? (
          <button onClick={() => setShowLogoutConfirm(true)} style={{
            background: 'transparent', border: '1px solid #1B4332',
            color: C.dim, padding: '6px 10px', borderRadius: 4,
            fontFamily: 'monospace', fontSize: 9, cursor: 'pointer',
            flexShrink: 0
          }}>OUT</button>
        ) : (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
            <span style={{ color: C.dim, fontSize: 9, fontFamily: 'monospace' }}>SURE?</span>
            <button onClick={onLogout} style={{
              background: 'rgba(226,75,74,0.15)', border: '1px solid #E24B4A',
              color: '#E24B4A', padding: '4px 8px', borderRadius: 4,
              fontFamily: 'monospace', fontSize: 9, cursor: 'pointer'
            }}>YES</button>
            <button onClick={() => setShowLogoutConfirm(false)} style={{
              background: 'transparent', border: '1px solid #1B4332',
              color: C.dim, padding: '4px 8px', borderRadius: 4,
              fontFamily: 'monospace', fontSize: 9, cursor: 'pointer'
            }}>NO</button>
          </div>
        )}
      </div>

      {/* Slow connection banner */}
      {isSlowLoading && (
        <div style={{
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderTop: 'none', padding: '8px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
          fontFamily: 'monospace', fontSize: 11
        }}>
          <span style={{
            display: 'inline-block', width: 8, height: 8,
            borderRadius: '50%', background: C.gold,
            animation: 'pulse 1s infinite', flexShrink: 0
          }}/>
          <span style={{ color: C.gold }}>
            Connecting to server — may take up to 30 seconds. Please wait...
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