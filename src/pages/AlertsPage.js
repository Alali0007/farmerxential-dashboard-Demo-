import React, { useState, useEffect } from 'react';
import { getAlerts } from '../api/farmerxential';

const C = {
  green: '#1B4332', gold: '#F59E0B',
  low: '#639922', mid: '#EF9F27', high: '#E24B4A',
  text: '#E8F5E9', dim: '#4CAF50'
};

const CARDS_PER_PAGE = 50;

export default function AlertsPage({ onLoadingChange }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('ALL');
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);

  useEffect(() => {
    setLoading(true);
    if (onLoadingChange) onLoadingChange(true);
    getAlerts()
      .then(d => {
        setData(d);
        setLoading(false);
        if (onLoadingChange) onLoadingChange(false);
      })
      .catch(() => {
        setLoading(false);
        if (onLoadingChange) onLoadingChange(false);
      });
  }, []);

  // Reset to page 1 when filter or search changes
  // Think of it like: every time you change what you're looking for,
  // go back to the beginning of the results
  useEffect(() => { setPage(1); }, [filter, search]);

  const zones = data
    ? ['ALL', ...new Set(data.alerts.map(a => a.zone_name).filter(Boolean))]
    : ['ALL'];

  // First apply zone filter, then apply search
  const filtered = data
    ? data.alerts
        .filter(a => filter === 'ALL' || a.zone_name === filter)
        .filter(a => search === '' || String(a.hhid).includes(search.trim()))
    : [];

  // Pagination
  const totalPages  = Math.ceil(filtered.length / CARDS_PER_PAGE);
  const startIndex  = (page - 1) * CARDS_PER_PAGE;
  const paginated   = filtered.slice(startIndex, startIndex + CARDS_PER_PAGE);

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
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
          <span style={{ color: C.dim, fontSize: 10, fontWeight: 'bold' }}>ZONE:</span>
          {zones.map(z => (
            <button key={z} onClick={() => setFilter(z)} style={{
              background: filter === z ? 'rgba(226,75,74,0.15)' : 'transparent',
              border: filter === z ? `1px solid ${C.high}` : '1px solid #1B4332',
              color: filter === z ? C.high : C.dim,
              padding: '5px 12px', borderRadius: 4,
              fontFamily: 'monospace', fontSize: 10, cursor: 'pointer', letterSpacing: 1
            }}>{z.toUpperCase()}</button>
          ))}
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <input
          placeholder="🔍  Search by HHID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            background: 'rgba(27,67,50,0.2)',
            border: `1px solid ${search ? C.gold : '#1B4332'}`,
            borderRadius: 6, padding: '8px 14px',
            color: C.text, fontFamily: 'monospace',
            fontSize: 12, outline: 'none', width: 220
          }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{
            background: 'transparent', border: '1px solid #1B4332',
            color: C.dim, padding: '6px 12px', borderRadius: 4,
            fontFamily: 'monospace', fontSize: 10, cursor: 'pointer'
          }}>CLEAR</button>
        )}
        {data && (
          <span style={{ color: C.dim, fontSize: 10 }}>
            SHOWING {filtered.length} OF {data.total_alerts} ALERTS
          </span>
        )}
      </div>

      {loading && (
        <div style={{ color: C.dim, padding: 60, textAlign: 'center', fontSize: 13 }}>
          SCANNING FOR CRITICAL CASES...
        </div>
      )}

      {/* No results */}
      {!loading && data && filtered.length === 0 && (
        <div style={{ padding: 60, textAlign: 'center', color: C.dim, fontSize: 12 }}>
          {search ? `NO ALERTS FOUND FOR HHID "${search}"` : 'NO ALERTS FOR THIS ZONE'}
        </div>
      )}

      {/* Alert Cards */}
      {data && filtered.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16
        }}>
          {paginated.map(a => (
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
                <span>SHOCK: {a.shock_level > 0
                  ? <span style={{ color: C.high }}>⚠ YES</span>
                  : 'NO'}
                </span>
                <span>EXT: {a.has_extension_access
                  ? <span style={{ color: C.low }}>✓</span>
                  : <span style={{ color: C.high }}>✗</span>}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div style={{
          display: 'flex', gap: 12, marginTop: 24,
          justifyContent: 'center', alignItems: 'center'
        }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              background: 'transparent',
              border: `1px solid ${page === 1 ? '#1B4332' : C.dim}`,
              color: page === 1 ? '#1B4332' : C.dim,
              padding: '6px 16px', borderRadius: 4,
              fontFamily: 'monospace', fontSize: 10,
              cursor: page === 1 ? 'not-allowed' : 'pointer'
            }}>← PREV</button>

          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button key={pageNum} onClick={() => setPage(pageNum)} style={{
                  background: page === pageNum ? 'rgba(226,75,74,0.2)' : 'transparent',
                  border: page === pageNum ? `1px solid ${C.high}` : '1px solid #1B4332',
                  color: page === pageNum ? C.high : C.dim,
                  width: 32, height: 32, borderRadius: 4,
                  fontFamily: 'monospace', fontSize: 10, cursor: 'pointer'
                }}>{pageNum}</button>
              );
            })}
          </div>

          <span style={{ color: C.dim, fontSize: 10 }}>
            PAGE {page} OF {totalPages}
          </span>

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              background: 'transparent',
              border: `1px solid ${page === totalPages ? '#1B4332' : C.dim}`,
              color: page === totalPages ? '#1B4332' : C.dim,
              padding: '6px 16px', borderRadius: 4,
              fontFamily: 'monospace', fontSize: 10,
              cursor: page === totalPages ? 'not-allowed' : 'pointer'
            }}>NEXT →</button>
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