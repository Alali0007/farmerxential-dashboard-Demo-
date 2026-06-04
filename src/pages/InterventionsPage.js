import React, { useState, useEffect } from 'react';
import { getAllInterventions } from '../api/farmerxential';

const C = {
  green: '#1B4332', gold: '#F59E0B',
  low: '#639922', mid: '#EF9F27', high: '#E24B4A',
  text: '#E8F5E9', dim: '#4CAF50'
};

const INTERVENTION_TYPES = [
  { value: 'extension_visit',      label: 'Extension Officer Visit' },
  { value: 'fertilizer_support',   label: 'Fertilizer Support' },
  { value: 'credit_facilitation',  label: 'Credit Facilitation' },
  { value: 'seed_distribution',    label: 'Seed Distribution' },
  { value: 'training',             label: 'Training/Workshop' },
  { value: 'emergency_support',    label: 'Emergency Support' },
  { value: 'market_linkage',       label: 'Market Linkage' },
  { value: 'other',                label: 'Other' },
];

const outcomeColor = (outcome) => {
  if (outcome === 'successful')       return C.low;
  if (outcome === 'no_response')      return C.high;
  if (outcome === 'follow_up_needed') return C.mid;
  return C.dim;
};

const outcomeLabel = (outcome) => {
  if (outcome === 'successful')       return 'SUCCESSFUL';
  if (outcome === 'no_response')      return 'NO RESPONSE';
  if (outcome === 'follow_up_needed') return 'FOLLOW UP';
  return 'PENDING';
};

