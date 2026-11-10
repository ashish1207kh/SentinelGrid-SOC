const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

function getAuthHeader() {
  const token = localStorage.getItem('sentinel_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errMessage = `Error ${response.status}: ${response.statusText}`;
    try {
      const data = await response.json();
      if (data.detail) errMessage = data.detail;
    } catch {
      // ignore
    }
    throw new Error(errMessage);
  }

  // If response is a blob or stream
  const contentType = response.headers.get('content-type');
  if (contentType && (contentType.includes('text/csv') || contentType.includes('application/pdf'))) {
    return response.blob();
  }

  return response.json();
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getProfile: () => request('/auth/me'),

  // Dashboard
  getKPIs: () => request('/dashboard/kpis'),
  getTimeline: (timeframe = '24h') => request(`/dashboard/timeline?timeframe=${timeframe}`),
  getSeverityDistribution: () => request('/dashboard/severity-distribution'),
  getCategoryDistribution: () => request('/dashboard/category-distribution'),
  getRecentAlerts: (limit = 6) => request(`/dashboard/recent-alerts?limit=${limit}`),
  getHealth: () => request('/dashboard/health'),

  // Logs
  getLogs: (params = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.append('search', params.search);
    if (params.severity) q.append('severity', params.severity);
    if (params.source_ip) q.append('source_ip', params.source_ip);
    if (params.event_type) q.append('event_type', params.event_type);
    if (params.limit) q.append('limit', params.limit);
    if (params.offset) q.append('offset', params.offset);
    return request(`/logs?${q.toString()}`);
  },
  generateDemoLogs: (scenario_type = 'random', count = 3) =>
    request('/logs/generate-demo', { method: 'POST', body: JSON.stringify({ scenario_type, count }) }),
  getExportLogsCsvUrl: () => `${API_BASE}/logs/export-csv`,

  // Alerts
  getAlerts: (params = {}) => {
    const q = new URLSearchParams();
    if (params.severity) q.append('severity', params.severity);
    if (params.status) q.append('status', params.status);
    if (params.category) q.append('category', params.category);
    if (params.search) q.append('search', params.search);
    if (params.limit) q.append('limit', params.limit);
    return request(`/alerts?${q.toString()}`);
  },
  getAlertDetail: (alertId) => request(`/alerts/${alertId}`),
  updateAlertStatus: (alertId, status) =>
    request(`/alerts/${alertId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  promoteAlertToIncident: (alertId, assigned_analyst, additional_notes) =>
    request(`/alerts/${alertId}/promote-incident`, {
      method: 'POST',
      body: JSON.stringify({ assigned_analyst, additional_notes }),
    }),

  // AI Threat Detection
  getAIStats: () => request('/ai/stats'),
  getAnomalies: (params = {}) => {
    const q = new URLSearchParams();
    if (params.status) q.append('status', params.status);
    if (params.severity) q.append('severity', params.severity);
    return request(`/ai/anomalies?${q.toString()}`);
  },
  detectLiveAnomaly: (payload) => request('/ai/detect', { method: 'POST', body: JSON.stringify(payload) }),
  updateAIThreshold: (threshold) => request('/ai/threshold', { method: 'POST', body: JSON.stringify({ threshold }) }),

  // Attack Campaigns
  getCampaigns: () => request('/campaigns'),
  getCampaignDetail: (campaignId) => request(`/campaigns/${campaignId}`),

  // MITRE ATT&CK
  getMitreMatrix: () => request('/mitre/matrix'),
  getMitreMappings: () => request('/mitre/mappings'),

  // Assets
  getAssets: () => request('/assets'),
  getAssetDetail: (assetId) => request(`/assets/${assetId}`),
  quarantineAsset: (assetId) => request(`/assets/${assetId}/quarantine`, { method: 'POST' }),
  unquarantineAsset: (assetId) => request(`/assets/${assetId}/unquarantine`, { method: 'POST' }),

  // SOAR Automation
  getPlaybooks: () => request('/soar/playbooks'),
  runPlaybook: (playbookId, target_entity, triggered_by) =>
    request(`/soar/playbooks/${playbookId}/run`, {
      method: 'POST',
      body: JSON.stringify({ target_entity, triggered_by }),
    }),
  getExecutions: () => request('/soar/executions'),
  approveExecution: (executionId, analyst_name, comments) =>
    request(`/soar/executions/${executionId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ analyst_name, comments }),
    }),
  rejectExecution: (executionId, analyst_name, comments) =>
    request(`/soar/executions/${executionId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ analyst_name, comments }),
    }),

  // Incident Management
  getIncidents: (params = {}) => {
    const q = new URLSearchParams();
    if (params.status) q.append('status', params.status);
    if (params.severity) q.append('severity', params.severity);
    if (params.search) q.append('search', params.search);
    return request(`/incidents?${q.toString()}`);
  },
  getIncidentDetail: (incidentId) => request(`/incidents/${incidentId}`),
  createIncident: (payload) => request('/incidents', { method: 'POST', body: JSON.stringify(payload) }),
  updateIncident: (incidentId, payload) =>
    request(`/incidents/${incidentId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  addIncidentNote: (incidentId, author, note) =>
    request(`/incidents/${incidentId}/notes`, { method: 'POST', body: JSON.stringify({ author, note }) }),

  // CERT-In Reporting
  getCertInReports: () => request('/cert-in/reports'),
  getCertInReportDetail: (reportId) => request(`/cert-in/${reportId}`),
  generateCertInReport: (incident_id, incident_category, remarks) =>
    request('/cert-in/generate', { method: 'POST', body: JSON.stringify({ incident_id, incident_category, remarks }) }),
  getCertInJsonUrl: (reportId) => `${API_BASE}/cert-in/${reportId}/export-json`,
  getCertInPdfUrl: (reportId) => `${API_BASE}/cert-in/${reportId}/pdf`,

  // Audit Logs
  getAuditLogs: (action) => request(`/audit/logs${action ? `?action=${action}` : ''}`),
  verifyAuditIntegrity: () => request('/audit/verify', { method: 'POST' }),

  // Simulation & Demo
  runSingleAttack: (attackType) => request(`/simulation/single/${attackType}`, { method: 'POST' }),
  runAptStep: (stepNumber, speed) => request(`/simulation/apt-step/${stepNumber}`, { method: 'POST', body: JSON.stringify({ step: stepNumber, speed }) }),
  resetDemoData: () => request('/simulation/reset-demo', { method: 'POST' }),
};
