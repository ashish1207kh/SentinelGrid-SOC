import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  Eye,
  FolderPlus,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  RefreshCw,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { useDemo } from '../context/DemoContext';
import XAIModal from '../components/XAIModal';

export default function SecurityAlerts({ setActivePage }) {
  const { refreshKey, triggerDataRefresh } = useDemo();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [promoteModalAlert, setPromoteModalAlert] = useState(null);
  const [promoteNotes, setPromoteNotes] = useState('');
  const [assignedAnalyst, setAssignedAnalyst] = useState('Priya Sharma');

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.getAlerts({
        severity: severityFilter,
        status: statusFilter,
        search
      });
      setAlerts(res.alerts || []);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [severityFilter, statusFilter, refreshKey]);

  const handleStatusChange = async (alertId, newStatus) => {
    try {
      await api.updateAlertStatus(alertId, newStatus);
      fetchAlerts();
      triggerDataRefresh();
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handlePromoteConfirm = async () => {
    if (!promoteModalAlert) return;
    try {
      await api.promoteAlertToIncident(
        promoteModalAlert.alert_id,
        assignedAnalyst,
        promoteNotes
      );
      setPromoteModalAlert(null);
      setPromoteNotes('');
      fetchAlerts();
      triggerDataRefresh();
      alert(`Alert ${promoteModalAlert.alert_id} successfully promoted to Incident!`);
      setActivePage('Incident Management');
    } catch (err) {
      alert(`Failed to promote: ${err.message}`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold font-mono text-white tracking-wide flex items-center space-x-2">
            <span>SECURITY ALERTS REPOSITORY</span>
            <span className="text-[10px] bg-red-950 text-red-400 px-2 py-0.5 rounded border border-red-800 font-mono font-bold">
              {alerts.length} ALERTS
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Triage, investigate behavioral anomaly evidence, and escalate confirmed threats to Incident Response
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-mono transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#101827] border border-cyan-500/20 shadow-lg flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchAlerts()}
            placeholder="Search alerts by IP, user, title, or MITRE ID (e.g. T1110)..."
            className="w-full bg-[#080B12] border border-slate-700 focus:border-cyan-400 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white font-mono focus:outline-none"
          />
        </div>

        {/* Severity Tabs */}
        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          {['all', 'Critical', 'High', 'Medium', 'Low'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded text-[11px] capitalize transition font-bold ${
                severityFilter.toLowerCase() === sev.toLowerCase()
                  ? 'bg-cyan-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#080B12] border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
          >
            <option value="all">All Statuses</option>
            <option value="New">New</option>
            <option value="Triaged">Triaged</option>
            <option value="Investigating">Investigating</option>
            <option value="Contained">Contained</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="rounded-2xl bg-[#101827] border border-cyan-500/20 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                <th className="py-3 px-4">Alert ID</th>
                <th className="py-3 px-4">Title & Context</th>
                <th className="py-3 px-4">Origin → Destination</th>
                <th className="py-3 px-4">MITRE ATT&CK</th>
                <th className="py-3 px-4">Anomaly Score</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {alerts.length > 0 ? (
                alerts.map((alt) => (
                  <tr key={alt.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-bold text-cyan-400 whitespace-nowrap">
                      {alt.alert_id}
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-slate-200 truncate">{alt.title}</div>
                      <div className="text-[10px] text-slate-500 truncate font-sans">
                        Target Asset: {alt.asset_name}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-slate-300">
                        {alt.source_ip} <span className="text-slate-600">→</span> {alt.destination_ip}
                      </div>
                      <div className="text-[10px] text-slate-500">User: {alt.username}</div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-bold">
                        {alt.mitre_technique_id}
                      </span>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">{alt.mitre_tactic}</div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-cyan-400">{alt.anomaly_score}</span>
                        <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-400"
                            style={{ width: `${Math.min(100, alt.anomaly_score * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          alt.severity === 'Critical'
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : alt.severity === 'High'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-blue-950 text-blue-400 border border-blue-800'
                        }`}
                      >
                        {alt.severity}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <select
                        value={alt.detection_status}
                        onChange={(e) => handleStatusChange(alt.alert_id, e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-300 rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:border-cyan-400"
                      >
                        <option value="New">New</option>
                        <option value="Triaged">Triaged</option>
                        <option value="Investigating">Investigating</option>
                        <option value="Contained">Contained</option>
                        <option value="Resolved">Resolved</option>
                        <option value="False Positive">False Positive</option>
                      </select>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedAlert(alt)}
                          className="px-2 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold transition flex items-center space-x-1"
                          title="Open Explainable AI Justification"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Investigate</span>
                        </button>

                        <button
                          onClick={() => setPromoteModalAlert(alt)}
                          className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
                          title="Promote to Incident"
                        >
                          <FolderPlus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No matching alerts found for selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* XAI Modal */}
      {selectedAlert && (
        <XAIModal
          alertItem={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onPromote={() => {
            setPromoteModalAlert(selectedAlert);
            setSelectedAlert(null);
          }}
          onTriggerSoar={() => {
            setSelectedAlert(null);
            setActivePage('SOAR Automation');
          }}
        />
      )}

      {/* Promote to Incident Dialog */}
      {promoteModalAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#080B12] border border-cyan-500/40 rounded-2xl shadow-2xl p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <FolderPlus className="w-4 h-4 text-cyan-400" />
                <span>PROMOTE ALERT TO INCIDENT</span>
              </h3>
              <button
                onClick={() => setPromoteModalAlert(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
              <div><strong className="text-slate-400">Alert:</strong> <span className="text-cyan-400">{promoteModalAlert.alert_id}</span></div>
              <div className="text-white truncate">{promoteModalAlert.title}</div>
              <div className="text-slate-400">Severity: <span className="text-red-400">{promoteModalAlert.severity}</span></div>
            </div>

            <div>
              <label className="block text-slate-400 uppercase text-[10px] mb-1">Assigned Analyst</label>
              <input
                type="text"
                value={assignedAnalyst}
                onChange={(e) => setAssignedAnalyst(e.target.value)}
                className="w-full bg-[#101827] border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 uppercase text-[10px] mb-1">Initial Triage Notes</label>
              <textarea
                rows={3}
                value={promoteNotes}
                onChange={(e) => setPromoteNotes(e.target.value)}
                placeholder="Observed anomalous outbound connection pattern; promoting to Tier 2 incident investigation..."
                className="w-full bg-[#101827] border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setPromoteModalAlert(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handlePromoteConfirm}
                className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-[0_0_15px_rgba(0,218,218,0.3)]"
              >
                Create Incident Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
