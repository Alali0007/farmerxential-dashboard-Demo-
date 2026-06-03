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

// FIX: now properly sends limit and offset to the API
// Before, these two params were being ignored — pagination wasn't working
export const getFarmers = async (zone = null, priority = null, limit = 50, offset = 0) => {
  const params = { limit, offset };
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

// ==============================
// NEW: INTERVENTION FUNCTIONS
// ==============================

// Record a new intervention for a farmer
// Think of it like: field officer fills in a form after visiting a farmer
export const createIntervention = async (interventionData) => {
  const res = await axios.post(
    `${API_BASE}/interventions`,
    interventionData,
    { headers: headers() }
  );
  return res.data;
};

// Get all interventions for one specific farmer
// Think of it like: opening a farmer's visit history file
export const getFarmerInterventions = async (farmerId) => {
  const res = await axios.get(
    `${API_BASE}/interventions/farmer/${farmerId}`,
    { headers: headers() }
  );
  return res.data;
};

// Get ALL interventions across all farmers (for NDDC dashboard)
// Think of it like: the full register of every visit ever made
export const getAllInterventions = async (outcome = null, officerName = null, limit = 100, offset = 0) => {
  const params = { limit, offset };
  if (outcome) params.outcome = outcome;
  if (officerName) params.officer_name = officerName;
  const res = await axios.get(
    `${API_BASE}/interventions`,
    { headers: headers(), params }
  );
  return res.data;
};

// Update the outcome of an intervention
// Think of it like: officer comes back and writes what happened after the visit
export const updateIntervention = async (interventionId, updateData) => {
  const res = await axios.patch(
    `${API_BASE}/interventions/${interventionId}`,
    updateData,
    { headers: headers() }
  );
  return res.data;
};