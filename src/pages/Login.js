import React, { useState } from 'react';
import { login } from '../api/farmerxential';

export default function Login({ onLogin }) {
  const [clientName, setClientName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await login(clientName, apiKey);
      onLogin();
    } catch (err) {
      setError('Invalid credentials. Check your client name and API key.');
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>🌱</div>
        <h1 style={styles.title}>FarmerXential</h1>
        <p style={styles.tagline}>Identifying the Farmers Who Need Help Most</p>

        <input
          style={styles.input}
          placeholder="Client Name"
          value={clientName}
          onChange={e => setClientName(e.target.value)}
        />
        <input
          style={styles.input}
          placeholder="API Key"
          type="password"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button
          style={loading ? styles.buttonDisabled : styles.button}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <p style={styles.footer}>By Lalishank Holdings Limited</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#F0FFF4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    width: '380px',
    textAlign: 'center',
  },
  logo: { fontSize: '48px', marginBottom: '8px' },
  title: { color: '#1B4332', fontSize: '28px', fontWeight: 'bold', margin: '0 0 4px' },
  tagline: { color: '#666', fontSize: '13px', marginBottom: '24px' },
  input: {
    width: '100%',
    padding: '12px',
    marginBottom: '12px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#1B4332',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '8px',
  },
  buttonDisabled: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#aaa',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'not-allowed',
    marginTop: '8px',
  },
  error: { color: '#E24B4A', fontSize: '13px', marginBottom: '8px' },
  footer: { color: '#999', fontSize: '11px', marginTop: '20px' },
};