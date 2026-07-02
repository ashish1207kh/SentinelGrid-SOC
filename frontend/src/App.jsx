import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Shield, 
  AlertTriangle, 
  Terminal, 
  FileText, 
  Activity, 
  Network, 
  Clock, 
  Percent, 
  CheckCircle, 
  Play, 
  RefreshCw, 
  ThumbsUp, 
  ThumbsDown,
  Server,
  Zap,
  Globe,
  UserCheck,
  Cpu,
  Layers,
  Settings,
  Radio,
  Lock,
  ChevronRight
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

function App() {
  const [activeTab, setActiveTab] = useState('alerts');
  const [alerts, setAlerts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [certReport, setCertReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [simMessage, setSimMessage] = useState('');

  const fetchData = async () => {
    try {
      const resAlerts = await axios.get(`${API_BASE}/alerts`);
      const resCampaigns = await axios.get(`${API_BASE}/campaigns`);
      const resAudit = await axios.get(`${API_BASE}/audit-log`);
      
      setAlerts(resAlerts.data);
      setCampaigns(resCampaigns.data);
      setAuditLogs(resAudit.data);
      
      if (resCampaigns.data.length > 0) {
        const resCert = await axios.get(`${API_BASE}/report/cert-in`);
        setCertReport(resCert.data);
      } else {
        setCertReport(null);
      }
    } catch (err) {
      console.error("Error loading data from API:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleRunAssessment = async () => {
    setLoading(true);
    setSimMessage('Ingesting current log streams and running threat profiling...');
    try {
      const res = await axios.post(`${API_BASE}/simulate/run`);
      setSimMessage('Ingestion complete. Profiling engine update verified.');
      await fetchData();
    } catch (err) {
      setSimMessage('Threat assessment connection failed.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (actionId) => {
    try {
      await axios.post(`${API_BASE}/actions/${actionId}/approve`);
      fetchData();
    } catch (err) {
      alert("Failed to execute response: " + err.message);
    }
  };

  const handleDeny = async (actionId) => {
    try {
      await axios.post(`${API_BASE}/actions/${actionId}/deny`);
      fetchData();
    } catch (err) {
      alert("Failed to dismiss response: " + err.message);
    }
  };

  const activeCampaignsCount = campaigns.length;
  const isQuarantineActive = auditLogs.some(l => l.action_name === "Isolate Host Machine" && l.status === "Executed");

  return (
    <div className="dashboard-container">
      <header>
        <div className="logo-section">
          <Shield className="logo-icon" size={32} />
          <div>
            <h1 className="logo-text">SentinelGrid</h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>
              ENTERPRISE CYBER DEFENSE & SOAR SUITE
            </span>
          </div>
        </div>
        
        <div className="control-panel">
          {simMessage && (
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
              {simMessage}
            </span>
          )}
          <button className="btn-primary" onClick={handleRunAssessment} disabled={loading}>
            {loading ? <RefreshCw className="spin" size={16} /> : <Activity size={16} />}
            {loading ? 'Processing...' : 'Run Threat Assessment'}
          </button>
        </div>
      </header>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-info">
            <h3>Analyzed Streams</h3>
            <div className="metric-value">{alerts.length > 0 ? "9,084,120" : "0"}</div>
          </div>
          <div className="metric-icon" style={{ color: 'var(--accent-cyan)' }}>
            <Activity size={24} />
          </div>
        </div>

        <div className="metric-card critical">
          <div className="metric-info">
            <h3>Active Anomalies</h3>
            <div className="metric-value" style={{ color: 'var(--accent-red)' }}>{alerts.length}</div>
          </div>
          <div className="metric-icon" style={{ color: 'var(--accent-red)' }}>
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="metric-card critical">
          <div className="metric-info">
            <h3>Incident Campaigns</h3>
            <div className="metric-value" style={{ color: 'var(--accent-orange)' }}>{activeCampaignsCount}</div>
          </div>
          <div className="metric-icon" style={{ color: 'var(--accent-orange)' }}>
            <Network size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h3>Mean Time to Contain</h3>
            <div className="metric-value" style={{ color: 'var(--accent-green)' }}>14 sec</div>
          </div>
          <div className="metric-icon" style={{ color: 'var(--accent-green)' }}>
            <Clock size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h3>Defense Integrity</h3>
            <div className="metric-value" style={{ color: 'var(--accent-green)' }}>100%</div>
          </div>
          <div className="metric-icon" style={{ color: 'var(--accent-green)' }}>
            <Percent size={24} />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tabs-nav">
        <button 
          className={`tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          <Activity size={16} style={{ marginRight: '4px' }} />
          Alert Feed
        </button>
        <button 
          className={`tab-btn ${activeTab === 'campaigns' ? 'active' : ''}`}
          onClick={() => setActiveTab('campaigns')}
        >
          <Network size={16} style={{ marginRight: '4px' }} />
          Correlated Campaigns
        </button>
        <button 
          className={`tab-btn ${activeTab === 'audit-log' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit-log')}
        >
          <Terminal size={16} style={{ marginRight: '4px' }} />
          Playbooks & Orchestrations
        </button>
        <button 
          className={`tab-btn ${activeTab === 'devices' ? 'active' : ''}`}
          onClick={() => setActiveTab('devices')}
        >
          <Cpu size={16} style={{ marginRight: '4px' }} />
          Device Inventory
        </button>
        <button 
          className={`tab-btn ${activeTab === 'integrations' ? 'active' : ''}`}
          onClick={() => setActiveTab('integrations')}
        >
          <Layers size={16} style={{ marginRight: '4px' }} />
          Integrations
        </button>
        <button 
          className={`tab-btn ${activeTab === 'cert-in' ? 'active' : ''}`}
          onClick={() => setActiveTab('cert-in')}
        >
          <FileText size={16} style={{ marginRight: '4px' }} />
          Compliance Reporting
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'alerts' && (
        <div className="alerts-section">
          {alerts.length === 0 ? (
            <div className="campaign-container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <CheckCircle size={48} style={{ color: 'var(--accent-green)', marginBottom: '1.25rem' }} />
              <h3>System Secure. No Active Threat Detections.</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                Run the Threat Assessment to ingest external system audits.
              </p>
            </div>
          ) : (
            alerts.map((alert, idx) => (
              <div key={idx} className={`alert-card ${alert.anomaly_score >= 80 ? 'critical' : 'high'}`}>
                <div className="alert-meta" style={{ flex: 1 }}>
                  <div className="alert-header">
                    <span className="alert-user">{alert.username}</span>
                    <span className="alert-badge">{alert.event_type.toUpperCase()}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {new Date(alert.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="alert-details">
                    <div>
                      <strong>Origin IP:</strong> {alert.ip_address} ({alert.city}, {alert.country})
                    </div>
                    <div>
                      <strong>Target Resource:</strong> {alert.server}
                    </div>
                    <div>
                      <strong>Payload size:</strong> {alert.data_transferred_mb} MB
                    </div>
                    <div>
                      <strong>Credentials Level:</strong> {alert.privilege_level}
                    </div>
                  </div>
                  {alert.explanation && (
                    <div style={{
                      marginTop: '0.75rem',
                      padding: '0.65rem',
                      background: 'rgba(255, 159, 28, 0.03)',
                      borderLeft: '3px solid var(--accent-orange)',
                      fontSize: '0.85rem',
                      borderRadius: '0 4px 4px 0',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      <span style={{ color: 'var(--accent-orange)', fontWeight: 'bold' }}>ENGINE ANALYSIS: </span>
                      {alert.explanation}
                    </div>
                  )}
                </div>
                
                <div className="alert-score-gauge" style={{ marginLeft: '1.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>CONFIDENCE RATING</span>
                  <span className={`score-num ${alert.anomaly_score >= 80 ? 'high-risk' : ''}`}>{alert.anomaly_score}%</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div>
          {campaigns.length === 0 ? (
            <div className="campaign-container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <Network size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }} />
              <h3>No Correlated Campaigns Active</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                Run threat assessments to verify behavior correlation profiles.
              </p>
            </div>
          ) : (
            campaigns.map((camp, idx) => (
              <div key={idx} className="campaign-container">
                <div className="campaign-header">
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', color: 'var(--accent-red)' }}>
                      THREAT TRAJECTORY: {camp.campaign_id} (Target Identity: {camp.username})
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      Identified: {new Date(camp.start_time).toLocaleString()} | Severity: <span style={{color: 'var(--accent-red)', fontWeight: 'bold'}}>{camp.severity}</span>
                    </p>
                  </div>
                  <span className="status-indicator pending" style={{fontWeight: 'bold'}}>
                    {camp.status.toUpperCase()}
                  </span>
                </div>

                <div className="timeline-line">
                  {camp.stages.map((stage, sIdx) => (
                    <div key={sIdx} className="timeline-step active">
                      <div className="step-node">
                        {stage.stage_id === 1 && <Globe size={20} />}
                        {stage.stage_id === 2 && <Server size={20} />}
                        {stage.stage_id === 3 && <UserCheck size={20} />}
                        {stage.stage_id === 4 && <Zap size={20} />}
                      </div>
                      <div className="step-info">
                        <div className="step-title">Stage {stage.stage_id}: {stage.mitre_name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                          {stage.mitre_id}
                        </div>
                        <div className="step-desc" style={{ marginTop: '0.5rem', maxHeight: '60px', overflow: 'hidden' }}>
                          {stage.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'audit-log' && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Execution ID</th>
                <th>Threat Reference</th>
                <th>Method Class</th>
                <th>SOAR Playbook Name</th>
                <th>Quarantined Node</th>
                <th>Status</th>
                <th>Remediation Context</th>
                <th>Logged At</th>
                <th>Operation Gate</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No playbooks triggered. Threat engine currently in passive monitoring.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>EXE-{log.id}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{log.campaign_id}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{log.mitre_id}</td>
                    <td style={{ fontWeight: '600' }}>{log.action_name}</td>
                    <td>{log.target}</td>
                    <td>
                      <span className={`status-indicator ${log.status.toLowerCase().replace(' ', '')}`}>
                        {log.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '280px' }}>
                      {log.reason}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td>
                      {log.status === 'Pending Approval' ? (
                        <div className="action-buttons">
                          <button 
                            className="btn-action approve"
                            onClick={() => handleApprove(log.id)}
                          >
                            Execute Action
                          </button>
                          <button 
                            className="btn-action deny"
                            onClick={() => handleDeny(log.id)}
                          >
                            Dismiss
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--accent-green)', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
                          CONTAINED
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'devices' && (
        <div className="blast-radius-box">
          <div className="radius-card">
            <h2 className="radius-title">
              <Server size={20} /> Host Node Dependency & Blast Radius
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Shows affected system dependencies if target hosts or exfiltration endpoints are quarantined.
            </p>
            
            {isQuarantineActive ? (
              <div>
                <div style={{ marginBottom: '1.25rem', padding: '0.65rem', background: 'rgba(255, 56, 56, 0.1)', border: '1px solid var(--accent-red)', borderRadius: '4px', fontSize: '0.9rem' }}>
                  🔴 <strong>ACTIVE HOST ISOLATION:</strong> Node <code>external_exfil_ip</code> has been isolated.
                </div>
                <ul className="radius-list">
                  <li className="radius-item offline">
                    <AlertTriangle size={16} /> <strong>Primary Data Mirror Sync (OFFLINE)</strong> - Outbound exfiltration paths blocked.
                  </li>
                  <li className="radius-item offline">
                    <AlertTriangle size={16} /> <strong>Finance DB Sync Agent (OFFLINE)</strong> - Sync backup channel isolated.
                  </li>
                  <li className="radius-item online">
                    <CheckCircle size={16} /> <strong>Active Directory Controller (ONLINE)</strong> - Identity service fully active.
                  </li>
                  <li className="radius-item online">
                    <CheckCircle size={16} /> <strong>Internal Portal server (ONLINE)</strong> - Intranet operations normal.
                  </li>
                </ul>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '1.25rem', padding: '0.65rem', background: 'rgba(57, 255, 20, 0.1)', border: '1px solid var(--accent-green)', borderRadius: '4px', fontSize: '0.9rem' }}>
                  🟢 <strong>ALL HOSTS HEALTHY:</strong> No active quarantines.
                </div>
                <ul className="radius-list">
                  <li className="radius-item online">
                    <CheckCircle size={16} /> <strong>Primary Data Mirror Sync (ONLINE)</strong>
                  </li>
                  <li className="radius-item online">
                    <CheckCircle size={16} /> <strong>Finance DB Sync Agent (ONLINE)</strong>
                  </li>
                  <li className="radius-item online">
                    <CheckCircle size={16} /> <strong>Active Directory Controller (ONLINE)</strong>
                  </li>
                  <li className="radius-item online">
                    <CheckCircle size={16} /> <strong>Internal Portal server (ONLINE)</strong>
                  </li>
                </ul>
              </div>
            )}
          </div>
          
          <div className="radius-card">
            <h2 className="radius-title">
              <Cpu size={20} /> Host Node Register
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                <span style={{ flex: 1, fontFamily: 'var(--font-mono)' }}>Domain Controller (Host-01)</span>
                <span className="status-indicator executed">ACTIVE</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                <span style={{ flex: 1, fontFamily: 'var(--font-mono)' }}>Mail Server (Host-02)</span>
                <span className="status-indicator executed">ACTIVE</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                <span style={{ flex: 1, fontFamily: 'var(--font-mono)' }}>Git Server Core (Host-03)</span>
                <span className="status-indicator executed">ACTIVE</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                <span style={{ flex: 1, fontFamily: 'var(--font-mono)' }}>Primary Backup DB (Host-04)</span>
                <span className={`status-indicator ${isQuarantineActive ? 'denied' : 'executed'}`}>
                  {isQuarantineActive ? 'ISOLATED' : 'ACTIVE'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'integrations' && (
        <div className="blast-radius-box" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <div className="radius-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(0,240,255,0.1)', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--accent-cyan)' }}>
                <Lock size={20} />
              </div>
              <div>
                <h4>CrowdStrike Falcon Link</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Host-level telemetry feed</p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
              <span className="status-indicator executed">CONNECTED</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>API: v2.1.0</span>
            </div>
          </div>

          <div className="radius-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(57,255,20,0.1)', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--accent-green)' }}>
                <Globe size={20} />
              </div>
              <div>
                <h4>Cloudflare WAF Ingest</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Border web traffic firewall logs</p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
              <span className="status-indicator executed">CONNECTED</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>LOGS: Streaming</span>
            </div>
          </div>

          <div className="radius-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(255,159,28,0.1)', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--accent-orange)' }}>
                <Radio size={20} />
              </div>
              <div>
                <h4>AWS GuardDuty Connector</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>VPC flow logs and cloud audits</p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
              <span className="status-indicator executed">CONNECTED</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>POLLED: 2m ago</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cert-in' && (
        <div>
          {certReport ? (
            <div className="cert-report-preview">
              <div style={{ borderBottom: '2px solid rgba(255,255,255,0.2)', paddingBottom: '1rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                <h2 style={{ letterSpacing: '2px', fontFamily: 'var(--font-mono)' }}>INDIAN COMPUTER EMERGENCY RESPONSE TEAM (CERT-In)</h2>
                <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>INCIDENT NOTIFICATION REPORT (FORM I)</h3>
              </div>
              <p><strong>REPORT INCIDENT REF:</strong> {certReport.cert_in_ref}</p>
              <p><strong>REPORTING ORGANISATION:</strong> {certReport.reporting_organization}</p>
              <p><strong>DATE & TIME OF REPORTING:</strong> {certReport.date_of_reporting}</p>
              <p><strong>INCIDENT SEVERITY:</strong> <span style={{ color: 'var(--accent-red)', fontWeight: 'bold' }}>{certReport.severity_level}</span></p>
              
              <div style={{ margin: '1.5rem 0', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                <p><strong>SYSTEM COMPROMISED:</strong> {certReport.system_details.compromised_system}</p>
                <p><strong>ATTACKER IP SOURCE:</strong> {certReport.system_details.ip_addresses_involved[0]} ({certReport.system_details.geographical_location})</p>
                <p><strong>VICTIM USER PROFILE:</strong> {certReport.system_details.affected_users.join(', ')}</p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h4>INCIDENT TIMELINE PROGRESSION:</h4>
                <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                  <li><strong>02:15:00</strong> - Stage 1 (Initial Login / Access from Russia)</li>
                  <li><strong>03:10:00</strong> - Stage 3 (Privilege Escalation to Admin level)</li>
                  <li><strong>03:50:00</strong> - Stage 4 (Exfiltration of 4.5 GB to external endpoint)</li>
                </ul>
              </div>

              <div>
                <h4>REMEDIATION & CONTAINMENT PLAYBOOK INITIATED:</h4>
                <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                  {certReport.remediation_actions.map((act, index) => (
                    <li key={index}>{act}</li>
                  ))}
                </ul>
              </div>

              <button 
                className="btn-primary" 
                style={{ marginTop: '2rem', width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(certReport, null, 2))}`;
                  const downloadAnchor = document.createElement('a');
                  downloadAnchor.setAttribute("href", jsonString);
                  downloadAnchor.setAttribute("download", "cert_in_incident_report.json");
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                }}
              >
                <FileText size={16} /> Download Incident Report (JSON)
              </button>
            </div>
          ) : (
            <div className="campaign-container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <FileText size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }} />
              <h3>No Compliance Reports Pending</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                Reports compile automatically during active threat events. Run Threat Ingestion to populate.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
