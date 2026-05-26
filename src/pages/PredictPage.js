import React, { useState } from 'react';
import { predict } from '../api/farmerxential';

const C = {
  green: '#1B4332', gold: '#F59E0B',
  low: '#639922', mid: '#EF9F27', high: '#E24B4A',
  text: '#E8F5E9', dim: '#4CAF50'
};

const ZONE_OPTIONS = [
  [0,'North Central'],[1,'North East'],[2,'North West'],
  [3,'South East'],[4,'South South'],[5,'South West']
];

const RECOMMENDATIONS = {
  yield:                    'Provide yield improvement support and training',
  has_extension_access:     'Assign a field extension officer to this farmer',
  shock_level:              'Provide emergency agricultural shock support',
  received_credit:          'Connect farmer to agricultural credit programme',
  used_fertilizer:          'Supply fertilizer and input support',
  rainfall_anomaly:         'Monitor for climate-related crop failure risk',
  drought_risk:             'Enrol in drought resilience programme',
  market_access_score:      'Improve market linkage and transport access',
  asset_score:              'Provide asset-building support programme',
  digital_access_score:     'Provide mobile/digital literacy training',
  crop_diversity_score:     'Encourage crop diversification',
  crop_loss_risk_score:     'Provide crop insurance or loss mitigation support',
  postharvest_activity_score:'Improve post-harvest storage facilities',
  transport_cost:           'Reduce transport barriers through local market access',
};

