import axios from 'axios';

const API_BASE = 'https://web-production-92e5f.up.railway.app';

let token = null;

export const login = async (clientName, apiKey) => {
  const form = new FormData();
  form.append('username', clientName);
  form.append('password', apiKey);
  const res = await axios.post(`${API_BASE}/auth/token`, form);
  token = res.data.access_token;
  localStorage.setItem('fx_token', token);
  return token;
};

export const getToken = () => {
  return token || localStorage.getItem('fx_token');
};

const headers = () => ({
  Authorization: `Bearer ${getToken()}`
});

export const getStats = async () => {
  const res = await axios.get(`${API_BASE}/stats`, { headers: headers() });
  return res.data;
};

export const getFarmers = async (zone = null, priority = null) => {
  const params = {};
  if (zone !== null) params.zone = zone;
  if (priority !== null) params.priority = priority;
  const res = await axios.get(`${API_BASE}/farmers`, { headers: headers(), params });
  return res.data;
};

export const getAlerts = async () => {
  const res = await axios.get(`${API_BASE}/alerts`, { headers: headers() });
  return res.data;
};

export const predict = async (farmerData) => {
  const res = await axios.post(`${API_BASE}/predict`, farmerData, { headers: headers() });
  return res.data;
};

export const getPredictionHistory = async () => {
  const res = await axios.get(`${API_BASE}/predictions/history`, { headers: headers() });
  return res.data;
};