import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState, useEffect, useRef } from 'react';
import { submitFieldData, getMySubmissions } from '../api/farmerxential';

const GOLD  = '#F59E0B';
const GREEN = '#1B4332';
const DARK  = '#0a1628';
const MID   = '#0d1f2d';
const WHITE = '#FFFFFF';
const GREY  = '#888';
const RED   = '#E24B4A';

const BAYELSA_LGAS = [
  'Brass', 'Ekeremor', 'Kolokuma/Opokuma', 'Nembe',
  'Ogbia', 'Sagbama', 'Southern Ijaw', 'Yenagoa'
];

const MODULES = [
  { id: 1, label: 'M1' }, { id: 2, label: 'M2' },
  { id: 3, label: 'M3' }, { id: 4, label: 'M4' },
  { id: 5, label: 'M5' }, { id: 6, label: 'M6' },
  { id: 7, label: 'M7' }, { id: 8, label: 'M8' },
];

const Label = ({ children, required }) => (
  <div style={{ color: GOLD, fontSize: 11, fontFamily: 'monospace', letterSpacing: 1, marginBottom: 6, fontWeight: 'bold' }}>
    {children}{required && <span style={{ color: RED }}> *</span>}
  </div>
);

const Input = ({ value, onChange, placeholder, type = 'text', disabled }) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
    style={{ width: '100%', padding: '14px 16px', fontSize: 15, borderRadius: 8, border: '1px solid #2a3a4a', background: '#0a1628', color: WHITE, outline: 'none', boxSizing: 'border-box', marginBottom: 16, fontFamily: 'monospace', opacity: disabled ? 0.5 : 1 }} />
);

const Select = ({ value, onChange, options, placeholder }) => (
  <select value={value} onChange={onChange}
    style={{ width: '100%', padding: '14px 16px', fontSize: 15, borderRadius: 8, border: '1px solid #2a3a4a', background: '#0a1628', color: value ? WHITE : GREY, outline: 'none', boxSizing: 'border-box', marginBottom: 16, fontFamily: 'monospace', appearance: 'none' }}>
    <option value="">{placeholder}</option>
    {options.map(o => <option key={o} value={o} style={{ color: WHITE, background: MID }}>{o}</option>)}
  </select>
);

const SectionHeader = ({ number, title }) => (
  <div style={{ background: GREEN, padding: '10px 16px', borderRadius: 8, marginBottom: 16, marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
    <div style={{ background: GOLD, color: GREEN, width: 26, height: 26, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 'bold', flexShrink: 0 }}>{number}</div>
    <div style={{ color: WHITE, fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold', letterSpacing: 1 }}>{title}</div>
  </div>
);

const NoteBox = ({ text }) => (
  <div style={{ background: '#1a2a1a', border: `1px solid ${GOLD}`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: GOLD, fontFamily: 'monospace', lineHeight: 1.6 }}>⚠ {text}</div>
);

const Card = ({ children }) => (
  <div style={{ background: MID, borderRadius: 12, padding: 20, border: '1px solid #1a3a2a', marginBottom: 8 }}>{children}</div>
);

const Btn = ({ onClick, disabled, children, variant = 'primary', style: extra = {} }) => {
  const styles = {
    primary: { background: GREEN, color: GOLD, border: 'none' },
    gold:    { background: GOLD, color: GREEN, border: 'none' },
    outline: { background: 'transparent', color: GOLD, border: `1px solid ${GOLD}` },
    danger:  { background: RED, color: WHITE, border: 'none' },
    ghost:   { background: 'transparent', color: GREY, border: '1px solid #333' },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ width: '100%', padding: 16, borderRadius: 8, fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold', letterSpacing: 1, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, marginBottom: 10, ...styles[variant], ...extra }}>
      {children}
    </button>
  );
};

function calculatePolygonArea(points) {
  if (points.length < 3) return 0;
  const R = 6371000;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const lat1 = points[i].lat * Math.PI / 180;
    const lat2 = points[j].lat * Math.PI / 180;
    const lng1 = points[i].lng * Math.PI / 180;
    const lng2 = points[j].lng * Math.PI / 180;
    area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  return ((Math.abs(area) * R * R / 2) / 10000).toFixed(4);
}

function centrePoint(points) {
  if (!points.length) return { lat: 0, lng: 0 };
  return {
    lat: parseFloat((points.reduce((s, p) => s + p.lat, 0) / points.length).toFixed(7)),
    lng: parseFloat((points.reduce((s, p) => s + p.lng, 0) / points.length).toFixed(7))
  };
}

// Smooth GPS path — removes outlier points that jump too far
function smoothPath(points) {
  if (points.length < 4) return points;
  const result = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    const distPrevNext = Math.sqrt(
      Math.pow(next.lat - prev.lat, 2) + Math.pow(next.lng - prev.lng, 2)
    ) * 111000;
    const distToCurr = Math.sqrt(
      Math.pow(curr.lat - prev.lat, 2) + Math.pow(curr.lng - prev.lng, 2)
    ) * 111000;
    if (distToCurr < distPrevNext + 15) {
      result.push(curr);
    }
  }
  result.push(points[points.length - 1]);
  return result;
}

// ── Leaflet boundary map ──────────────────────────────────────
function BoundaryMap({ points, isWalking, currentPos }) {
  const mapRef         = useRef(null);
  const leafletMap     = useRef(null);
  const polylineRef    = useRef(null);
  const polygonRef     = useRef(null);
  const startMarker    = useRef(null);
  const liveMarker     = useRef(null);
  const initialFly     = useRef(false);

  const NIGERIA_CENTER = [9.0820, 8.6753];
  const NIGERIA_ZOOM   = 6;

  // Initialise map once
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    const map = L.map(mapRef.current, {
      center: NIGERIA_CENTER,
      zoom: NIGERIA_ZOOM,
      zoomControl: true,
      attributionControl: false,
      // Restrict panning loosely around Nigeria/Africa


    });

    // Satellite imagery — Esri, free, no API key
    L.tileLayer(
      'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      { maxZoom: 20, subdomains: ['mt0','mt1','mt2','mt3'] }
    ).addTo(map);

    // Label overlay so Jim can see town/city names
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
      { subdomains: 'abcd', maxZoom: 20, opacity: 0.6 }
    ).addTo(map);

    leafletMap.current = map;

    return () => {
      if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; }
    };
  }, []);

  // Draw boundary as points accumulate
  useEffect(() => {
    if (!leafletMap.current || points.length < 1) return;
    const lls = points.map(p => [p.lat, p.lng]);

    // Walking path line
    if (polylineRef.current) {
      polylineRef.current.setLatLngs(lls);
    } else {
      polylineRef.current = L.polyline(lls, { color: GOLD, weight: 3, opacity: 0.95 }).addTo(leafletMap.current);
    }

    // Filled polygon
    if (points.length >= 3) {
      if (polygonRef.current) {
        polygonRef.current.setLatLngs(lls);
      } else {
        polygonRef.current = L.polygon(lls, {
          color: GOLD, fillColor: GREEN, fillOpacity: 0.35, weight: 2
        }).addTo(leafletMap.current);
      }
    }

    // Red START marker
    if (!startMarker.current) {
      const icon = L.divIcon({
        html: '<div style="width:14px;height:14px;background:#E24B4A;border-radius:50%;border:2px solid white;"></div>',
        iconSize: [14, 14], iconAnchor: [7, 7], className: ''
      });
      startMarker.current = L.marker([points[0].lat, points[0].lng], { icon })
        .bindTooltip('START', { permanent: true, direction: 'right' })
        .addTo(leafletMap.current);
    }

    // Fly to latest pin so Jim can confirm it landed in the right place
    if (points.length > 0) {
      const last = points[points.length - 1];
      leafletMap.current.panTo([last.lat, last.lng], { animate: true, duration: 0.4 });
    }
  }, [points, isWalking]);

  // Live position blue dot
  useEffect(() => {
    if (!leafletMap.current || !currentPos) return;

    const icon = L.divIcon({
      html: '<div style="width:18px;height:18px;background:#2196F3;border-radius:50%;border:3px solid white;box-shadow:0 0 10px rgba(33,150,243,0.9);"></div>',
      iconSize: [18, 18], iconAnchor: [9, 9], className: ''
    });

    if (liveMarker.current) {
      liveMarker.current.setLatLng([currentPos.lat, currentPos.lng]);
    } else {
      liveMarker.current = L.marker([currentPos.lat, currentPos.lng], { icon }).addTo(leafletMap.current);
    }

    // First GPS fix — fly from Nigeria overview to exact location
    if (!initialFly.current) {
      leafletMap.current.flyTo([currentPos.lat, currentPos.lng], 18, { animate: true, duration: 2 });
      initialFly.current = true;
    }
  }, [currentPos]);

  // Reset when points cleared
  useEffect(() => {
    if (points.length === 0 && leafletMap.current) {
      if (polylineRef.current)  { polylineRef.current.remove();  polylineRef.current  = null; }
      if (polygonRef.current)   { polygonRef.current.remove();   polygonRef.current   = null; }
      if (startMarker.current)  { startMarker.current.remove();  startMarker.current  = null; }
      if (liveMarker.current)   { liveMarker.current.remove();   liveMarker.current   = null; }
      initialFly.current = false;
      leafletMap.current.flyTo(NIGERIA_CENTER, NIGERIA_ZOOM, { animate: true, duration: 1 });
    }
  }, [points]);

  return (
    <div ref={mapRef} style={{
      width: '100%', height: 320, borderRadius: 8,
      border: `1px solid ${GREEN}`, marginBottom: 16, overflow: 'hidden'
    }} />
  );
}

const SummaryRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1a2a2a', gap: 12 }}>
    <div style={{ color: GREY, fontSize: 11, fontFamily: 'monospace', flexShrink: 0, maxWidth: '45%' }}>{label}</div>
    <div style={{ color: value ? WHITE : RED, fontSize: 11, fontFamily: 'monospace', textAlign: 'right', fontWeight: value ? 'normal' : 'bold' }}>{value || '— NOT FILLED'}</div>
  </div>
);

const SummarySection = ({ title, rows }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ color: GOLD, fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8, paddingBottom: 4, borderBottom: `1px solid ${GREEN}` }}>{title}</div>
    {rows.map(([label, value]) => <SummaryRow key={label} label={label} value={value} />)}
  </div>
);

export default function FieldAgentPage() {
  const [screen, setScreen]             = useState('login');
  const [apiKey, setApiKey]             = useState('');
  const [agentName, setAgentName]       = useState('');
  const [loginError, setLoginError]     = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [submissions, setSubmissions]   = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeModule, setActiveModule] = useState(1);
  const [isPinning, setIsPinning]           = useState(false);  // pin mode active
  const [boundaryPoints, setBoundaryPoints] = useState([]);
  const [boundaryArea, setBoundaryArea]     = useState(null);
  const [pinLoading, setPinLoading]         = useState(false);  // waiting for GPS fix
  const [photos, setPhotos]             = useState({ farmer: null, farm: null, extra: null });

  const [form, setForm] = useState({
    lga: '', community: '',
    farmer_name: '', farmer_phone: '', farmer_nin: '', farmer_gender: '', farmer_age_range: '', household_education_level: '',
    household_size: '', working_adults: '', dependants: '',
    land_ownership: '', main_crop: '', other_crops: '', has_irrigation: '', used_fertiliser: '',
    farm_size_hectares: '', farm_gps_lat: '', farm_gps_lng: '', farm_gps_accuracy: '',
    experienced_flooding: '', experienced_drought: '', experienced_pest_attack: '',
    experienced_crop_disease: '', crop_loss_level: '', household_illness_death: '',
    extension_visits: '', received_assistance: '', has_veterinary_access: '',
    distance_to_market: '', transport_cost: '',
    has_bank_account: '', uses_mobile_money: '', mobile_money_provider: '',
    credit_source: '', loan_repayment: '', farm_income_per_season: '', input_expenditure: '',
    distance_to_health: '', has_health_insurance: '', household_illness_12m: '',
    water_source: '', uses_pesticides: '', uses_protective_equipment: '',
    harvest_behaviour: '', primary_buyer: '', time_to_sell: '', has_storage: '',
    distance_to_processing: '', postharvest_challenge: '', fertiliser_brand: '', input_purchase_source: '',
    phone_type: '', uses_whatsapp: '', uses_agri_app: '', attended_training: '',
    preferred_learning_topic: '', preferred_language: '', advice_source: '',
    field_agent_notes: ''
  });

  const set = field => e => setForm(p => ({ ...p, [field]: e.target.value }));

  useEffect(() => {
    const k = localStorage.getItem('fx_field_key');
    const n = localStorage.getItem('fx_field_name');
    if (k && n) { setApiKey(k); setAgentName(n); setScreen('form'); }
  }, []);

  // no persistent GPS watcher needed — pin mode uses one-shot getCurrentPosition

  const handleLogin = () => {
    if (!agentName.trim()) { setLoginError('Enter your name'); return; }
    if (!apiKey.trim()) { setLoginError('Enter your field agent key'); return; }
    if (apiKey.length < 20) { setLoginError('Key looks too short — check it'); return; }
    localStorage.setItem('fx_field_key', apiKey);
    localStorage.setItem('fx_field_name', agentName);
    setLoginError(''); setScreen('form');
  };

  const capturePhoto = (type) => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*'; input.capture = 'environment';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { alert('Photo too large. Take a lower resolution photo.'); return; }
      const reader = new FileReader();
      reader.onload = (ev) => setPhotos(p => ({ ...p, [type]: ev.target.result }));
      reader.readAsDataURL(file);
    };
    input.click();
  };

  // ── PIN-AND-CONNECT boundary mapping ─────────────────────────
  // Jim walks to each corner and taps "PIN THIS CORNER".
  // The app records one clean GPS point per tap.
  // Straight lines connect the pins. No zigzags.

  const startPinMode = () => {
    if (!navigator.geolocation) { alert('GPS not available on this device'); return; }
    setBoundaryPoints([]); setBoundaryArea(null); setIsPinning(true);
  };

  const pinCorner = () => {
    if (!navigator.geolocation) return;
    setPinLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };
        setBoundaryPoints(prev => {
          // Prevent duplicate pins — must be at least 5m from last pin
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            const dist = Math.sqrt(
              Math.pow(newPoint.lat - last.lat, 2) +
              Math.pow(newPoint.lng - last.lng, 2)
            ) * 111000;
            if (dist < 5) {
              alert('Too close to last pin. Move further to the next corner and try again.');
              setPinLoading(false);
              return prev;
            }
          }
          setPinLoading(false);
          return [...prev, newPoint];
        });
      },
      (err) => { setPinLoading(false); alert('GPS error: ' + err.message + '. Move to open sky and try again.'); },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  };

  const undoLastPin = () => {
    setBoundaryPoints(prev => prev.slice(0, -1));
    setBoundaryArea(null);
  };

  const completeBoundary = () => {
    if (boundaryPoints.length < 3) {
      alert('You need at least 3 corner pins to map a boundary. Pin more corners first.');
      return;
    }
    const area = calculatePolygonArea(boundaryPoints);
    const centre = centrePoint(boundaryPoints);
    setBoundaryArea(area);
    setIsPinning(false);
    setForm(prev => ({
      ...prev,
      farm_size_hectares: area,
      farm_gps_lat: centre.lat.toFixed(6),
      farm_gps_lng: centre.lng.toFixed(6),
      farm_gps_accuracy: '5'
    }));
  };

  const resetBoundary = () => {
    setBoundaryPoints([]); setBoundaryArea(null); setIsPinning(false);
    setForm(p => ({ ...p, farm_size_hectares: '', farm_gps_lat: '', farm_gps_lng: '' }));
  };

  const goNext = () => {
    if (activeModule === 1) {
      if (!form.lga) { alert('Please select the LGA'); return; }
      if (!form.community.trim()) { alert('Please enter the community name'); return; }
      if (!form.farmer_name.trim()) { alert('Farmer name is required'); return; }
      if (!form.farmer_phone.trim()) { alert('Farmer phone is required'); return; }
      if (!form.farmer_nin.trim()) { alert('Farmer NIN is required'); return; }
    }
    if (activeModule === 8) {
      if (!form.farm_size_hectares) { alert('Farm size is required. Either walk the boundary or enter it manually.'); return; }
      setScreen('summary'); window.scrollTo(0, 0); return;
    }
    setActiveModule(m => m + 1); window.scrollTo(0, 0);
  };

  const goPrev = () => { if (activeModule > 1) { setActiveModule(m => m - 1); window.scrollTo(0, 0); } };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        submitted_by: agentName, state: 'Bayelsa', ...form,
        household_size: form.household_size ? parseInt(form.household_size) : null,
        working_adults: form.working_adults ? parseInt(form.working_adults) : null,
        dependants: form.dependants ? parseInt(form.dependants) : null,
        farm_size_hectares: form.farm_size_hectares ? parseFloat(form.farm_size_hectares) : null,
        farm_gps_lat: form.farm_gps_lat ? parseFloat(form.farm_gps_lat) : null,
        farm_gps_lng: form.farm_gps_lng ? parseFloat(form.farm_gps_lng) : null,
        farm_gps_accuracy: form.farm_gps_accuracy ? parseFloat(form.farm_gps_accuracy) : null,
        boundary_points: boundaryPoints.length ? JSON.stringify(boundaryPoints) : null,
        photo_farmer: photos.farmer || null,
        photo_farm: photos.farm || null,
        photo_extra: photos.extra || null,
      };
      const result = await submitFieldData(apiKey, payload);
      setSubmitResult(result); setScreen('success');
    } catch (err) {
      // ── FIXED ERROR HANDLING ──────────────────────────────────
      // The server sends back `detail` as a LIST of problem-notes
      // when validation fails, e.g.
      //   [{ loc: ["body", "farmer_phone"], msg: "must be a valid Nigerian number" }]
      // A plain ${detail} turns that list into "[object Object]"
      // because JS doesn't know how to print an object as text.
      // Here we walk through each note and read out the field name
      // (the last item in "loc") plus the message, one per line.
      const detail = err?.response?.data?.detail;
      let message = 'Submission failed. Check your connection.';
      if (Array.isArray(detail)) {
        message = detail.map(d => `${d.loc?.[d.loc.length - 1]} — ${d.msg}`).join('\n');
      } else if (typeof detail === 'string') {
        message = detail;
      }
      alert(`Submission rejected:\n\n${message}`);
    } finally { setSubmitting(false); }
  };

  const loadHistory = async () => {
    setScreen('history'); setLoadingHistory(true);
    try { const result = await getMySubmissions(apiKey); setSubmissions(result.submissions || []); }
    catch { alert('Could not load submissions.'); }
    finally { setLoadingHistory(false); }
  };

  const resetForm = () => {
    setForm(prev => ({ ...Object.fromEntries(Object.keys(prev).map(k => [k, ''])), lga: prev.lga, community: prev.community }));
    setPhotos({ farmer: null, farm: null, extra: null });
    setBoundaryPoints([]); setBoundaryArea(null);
    setSubmitResult(null); setActiveModule(1);
    setScreen('form'); window.scrollTo(0, 0);
  };

  const statusColor = s => ({ pending: GOLD, flagged: RED, approved: '#4CAF50', rejected: RED, under_review: '#2196F3' }[s] || GREY);

  const TopBar = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '12px 16px', background: MID, borderRadius: 12, border: '1px solid #1a3a2a' }}>
      <div>
        <div style={{ color: GOLD, fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold' }}>🌾 FARMERXENTIAL</div>
        <div style={{ color: GREY, fontFamily: 'monospace', fontSize: 10, marginTop: 2 }}>Agent: {agentName}</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={loadHistory} style={{ background: 'transparent', border: `1px solid ${GOLD}`, color: GOLD, borderRadius: 6, padding: '6px 10px', fontFamily: 'monospace', fontSize: 10, cursor: 'pointer' }}>HISTORY</button>
        <button onClick={() => { localStorage.removeItem('fx_field_key'); localStorage.removeItem('fx_field_name'); setScreen('login'); }} style={{ background: 'transparent', border: '1px solid #333', color: GREY, borderRadius: 6, padding: '6px 10px', fontFamily: 'monospace', fontSize: 10, cursor: 'pointer' }}>LOGOUT</button>
      </div>
    </div>
  );

  const ModuleTabs = () => (
    <div style={{ display: 'flex', gap: 4, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
      {MODULES.map(m => (
        <button key={m.id} onClick={() => setActiveModule(m.id)}
          style={{ flex: '0 0 auto', padding: '6px 12px', background: activeModule === m.id ? GREEN : MID, color: activeModule === m.id ? GOLD : GREY, border: `1px solid ${activeModule === m.id ? GREEN : '#1a3a2a'}`, borderRadius: 8, fontFamily: 'monospace', fontSize: 10, cursor: 'pointer', fontWeight: activeModule === m.id ? 'bold' : 'normal' }}>
          {m.label}
        </button>
      ))}
    </div>
  );

  const NavButtons = ({ onNext, nextLabel = 'NEXT →', nextVariant = 'primary' }) => (
    <div style={{ display: 'flex', gap: 12, marginTop: 20, marginBottom: 16 }}>
      {activeModule > 1 && (
        <button onClick={goPrev} style={{ flex: 1, padding: 16, background: 'transparent', color: GOLD, border: `1px solid ${GOLD}`, borderRadius: 8, fontFamily: 'monospace', fontSize: 13, cursor: 'pointer' }}>← BACK</button>
      )}
      <button onClick={onNext || goNext} style={{ flex: 2, padding: 16, background: nextVariant === 'gold' ? GOLD : GREEN, color: nextVariant === 'gold' ? GREEN : GOLD, border: 'none', borderRadius: 8, fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold', cursor: 'pointer', letterSpacing: 1 }}>
        {nextLabel}
      </button>
    </div>
  );

  // ══ LOGIN ══
  if (screen === 'login') return (
    <div style={{ minHeight: '100vh', background: DARK, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: MID, borderRadius: 16, padding: 32, width: '100%', maxWidth: 400, border: '1px solid #1a3a2a' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🌾</div>
          <div style={{ color: GOLD, fontFamily: 'monospace', fontSize: 22, fontWeight: 'bold', letterSpacing: 2, marginBottom: 6 }}>FARMERXENTIAL</div>
          <div style={{ color: GREY, fontFamily: 'monospace', fontSize: 11, letterSpacing: 1 }}>FIELD DATA COLLECTION</div>
        </div>
        <Label required>YOUR NAME</Label>
        <Input value={agentName} onChange={e => setAgentName(e.target.value)} placeholder="Enter your name" />
        <Label required>FIELD AGENT KEY</Label>
        <Input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Paste your access key" type="password" />
        {loginError && <div style={{ color: RED, fontSize: 13, marginBottom: 16, fontFamily: 'monospace' }}>⚠ {loginError}</div>}
        <Btn onClick={handleLogin}>ACCESS FIELD PORTAL</Btn>
        <div style={{ textAlign: 'center', marginTop: 16, color: GREY, fontSize: 11, fontFamily: 'monospace' }}>FARMERXENTIAL v3.0 — LALISHANK HOLDINGS LIMITED</div>
      </div>
    </div>
  );

  // ══ SUCCESS ══
  if (screen === 'success') return (
    <div style={{ minHeight: '100vh', background: DARK, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: MID, borderRadius: 16, padding: 32, width: '100%', maxWidth: 400, border: `1px solid ${GREEN}`, textAlign: 'center' }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
        <div style={{ color: GOLD, fontFamily: 'monospace', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>SUBMITTED SUCCESSFULLY</div>
        <div style={{ background: '#1a2a1a', borderRadius: 8, padding: 16, marginBottom: 24, marginTop: 16 }}>
          <div style={{ color: GREY, fontSize: 11, fontFamily: 'monospace', marginBottom: 4 }}>SUBMISSION ID</div>
          <div style={{ color: WHITE, fontFamily: 'monospace', fontSize: 16, fontWeight: 'bold' }}>{submitResult?.submission_id}</div>
          <div style={{ color: GREY, fontSize: 11, fontFamily: 'monospace', marginTop: 8 }}>STATUS</div>
          <div style={{ color: submitResult?.status === 'flagged' ? RED : '#4CAF50', fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' }}>{submitResult?.status}</div>
          {submitResult?.flags_raised && submitResult.flags_raised !== 'None — submission looks clean' && (
            <div style={{ marginTop: 12, padding: 10, background: '#2a1a1a', borderRadius: 6, border: `1px solid ${RED}` }}>
              <div style={{ color: RED, fontSize: 11, fontFamily: 'monospace', fontWeight: 'bold', marginBottom: 4 }}>FLAGS RAISED</div>
              <div style={{ color: '#ff9999', fontSize: 12, fontFamily: 'monospace' }}>{submitResult.flags_raised}</div>
            </div>
          )}
        </div>
        <div style={{ color: GREY, fontSize: 12, fontFamily: 'monospace', marginBottom: 24, lineHeight: 1.6 }}>{submitResult?.next_step}</div>
        <Btn onClick={resetForm} variant="primary">+ REGISTER NEXT FARMER</Btn>
        <Btn onClick={loadHistory} variant="outline">VIEW MY SUBMISSIONS</Btn>
      </div>
    </div>
  );

  // ══ HISTORY ══
  if (screen === 'history') return (
    <div style={{ minHeight: '100vh', background: DARK, padding: 20 }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => setScreen('form')} style={{ background: 'transparent', border: `1px solid ${GOLD}`, color: GOLD, borderRadius: 8, padding: '8px 16px', fontFamily: 'monospace', fontSize: 12, cursor: 'pointer' }}>← BACK</button>
          <div style={{ color: GOLD, fontFamily: 'monospace', fontSize: 16, fontWeight: 'bold' }}>MY SUBMISSIONS</div>
        </div>
        {loadingHistory ? (
          <div style={{ textAlign: 'center', color: GREY, fontFamily: 'monospace', padding: 40 }}>Loading...</div>
        ) : submissions.length === 0 ? (
          <div style={{ textAlign: 'center', color: GREY, fontFamily: 'monospace', padding: 40 }}>No submissions yet</div>
        ) : submissions.map(s => (
          <div key={s.submission_id} style={{ background: MID, borderRadius: 12, padding: 16, marginBottom: 12, border: '1px solid #1a3a2a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ color: WHITE, fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold' }}>{s.farmer_name}</div>
                <div style={{ color: GREY, fontFamily: 'monospace', fontSize: 11, marginTop: 2 }}>{s.lga} — {s.community}</div>
              </div>
              <div style={{ background: statusColor(s.status) + '22', color: statusColor(s.status), border: `1px solid ${statusColor(s.status)}`, borderRadius: 6, padding: '4px 10px', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold', textTransform: 'uppercase' }}>{s.status}</div>
            </div>
            <div style={{ color: GREY, fontSize: 11, fontFamily: 'monospace' }}>{s.submission_id} · {new Date(s.submitted_at).toLocaleDateString()}</div>
            {s.rejection_reason && <div style={{ color: RED, fontSize: 11, fontFamily: 'monospace', marginTop: 6 }}>Reason: {s.rejection_reason}</div>}
          </div>
        ))}
      </div>
    </div>
  );

  // ══ SUMMARY ══
  if (screen === 'summary') return (
    <div style={{ minHeight: '100vh', background: DARK, padding: 16 }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <TopBar />
        <div style={{ background: MID, borderRadius: 12, padding: 20, border: `1px solid ${GOLD}`, marginBottom: 16 }}>
          <div style={{ color: GOLD, fontFamily: 'monospace', fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>📋 REVIEW BEFORE SUBMITTING</div>
          <div style={{ color: GREY, fontSize: 12, fontFamily: 'monospace' }}>Check every answer carefully. Press GO BACK to correct anything.</div>
        </div>
        <Card>
          <SummarySection title="📍 LOCATION" rows={[['LGA', form.lga], ['Community', form.community], ['State', 'Bayelsa']]} />
          <SummarySection title="👤 FARMER IDENTITY" rows={[['Full Name', form.farmer_name], ['Phone', form.farmer_phone], ['NIN', form.farmer_nin], ['Gender', form.farmer_gender], ['Age Range', form.farmer_age_range], ['Education', form.household_education_level]]} />
          <SummarySection title="🏠 HOUSEHOLD" rows={[['Household Size', form.household_size], ['Working Adults', form.working_adults], ['Dependants', form.dependants]]} />
          <SummarySection title="🌾 FARM" rows={[['Land Ownership', form.land_ownership], ['Main Crop', form.main_crop], ['Other Crops', form.other_crops || '—'], ['Irrigation', form.has_irrigation], ['Fertiliser', form.used_fertiliser], ['Farm Size', form.farm_size_hectares ? `${form.farm_size_hectares} ha` : null], ['GPS Lat', form.farm_gps_lat], ['GPS Lng', form.farm_gps_lng], ['Boundary Points', boundaryPoints.length ? `${boundaryPoints.length} points` : null]]} />
          <SummarySection title="⚡ SHOCKS" rows={[['Flooding', form.experienced_flooding], ['Drought', form.experienced_drought], ['Pest Attack', form.experienced_pest_attack], ['Crop Disease', form.experienced_crop_disease], ['Crop Loss', form.crop_loss_level], ['Household Shock', form.household_illness_death], ['Extension Visits', form.extension_visits], ['Received Assistance', form.received_assistance], ['Distance to Market', form.distance_to_market], ['Transport Cost', form.transport_cost]]} />
          <SummarySection title="💰 FINANCIAL" rows={[['Bank Account', form.has_bank_account], ['Mobile Money', form.uses_mobile_money], ['Provider', form.mobile_money_provider], ['Credit Source', form.credit_source], ['Loan Repayment', form.loan_repayment], ['Income/Season', form.farm_income_per_season], ['Input Spend', form.input_expenditure]]} />
          <SummarySection title="🏥 HEALTH" rows={[['Distance to Health', form.distance_to_health], ['Insurance', form.has_health_insurance], ['Illness (12m)', form.household_illness_12m], ['Water Source', form.water_source], ['Pesticides', form.uses_pesticides], ['Protection', form.uses_protective_equipment]]} />
          <SummarySection title="🛒 SUPPLY CHAIN" rows={[['Harvest Behaviour', form.harvest_behaviour], ['Primary Buyer', form.primary_buyer], ['Time to Sell', form.time_to_sell], ['Storage', form.has_storage], ['Post-Harvest Challenge', form.postharvest_challenge], ['Fertiliser Brand', form.fertiliser_brand || '—'], ['Input Source', form.input_purchase_source]]} />
          <SummarySection title="📱 DIGITAL" rows={[['Phone Type', form.phone_type], ['WhatsApp', form.uses_whatsapp], ['Agri App', form.uses_agri_app], ['Training', form.attended_training], ['Learning Interest', form.preferred_learning_topic], ['Language', form.preferred_language], ['Advice Source', form.advice_source]]} />
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: GOLD, fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8, paddingBottom: 4, borderBottom: `1px solid ${GREEN}` }}>📷 PHOTOS</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['farmer', 'farm', 'extra'].map(type => (
                <div key={type} style={{ flex: '1 1 80px' }}>
                  {photos[type] ? (
                    <img src={photos[type]} alt={type} style={{ width: '100%', borderRadius: 6, border: `1px solid ${GREEN}`, maxHeight: 80, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: 80, borderRadius: 6, border: `1px dashed ${type === 'extra' ? GREY : RED}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: type === 'extra' ? GREY : RED, fontSize: 9, fontFamily: 'monospace', textAlign: 'center' }}>
                      {type === 'extra' ? 'OPT' : 'MISSING'}
                    </div>
                  )}
                  <div style={{ color: GREY, fontSize: 9, fontFamily: 'monospace', textAlign: 'center', marginTop: 4 }}>{type.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </div>
          {form.field_agent_notes && <SummarySection title="📝 NOTES" rows={[['Notes', form.field_agent_notes]]} />}
        </Card>
        <div style={{ marginBottom: 32 }}>
          <Btn onClick={handleSubmit} disabled={submitting} variant="gold">{submitting ? '⏳ SUBMITTING...' : '✅ CONFIRM AND SUBMIT'}</Btn>
          <Btn onClick={() => { setScreen('form'); setActiveModule(1); }} variant="outline">← GO BACK AND EDIT</Btn>
        </div>
      </div>
    </div>
  );

  // ══ MAIN FORM ══
  return (
    <div style={{ minHeight: '100vh', background: DARK, padding: 16 }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <TopBar />
        <ModuleTabs />

        {activeModule === 1 && (
          <Card>
            <SectionHeader number="📍" title="LOCATION" />
            <Label required>LGA</Label>
            <Select value={form.lga} onChange={set('lga')} options={BAYELSA_LGAS} placeholder="Select LGA" />
            <Label required>COMMUNITY</Label>
            <Input value={form.community} onChange={set('community')} placeholder="Community name" />
            <SectionHeader number="1A" title="FARMER IDENTITY" />
            <Label required>FULL NAME</Label>
            <Input value={form.farmer_name} onChange={set('farmer_name')} placeholder="Farmer's full name" />
            <Label required>PHONE NUMBER</Label>
            <Input value={form.farmer_phone} onChange={set('farmer_phone')} placeholder="e.g. 08012345678" type="tel" />
            <Label required>NIN (NATIONAL ID NUMBER)</Label>
            <Input value={form.farmer_nin} onChange={set('farmer_nin')} placeholder="11-digit NIN" type="tel" />
            <Label>GENDER</Label>
            <Select value={form.farmer_gender} onChange={set('farmer_gender')} options={['Male', 'Female']} placeholder="Select gender" />
            <Label>AGE RANGE</Label>
            <Select value={form.farmer_age_range} onChange={set('farmer_age_range')} options={['18 – 30', '31 – 45', '46 – 60', '61 and above']} placeholder="Select age range" />
            <Label>HIGHEST EDUCATION LEVEL IN HOUSEHOLD</Label>
            <Select value={form.household_education_level} onChange={set('household_education_level')} options={['No formal education', 'Primary school', 'Secondary school', 'Tertiary / University', 'Vocational / Technical']} placeholder="Select level" />
            <SectionHeader number="1B" title="HOUSEHOLD PROFILE" />
            <Label>TOTAL PEOPLE IN HOUSEHOLD</Label>
            <Input value={form.household_size} onChange={set('household_size')} placeholder="e.g. 6" type="number" />
            <Label>WORKING ADULTS</Label>
            <Input value={form.working_adults} onChange={set('working_adults')} placeholder="e.g. 2" type="number" />
            <Label>DEPENDANTS (children, elderly, ill)</Label>
            <Input value={form.dependants} onChange={set('dependants')} placeholder="e.g. 4" type="number" />
            <SectionHeader number="1C" title="FARM PROFILE" />
            <Label>LAND OWNERSHIP</Label>
            <Select value={form.land_ownership} onChange={set('land_ownership')} options={['Own', 'Rent', 'Communal / Family land', 'Borrowed']} placeholder="Select ownership" />
            <Label>MAIN CROP GROWN</Label>
            <Select value={form.main_crop} onChange={set('main_crop')} options={['Maize', 'Cassava', 'Rice', 'Yam', 'Sorghum', 'Vegetables', 'Groundnut', 'Other']} placeholder="Select main crop" />
            <Label>OTHER CROPS GROWN</Label>
            <Input value={form.other_crops} onChange={set('other_crops')} placeholder="e.g. Cassava, Vegetables" />
            <Label>ACCESS TO IRRIGATION</Label>
            <Select value={form.has_irrigation} onChange={set('has_irrigation')} options={['Yes — full irrigation', 'Yes — partial irrigation', 'No — rain fed only']} placeholder="Select option" />
            <Label>USED FERTILISER THIS SEASON?</Label>
            <Select value={form.used_fertiliser} onChange={set('used_fertiliser')} options={['Yes', 'No', 'Cannot afford it', 'Not available in area']} placeholder="Select option" />
            <NavButtons />
          </Card>
        )}

        {activeModule === 2 && (
          <Card>
            <SectionHeader number="2A" title="RECENT SHOCKS" />
            <Label>FLOODING IN LAST 12 MONTHS?</Label>
            <Select value={form.experienced_flooding} onChange={set('experienced_flooding')} options={['Yes — severe', 'Yes — minor', 'No']} placeholder="Select option" />
            <Label>DROUGHT OR LOW RAINFALL?</Label>
            <Select value={form.experienced_drought} onChange={set('experienced_drought')} options={['Yes — severe', 'Yes — minor', 'No']} placeholder="Select option" />
            <Label>PEST ATTACK?</Label>
            <Select value={form.experienced_pest_attack} onChange={set('experienced_pest_attack')} options={['Yes — severe', 'Yes — minor', 'No']} placeholder="Select option" />
            <Label>CROP DISEASE?</Label>
            <Select value={form.experienced_crop_disease} onChange={set('experienced_crop_disease')} options={['Yes — spreading', 'Yes — isolated', 'No']} placeholder="Select option" />
            <Label>CROP LOSS THIS SEASON?</Label>
            <Select value={form.crop_loss_level} onChange={set('crop_loss_level')} options={['Yes — more than 50% loss', 'Yes — 25 to 50% loss', 'Yes — less than 25% loss', 'No crop loss']} placeholder="Select option" />
            <Label>SERIOUS ILLNESS OR DEATH IN HOUSEHOLD?</Label>
            <Select value={form.household_illness_death} onChange={set('household_illness_death')} options={['Yes — death of income earner', 'Yes — serious illness', 'No']} placeholder="Select option" />
            <SectionHeader number="2B" title="ACCESS & SUPPORT" />
            <Label>EXTENSION OFFICER VISITS THIS YEAR?</Label>
            <Select value={form.extension_visits} onChange={set('extension_visits')} options={['Yes — more than 3 visits', 'Yes — 1 to 2 visits', 'No visits']} placeholder="Select option" />
            <Label>RECEIVED GOVERNMENT ASSISTANCE (LAST 2 YEARS)?</Label>
            <Select value={form.received_assistance} onChange={set('received_assistance')} options={['Yes', 'No', 'Applied but not received']} placeholder="Select option" />
            <Label>ACCESS TO VETERINARY SERVICES?</Label>
            <Select value={form.has_veterinary_access} onChange={set('has_veterinary_access')} options={['Yes', 'No', 'No livestock']} placeholder="Select option" />
            <Label>DISTANCE TO NEAREST MARKET</Label>
            <Select value={form.distance_to_market} onChange={set('distance_to_market')} options={['Less than 5 km', '5 to 15 km', '15 to 30 km', 'More than 30 km']} placeholder="Select option" />
            <Label>TRANSPORT COST TO MARKET</Label>
            <Select value={form.transport_cost} onChange={set('transport_cost')} options={['Less than ₦500', '₦500 to ₦2,000', '₦2,000 to ₦5,000', 'More than ₦5,000']} placeholder="Select option" />
            <NavButtons />
          </Card>
        )}

        {activeModule === 3 && (
          <Card>
            <SectionHeader number="3" title="FINANCIAL PROFILE" />
            <Label>HAS BANK ACCOUNT?</Label>
            <Select value={form.has_bank_account} onChange={set('has_bank_account')} options={['Yes — active', 'Yes — inactive', 'No']} placeholder="Select option" />
            <Label>USES MOBILE MONEY?</Label>
            <Select value={form.uses_mobile_money} onChange={set('uses_mobile_money')} options={['Yes — regularly', 'Yes — occasionally', 'No']} placeholder="Select option" />
            <Label>MOBILE MONEY PROVIDER</Label>
            <Select value={form.mobile_money_provider} onChange={set('mobile_money_provider')} options={['OPay', 'PalmPay', 'MTN MoMo', 'Airtel Money', 'None', 'Other']} placeholder="Select option" />
            <Label>EVER TAKEN A LOAN FOR FARMING?</Label>
            <Select value={form.credit_source} onChange={set('credit_source')} options={['Yes — from a bank', 'Yes — from a cooperative', 'Yes — from a moneylender', 'Yes — from family or friends', 'No']} placeholder="Select option" />
            <Label>LOAN REPAYMENT STATUS</Label>
            <Select value={form.loan_repayment} onChange={set('loan_repayment')} options={['Yes — fully repaid', 'Partially repaid', 'Not yet repaid', 'Never taken a loan']} placeholder="Select option" />
            <Label>ESTIMATED FARM INCOME PER SEASON</Label>
            <Select value={form.farm_income_per_season} onChange={set('farm_income_per_season')} options={['Less than ₦50,000', '₦50,000 to ₦200,000', '₦200,000 to ₦500,000', 'More than ₦500,000', 'Farmer does not know']} placeholder="Select option" />
            <Label>INPUT EXPENDITURE PER SEASON</Label>
            <Select value={form.input_expenditure} onChange={set('input_expenditure')} options={['Less than ₦20,000', '₦20,000 to ₦80,000', '₦80,000 to ₦200,000', 'More than ₦200,000']} placeholder="Select option" />
            <NavButtons />
          </Card>
        )}

        {activeModule === 4 && (
          <Card>
            <SectionHeader number="4" title="HEALTH & WELLBEING" />
            <Label>DISTANCE TO NEAREST HEALTH CLINIC</Label>
            <Select value={form.distance_to_health} onChange={set('distance_to_health')} options={['Less than 5 km', '5 to 15 km', '15 to 30 km', 'More than 30 km']} placeholder="Select option" />
            <Label>HAS HEALTH INSURANCE?</Label>
            <Select value={form.has_health_insurance} onChange={set('has_health_insurance')} options={['Yes — NHIS', 'Yes — private', 'No']} placeholder="Select option" />
            <Label>SERIOUS ILLNESS IN HOUSEHOLD (LAST 12 MONTHS)?</Label>
            <Select value={form.household_illness_12m} onChange={set('household_illness_12m')} options={['Yes — hospitalised', 'Yes — treated at home', 'No']} placeholder="Select option" />
            <Label>MAIN DRINKING WATER SOURCE</Label>
            <Select value={form.water_source} onChange={set('water_source')} options={['Borehole / pipe-borne', 'Well', 'River or stream', 'Rainwater', 'Purchased water']} placeholder="Select option" />
            <Label>USES PESTICIDES OR HERBICIDES?</Label>
            <Select value={form.uses_pesticides} onChange={set('uses_pesticides')} options={['Yes', 'No']} placeholder="Select option" />
            <Label>USES PROTECTIVE EQUIPMENT WHEN APPLYING?</Label>
            <Select value={form.uses_protective_equipment} onChange={set('uses_protective_equipment')} options={['Yes — always', 'Yes — sometimes', 'No — never', 'Does not use pesticides']} placeholder="Select option" />
            <NavButtons />
          </Card>
        )}

        {activeModule === 5 && (
          <Card>
            <SectionHeader number="5" title="SUPPLY CHAIN & MARKET" />
            <Label>WHAT DO THEY DO WITH THEIR HARVEST?</Label>
            <Select value={form.harvest_behaviour} onChange={set('harvest_behaviour')} options={['Sell immediately after harvest', 'Store and sell later', 'Consume at home', 'Mix of selling and consuming']} placeholder="Select option" />
            <Label>WHO DO THEY PRIMARILY SELL TO?</Label>
            <Select value={form.primary_buyer} onChange={set('primary_buyer')} options={['Individual buyers at farm gate', 'Market traders', 'Cooperatives or aggregators', 'Processors or factories', 'Direct consumers at market', 'Does not sell']} placeholder="Select option" />
            <Label>HOW LONG AFTER HARVEST DO THEY SELL?</Label>
            <Select value={form.time_to_sell} onChange={set('time_to_sell')} options={['Within 1 week', '1 to 4 weeks', '1 to 3 months', 'More than 3 months']} placeholder="Select option" />
            <Label>ACCESS TO STORAGE FACILITIES?</Label>
            <Select value={form.has_storage} onChange={set('has_storage')} options={['Yes — own storage', 'Yes — community storage', 'Yes — rented storage', 'No storage available']} placeholder="Select option" />
            <Label>DISTANCE TO NEAREST PROCESSING FACILITY</Label>
            <Select value={form.distance_to_processing} onChange={set('distance_to_processing')} options={['Less than 10 km', '10 to 30 km', '30 to 60 km', 'More than 60 km', 'Not aware of any']} placeholder="Select option" />
            <Label>BIGGEST POST-HARVEST CHALLENGE</Label>
            <Select value={form.postharvest_challenge} onChange={set('postharvest_challenge')} options={['No storage', 'No transport', 'Low market prices', 'No buyers nearby', 'Produce spoils quickly', 'No challenge']} placeholder="Select option" />
            <Label>FERTILISER BRAND USED (if any)</Label>
            <Input value={form.fertiliser_brand} onChange={set('fertiliser_brand')} placeholder="e.g. Notore, UREA" />
            <Label>WHERE DO THEY BUY INPUTS?</Label>
            <Select value={form.input_purchase_source} onChange={set('input_purchase_source')} options={['Government agro-dealer', 'Private agro-dealer', 'Cooperative', 'Local market', 'Online', 'Does not buy inputs']} placeholder="Select option" />
            <NavButtons />
          </Card>
        )}

        {activeModule === 6 && (
          <Card>
            <SectionHeader number="6" title="DIGITAL & LEARNING" />
            <Label>TYPE OF PHONE</Label>
            <Select value={form.phone_type} onChange={set('phone_type')} options={['Smartphone (touchscreen)', 'Basic phone (calls and SMS only)', 'No phone']} placeholder="Select option" />
            <Label>USES WHATSAPP?</Label>
            <Select value={form.uses_whatsapp} onChange={set('uses_whatsapp')} options={['Yes — daily', 'Yes — occasionally', 'No']} placeholder="Select option" />
            <Label>USES ANY AGRICULTURAL APP?</Label>
            <Select value={form.uses_agri_app} onChange={set('uses_agri_app')} options={['Yes', 'No', 'Not aware of any']} placeholder="Select option" />
            <Label>ATTENDED AGRICULTURAL TRAINING (LAST 2 YEARS)?</Label>
            <Select value={form.attended_training} onChange={set('attended_training')} options={['Yes — government training', 'Yes — NGO training', 'Yes — cooperative training', 'No']} placeholder="Select option" />
            <Label>MOST WANTED LEARNING TOPIC</Label>
            <Select value={form.preferred_learning_topic} onChange={set('preferred_learning_topic')} options={['Pest and disease control', 'Fertiliser and soil management', 'Post-harvest storage', 'Market access and pricing', 'Climate and weather adaptation', 'Financial management']} placeholder="Select option" />
            <Label>PREFERRED LANGUAGE</Label>
            <Select value={form.preferred_language} onChange={set('preferred_language')} options={['English', 'Hausa', 'Yoruba', 'Igbo', 'Pidgin English', 'Izon', 'Other local language']} placeholder="Select option" />
            <Label>WHERE DO THEY GET FARMING ADVICE?</Label>
            <Select value={form.advice_source} onChange={set('advice_source')} options={['Government extension officer', 'Cooperative members', 'Family and neighbours', 'Radio or TV', 'Mobile phone or internet', 'No regular source']} placeholder="Select option" />
            <SectionHeader number="📝" title="FIELD AGENT NOTES" />
            <textarea value={form.field_agent_notes} onChange={set('field_agent_notes')} placeholder="Any additional observations..." rows={4}
              style={{ width: '100%', padding: '14px 16px', fontSize: 14, borderRadius: 8, border: '1px solid #2a3a4a', background: '#0a1628', color: WHITE, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace', resize: 'vertical', lineHeight: 1.5, marginBottom: 16 }} />
            <NavButtons />
          </Card>
        )}

        {activeModule === 7 && (
          <Card>
            <SectionHeader number="7" title="PHOTO CAPTURE" />
            <NoteBox text="All photos must be taken NOW using your camera. Do not upload old photos from your gallery. Photos are proof of your visit." />
            {['farmer', 'farm', 'extra'].map((type, idx) => (
              <div key={type} style={{ marginBottom: 20 }}>
                <Label required={type !== 'extra'}>
                  PHOTO {idx + 1} — {type === 'farmer' ? 'FARMER WITH NAME CARD' : type === 'farm' ? 'FARM OVERVIEW' : 'EXTRA (OPTIONAL)'}
                </Label>
                <div style={{ color: GREY, fontSize: 11, fontFamily: 'monospace', marginBottom: 10, lineHeight: 1.6 }}>
                  {type === 'farmer' ? 'Ask the farmer to hold a paper with their name. Take photo while standing on the farm.' :
                   type === 'farm' ? 'Stand at one edge of the farm. Take a wide photo showing crops and land condition.' :
                   'Any additional photo — crop damage, pest evidence, flooding, or anything relevant.'}
                </div>
                {photos[type] ? (
                  <div style={{ position: 'relative', marginBottom: 12 }}>
                    <img src={photos[type]} alt={type} style={{ width: '100%', borderRadius: 8, border: `2px solid ${GREEN}`, maxHeight: 200, objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: 8, right: 8, background: '#4CAF50', color: WHITE, borderRadius: 4, padding: '2px 8px', fontSize: 10, fontFamily: 'monospace' }}>✅ CAPTURED</div>
                  </div>
                ) : (
                  <div style={{ height: 100, background: '#0a1628', borderRadius: 8, border: '2px dashed #2a3a4a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: GREY, fontFamily: 'monospace', fontSize: 12 }}>No photo yet</div>
                )}
                <Btn onClick={() => capturePhoto(type)} variant="outline">
                  📷 {photos[type] ? `RETAKE ${type.toUpperCase()} PHOTO` : `TAKE ${type.toUpperCase()} PHOTO${type === 'extra' ? ' (OPTIONAL)' : ''}`}
                </Btn>
              </div>
            ))}
            <NavButtons />
          </Card>
        )}

        {activeModule === 8 && (
          <Card>
            <SectionHeader number="8" title="FARM BOUNDARY MAPPING" />
            <NoteBox text="Walk to the FIRST corner of the farm and press START. Then walk to each corner and press PIN THIS CORNER. When all corners are pinned, press COMPLETE BOUNDARY. The app draws straight lines between your pins." />

            <BoundaryMap
              points={boundaryPoints}
              isWalking={isPinning}
              currentPos={boundaryPoints.length > 0 ? boundaryPoints[boundaryPoints.length - 1] : null}
            />

            {/* Corner counter while pinning */}
            {isPinning && (
              <div style={{ background: '#0a1a0a', border: `1px solid ${GOLD}`, borderRadius: 8, padding: 12, marginBottom: 12 }}>
                <div style={{ color: GOLD, fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold', marginBottom: 4 }}>
                  📍 PIN MODE ACTIVE — {boundaryPoints.length} CORNER{boundaryPoints.length !== 1 ? 'S' : ''} PINNED
                </div>
                <div style={{ color: GREY, fontFamily: 'monospace', fontSize: 11, lineHeight: 1.6 }}>
                  Walk to the next corner of the farm, stand still, then press PIN THIS CORNER.
                  {boundaryPoints.length >= 3 && ' You have enough corners to complete the boundary.'}
                </div>
              </div>
            )}

            {/* Boundary result */}
            {boundaryArea && (
              <div style={{ background: '#1a2a1a', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <div style={{ color: '#4CAF50', fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold', marginBottom: 8 }}>✅ BOUNDARY MAPPED</div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ color: GREY, fontSize: 10, fontFamily: 'monospace' }}>FARM SIZE</div>
                    <div style={{ color: WHITE, fontSize: 18, fontFamily: 'monospace', fontWeight: 'bold' }}>{boundaryArea} ha</div>
                  </div>
                  <div>
                    <div style={{ color: GREY, fontSize: 10, fontFamily: 'monospace' }}>CORNERS PINNED</div>
                    <div style={{ color: WHITE, fontSize: 18, fontFamily: 'monospace', fontWeight: 'bold' }}>{boundaryPoints.length}</div>
                  </div>
                  <div>
                    <div style={{ color: GREY, fontSize: 10, fontFamily: 'monospace' }}>CENTRE</div>
                    <div style={{ color: WHITE, fontSize: 12, fontFamily: 'monospace' }}>{form.farm_gps_lat}, {form.farm_gps_lng}</div>
                  </div>
                </div>
              </div>
            )}

            {/* START button — before pin mode */}
            {!isPinning && !boundaryArea && (
              <Btn onClick={startPinMode} variant="primary">📍 START BOUNDARY MAPPING</Btn>
            )}

            {/* PIN + UNDO + COMPLETE buttons — during pin mode */}
            {isPinning && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Btn
                  onClick={pinCorner}
                  variant="primary"
                  style={{ opacity: pinLoading ? 0.6 : 1 }}
                >
                  {pinLoading ? '⏳ GETTING GPS FIX...' : `📍 PIN THIS CORNER (${boundaryPoints.length + 1})`}
                </Btn>
                {boundaryPoints.length > 0 && (
                  <Btn onClick={undoLastPin} variant="ghost">↩ UNDO LAST PIN</Btn>
                )}
                {boundaryPoints.length >= 3 && (
                  <Btn onClick={completeBoundary} variant="gold">✅ COMPLETE BOUNDARY</Btn>
                )}
              </div>
            )}

            {/* REDO button — after boundary complete */}
            {boundaryArea && (
              <Btn onClick={resetBoundary} variant="ghost">🔄 REDO BOUNDARY MAPPING</Btn>
            )}

            {/* Manual fallback — if GPS is poor or farm near buildings */}
            <div style={{ marginTop: 8, padding: 16, background: '#0a1628', borderRadius: 8, border: '1px dashed #2a3a4a', marginBottom: 8 }}>
              <div style={{ color: GREY, fontFamily: 'monospace', fontSize: 11, marginBottom: 12, lineHeight: 1.6 }}>
                ⚠ GPS signal poor or farm near buildings? Enter details manually:
              </div>
              <Label>FARM SIZE IN HECTARES (from farmer or land document)</Label>
              <Input value={form.farm_size_hectares} onChange={set('farm_size_hectares')} placeholder="e.g. 1.5" type="number" />
              <Label>GPS LATITUDE (optional)</Label>
              <Input value={form.farm_gps_lat} onChange={set('farm_gps_lat')} placeholder="e.g. 4.9217" type="number" />
              <Label>GPS LONGITUDE (optional)</Label>
              <Input value={form.farm_gps_lng} onChange={set('farm_gps_lng')} placeholder="e.g. 6.2836" type="number" />
              <div style={{ color: GOLD, fontFamily: 'monospace', fontSize: 10, lineHeight: 1.6 }}>
                ✓ Manual entry will be flagged for coordinator verification
              </div>
            </div>

            <NavButtons onNext={goNext} nextLabel="REVIEW & SUBMIT →" nextVariant="gold" />
          </Card>
        )}

      </div>
    </div>
  );
}