export default function PredictPage() {
  const [form, setForm] = useState({
    yield_value: 1.5, has_extension_access: 0,
    household_max_education: 2, shock_level: 1,
    received_assistance: 0, used_fertilizer: 0,
    land_size: 1.0, household_size: 5, zone: 0,
    transport_cost: 500, dependency_ratio: 0.5,
    asset_score: 2.0, postharvest_activity_score: 1.0,
    crop_loss_risk_score: 1.0, crop_diversity_score: 2.0,
    digital_access_score: 0.5, has_veterinary_access: 0,
    market_access_score: 1.5, is_rural: 1,
    rainfall_anomaly: -0.5, drought_risk: 1,
    cultivates_crops: 1, received_credit: 0, head_gender: 1
  });

  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handlePredict = async () => {
    setLoading(true); setError(''); setResult(null);
    try { const r = await predict(form); setResult(r); }
    catch { setError('Prediction failed. Check your API connection.'); }
    setLoading(false);
  };

  const resultColor = result
    ? (result.prediction === 2 ? C.high : result.prediction === 1 ? C.mid : C.low)
    : C.gold;

  const getRecommendations = (factors) => {
    return factors.map(f => RECOMMENDATIONS[f]).filter(Boolean);
  };

  const NumberField = ({ label, field, step = 'any' }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 10, color: C.dim, letterSpacing: 1, fontWeight: 'bold' }}>
        {label.toUpperCase()}
      </label>
      <input
        type="number" step={step} value={form[field]}
        onChange={e => set(field, parseFloat(e.target.value) || 0)}
        style={{
          background: 'rgba(27,67,50,0.2)', border: '1px solid #1B4332',
          borderRadius: 4, padding: '8px 10px', color: C.text,
          fontFamily: 'monospace', fontSize: 13, outline: 'none', fontWeight: 'bold'
        }}
      />
    </div>
  );

  const SelectField = ({ label, field, options }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 10, color: C.dim, letterSpacing: 1, fontWeight: 'bold' }}>
        {label.toUpperCase()}
      </label>
      <select
        value={form[field]}
        onChange={e => set(field, parseInt(e.target.value))}
        style={{
          background: 'rgba(27,67,50,0.2)', border: '1px solid #1B4332',
          borderRadius: 4, padding: '8px 10px', color: C.text,
          fontFamily: 'monospace', fontSize: 13, outline: 'none', width: '100%', fontWeight: 'bold'
        }}
      >
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{ padding: 24, color: C.text, fontFamily: 'monospace' }}>
      <div style={{ color: C.gold, fontSize: 12, letterSpacing: 2, marginBottom: 20, fontWeight: 'bold' }}>
        ◈ AI PREDICTION ENGINE — NEW FARMER ASSESSMENT
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>

        {/* ── FORM ── */}
        <div style={{ background: 'rgba(27,67,50,0.1)', border: '1px solid #1B4332', borderRadius: 10, padding: 20 }}>

          <div style={{ color: C.gold, fontSize: 10, letterSpacing: 2, marginBottom: 12, fontWeight: 'bold' }}>
            FARM DATA
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
            <NumberField label="Crop Yield"         field="yield_value"/>
            <NumberField label="Land Size (ha)"     field="land_size"/>
            <NumberField label="Household Size"     field="household_size"/>
            <NumberField label="Transport Cost (₦)" field="transport_cost"/>
            <NumberField label="Dependency Ratio"   field="dependency_ratio"/>
            <NumberField label="Asset Score"        field="asset_score"/>
            <NumberField label="Rainfall Anomaly"   field="rainfall_anomaly"/>
            <NumberField label="Crop Loss Risk"     field="crop_loss_risk_score"/>
            <NumberField label="Market Access"      field="market_access_score"/>
            <NumberField label="Digital Access"     field="digital_access_score"/>
            <NumberField label="Crop Diversity"     field="crop_diversity_score"/>
            <NumberField label="Post-Harvest Score" field="postharvest_activity_score"/>
          </div>

          <div style={{ color: C.gold, fontSize: 10, letterSpacing: 2, marginBottom: 12, fontWeight: 'bold' }}>
            ACCESS & CONDITIONS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
            <SelectField label="Extension Officer" field="has_extension_access"  options={[[0,'No'],[1,'Yes']]}/>
            <SelectField label="Uses Fertilizer"   field="used_fertilizer"       options={[[0,'No'],[1,'Yes']]}/>
            <SelectField label="Has Credit"        field="received_credit"       options={[[0,'No'],[1,'Yes']]}/>
            <SelectField label="Gets Assistance"   field="received_assistance"   options={[[0,'No'],[1,'Yes']]}/>
            <SelectField label="Rural Area"        field="is_rural"              options={[[0,'No'],[1,'Yes']]}/>
            <SelectField label="Drought Risk"      field="drought_risk"          options={[[0,'No'],[1,'Yes']]}/>
            <SelectField label="Grows Crops"       field="cultivates_crops"      options={[[0,'No'],[1,'Yes']]}/>
            <SelectField label="Vet Access"        field="has_veterinary_access" options={[[0,'No'],[1,'Yes']]}/>
          </div>

          <div style={{ color: C.gold, fontSize: 10, letterSpacing: 2, marginBottom: 12, fontWeight: 'bold' }}>
            LOCATION & PROFILE
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
            <SelectField label="Zone"            field="zone"                    options={ZONE_OPTIONS}/>
            <SelectField label="Household Head"  field="head_gender"             options={[[1,'Male'],[2,'Female']]}/>
            <NumberField label="Shock Level (0-3)"    field="shock_level"              step="1"/>
            <NumberField label="Education Level (0-6)" field="household_max_education" step="1"/>
          </div>

          <button onClick={handlePredict} disabled={loading} style={{
            width: '100%', padding: 14,
            background: loading ? '#1B4332' : 'linear-gradient(135deg, #1B4332, #2D6A4F)',
            border: `1px solid ${C.gold}`, borderRadius: 6,
            color: C.gold, fontSize: 14, fontFamily: 'monospace',
            fontWeight: 'bold', letterSpacing: 2,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}>
            {loading ? 'RUNNING AI MODEL...' : '◈ RUN PREDICTION'}
          </button>

          {error && (
            <div style={{ color: C.high, fontSize: 12, marginTop: 10, textAlign: 'center' }}>{error}</div>
          )}
        </div>

        {/* ── RESULT PANEL ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ color: C.gold, fontSize: 11, letterSpacing: 2, fontWeight: 'bold' }}>
            ◈ PREDICTION RESULT
          </div>

          {!result && !loading && (
            <div style={{
              background: 'rgba(27,67,50,0.1)', border: '1px solid #1B4332',
              borderRadius: 10, padding: 40, textAlign: 'center', color: C.dim, fontSize: 12
            }}>
              Fill in farmer data and click RUN PREDICTION to see results.
            </div>
          )}

          {loading && (
            <div style={{
              background: 'rgba(27,67,50,0.1)', border: '1px solid #1B4332',
              borderRadius: 10, padding: 40, textAlign: 'center'
            }}>
              <div style={{ color: C.gold, fontSize: 12, animation: 'blink 1s infinite' }}>
                ◈ ANALYSING FARMER PROFILE...
              </div>
            </div>
          )}

          {result && <>
            {/* Priority result */}
            <div style={{
              background: `${resultColor}11`, border: `2px solid ${resultColor}`,
              borderRadius: 10, padding: 24, textAlign: 'center'
            }}>
              <div style={{ color: C.dim, fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>
                INTERVENTION LEVEL
              </div>
              <div style={{ color: resultColor, fontSize: 32, fontWeight: 'bold', marginBottom: 6 }}>
                {result.priority_label.toUpperCase()}
              </div>
              <div style={{ color: resultColor, fontSize: 22, fontWeight: 'bold' }}>
                {result.risk_score_percent}% RISK SCORE
              </div>
            </div>

            {/* Probability bars */}
            <div style={{ background: 'rgba(27,67,50,0.1)', border: '1px solid #1B4332', borderRadius: 10, padding: 16 }}>
              <div style={{ color: C.gold, fontSize: 10, letterSpacing: 2, marginBottom: 14, fontWeight: 'bold' }}>
                PROBABILITY BREAKDOWN
              </div>
              {[
                ['Low Priority',    result.probabilities.low,    C.low],
                ['Medium Priority', result.probabilities.medium, C.mid],
                ['High Priority',   result.probabilities.high,   C.high],
              ].map(([label, val, color]) => (
                <div key={label} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: C.text, fontWeight: 'bold' }}>{label}</span>
                    <span style={{ fontSize: 12, color, fontWeight: 'bold' }}>{val}%</span>
                  </div>
                  <div style={{ height: 6, background: '#1B4332', borderRadius: 3 }}>
                    <div style={{
                      height: '100%', width: `${val}%`, background: color,
                      borderRadius: 3, transition: 'width 0.8s ease'
                    }}/>
                  </div>
                </div>
              ))}
            </div>

            {/* SHAP Risk Factors */}
            <div style={{ background: 'rgba(27,67,50,0.1)', border: '1px solid #1B4332', borderRadius: 10, padding: 16 }}>
              <div style={{ color: C.gold, fontSize: 10, letterSpacing: 2, marginBottom: 12, fontWeight: 'bold' }}>
                WHY THIS FARMER IS AT RISK
              </div>
              {result.top_risk_factors.map((f, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  marginBottom: 8, padding: '8px 12px',
                  background: 'rgba(226,75,74,0.08)', borderRadius: 6
                }}>
                  <span style={{ color: C.high, fontSize: 12 }}>▶</span>
                  <span style={{ fontSize: 12, color: C.text, fontWeight: 'bold' }}>
                    {f.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
              ))}
            </div>

            {/* Recommendations */}
            <div style={{ background: 'rgba(27,67,50,0.1)', border: `1px solid ${C.gold}40`, borderRadius: 10, padding: 16 }}>
              <div style={{ color: C.gold, fontSize: 10, letterSpacing: 2, marginBottom: 12, fontWeight: 'bold' }}>
                ◈ RECOMMENDED INTERVENTIONS
              </div>
              {getRecommendations(result.top_risk_factors).length === 0 && (
                <div style={{ color: C.dim, fontSize: 12 }}>No specific recommendations.</div>
              )}
              {getRecommendations(result.top_risk_factors).map((rec, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  marginBottom: 10, padding: '10px 12px',
                  background: 'rgba(245,158,11,0.06)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  borderRadius: 6
                }}>
                  <span style={{ color: C.gold, fontSize: 14, marginTop: 1 }}>✦</span>
                  <span style={{ fontSize: 12, color: C.text, fontWeight: 'bold', lineHeight: 1.5 }}>
                    {rec}
                  </span>
                </div>
              ))}
            </div>
          </>}
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}