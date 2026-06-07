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
    // Wrapper div — position relative so dropdown positions relative to this
    <div style={{ position: 'sticky', top: 0, zIndex: 9999, width: '100%' }}>

      {/* ── Main navbar bar ── */}
      <div style={{
        background: 'rgba(6,13,10,0.97)',
        borderBottom: '1px solid #1B4332',
        padding: '0 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 52,
        width: '100%',
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 9999
      }}>

        {/* Logo */}
        <div style={{
          color: C.gold, fontWeight: 'bold',
          fontFamily: 'monospace', letterSpacing: 2,
          fontSize: 13, flexShrink: 0
        }}>
          🌱 FARMERXENTIAL
        </div>

        {/* Desktop tabs */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>

          {/* Clock — desktop only */}
          <div className="desktop-only" style={{
            color: C.dim, fontSize: 9,
            fontFamily: 'monospace', whiteSpace: 'nowrap'
          }}>
            ● {time}
          </div>

          {/* Logout */}
          {!showLogoutConfirm ? (
            <button onClick={() => setShowLogoutConfirm(true)} style={{
              background: 'transparent', border: '1px solid #1B4332',
              color: C.dim, padding: '5px 8px', borderRadius: 4,
              fontFamily: 'monospace', fontSize: 9, cursor: 'pointer',
              flexShrink: 0
            }}>OUT</button>
          ) : (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ color: C.dim, fontSize: 9, fontFamily: 'monospace' }}>SURE?</span>
              <button onClick={onLogout} style={{
                background: 'rgba(226,75,74,0.15)', border: '1px solid #E24B4A',
                color: '#E24B4A', padding: '4px 6px', borderRadius: 4,
                fontFamily: 'monospace', fontSize: 9, cursor: 'pointer'
              }}>YES</button>
              <button onClick={() => setShowLogoutConfirm(false)} style={{
                background: 'transparent', border: '1px solid #1B4332',
                color: C.dim, padding: '4px 6px', borderRadius: 4,
                fontFamily: 'monospace', fontSize: 9, cursor: 'pointer'
              }}>NO</button>
            </div>
          )}

          {/* Hamburger button — mobile only */}
          <button
            className="mobile-only"
            onClick={() => setMenuOpen(o => !o)}
            style={{
              background: menuOpen ? `${C.gold}22` : 'transparent',
              border: `1px solid ${menuOpen ? C.gold : '#1B4332'}`,
              color: menuOpen ? C.gold : C.dim,
              padding: '6px 10px', borderRadius: 4,
              fontFamily: 'monospace', fontSize: 16,
              cursor: 'pointer', flexShrink: 0,
              lineHeight: 1
            }}
          >☰</button>
        </div>
      </div>

      {/* ── Mobile dropdown menu ──
          position: absolute means it drops DOWN from the navbar
          width: 100vw makes it full screen width
          This approach works on all iOS Safari versions */}
      {menuOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          width: '100%',
          background: '#060D0A',
          borderBottom: `3px solid ${C.gold}`,
          borderTop: 'none',
          zIndex: 9999,
          boxShadow: '0 16px 40px rgba(0,0,0,0.9)'
        }}>
          {tabs.map(t => (
            <button key={t} onClick={() => handleNav(t)} style={{
              display: 'block',
              width: '100%',
              background: page === t ? 'rgba(27,67,50,0.6)' : 'transparent',
              border: 'none',
              borderLeft: page === t ? `4px solid ${C.gold}` : `4px solid transparent`,
              borderBottom: '1px solid rgba(27,67,50,0.3)',
              color: page === t ? C.gold : C.dim,
              padding: '18px 24px',
              fontFamily: 'monospace', fontSize: 15,
              letterSpacing: 2, cursor: 'pointer',
              textAlign: 'left', boxSizing: 'border-box'
            }}>{t}</button>
          ))}

          {/* Close button at bottom */}
          <button onClick={() => setMenuOpen(false)} style={{
            display: 'block', width: '100%',
            background: 'transparent', border: 'none',
            borderTop: `1px solid ${C.gold}44`,
            color: C.dim, padding: '14px 24px',
            fontFamily: 'monospace', fontSize: 11,
            letterSpacing: 2, cursor: 'pointer',
            textAlign: 'center', boxSizing: 'border-box'
          }}>✕ CLOSE</button>
        </div>
      )}

      {/* ── Slow connection banner ── */}
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
        @media (min-width: 768px) {
          .desktop-tabs { display: flex !important; }
          .desktop-only { display: block !important; }
          .mobile-only  { display: none !important; }
        }
        @media (max-width: 767px) {
          .desktop-tabs { display: none !important; }
          .desktop-only { display: none !important; }
          .mobile-only  { display: block !important; }
        }
      `}</style>
    </div>
  );
}