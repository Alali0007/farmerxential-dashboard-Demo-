import React, { useState, useEffect } from 'react';
import { getAlerts } from '../api/farmerxential';

const C = {
  green: '#1B4332', gold: '#F59E0B',
  low: '#639922', mid: '#EF9F27', high: '#E24B4A',
  text: '#E8F5E9', dim: '#4CAF50'
};

export default function AlertsPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('ALL');

  useEffect(() => {
    getAlerts()
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const zones = data
    ? ['ALL', ...new Set(data.alerts.map(a => a.zone_name).filter(Boolean))]
    : ['ALL'];

  const filtered = data
    ? (filter === 'ALL' ? data.alerts : data.alerts.filter(a => a.zone_name === filter))
    : [];

  return (
    <div style={{ padding: 24, color: C.text, fontFamily: 'monospace' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ color: C.high, fontSize: 11, letterSpacing: 2 }}>
          ◈ ACTIVE INTERVENTION ALERTS
        </div>
        {data && (
          <div style={{
            background: `${C.high}22`, border: `1px solid ${C.high}`,
            color: C.high, padding: '3px 12px', borderRadius: 4, fontSize: 10
          }}>
            {data.total_alerts} CRITICAL FARMERS
          </div>
        )}
      </div>

      {/* Zone Filter */}
      {data && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
          <span style={{ color: C.dim, fontSize: 10 }}>ZONE:</span>
          {zones.map(z => (
            <button key={z} onClick={() => setFilter(z)} style={{
              background: filter === z ? 'rgba(226,75,74,0.15)' : 'transparent',
              border: filter === z ? `1px solid ${C.high}` : '1px solid #1B4332',
              color: filter === z ? C.high : C.dim,
              padding: '5px 12px', borderRadius: 4,
              fontFamily: 'monospace', fontSize: 10, cursor: 'pointer', letterSpacing: 1
            }}>{z.toUpperCase()}</button>
          ))}
          <span style={{ color: C.dim, fontSize: 10, marginLeft: 8 }}>
            SHOWING {filtered.length} ALERTS
          </span>
        </div>
      )}

      {loading && (
        <div style={{ color: C.dim, padding: 60, textAlign: 'center', fontSize: 13 }}>
          SCANNING FOR CRITICAL CASES...
        </div>
      )}

      {/* Alert Cards */}
      {data && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16
        }}>
          {filtered.slice(0, 80).map(a => (
            <div key={a.hhid} style={{
              background: 'rgba(226,75,74,0.05)',
              border: '1px solid rgba(226,75,74,0.3)',
              borderRadius: 8, padding: 16,
              position: 'relative'
            }}>
              {/* Blinking dot */}
              <div style={{ position: 'absolute', top: 14, right: 14 }}>
                <span style={{
                  display: 'inline-block', width: 8, height: 8,
                  borderRadius: '50%', background: C.high,
                  animation: 'blink 1.2s infinite'
                }}/>
              </div>

              {/* Top row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: C.gold, fontSize: 13, fontWeight: 'bold' }}>
                  HHID {a.hhid}
                </span>
                <span style={{ color: C.high, fontSize: 12, fontWeight: 'bold' }}>
                  {a.risk_score}% RISK
                </span>
              </div>

              {/* Zone */}
              <div style={{ color: C.dim, fontSize: 10, marginBottom: 10, letterSpacing: 1 }}>
                📍 {a.zone_name?.toUpperCase()}
              </div>

              {/* Risk bar */}
              <div style={{ height: 4, background: '#1B4332', borderRadius: 2, marginBottom: 12 }}>
                <div style={{
                  height: '100%', width: `${a.risk_score}%`,
                  background: `linear-gradient(90deg, ${C.mid}, ${C.high})`,
                  borderRadius: 2
                }}/>
              </div>

              {/* Reasons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
                {a.reasons.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.text }}>
                    <span style={{ color: C.high, fontSize: 10 }}>▶</span> {r}
                  </div>
                ))}
              </div>

              {/* Footer stats */}
              <div style={{
                paddingTop: 10, borderTop: '1px solid rgba(226,75,74,0.2)',
                display: 'flex', gap: 16, fontSize: 10, color: C.dim
              }}>
                <span>YIELD: {Number(a.yield_original).toFixed(1)}</span>
                <span>SHOCK: {a.shock_level > 0 ? <span style={{ color: C.high }}>⚠ YES</span> : 'NO'}</span>
                <span>EXT: {a.has_extension_access ? <span style={{ color: C.low }}>✓</span> : <span style={{ color: C.high }}>✗</span>}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.15; }
        }
      `}</style>
    </div>
  );
}