function SummaryCard({ label, value, color }) {
  return (
    <div style={{
      background: `${color}11`, border: `1px solid ${color}44`,
      borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 120
    }}>
      <div style={{ color, fontSize: 22, fontWeight: 'bold', fontFamily: 'monospace' }}>{value}</div>
      <div style={{ color: C.dim, fontSize: 10, letterSpacing: 1, marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function InterventionsPage({ onLoadingChange }) {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [outcome, setOutcome]   = useState('ALL');
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const LIMIT = 50;

  useEffect(() => {
    setLoading(true);
    if (onLoadingChange) onLoadingChange(true);

    // Fetch all interventions — no outcome filter at API level
    // We filter on the frontend so summary cards always show full counts
    getAllInterventions(null, null, 1000, 0)
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
  useEffect(() => { setPage(1); }, [outcome, search]);

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getLabel = (type) =>
    INTERVENTION_TYPES.find(t => t.value === type)?.label || type;

  // Apply filters
  const filtered = data
    ? data.interventions
        .filter(i => outcome === 'ALL' || i.outcome === outcome)
        .filter(i => {
          if (search === '') return true;
          const s = search.toLowerCase().trim();
          return (
            String(i.farmer_id).includes(s) ||
            i.officer_name.toLowerCase().includes(s)
          );
        })
    : [];

  const totalPages  = Math.ceil(filtered.length / LIMIT);
  const paginated   = filtered.slice((page - 1) * LIMIT, page * LIMIT);

  const summary = data ? data.summary : {
    total: 0, pending: 0, successful: 0, no_response: 0, follow_up_needed: 0
  };

  return (
    <div style={{ padding: 24, color: C.text, fontFamily: 'monospace' }}>

      {/* Header */}
      <div style={{ color: C.gold, fontSize: 11, letterSpacing: 2, marginBottom: 20, fontWeight: 'bold' }}>
        ◈ INTERVENTION TRACKING DASHBOARD
      </div>

      {/* Summary Cards */}
      {/* Think of these like: the headline numbers on an NDDC report */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <SummaryCard label="TOTAL INTERVENTIONS" value={summary.total}            color={C.gold}/>
        <SummaryCard label="PENDING"              value={summary.pending}          color={C.dim}/>
        <SummaryCard label="SUCCESSFUL"           value={summary.successful}       color={C.low}/>
        <SummaryCard label="NO RESPONSE"          value={summary.no_response}      color={C.high}/>
        <SummaryCard label="FOLLOW UP NEEDED"     value={summary.follow_up_needed} color={C.mid}/>
      </div>

      {/* Outcome Filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <span style={{ color: C.dim, fontSize: 10, fontWeight: 'bold' }}>OUTCOME:</span>
        {['ALL', 'pending', 'successful', 'no_response', 'follow_up_needed'].map(o => (
          <button key={o} onClick={() => setOutcome(o)} style={{
            background: outcome === o ? `${outcomeColor(o)}22` : 'transparent',
            border: outcome === o ? `1px solid ${outcomeColor(o)}` : '1px solid #1B4332',
            color: outcome === o ? outcomeColor(o) : C.dim,
            padding: '5px 12px', borderRadius: 4,
            fontFamily: 'monospace', fontSize: 10,
            cursor: 'pointer', letterSpacing: 1
          }}>
            {o === 'ALL' ? 'ALL' : outcomeLabel(o)}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <input
          placeholder="🔍  Search by Farmer ID or Officer Name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            background: 'rgba(27,67,50,0.2)',
            border: `1px solid ${search ? C.gold : '#1B4332'}`,
            borderRadius: 6, padding: '8px 14px',
            color: C.text, fontFamily: 'monospace',
            fontSize: 12, outline: 'none', width: 300
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
            SHOWING {filtered.length} OF {summary.total} RECORDS
          </span>
        )}
      </div>

      {loading && (
        <div style={{ color: C.dim, padding: 60, textAlign: 'center', fontSize: 13 }}>
          LOADING INTERVENTION RECORDS...
        </div>
      )}

      {/* No results */}
      {!loading && data && filtered.length === 0 && (
        <div style={{ padding: 60, textAlign: 'center', color: C.dim, fontSize: 12 }}>
          {summary.total === 0
            ? 'NO INTERVENTIONS RECORDED YET'
            : 'NO RECORDS MATCH YOUR SEARCH'
          }
        </div>
      )}

      {/* Table */}
      {data && filtered.length > 0 && (
        <div style={{
          background: 'rgba(27,67,50,0.1)', border: '1px solid #1B4332',
          borderRadius: 8, overflow: 'hidden'
        }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '80px 140px 180px 140px 100px 120px',
            padding: '10px 16px', borderBottom: '1px solid #1B4332',
            fontSize: 9, color: C.dim, letterSpacing: 1,
            background: 'rgba(27,67,50,0.3)', fontWeight: 'bold'
          }}>
            <span>FARMER ID</span>
            <span>OFFICER</span>
            <span>TYPE</span>
            <span>OUTCOME</span>
            <span>RISK %</span>
            <span>DATE</span>
          </div>

          {/* Table Rows */}
          {paginated.map((iv, i) => (
            <div key={iv.id} style={{
              display: 'grid',
              gridTemplateColumns: '80px 140px 180px 140px 100px 120px',
              padding: '10px 16px',
              borderBottom: '1px solid rgba(27,67,50,0.4)',
              background: i % 2 === 0 ? 'transparent' : 'rgba(27,67,50,0.08)',
              fontSize: 11, alignItems: 'center'
            }}>
              <span style={{ color: C.gold, fontWeight: 'bold' }}>{iv.farmer_id}</span>
              <span style={{ color: C.text }}>{iv.officer_name}</span>
              <span style={{ color: C.dim }}>{getLabel(iv.intervention_type)}</span>
              <span style={{
                color: outcomeColor(iv.outcome),
                fontWeight: 'bold', fontSize: 10
              }}>{outcomeLabel(iv.outcome)}</span>
              <span style={{ color: C.text }}>
                {iv.risk_score_at_intervention
                  ? `${iv.risk_score_at_intervention}%`
                  : '—'
                }
              </span>
              <span style={{ color: C.dim }}>{formatDate(iv.created_at)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div style={{
          display: 'flex', gap: 12, marginTop: 16,
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
                  background: page === pageNum ? 'rgba(245,158,11,0.2)' : 'transparent',
                  border: page === pageNum ? `1px solid ${C.gold}` : '1px solid #1B4332',
                  color: page === pageNum ? C.gold : C.dim,
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
    </div>
  );
}