import React, { useState, useEffect } from 'react';
import { getFarmers } from '../api/farmerxential';

const C = {
  green: '#1B4332', gold: '#F59E0B',
  low: '#639922', mid: '#EF9F27', high: '#E24B4A',
  text: '#E8F5E9', dim: '#4CAF50'
};

const ZONE_NAMES = {
  0: 'N.Central', 1: 'N.East', 2: 'N.West',
  3: 'S.East', 4: 'S.South', 5: 'S.West'
};

const ZONE_FULL = {
  0: 'North Central', 1: 'North East', 2: 'North West',
  3: 'South East', 4: 'South South', 5: 'South West'
};

const RECOMMENDATIONS = {
  yield:                     'Provide yield improvement support and training',
  has_extension_access:      'Assign a field extension officer to this farmer',
  shock_level:               'Provide emergency agricultural shock support',
  received_credit:           'Connect farmer to agricultural credit programme',
  used_fertilizer:           'Supply fertilizer and input support',
  rainfall_anomaly:          'Monitor for climate-related crop failure risk',
  drought_risk:              'Enrol in drought resilience programme',
  market_access_score:       'Improve market linkage and transport access',
  asset_score:               'Provide asset-building support programme',
  digital_access_score:      'Provide mobile/digital literacy training',
  crop_diversity_score:      'Encourage crop diversification',
  crop_loss_risk_score:      'Provide crop insurance or loss mitigation support',
  postharvest_activity_score:'Improve post-harvest storage facilities',
  transport_cost:            'Reduce transport barriers through local market access',
};

function PriorityBadge({ level }) {
  const map = {
    2: { label: 'HIGH', color: C.high },
    1: { label: 'MED',  color: C.mid  },
    0: { label: 'LOW',  color: C.low  }
  };
  const { label, color } = map[level] || map[0];
  return (
    <span style={{
      background: `${color}22`, border: `1px solid ${color}`, color,
      padding: '2px 8px', borderRadius: 4, fontSize: 10,
      fontFamily: 'monospace', fontWeight: 'bold'
    }}>{label}</span>
  );
}

function FilterBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: active ? 'rgba(245,158,11,0.15)' : 'transparent',
      border: active ? `1px solid ${C.gold}` : '1px solid #1B4332',
      color: active ? C.gold : C.dim,
      padding: '5px 12px', borderRadius: 4,
      fontFamily: 'monospace', fontSize: 10,
      cursor: 'pointer', letterSpacing: 1
    }}>{label}</button>
  );
}

