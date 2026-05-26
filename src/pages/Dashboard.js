import React, { useEffect, useState } from 'react';
import { getStats } from '../api/farmerxential';

export default function Dashboard({ onLogout }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getStats()
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => { setError('Failed to load stats.'); setLoading(false); });
  }, []);

  return (
    <div style={styles.container}>

      {/* NAVBAR */}
      <div style={styles.navbar}>
        <span style={styles.navTitle}>🌱 FarmerXential</span>
        <span style={styles.navTagline}>Identifying the Farmers Who Need Help Most</span>
        <button style={styles.logoutBtn} onClick={onLogout}>Logout</button>
      </div>

      {/* MAIN CONTENT */}
      <div style={styles.content}>
        <h2 style={styles.heading}>Dashboard Overview</h2>

        {loading && <p style={styles.loading}>Loading data from API...</p>}
        {error && <p style={styles.error}>{error}</p>}

        {stats && (
          <>
            {/* STAT CARDS */}
            <div style={styles.cardRow}>
              <div style={styles.card}>
                <p style={styles.cardLabel}>Total Farmers</p>
                <p style={styles.cardValue}>{stats.total_farmers}</p>
              </div>
              <div style={{...styles.card, borderTop: '4px solid #E24B4A'}}>
                <p style={styles.cardLabel}>High Priority</p>
                <p style={{...styles.cardValue, color: '#E24B4A'}}>{stats.high_priority_count}</p>
              </div>
              <div style={{...styles.card, borderTop: '4px solid #EF9F27'}}>
                <p style={styles.cardLabel}>Medium Priority</p>
                <p style={{...styles.cardValue, color: '#EF9F27'}}>{stats.medium_priority_count}</p>
              </div>
              <div style={{...styles.card, borderTop: '4px solid #639922'}}>
                <p style={styles.cardLabel}>Low Priority</p>
                <p style={{...styles.cardValue, color: '#639922'}}>{stats.low_priority_count}</p>
              </div>
              <div style={{...styles.card, borderTop: '4px solid #F59E0B'}}>
                <p style={styles.cardLabel}>Avg Risk Score</p>
                <p style={{...styles.cardValue, color: '#F59E0B'}}>{stats.avg_risk_score}%</p>
              </div>
              <div style={{...styles.card, borderTop: '4px solid #1B4332'}}>
                <p style={styles.cardLabel}>Active Alerts</p>
                <p style={{...styles.cardValue, color: '#1B4332'}}>{stats.active_alerts}</p>
              </div>
            </div>

            {/* ZONES */}
            <h3 style={styles.subheading}>High Priority Farmers by Zone</h3>
            <div style={styles.cardRow}>
              {Object.entries(stats.zones).map(([zone, count]) => (
                <div key={zone} style={styles.zoneCard}>
                  <p style={styles.zoneName}>{zone}</p>
                  <p style={styles.zoneCount}>{count}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#F0FFF4', fontFamily: 'sans-serif' },
  navbar: {
    backgroundColor: '#1B4332', padding: '16px 32px',
    display: 'flex', alignItems: 'center', gap: '16px'
  },
  navTitle: { color: '#FFFFFF', fontSize: '20px', fontWeight: 'bold' },
  navTagline: { color: '#F59E0B', fontSize: '13px', flex: 1 },
  logoutBtn: {
    backgroundColor: 'transparent', border: '1px solid #F59E0B',
    color: '#F59E0B', padding: '6px 16px', borderRadius: '6px',
    cursor: 'pointer', fontSize: '13px'
  },
  content: { padding: '32px' },
  heading: { color: '#1B4332', fontSize: '24px', marginBottom: '24px' },
  subheading: { color: '#1B4332', fontSize: '18px', margin: '32px 0 16px' },
  cardRow: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: '10px', padding: '20px',
    minWidth: '140px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    borderTop: '4px solid #1B4332', textAlign: 'center'
  },
  cardLabel: { color: '#666', fontSize: '12px', margin: '0 0 8px' },
  cardValue: { color: '#1A1A2E', fontSize: '28px', fontWeight: 'bold', margin: 0 },
  zoneCard: {
    backgroundColor: '#FFFFFF', borderRadius: '10px', padding: '16px 24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center'
  },
  zoneName: { color: '#1B4332', fontSize: '13px', fontWeight: 'bold', margin: '0 0 4px' },
  zoneCount: { color: '#E24B4A', fontSize: '24px', fontWeight: 'bold', margin: 0 },
  loading: { color: '#1B4332', fontSize: '16px' },
  error: { color: '#E24B4A', fontSize: '14px' },
};