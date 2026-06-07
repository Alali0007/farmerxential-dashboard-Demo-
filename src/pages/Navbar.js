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

      {/* ── Side drawer overlay (dark background) ──
          Appears behind the drawer, tapping it closes the menu
          Think of it like: the curtain behind an open door */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000
          }}
        />
      )}

      {/* ── Side drawer ──
          Slides in from the RIGHT side of the screen
          width: 75% so you can still see the page behind it
          Think of it like: a door sliding open from the right */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: menuOpen ? 0 : '-75%', // slides in/out
        width: '75%',
        maxWidth: 280,
        height: '100%',
        background: '#060D0A',
        borderLeft: `2px solid ${C.gold}`,
        zIndex: 1001,
        transition: 'right 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 60
      }}>

        {/* Close button at top of drawer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', padding: '0 20px 20px 20px',
          borderBottom: '1px solid #1B4332'
        }}>
          <span style={{ color: C.gold, fontFamily: 'monospace', fontSize: 11, letterSpacing: 2 }}>
            MENU
          </span>
          <button onClick={() => setMenuOpen(false)} style={{
            background: 'transparent', border: `1px solid #1B4332`,
            color: C.dim, width: 32, height: 32, borderRadius: 4,
            fontFamily: 'monospace', fontSize: 16, cursor: 'pointer'
          }}>✕</button>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, paddingTop: 8 }}>
          {tabs.map(t => (
            <button key={t} onClick={() => handleNav(t)} style={{
              display: 'block',
              width: '100%',
              background: page === t ? 'rgba(27,67,50,0.6)' : 'transparent',
              border: 'none',
              borderLeft: page === t ? `4px solid ${C.gold}` : '4px solid transparent',
              color: page === t ? C.gold : C.dim,
              padding: '16px 20px',
              fontFamily: 'monospace', fontSize: 13,
              letterSpacing: 2, cursor: 'pointer',
              textAlign: 'left', boxSizing: 'border-box',
              borderBottom: '1px solid rgba(27,67,50,0.3)'
            }}>{t}</button>
          ))}
        </div>

        {/* Bottom of drawer — version info */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #1B4332',
          color: '#1B4332',
          fontFamily: 'monospace',
          fontSize: 9,
          letterSpacing: 1
        }}>
          FARMERXENTIAL v3.0<br/>
          LALISHANK HOLDINGS LIMITED
        </div>
      </div>

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