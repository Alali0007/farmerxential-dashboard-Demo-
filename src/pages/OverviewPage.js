import React, { useState, useEffect } from 'react';
import { getStats } from '../api/farmerxential';
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const C = {
  green: '#1B4332', gold: '#F59E0B', bg: '#060D0A',
  low: '#639922', mid: '#EF9F27', high: '#E24B4A',
  text: '#E8F5E9', dim: '#4CAF50'
};

const ZONES = [
  { name: 'North West',    lat: 12.5, lng: 7.0  },
  { name: 'North East',    lat: 12.0, lng: 13.0 },
  { name: 'North Central', lat: 9.5,  lng: 8.5  },
  { name: 'South West',    lat: 7.0,  lng: 3.8  },
  { name: 'South East',    lat: 5.8,  lng: 7.8  },
  { name: 'South South',   lat: 5.0,  lng: 6.0  },
];

// Mobile detection hook
function useIsMobile() {
  const mq = window.matchMedia('(max-width: 767px)');
  const [isMobile, setIsMobile] = useState(mq.matches);
  useEffect(() => {
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

function StatCard({ label, value, color, pulse }) {
  return (
    <div style={{
      background: 'rgba(27,67,50,0.2)', border: `1px solid ${color}40`,
      borderRadius: 8, padding: '16px 20px', position: 'relative', overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        animation: pulse ? 'scan 2.5s linear infinite' : 'none'
      }}/>
      <div style={{ color: C.dim, fontSize: 10, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 6, fontWeight: 'bold' }}>
        {label.toUpperCase()}
      </div>
      <div style={{ color, fontSize: 28, fontWeight: 'bold', fontFamily: 'monospace' }}>
        {value}
      </div>
    </div>
  );
}

export default function OverviewPage({ onZoneClick, onLoadingChange }) {
  const isMobile = useIsMobile();
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (onLoadingChange) onLoadingChange(true);
    getStats()
      .then(d => {
        setStats(d);
        setLoading(false);
        if (onLoadingChange) onLoadingChange(false);
      })
      .catch(() => {
        setLoading(false);
        if (onLoadingChange) onLoadingChange(false);
      });
  }, []);

  const handleZoneClick = (zoneName) => {
    setSelected(zoneName);
    onZoneClick(zoneName);
  };

  return (
    <div style={{ padding: isMobile ? 12 : 24, color: C.text, fontFamily: 'monospace' }}>
      <div style={{ color: C.gold, fontSize: 12, letterSpacing: 2, marginBottom: 20, fontWeight: 'bold' }}>
        ◈ AGRICULTURAL INTELLIGENCE OVERVIEW
      </div>

      {loading && (
        <div style={{ color: C.dim, textAlign: 'center', padding: 60, fontSize: 13 }}>
          LOADING INTELLIGENCE DATA...
        </div>
      )}

      {stats && <>
        {/* Stat Cards — auto-fit works on both mobile and desktop */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile
            ? 'repeat(2, 1fr)'
            : 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: isMobile ? 8 : 12,
          marginBottom: 20
        }}>
          <StatCard label="Total Farmers"   value={stats.total_farmers.toLocaleString()} color={C.gold} pulse/>
          <StatCard label="High Priority"   value={stats.high_priority_count}            color={C.high} pulse/>
          <StatCard label="Medium Priority" value={stats.medium_priority_count}          color={C.mid}/>
          <StatCard label="Low Priority"    value={stats.low_priority_count}             color={C.low}/>
          <StatCard label="Active Alerts"   value={stats.active_alerts}                  color={C.high} pulse/>
          <StatCard label="Avg Risk Score"  value={`${stats.avg_risk_score}%`}           color={C.gold}/>
        </div>

        {/* Map + Zone Panel
            Desktop: side by side (map | zone list)
            Mobile: stacked (zone list first, map below) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 320px',
          gap: isMobile ? 12 : 20
        }}>

          {/* On mobile: show zone list FIRST (more useful on small screen) */}
          {isMobile && (
            <ZoneList
              zones={ZONES}
              stats={stats}
              selected={selected}
              onZoneClick={handleZoneClick}
            />
          )}

          {/* MAP */}
          <div style={{
            background: 'rgba(27,67,50,0.1)', border: '1px solid #1B4332',
            borderRadius: 10, padding: isMobile ? 10 : 16
          }}>
            <div style={{ color: C.gold, fontSize: 10, letterSpacing: 2, marginBottom: 12, fontWeight: 'bold' }}>
              ◈ NIGERIA ZONE MAP — {isMobile ? 'TAP' : 'CLICK'} A ZONE TO VIEW FARMERS
            </div>

            <div style={{
              height: isMobile ? 260 : 420,
              borderRadius: 8, overflow: 'hidden', border: '1px solid #1B4332'
            }}>
              <MapContainer
                center={[9.0, 8.0]}
                zoom={isMobile ? 5 : 6}
                style={{ height: '100%', width: '100%' }}
                zoomControl={!isMobile}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                />
                {ZONES.map(z => {
                  const count = stats.zones[z.name] || 0;
                  const color = count > 150 ? C.high : count > 80 ? C.mid : C.low;
                  const radius = Math.max(40000, Math.min(120000, count * 400));
                  return (
                    <Circle
                      key={z.name}
                      center={[z.lat, z.lng]}
                      radius={radius}
                      pathOptions={{
                        color, fillColor: color,
                        fillOpacity: 0.25, weight: 2, opacity: 0.8
                      }}
                      eventHandlers={{ click: () => handleZoneClick(z.name) }}
                    >
                      <Popup>
                        <div style={{ fontFamily: 'monospace', background: '#060D0A', color: C.text, padding: 8, borderRadius: 4 }}>
                          <div style={{ color, fontWeight: 'bold', fontSize: 13 }}>{z.name.toUpperCase()}</div>
                          <div style={{ color: C.text, marginTop: 4 }}>
                            High Priority: <strong style={{ color }}>{count}</strong>
                          </div>
                          <div style={{ color: C.dim, fontSize: 11, marginTop: 2 }}>
                            {Math.round((count / stats.high_priority_count) * 100)}% of national high priority
                          </div>
                          <div style={{ color: C.gold, fontSize: 10, marginTop: 6 }}>
                            ◈ {isMobile ? 'Tap' : 'Click'} to view all farmers in this zone
                          </div>
                        </div>
                      </Popup>
                    </Circle>
                  );
                })}
              </MapContainer>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: isMobile ? 12 : 24, marginTop: 10, flexWrap: 'wrap' }}>
              {[['HIGH', C.high], ['MEDIUM', C.mid], ['LOW', C.low]].map(([l, c]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }}/>
                  <span style={{ fontSize: 10, color: c, letterSpacing: 1, fontWeight: 'bold' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* On desktop: show zone list on the right */}
          {!isMobile && (
            <ZoneList
              zones={ZONES}
              stats={stats}
              selected={selected}
              onZoneClick={handleZoneClick}
            />
          )}
        </div>

        {/* Selected Zone Banner */}
        {selected && (
          <div style={{
            marginTop: 16, background: 'rgba(27,67,50,0.3)',
            border: `1px solid ${C.gold}`, borderRadius: 8,
            padding: '14px 20px', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ color: C.gold, fontSize: isMobile ? 11 : 13, fontWeight: 'bold' }}>
              ◈ NAVIGATING TO {selected.toUpperCase()} — {stats.zones[selected] || 0} HIGH PRIORITY FARMERS
            </span>
            <button onClick={() => setSelected(null)} style={{
              background: 'transparent', border: 'none',
              color: C.dim, cursor: 'pointer',
              fontFamily: 'monospace', fontSize: 16
            }}>✕</button>
          </div>
        )}
      </>}

      <style>{`
        @keyframes scan { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        .leaflet-popup-content-wrapper {
          background: #060D0A !important;
          border: 1px solid #1B4332 !important;
          color: #E8F5E9 !important;
        }
        .leaflet-popup-tip { background: #060D0A !important; }
      `}</style>
    </div>
  );
}

