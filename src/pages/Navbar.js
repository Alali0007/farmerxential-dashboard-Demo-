import React, { useState, useEffect } from 'react';

const C = { green: '#1B4332', gold: '#F59E0B', dim: '#4CAF50' };

export default function Navbar({ page, setPage, onLogout, isSlowLoading }) {
  const [time, setTime]                           = useState(new Date().toLocaleTimeString());
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [menuOpen, setMenuOpen]                   = useState(false);

  const tabs = ['OVERVIEW', 'FARMERS', 'ALERTS', 'INTERVENTIONS', 'PREDICT'];

  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleNav = (tab) => {
    setPage(tab);
    setMenuOpen(false);
  };

  return (
    <>
      {/* ── Main navbar bar ── */}
      <div style={{
        background: 'rgba(6,13,10,0.97)',
        borderBottom: '1px solid #1B4332',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 200,
        minHeight: 52
      }}>
        {/* Logo */}
        <div style={{
          color: C.gold, fontWeight: 'bold',
          fontFamily: 'monospace', letterSpacing: 2,
          fontSize: 13, flexShrink: 0
        }}>
          🌱 FARMERXENTIAL
        </div>

        {/* Desktop tabs — hidden on small screens via CSS */}
        <div className="desktop-tabs" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {tabs.map(t => (
            <button key={t} onClick={() => handleNav(t)} style={{
              background: page === t ? 'rgba(27,67,50,0.5)' : 'transparent',
              border: page === t ? `1px solid ${C.gold}` : '1px solid transparent',
              color: page === t ? C.gold : C.dim,
              padding: '7px 12px', borderRadius: 4,
              fontFamily: 'monospace', fontSize: 10,
              letterSpacing: 1, cursor: 'pointer', whiteSpace: 'nowrap'
            }}>{t}</button>
          ))}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Clock — desktop only */}
          <div className="desktop-only" style={{ color: C.dim, fontSize: 9, fontFamily: 'monospace' }}>
            ● {time}
          </div>

          {/* Logout */}
          {!showLogoutConfirm ? (
            <button onClick={() => setShowLogoutConfirm(true)} style={{
              background: 'transparent', border: '1px solid #1B4332',
              color: C.dim, padding: '5px 10px', borderRadius: 4,
              fontFamily: 'monospace', fontSize: 9, cursor: 'pointer'
            }}>OUT</button>
          ) : (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
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

          {/* Hamburger menu button — mobile only */}
          <button
            className="mobile-only"
            onClick={() => setMenuOpen(o => !o)}
            style={{
              background: menuOpen ? 'rgba(27,67,50,0.5)' : 'transparent',
              border: `1px solid ${menuOpen ? C.gold : '#1B4332'}`,
              color: menuOpen ? C.gold : C.dim,
              padding: '5px 10px', borderRadius: 4,
              fontFamily: 'monospace', fontSize: 14, cursor: 'pointer'
            }}
          >☰</button>
        </div>
      </div>

      {/* ── Mobile dropdown menu ── */}
      {menuOpen && (
        <div style={{
          position: 'fixed',
          top: 52,
          left: 0,
          right: 0,
          background: 'rgba(6,13,10,0.98)',
          borderBottom: `2px solid ${C.gold}`,
          zIndex: 199,
          padding: '8px 0'
        }}>
          {tabs.map(t => (
            <button key={t} onClick={() => handleNav(t)} style={{
              display: 'block',
              width: '100%',
              background: page === t ? 'rgba(27,67,50,0.5)' : 'transparent',
              border: 'none',
              borderLeft: page === t ? `3px solid ${C.gold}` : '3px solid transparent',
              color: page === t ? C.gold : C.dim,
              padding: '14px 20px',
              fontFamily: 'monospace', fontSize: 13,
              letterSpacing: 2, cursor: 'pointer',
              textAlign: 'left'
            }}>{t}</button>
          ))}
        </div>
      )}

      {/* ── Slow connection banner ── */}
      {isSlowLoading && (
        <div style={{
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderTop: 'none', padding: '8px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
          fontFamily: 'monospace', fontSize: 11,
          position: 'sticky', top: 52, zIndex: 199
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
        /* Desktop: show tabs, hide hamburger */
        @media (min-width: 768px) {
          .desktop-tabs { display: flex !important; }
          .desktop-only { display: block !important; }
          .mobile-only  { display: none !important; }
        }
        /* Mobile: hide tabs, show hamburger */
        @media (max-width: 767px) {
          .desktop-tabs { display: none !important; }
          .desktop-only { display: none !important; }
          .mobile-only  { display: block !important; }
        }
      `}</style>
    </>
  );
}