import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState, useEffect, useRef } from 'react';
import { getAdminSubmissions, getSubmissionDetail, reviewSubmission, getStagingMap } from '../api/farmerxential';

// ─────────────────────────────────────────────────────────────
// ADMIN INBOX PAGE
// Princewill's tool — review Jim's submissions from Coventry
// See all data flowing in, approve or reject each farmer record
// ─────────────────────────────────────────────────────────────

const GOLD   = '#F59E0B';
const GREEN  = '#1B4332';
const DARK   = '#060D0A';
const MID    = '#0d1f2d';
const NAVY   = '#1A1A2E';
const WHITE  = '#FFFFFF';
const GREY   = '#6B7280';
const RED    = '#E24B4A';
const BLUE   = '#2196F3';
const LGREY  = '#F3F4F6';

const statusColor = s => ({
  pending:      GOLD,
  flagged:      RED,
  under_review: BLUE,
  approved:     '#4CAF50',
  rejected:     RED,
}[s] || GREY);

const statusBg = s => ({
  pending:      '#2a2000',
  flagged:      '#2a0a0a',
  under_review: '#0a1a2a',
  approved:     '#0a2a0a',
  rejected:     '#2a0a0a',
}[s] || '#1a1a1a');

// ── Reusable components ───────────────────────────────────────
const Badge = ({ status }) => (
  <div style={{
    background: statusBg(status),
    color: statusColor(status),
    border: `1px solid ${statusColor(status)}`,
    borderRadius: 6, padding: '3px 10px',
    fontSize: 10, fontFamily: 'monospace',
    fontWeight: 'bold', textTransform: 'uppercase',
    flexShrink: 0
  }}>{status}</div>
);

const StatCard = ({ label, value, color = WHITE }) => (
  <div style={{
    background: MID, borderRadius: 10, padding: '14px 16px',
    border: '1px solid #1a3a2a', flex: '1 1 80px', minWidth: 80
  }}>
    <div style={{ color: GREY, fontSize: 10, fontFamily: 'monospace',
      letterSpacing: 1, marginBottom: 4 }}>{label}</div>
    <div style={{ color, fontFamily: 'monospace', fontSize: 22,
      fontWeight: 'bold' }}>{value}</div>
  </div>
);

const DetailRow = ({ label, value, highlight }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between',
    padding: '7px 0', borderBottom: '1px solid #1a2a2a', gap: 12
  }}>
    <div style={{ color: GREY, fontSize: 11, fontFamily: 'monospace',
      flexShrink: 0, maxWidth: '45%' }}>{label}</div>
    <div style={{
      color: highlight ? GOLD : (value ? WHITE : RED),
      fontSize: 11, fontFamily: 'monospace',
      textAlign: 'right', fontWeight: highlight ? 'bold' : 'normal'
    }}>{value || '— not filled'}</div>
  </div>
);

const DetailSection = ({ title, rows }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{
      color: GOLD, fontFamily: 'monospace', fontSize: 11,
      fontWeight: 'bold', letterSpacing: 1, marginBottom: 8,
      paddingBottom: 4, borderBottom: `1px solid ${GREEN}`
    }}>{title}</div>
    {rows.map(([label, value, highlight]) => (
      <DetailRow key={label} label={label} value={value} highlight={highlight} />
    ))}
  </div>
);

