import React, { useState, useEffect } from 'react';

const C = { green: '#1B4332', gold: '#F59E0B', dim: '#4CAF50' };

export default function Navbar({ page, setPage, onLogout, isSlowLoading }) {
  const [time, setTime]                           = useState(new Date().toLocaleTimeString());
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [menuOpen, setMenuOpen]                   = useState(false);

  const tabs = [
    { name: 'OVERVIEW',      icon: '◈' },
    { name: 'FARMERS',       icon: '🌾' },
    { name: 'ALERTS',        icon: '⚠' },
    { name: 'INTERVENTIONS', icon: '✦' },
    { name: 'PREDICT',       icon: '◉' },
  ];

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
        padding: '0 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 500,
        minHeight: 52,
        width: '100%',
        boxSizing: 'border-box'
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
            <button key={t.name} onClick={() => handleNav(t.name)} style={{
              background: page === t.name ? 'rgba(27,67,50,0.5)' : 'transparent',
              border: page === t.name ? `1px solid ${C.gold}` : '1px solid transparent',
              color: page === t.name ? C.gold : C.dim,
              padding: '7px 12px', borderRadius: 4,
              fontFamily: 'monospace', fontSize: 10,
              letterSpacing: 1, cursor: 'pointer', whiteSpace: 'nowrap'
            }}>{t.name}</button>
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
            onClick={() => setMenuOpen(true)}
            style={{
              background: 'transparent',
              border: `1px solid #1B4332`,
              color: C.dim,
              padding: '6px 10px', borderRadius: 4,
              fontFamily: 'monospace', fontSize: 16,
              cursor: 'pointer', flexShrink: 0,
              lineHeight: 1
            }}
          >☰</button>
        </div>
      </div>

      {/* Slow connection banner */}
      {isSlowLoading && (
        <div style={{
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderTop: 'none', padding: '8px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
          fontFamily: 'monospace', fontSize: 11,
          position: 'sticky', top: 52, zIndex: 499
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

      {/* ── Full screen menu overlay ──
          When ☰ is tapped, this covers the ENTIRE screen
          like a proper mobile app menu page */}
      {menuOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: '#060D0A',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'monospace'
        }}>

          {/* Menu header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: `1px solid ${C.gold}44`,
            minHeight: 60
          }}>
            <div style={{ color: C.gold, fontSize: 13, fontWeight: 'bold', letterSpacing: 2 }}>
              🌱 FARMERXENTIAL
            </div>
            <button onClick={() => setMenuOpen(false)} style={{
              background: 'transparent',
              border: `1px solid #1B4332`,
              color: C.dim, width: 36, height: 36,
              borderRadius: 4, fontSize: 18,
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}>✕</button>
          </div>

          {/* Current page indicator */}
          <div style={{
            padding: '12px 20px',
            color: C.dim, fontSize: 9, letterSpacing: 2
          }}>
            CURRENTLY VIEWING: <span style={{ color: C.gold }}>{page}</span>
          </div>

          {/* Nav items — big, easy to tap */}
          <div style={{ flex: 1, paddingTop: 8 }}>
            {tabs.map(t => (
              <button key={t.name} onClick={() => handleNav(t.name)} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                width: '100%',
                background: page === t.name
                  ? 'rgba(245,158,11,0.08)'
                  : 'transparent',
                border: 'none',
                borderLeft: page === t.name
                  ? `4px solid ${C.gold}`
                  : '4px solid transparent',
                borderBottom: '1px solid rgba(27,67,50,0.3)',
                color: page === t.name ? C.gold : C.dim,
                padding: '20px 24px',
                fontFamily: 'monospace', fontSize: 16,
                letterSpacing: 2, cursor: 'pointer',
                textAlign: 'left', boxSizing: 'border-box'
              }}>
                <span style={{ fontSize: 20, width: 28 }}>{t.icon}</span>
                <span>{t.name}</span>
                {page === t.name && (
                  <span style={{
                    marginLeft: 'auto', fontSize: 10,
                    color: C.gold, letterSpacing: 1
                  }}>● ACTIVE</span>
                )}
              </button>
            ))}
          </div>

          {/* Bottom — logout + version */}
          <div style={{
            borderTop: '1px solid #1B4332',
            padding: '16px 20px'
          }}>
            <button
              onClick={() => { setMenuOpen(false); onLogout(); }}
              style={{
                width: '100%', padding: '14px',
                background: 'rgba(226,75,74,0.1)',
                border: '1px solid rgba(226,75,74,0.4)',
                color: '#E24B4A', borderRadius: 6,
                fontFamily: 'monospace', fontSize: 12,
                letterSpacing: 2, cursor: 'pointer',
                marginBottom: 12
              }}
            >⏻ LOGOUT</button>

            <div style={{
              color: '#1B4332', fontSize: 9,
              textAlign: 'center', letterSpacing: 1
            }}>
              FARMERXENTIAL v3.0 — LALISHANK HOLDINGS LIMITED
            </div>
          </div>
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
    </>
  );
}