// Extracted zone list component — used in both mobile and desktop
function ZoneList({ zones, stats, selected, onZoneClick }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ color: '#F59E0B', fontSize: 10, letterSpacing: 2, fontWeight: 'bold' }}>
        ◈ ZONE BREAKDOWN — CLICK TO VIEW FARMERS
      </div>
      {zones.map(z => {
        const count = stats.zones[z.name] || 0;
        const color = count > 150 ? '#E24B4A' : count > 80 ? '#EF9F27' : '#639922';
        const pct   = Math.round((count / stats.high_priority_count) * 100);
        return (
          <div key={z.name}
            onClick={() => onZoneClick(z.name)}
            style={{
              background: selected === z.name ? `${color}15` : 'rgba(27,67,50,0.2)',
              border: `1px solid ${selected === z.name ? color : color+'40'}`,
              borderRadius: 8, padding: '12px 16px',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: '#E8F5E9', fontWeight: 'bold' }}>
                {z.name.toUpperCase()}
              </span>
              <span style={{ fontSize: 14, fontWeight: 'bold', color }}>{count}</span>
            </div>
            <div style={{ height: 4, background: '#1B4332', borderRadius: 2 }}>
              <div style={{
                height: '100%', width: `${pct}%`,
                background: color, borderRadius: 2, transition: 'width 1s ease'
              }}/>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 9, color: '#4CAF50' }}>{pct}% of high priority</span>
              <span style={{ fontSize: 9, color: '#F59E0B' }}>VIEW FARMERS →</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}