// ── Map component for submission GPS points ───────────────────
function SubmissionMapView({ submissions }) {
  const mapRef     = useRef(null);
  const leafletMap = useRef(null);
  const markersRef = useRef([]);

  const NIGERIA_CENTER = [9.0820, 8.6753];

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    const map = L.map(mapRef.current, {
      center: NIGERIA_CENTER, zoom: 6,
      zoomControl: true, attributionControl: false
    });

    L.tileLayer(
      'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      { maxZoom: 20, subdomains: ['mt0','mt1','mt2','mt3'] }
    ).addTo(map);

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
      { subdomains: 'abcd', maxZoom: 20, opacity: 0.5 }
    ).addTo(map);

    leafletMap.current = map;
    return () => { if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; } };
  }, []);

  // Plot submission GPS points on map
  useEffect(() => {
    if (!leafletMap.current) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const validPoints = submissions.filter(s => s.farm_gps_lat && s.farm_gps_lng);
    if (!validPoints.length) return;

    validPoints.forEach(s => {
      const color = statusColor(s.status);
      const icon = L.divIcon({
        html: `<div style="width:12px;height:12px;background:${color};border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.5);"></div>`,
        iconSize: [12, 12], iconAnchor: [6, 6], className: ''
      });

      const marker = L.marker([s.farm_gps_lat, s.farm_gps_lng], { icon })
        .bindPopup(`
          <div style="font-family:monospace;font-size:12px;min-width:160px;">
            <b>${s.farmer_name || 'Unknown'}</b><br/>
            ${s.lga} — ${s.community}<br/>
            <span style="color:${color};font-weight:bold;text-transform:uppercase;">${s.status}</span><br/>
            ${s.submission_id}
          </div>
        `)
        .addTo(leafletMap.current);

      markersRef.current.push(marker);
    });

    // Fit map to all markers
    if (validPoints.length > 0) {
      const bounds = L.latLngBounds(validPoints.map(s => [s.farm_gps_lat, s.farm_gps_lng]));
      leafletMap.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
    }
  }, [submissions]);

  return (
    <div ref={mapRef} style={{
      width: '100%', height: 280, borderRadius: 10,
      border: `1px solid ${GREEN}`, marginBottom: 20, overflow: 'hidden'
    }} />
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function AdminInboxPage() {
  const [submissions, setSubmissions]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selected, setSelected]           = useState(null);
  const [detail, setDetail]               = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filterStatus, setFilterStatus]   = useState('');
  const [filterLga, setFilterLga]         = useState('');
  const [reviewAction, setReviewAction]   = useState('');
  const [rejectReason, setRejectReason]   = useState('');
  const [reviewing, setReviewing]         = useState(false);
  const [reviewMsg, setReviewMsg]         = useState('');
  const [view, setView]                   = useState('list'); // list | detail | map
  const [autoRefresh, setAutoRefresh]     = useState(true);

  const BAYELSA_LGAS = [
    'Brass', 'Ekeremor', 'Kolokuma/Opokuma', 'Nembe',
    'Ogbia', 'Sagbama', 'Southern Ijaw', 'Yenagoa'
  ];

  // ── Load submissions ────────────────────────────────────────
  const loadSubmissions = async () => {
    try {
      const result = await getAdminSubmissions(
        filterStatus || null,
        filterLga || null,
        50, 0
      );
      setSubmissions(result.submissions || []);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, [filterStatus, filterLga]);

  // Auto refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadSubmissions, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, filterStatus, filterLga]);

  // ── Load detail ─────────────────────────────────────────────
  const openDetail = async (submissionId) => {
    setSelected(submissionId);
    setDetail(null);
    setDetailLoading(true);
    setReviewAction('');
    setRejectReason('');
    setReviewMsg('');
    setView('detail');
    try {
      const result = await getSubmissionDetail(submissionId);
      setDetail(result);
    } catch (err) {
      alert('Could not load submission detail.');
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Review submission ───────────────────────────────────────
  const handleReview = async () => {
    if (!reviewAction) { alert('Select approve or reject first'); return; }
    if (reviewAction === 'reject' && !rejectReason.trim()) {
      alert('Please enter a rejection reason so Jim knows what to fix');
      return;
    }
    setReviewing(true);
    try {
      await reviewSubmission(
        selected,
        reviewAction,
        'Princewill Alali',
        reviewAction === 'reject' ? rejectReason : null
      );
      setReviewMsg(reviewAction === 'approve'
        ? '✅ Submission approved — farmer will enter production database'
        : '❌ Submission rejected — Jim will see the reason'
      );
      // Refresh list
      await loadSubmissions();
      // Reload detail
      const updated = await getSubmissionDetail(selected);
      setDetail(updated);
    } catch (err) {
      alert('Review failed: ' + (err?.response?.data?.detail || err.message));
    } finally {
      setReviewing(false);
    }
  };

  // ── Summary counts ──────────────────────────────────────────
  const counts = {
    total:        submissions.length,
    pending:      submissions.filter(s => s.status === 'pending').length,
    flagged:      submissions.filter(s => s.status === 'flagged').length,
    approved:     submissions.filter(s => s.status === 'approved').length,
    rejected:     submissions.filter(s => s.status === 'rejected').length,
  };

  // ── Header ──────────────────────────────────────────────────
  const Header = () => (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: 20,
      padding: '16px 20px', background: MID,
      borderRadius: 12, border: '1px solid #1a3a2a'
    }}>
      <div>
        <div style={{ color: GOLD, fontFamily: 'monospace',
          fontSize: 16, fontWeight: 'bold' }}>📥 ADMIN INBOX</div>
        <div style={{ color: GREY, fontFamily: 'monospace',
          fontSize: 11, marginTop: 2 }}>
          FarmerXential — Staging Review
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: autoRefresh ? '#4CAF50' : GREY
        }} />
        <div style={{ color: GREY, fontSize: 10, fontFamily: 'monospace' }}>
          {autoRefresh ? 'LIVE' : 'PAUSED'}
        </div>
        <button onClick={() => setAutoRefresh(p => !p)} style={{
          background: 'transparent', border: `1px solid ${GREY}`,
          color: GREY, borderRadius: 6, padding: '4px 10px',
          fontFamily: 'monospace', fontSize: 10, cursor: 'pointer'
        }}>{autoRefresh ? 'PAUSE' : 'RESUME'}</button>
        <button onClick={loadSubmissions} style={{
          background: 'transparent', border: `1px solid ${GOLD}`,
          color: GOLD, borderRadius: 6, padding: '4px 10px',
          fontFamily: 'monospace', fontSize: 10, cursor: 'pointer'
        }}>↻ REFRESH</button>
      </div>
    </div>
  );

  // ── View tabs ────────────────────────────────────────────────
  const ViewTabs = () => (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      {[['list', '📋 LIST'], ['map', '🗺 MAP']].map(([v, label]) => (
        <button key={v} onClick={() => setView(v)} style={{
          padding: '8px 16px', borderRadius: 8,
          background: view === v ? GREEN : 'transparent',
          color: view === v ? GOLD : GREY,
          border: `1px solid ${view === v ? GREEN : '#1a3a2a'}`,
          fontFamily: 'monospace', fontSize: 12,
          cursor: 'pointer', fontWeight: view === v ? 'bold' : 'normal'
        }}>{label}</button>
      ))}
    </div>
  );

  // ── Filters ─────────────────────────────────────────────────
  const Filters = () => (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
      <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #2a3a4a', background: MID, color: filterStatus ? WHITE : GREY, fontFamily: 'monospace', fontSize: 12, cursor: 'pointer' }}>
        <option value="">All Status</option>
        <option value="pending">Pending</option>
        <option value="flagged">Flagged</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>

      <select value={filterLga} onChange={e => setFilterLga(e.target.value)}
        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #2a3a4a', background: MID, color: filterLga ? WHITE : GREY, fontFamily: 'monospace', fontSize: 12, cursor: 'pointer' }}>
        <option value="">All LGAs</option>
        {BAYELSA_LGAS.map(lga => <option key={lga} value={lga}>{lga}</option>)}
      </select>

      {(filterStatus || filterLga) && (
        <button onClick={() => { setFilterStatus(''); setFilterLga(''); }}
          style={{ padding: '8px 12px', borderRadius: 8, background: 'transparent', color: RED, border: `1px solid ${RED}`, fontFamily: 'monospace', fontSize: 12, cursor: 'pointer' }}>
          ✕ CLEAR
        </button>
      )}
    </div>
  );

  // ══════════════════════════════════════════════════════════
  // RENDER — LIST VIEW
  // ══════════════════════════════════════════════════════════
  if (view === 'list') return (
    <div style={{ minHeight: '100vh', background: DARK, padding: 20 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <Header />

        {/* Stat cards */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <StatCard label="TOTAL" value={counts.total} />
          <StatCard label="PENDING" value={counts.pending} color={GOLD} />
          <StatCard label="FLAGGED" value={counts.flagged} color={RED} />
          <StatCard label="APPROVED" value={counts.approved} color="#4CAF50" />
          <StatCard label="REJECTED" value={counts.rejected} color={RED} />
        </div>

        <ViewTabs />
        <Filters />

        {/* Submissions list */}
        {loading ? (
          <div style={{ textAlign: 'center', color: GREY, fontFamily: 'monospace', padding: 60 }}>
            Loading submissions...
          </div>
        ) : submissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <div style={{ color: GREY, fontFamily: 'monospace', fontSize: 14 }}>
              No submissions yet
            </div>
            <div style={{ color: GREY, fontFamily: 'monospace', fontSize: 11, marginTop: 8 }}>
              Jim's farmer data will appear here as he submits from the field
            </div>
          </div>
        ) : submissions.map(s => (
          <div
            key={s.submission_id}
            onClick={() => openDetail(s.submission_id)}
            style={{
              background: MID, borderRadius: 12, padding: 16,
              marginBottom: 10, border: `1px solid ${selected === s.submission_id ? GOLD : '#1a3a2a'}`,
              cursor: 'pointer', transition: 'border-color 0.2s',
              borderLeft: `4px solid ${statusColor(s.status)}`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <div style={{ color: WHITE, fontFamily: 'monospace', fontSize: 15, fontWeight: 'bold' }}>
                    {s.farmer_name || 'Unnamed Farmer'}
                  </div>
                  <Badge status={s.status} />
                </div>
                <div style={{ color: GREY, fontFamily: 'monospace', fontSize: 11 }}>
                  {s.lga} — {s.community} · {s.submitted_by} · {new Date(s.submitted_at).toLocaleString()}
                </div>
                <div style={{ color: GREY, fontFamily: 'monospace', fontSize: 10, marginTop: 4 }}>
                  {s.submission_id}
                </div>
              </div>
            </div>

            {/* GPS indicator */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{
                color: s.farm_gps_lat ? '#4CAF50' : RED,
                fontSize: 10, fontFamily: 'monospace'
              }}>
                {s.farm_gps_lat ? `📍 GPS: ${s.farm_gps_lat}, ${s.farm_gps_lng}` : '📍 No GPS'}
              </div>
              {s.flags && (
                <div style={{ color: RED, fontSize: 10, fontFamily: 'monospace' }}>
                  ⚠ {s.flags.split(',').length} flag{s.flags.split(',').length > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Detail panel — slides in from right ── */}
      {view === 'detail' && (
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: '100%', maxWidth: 520,
          background: DARK, borderLeft: `1px solid ${GREEN}`,
          overflowY: 'auto', zIndex: 1000, padding: 20,
          boxShadow: '-4px 0 20px rgba(0,0,0,0.5)'
        }}>
          <DetailPanel />
        </div>
      )}
    </div>
  );

  // ══════════════════════════════════════════════════════════
  // RENDER — MAP VIEW
  // ══════════════════════════════════════════════════════════
  if (view === 'map') return (
    <div style={{ minHeight: '100vh', background: DARK, padding: 20 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <Header />

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <ViewTabs />
        </div>

        <div style={{ background: MID, borderRadius: 12, padding: 16, border: '1px solid #1a3a2a', marginBottom: 16 }}>
          <div style={{ color: GOLD, fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold', marginBottom: 4 }}>
            🗺 SUBMISSION MAP
          </div>
          <div style={{ color: GREY, fontFamily: 'monospace', fontSize: 11, marginBottom: 12 }}>
            Each dot is a submitted farmer. Colour = status. Click any dot for details.
          </div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
            {[['pending', 'Pending'], ['flagged', 'Flagged'], ['approved', 'Approved'], ['rejected', 'Rejected']].map(([s, label]) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: statusColor(s) }} />
                <div style={{ color: GREY, fontSize: 11, fontFamily: 'monospace' }}>{label}</div>
              </div>
            ))}
          </div>
          <SubmissionMapView submissions={submissions} />
        </div>

        {/* List below map */}
        <Filters />
        {submissions.map(s => (
          <div key={s.submission_id} onClick={() => { setView('detail'); openDetail(s.submission_id); }}
            style={{ background: MID, borderRadius: 10, padding: 12, marginBottom: 8, border: '1px solid #1a3a2a', cursor: 'pointer', borderLeft: `3px solid ${statusColor(s.status)}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: WHITE, fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold' }}>{s.farmer_name || 'Unknown'}</div>
                <div style={{ color: GREY, fontFamily: 'monospace', fontSize: 10, marginTop: 2 }}>{s.lga} — {s.community}</div>
              </div>
              <Badge status={s.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════
  // DETAIL PANEL
  // ══════════════════════════════════════════════════════════
  function DetailPanel() {
    if (detailLoading) return (
      <div style={{ textAlign: 'center', color: GREY, fontFamily: 'monospace', padding: 60 }}>
        Loading detail...
      </div>
    );

    if (!detail) return null;

    return (
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <button onClick={() => setView('list')} style={{
            background: 'transparent', border: `1px solid ${GOLD}`,
            color: GOLD, borderRadius: 8, padding: '6px 14px',
            fontFamily: 'monospace', fontSize: 11, cursor: 'pointer'
          }}>← BACK</button>
          <Badge status={detail.status} />
        </div>

        {/* Farmer name + ID */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ color: WHITE, fontFamily: 'monospace', fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>
            {detail.farmer?.name || 'Unknown Farmer'}
          </div>
          <div style={{ color: GREY, fontFamily: 'monospace', fontSize: 11 }}>
            {detail.submission_id} · Submitted by {detail.submitted_by}
          </div>
          <div style={{ color: GREY, fontFamily: 'monospace', fontSize: 11 }}>
            {new Date(detail.submitted_at).toLocaleString()}
          </div>
        </div>

        {/* Flags */}
        {detail.flags && detail.flags.length > 0 && (
          <div style={{ background: '#2a0a0a', border: `1px solid ${RED}`, borderRadius: 8, padding: 12, marginBottom: 16 }}>
            <div style={{ color: RED, fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold', marginBottom: 8 }}>
              ⚠ AUTOMATIC FLAGS — INVESTIGATE BEFORE APPROVING
            </div>
            {detail.flags.map((f, i) => (
              <div key={i} style={{ color: '#ff9999', fontFamily: 'monospace', fontSize: 11, marginBottom: 4 }}>
                • {f.flag_message}
              </div>
            ))}
          </div>
        )}

        {/* Photos */}
        {detail.photos && detail.photos.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: GOLD, fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8, paddingBottom: 4, borderBottom: `1px solid ${GREEN}` }}>
              📷 PHOTOS
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {detail.photos.map((p, i) => (
                <div key={i} style={{ flex: '1 1 120px' }}>
                  {p.photo_url ? (
                    <img src={p.photo_url} alt={p.photo_type}
                      style={{ width: '100%', borderRadius: 6, border: `1px solid ${GREEN}`, maxHeight: 120, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ height: 80, borderRadius: 6, border: `1px dashed ${RED}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: RED, fontSize: 10, fontFamily: 'monospace' }}>
                      NO PHOTO
                    </div>
                  )}
                  <div style={{ color: GREY, fontSize: 9, fontFamily: 'monospace', textAlign: 'center', marginTop: 4 }}>
                    {p.photo_type?.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full data */}
        <DetailSection title="📍 LOCATION" rows={[
          ['LGA', detail.location?.lga],
          ['Community', detail.location?.community],
          ['State', detail.location?.state],
          ['GPS Lat', detail.farm?.gps_lat?.toString()],
          ['GPS Lng', detail.farm?.gps_lng?.toString()],
        ]} />

        <DetailSection title="👤 FARMER" rows={[
          ['Full Name', detail.farmer?.name],
          ['Phone', detail.farmer?.phone],
          ['Gender', detail.farmer?.gender],
          ['Age Range', detail.farmer?.age_range],
          ['Education', detail.farmer?.education],
        ]} />

        <DetailSection title="🏠 HOUSEHOLD" rows={[
          ['Household Size', detail.household?.size?.toString()],
          ['Working Adults', detail.household?.working_adults?.toString()],
          ['Dependants', detail.household?.dependants?.toString()],
        ]} />

        <DetailSection title="🌾 FARM" rows={[
          ['Land Ownership', detail.farm?.ownership],
          ['Main Crop', detail.farm?.main_crop],
          ['Other Crops', detail.farm?.other_crops],
          ['Irrigation', detail.farm?.irrigation],
          ['Fertiliser Used', detail.farm?.fertiliser],
          ['Farm Size', detail.farm?.size_hectares ? `${detail.farm.size_hectares} ha` : null, true],
        ]} />

        <DetailSection title="⚡ SHOCKS" rows={[
          ['Flooding', detail.shocks?.flooding],
          ['Drought', detail.shocks?.drought],
          ['Pest Attack', detail.shocks?.pest_attack],
          ['Crop Disease', detail.shocks?.crop_disease],
          ['Crop Loss', detail.shocks?.crop_loss],
          ['Household Shock', detail.shocks?.household_illness],
        ]} />

        <DetailSection title="💰 FINANCIAL" rows={[
          ['Bank Account', detail.financial?.bank_account],
          ['Mobile Money', detail.financial?.mobile_money],
          ['Credit Source', detail.financial?.credit_source],
          ['Income/Season', detail.financial?.income_per_season],
        ]} />

        <DetailSection title="🏥 HEALTH" rows={[
          ['Distance to Health', detail.health?.distance_to_health],
          ['Water Source', detail.health?.water_source],
          ['Health Insurance', detail.health?.insurance],
        ]} />

        <DetailSection title="🛒 SUPPLY CHAIN" rows={[
          ['Harvest Behaviour', detail.supply_chain?.harvest_behaviour],
          ['Primary Buyer', detail.supply_chain?.primary_buyer],
          ['Storage', detail.supply_chain?.has_storage],
        ]} />

        <DetailSection title="📱 DIGITAL" rows={[
          ['Phone Type', detail.digital?.phone_type],
          ['WhatsApp', detail.digital?.whatsapp],
          ['Language', detail.digital?.preferred_language],
        ]} />

        {detail.notes && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: GOLD, fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold', marginBottom: 8 }}>📝 FIELD NOTES</div>
            <div style={{ color: WHITE, fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6, background: MID, padding: 12, borderRadius: 8 }}>
              {detail.notes}
            </div>
          </div>
        )}

        {/* ── Review section ── */}
        {detail.status !== 'approved' && detail.status !== 'rejected' && (
          <div style={{ background: MID, borderRadius: 12, padding: 20, border: '1px solid #1a3a2a', marginTop: 8, marginBottom: 32 }}>
            <div style={{ color: GOLD, fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold', marginBottom: 16 }}>
              YOUR DECISION
            </div>

            {reviewMsg ? (
              <div style={{ color: reviewMsg.startsWith('✅') ? '#4CAF50' : RED, fontFamily: 'monospace', fontSize: 13, padding: 12, background: '#0a1628', borderRadius: 8 }}>
                {reviewMsg}
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                  <button
                    onClick={() => setReviewAction('approve')}
                    style={{
                      flex: 1, padding: 14,
                      background: reviewAction === 'approve' ? '#4CAF50' : 'transparent',
                      color: reviewAction === 'approve' ? WHITE : '#4CAF50',
                      border: `2px solid #4CAF50`, borderRadius: 8,
                      fontFamily: 'monospace', fontSize: 13,
                      fontWeight: 'bold', cursor: 'pointer'
                    }}>✅ APPROVE</button>
                  <button
                    onClick={() => setReviewAction('reject')}
                    style={{
                      flex: 1, padding: 14,
                      background: reviewAction === 'reject' ? RED : 'transparent',
                      color: reviewAction === 'reject' ? WHITE : RED,
                      border: `2px solid ${RED}`, borderRadius: 8,
                      fontFamily: 'monospace', fontSize: 13,
                      fontWeight: 'bold', cursor: 'pointer'
                    }}>❌ REJECT</button>
                </div>

                {reviewAction === 'reject' && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ color: GOLD, fontSize: 11, fontFamily: 'monospace', marginBottom: 6 }}>
                      REJECTION REASON (Jim will see this)
                    </div>
                    <textarea
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="e.g. GPS coordinates look wrong. Please revisit and redo boundary walk."
                      rows={3}
                      style={{
                        width: '100%', padding: '12px 14px', fontSize: 13,
                        borderRadius: 8, border: '1px solid #2a3a4a',
                        background: '#0a1628', color: WHITE, outline: 'none',
                        boxSizing: 'border-box', fontFamily: 'monospace',
                        resize: 'vertical', lineHeight: 1.5
                      }}
                    />
                  </div>
                )}

                {reviewAction && (
                  <button
                    onClick={handleReview}
                    disabled={reviewing}
                    style={{
                      width: '100%', padding: 16,
                      background: reviewAction === 'approve' ? '#4CAF50' : RED,
                      color: WHITE, border: 'none', borderRadius: 8,
                      fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold',
                      cursor: reviewing ? 'not-allowed' : 'pointer',
                      opacity: reviewing ? 0.6 : 1
                    }}>
                    {reviewing ? 'PROCESSING...' : `CONFIRM ${reviewAction.toUpperCase()}`}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Already reviewed */}
        {(detail.status === 'approved' || detail.status === 'rejected') && (
          <div style={{
            background: detail.status === 'approved' ? '#0a2a0a' : '#2a0a0a',
            border: `1px solid ${detail.status === 'approved' ? '#4CAF50' : RED}`,
            borderRadius: 12, padding: 16, marginBottom: 32
          }}>
            <div style={{ color: detail.status === 'approved' ? '#4CAF50' : RED, fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold', marginBottom: 8 }}>
              {detail.status === 'approved' ? '✅ APPROVED' : '❌ REJECTED'}
            </div>
            <div style={{ color: GREY, fontFamily: 'monospace', fontSize: 11 }}>
              Reviewed by {detail.reviewed_by} · {detail.reviewed_at ? new Date(detail.reviewed_at).toLocaleString() : ''}
            </div>
            {detail.rejection_reason && (
              <div style={{ color: '#ff9999', fontFamily: 'monospace', fontSize: 11, marginTop: 8 }}>
                Reason: {detail.rejection_reason}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // RENDER — DETAIL VIEW (full screen on mobile)
  // ══════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: '100vh', background: DARK, padding: 20 }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <DetailPanel />
      </div>
    </div>
  );
}