function FarmerDetailPanel({ farmer, onClose }) {
  if (!farmer) return null;

  const level = farmer.predicted_intervention_level;
  const color = level === 2 ? C.high : level === 1 ? C.mid : C.low;
  const priorityLabel = level === 2 ? 'HIGH PRIORITY' : level === 1 ? 'MEDIUM PRIORITY' : 'LOW PRIORITY';

  const reasons = [];
  if (farmer.yield_original < 1)           reasons.push('Low crop yield');
  if (farmer.has_extension_access === 0)   reasons.push('No extension officer access');
  if (farmer.shock_level > 0)              reasons.push('Experienced agricultural shock');
  if (farmer.received_credit === 0)        reasons.push('No access to credit');
  if (farmer.household_max_education <= 1) reasons.push('Low household education level');

  const recommendations = [];
  if (farmer.yield_original < 1)         recommendations.push(RECOMMENDATIONS.yield);
  if (farmer.has_extension_access === 0) recommendations.push(RECOMMENDATIONS.has_extension_access);
  if (farmer.shock_level > 0)            recommendations.push(RECOMMENDATIONS.shock_level);
  if (farmer.received_credit === 0)      recommendations.push(RECOMMENDATIONS.received_credit);

  const assetLabel = Number(farmer.asset_score) < 0 ? 'Low' : Number(farmer.asset_score) < 1 ? 'Medium' : 'High';

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 380,
      background: '#060D0A', borderLeft: `2px solid ${color}`,
      zIndex: 1000, overflowY: 'auto', padding: 24,
      fontFamily: 'monospace', color: C.text,
      boxShadow: `-8px 0 40px ${color}22`
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ color: C.gold, fontSize: 18, fontWeight: 'bold' }}>HHID {farmer.hhid}</div>
          <div style={{ color: C.dim, fontSize: 10, letterSpacing: 1, marginTop: 2 }}>
            FARMER INTELLIGENCE PROFILE
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'transparent', border: `1px solid ${C.dim}`,
          color: C.dim, width: 32, height: 32, borderRadius: 4,
          cursor: 'pointer', fontFamily: 'monospace', fontSize: 16
        }}>✕</button>
      </div>

      {/* Priority */}
      <div style={{
        background: `${color}11`, border: `2px solid ${color}`,
        borderRadius: 10, padding: '16px 20px',
        textAlign: 'center', marginBottom: 16
      }}>
        <div style={{ color, fontSize: 20, fontWeight: 'bold' }}>{priorityLabel}</div>
        <div style={{ color, fontSize: 26, fontWeight: 'bold', marginTop: 4 }}>
          {farmer.risk_score}% RISK
        </div>
        <div style={{ height: 6, background: '#1B4332', borderRadius: 3, marginTop: 10 }}>
          <div style={{ height: '100%', width: `${farmer.risk_score}%`, background: color, borderRadius: 3 }}/>
        </div>
      </div>

      {/* Farm Details */}
      <div style={{
        background: 'rgba(27,67,50,0.2)', border: '1px solid #1B4332',
        borderRadius: 8, padding: 16, marginBottom: 16
      }}>
        <div style={{ color: C.gold, fontSize: 10, letterSpacing: 2, marginBottom: 12, fontWeight: 'bold' }}>
          FARM DETAILS
        </div>
        {[
          ['Zone',             farmer.zone_name || ZONE_FULL[farmer.zone]],
          ['Crop Yield',       Number(farmer.yield_original).toFixed(2)],
          ['Education Level',  farmer.household_max_education],
          ['Shock Level',      farmer.shock_level > 0 ? '⚠ YES' : 'None'],
          ['Extension Access', farmer.has_extension_access ? '✓ Yes' : '✗ No'],
          ['Credit Access',    farmer.received_credit ? '✓ Yes' : '✗ No'],
          ['Market Access',    Number(farmer.market_access_score).toFixed(1)],
          ['Digital Access',   Number(farmer.digital_access_score).toFixed(1)],
          ['Asset Score',      assetLabel],
        ].map(([label, value]) => (
          <div key={label} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '7px 0', borderBottom: '1px solid rgba(27,67,50,0.4)'
          }}>
            <span style={{ color: C.dim, fontSize: 11 }}>{label}</span>
            <span style={{ color: C.text, fontSize: 11, fontWeight: 'bold' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Why at risk */}
      {reasons.length > 0 && (
        <div style={{
          background: 'rgba(226,75,74,0.06)',
          border: '1px solid rgba(226,75,74,0.3)',
          borderRadius: 8, padding: 16, marginBottom: 16
        }}>
          <div style={{ color: C.high, fontSize: 10, letterSpacing: 2, marginBottom: 10, fontWeight: 'bold' }}>
            WHY THIS FARMER IS AT RISK
          </div>
          {reasons.map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 12 }}>
              <span style={{ color: C.high }}>▶</span>
              <span style={{ color: C.text }}>{r}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div style={{
          background: 'rgba(245,158,11,0.05)',
          border: `1px solid ${C.gold}40`,
          borderRadius: 8, padding: 16
        }}>
          <div style={{ color: C.gold, fontSize: 10, letterSpacing: 2, marginBottom: 10, fontWeight: 'bold' }}>
            ◈ RECOMMENDED INTERVENTIONS
          </div>
          {recommendations.map((r, i) => (
            <div key={i} style={{
              display: 'flex', gap: 8, marginBottom: 8,
              padding: '8px 10px',
              background: 'rgba(245,158,11,0.06)', borderRadius: 6
            }}>
              <span style={{ color: C.gold }}>✦</span>
              <span style={{ color: C.text, fontSize: 12, lineHeight: 1.5 }}>{r}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FarmersPage({ initialZone = null }) {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [zone, setZone]         = useState(initialZone);
  const [priority, setPriority] = useState(null);
  const [offset, setOffset]     = useState(0);
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState('');
  const LIMIT = 50;

  // Fetch from API whenever zone, priority or offset changes
  useEffect(() => {
    setLoading(true);
    setSelected(null);
    getFarmers(zone, priority, LIMIT, offset)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [zone, priority, offset]);

  const changeZone = (newZone) => {
    setZone(newZone);
    setOffset(0);
    setSearch('');
  };

  const changePriority = (newPriority) => {
    setPriority(newPriority);
    setOffset(0);
    setSearch('');
  };

  const goNext = () => {
    if (data && offset + LIMIT < data.total) {
      setOffset(prev => prev + LIMIT);
    }
  };

  const goPrev = () => {
    if (offset > 0) {
      setOffset(prev => Math.max(0, prev - LIMIT));
    }
  };

  const filteredFarmers = data
    ? data.farmers.filter(f =>
        search === '' || String(f.hhid).includes(search.trim())
      )
    : [];

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 0;
  const currentPage = Math.floor(offset / LIMIT) + 1;

  return (
    <div style={{ padding: 24, color: C.text, fontFamily: 'monospace' }}>
      <div style={{ color: C.gold, fontSize: 11, letterSpacing: 2, marginBottom: 16, fontWeight: 'bold' }}>
        ◈ FARMER INTELLIGENCE DATABASE
      </div>

      {/* Priority Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
        <span style={{ color: C.dim, fontSize: 10, fontWeight: 'bold' }}>PRIORITY:</span>
        <FilterBtn label="ALL"    active={priority === null} onClick={() => changePriority(null)}/>
        <FilterBtn label="HIGH"   active={priority === 2}    onClick={() => changePriority(2)}/>
        <FilterBtn label="MEDIUM" active={priority === 1}    onClick={() => changePriority(1)}/>
        <FilterBtn label="LOW"    active={priority === 0}    onClick={() => changePriority(0)}/>
      </div>

      {/* Zone Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <span style={{ color: C.dim, fontSize: 10, fontWeight: 'bold' }}>ZONE:</span>
        <FilterBtn label="ALL ZONES" active={zone === null} onClick={() => changeZone(null)}/>
        {[0,1,2,3,4,5].map(z => (
          <FilterBtn
            key={z}
            label={ZONE_NAMES[z]}
            active={zone === z}
            onClick={() => changeZone(z)}
          />
        ))}
        {zone !== null && (
          <span style={{ color: C.gold, fontSize: 10, marginLeft: 8, fontWeight: 'bold' }}>
            ◈ VIEWING: {ZONE_FULL[zone].toUpperCase()}
          </span>
        )}
      </div>

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
            fontSize: 12, outline: 'none', width: 220,
            transition: 'border 0.2s'
          }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{
            background: 'transparent', border: '1px solid #1B4332',
            color: C.dim, padding: '6px 12px', borderRadius: 4,
            fontFamily: 'monospace', fontSize: 10, cursor: 'pointer'
          }}>CLEAR</button>
        )}
        {search && (
          <span style={{ color: C.dim, fontSize: 10 }}>
            {filteredFarmers.length} RESULT{filteredFarmers.length !== 1 ? 'S' : ''} FOUND
          </span>
        )}
      </div>

      {loading && (
        <div style={{ color: C.dim, padding: 60, textAlign: 'center', fontSize: 13 }}>
          SCANNING DATABASE...
        </div>
      )}

      {data && <>
        <div style={{ color: C.dim, fontSize: 10, marginBottom: 12, fontWeight: 'bold' }}>
          {search
            ? `SEARCH RESULTS FOR "${search}"`
            : `SHOWING ${offset + 1}–${Math.min(offset + LIMIT, data.total)} OF ${data.total} RECORDS`
          }
          &nbsp;—&nbsp;
          <span style={{ color: C.gold }}>CLICK ANY ROW TO VIEW FULL PROFILE</span>
        </div>

        {/* Table */}
        <div style={{
          background: 'rgba(27,67,50,0.1)', border: '1px solid #1B4332',
          borderRadius: 8, overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '80px 110px 90px 90px 130px 110px 90px',
            padding: '10px 16px', borderBottom: '1px solid #1B4332',
            fontSize: 9, color: C.dim, letterSpacing: 1,
            background: 'rgba(27,67,50,0.3)', fontWeight: 'bold'
          }}>
            <span>HHID</span>
            <span>PRIORITY</span>
            <span>RISK %</span>
            <span>YIELD</span>
            <span>ZONE</span>
            <span>EDUCATION</span>
            <span>SHOCK</span>
          </div>

          {/* No results */}
          {filteredFarmers.length === 0 && !loading && (
            <div style={{ padding: 40, textAlign: 'center', color: C.dim, fontSize: 12 }}>
              {search ? `NO FARMERS FOUND MATCHING "${search}"` : 'NO DATA AVAILABLE'}
            </div>
          )}

          {/* Rows */}
          {filteredFarmers.map((f, i) => (
            <div key={f.hhid}
              onClick={() => setSelected(f)}
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 110px 90px 90px 130px 110px 90px',
                padding: '10px 16px',
                borderBottom: '1px solid rgba(27,67,50,0.4)',
                background: selected?.hhid === f.hhid
                  ? 'rgba(245,158,11,0.08)'
                  : i % 2 === 0 ? 'transparent' : 'rgba(27,67,50,0.08)',
                fontSize: 12, alignItems: 'center',
                cursor: 'pointer',
                borderLeft: selected?.hhid === f.hhid
                  ? `3px solid ${C.gold}`
                  : '3px solid transparent',
                transition: 'background 0.15s'
              }}
            >
              <span style={{ color: C.gold, fontWeight: 'bold' }}>{f.hhid}</span>
              <span><PriorityBadge level={f.predicted_intervention_level}/></span>
              <span style={{
                color: f.risk_score > 60 ? C.high : f.risk_score > 30 ? C.mid : C.low,
                fontWeight: 'bold'
              }}>
                {f.risk_score}%
              </span>
              <span style={{ color: C.text }}>{Number(f.yield_original).toFixed(1)}</span>
              <span style={{ color: C.dim }}>{f.zone_name || ZONE_FULL[f.zone] || ZONE_NAMES[f.zone]}</span>
              <span style={{ color: C.text }}>{f.household_max_education}</span>
              <span style={{ color: f.shock_level > 0 ? C.high : C.dim, fontWeight: 'bold' }}>
                {f.shock_level > 0 ? '⚠ YES' : 'NONE'}
              </span>
            </div>
          ))}
        </div>

        {/* Pagination — only show when not searching */}
        {!search && (
          <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'center', alignItems: 'center' }}>
            <button
              onClick={goPrev}
              disabled={offset === 0}
              style={{
                background: 'transparent',
                border: `1px solid ${offset === 0 ? '#1B4332' : C.dim}`,
                color: offset === 0 ? '#1B4332' : C.dim,
                padding: '6px 16px', borderRadius: 4,
                fontFamily: 'monospace', fontSize: 10,
                cursor: offset === 0 ? 'not-allowed' : 'pointer'
              }}>← PREV</button>

            {/* Page numbers */}
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setOffset((pageNum - 1) * LIMIT)}
                    style={{
                      background: currentPage === pageNum ? 'rgba(245,158,11,0.2)' : 'transparent',
                      border: currentPage === pageNum ? `1px solid ${C.gold}` : '1px solid #1B4332',
                      color: currentPage === pageNum ? C.gold : C.dim,
                      width: 32, height: 32, borderRadius: 4,
                      fontFamily: 'monospace', fontSize: 10, cursor: 'pointer'
                    }}
                  >{pageNum}</button>
                );
              })}
            </div>

            <span style={{ color: C.dim, fontSize: 10 }}>
              PAGE {currentPage} OF {totalPages}
            </span>

            <button
              onClick={goNext}
              disabled={offset + LIMIT >= data.total}
              style={{
                background: 'transparent',
                border: `1px solid ${offset + LIMIT >= data.total ? '#1B4332' : C.dim}`,
                color: offset + LIMIT >= data.total ? '#1B4332' : C.dim,
                padding: '6px 16px', borderRadius: 4,
                fontFamily: 'monospace', fontSize: 10,
                cursor: offset + LIMIT >= data.total ? 'not-allowed' : 'pointer'
              }}>NEXT →</button>
          </div>
        )}
      </>}

      {/* Farmer Detail Side Panel */}
      <FarmerDetailPanel farmer={selected} onClose={() => setSelected(null)}/>

      {/* Overlay */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)', zIndex: 999
          }}
        />
      )}
    </div>
  );
}