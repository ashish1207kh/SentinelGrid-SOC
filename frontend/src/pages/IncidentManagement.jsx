import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  User,
  MessageSquare,
  RefreshCw,
  FolderPlus,
  AlertTriangle,
  ChevronRight,
  Send,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { useDemo } from '../context/DemoContext';

export default function IncidentManagement({ setActivePage }) {
  const { refreshKey, triggerDataRefresh } = useDemo();
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // New Note state
  const [newNote, setNewNote] = useState('');
  const [noteAuthor, setNoteAuthor] = useState('Priya Sharma');

  // Open New Incident Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSev, setNewSev] = useState('High');
  const [newAnalyst, setNewAnalyst] = useState('Priya Sharma');
  const [newAsset, setNewAsset] = useState('CNI-PWR-SCADA-01');

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const data = await api.getIncidents({ status: statusFilter, search });
      setIncidents(data);
      if (data.length > 0 && !selectedIncident) {
        const detail = await api.getIncidentDetail(data[0].incident_id);
        setSelectedIncident(detail);
      } else if (selectedIncident) {
        const detail = await api.getIncidentDetail(selectedIncident.incident_id);
        setSelectedIncident(detail);
      }
    } catch (err) {
      console.error('Error fetching incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [statusFilter, refreshKey]);

  const handleSelectIncident = async (incId) => {
    try {
      const detail = await api.getIncidentDetail(incId);
      setSelectedIncident(detail);
    } catch (err) {
      console.error('Error loading incident details:', err);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!selectedIncident) return;
    try {
      await api.updateIncident(selectedIncident.incident_id, { status: newStatus });
      fetchIncidents();
      triggerDataRefresh();
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const handleSeverityUpdate = async (newSeverity) => {
    if (!selectedIncident) return;
    try {
      await api.updateIncident(selectedIncident.incident_id, { severity: newSeverity });
      fetchIncidents();
      triggerDataRefresh();
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedIncident) return;
    try {
      await api.addIncidentNote(selectedIncident.incident_id, noteAuthor, newNote);
      setNewNote('');
      const updated = await api.getIncidentDetail(selectedIncident.incident_id);
      setSelectedIncident(updated);
      triggerDataRefresh();
    } catch (err) {
      alert(`Error adding note: ${err.message}`);
    }
  };

  const handleCreateIncident = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createIncident({
        title: newTitle,
        description: newDesc,
        severity: newSev,
        assigned_analyst: newAnalyst,
        affected_assets: [newAsset],
        mitre_techniques: ['T1078', 'T1021']
      });
      setIsCreateOpen(false);
      setNewTitle('');
      setNewDesc('');
      fetchIncidents();
      triggerDataRefresh();
      alert(`Incident ${res.incident_id} created successfully!`);
    } catch (err) {
      alert(`Create incident failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold font-mono text-white tracking-wide flex items-center space-x-2">
            <span>INCIDENT MANAGEMENT & LIFECYCLE</span>
            <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800 font-mono font-bold">
              {incidents.length} RECORDS
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Case tracking, containment workflows, timeline chronological forensics, and regulatory escalation
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs transition shadow-[0_0_15px_rgba(0,218,218,0.3)]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Open New Incident</span>
          </button>

          <button
            onClick={fetchIncidents}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-mono transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Incident List on left (1 col), Detail View on right (2 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Incidents List */}
        <div className="p-4 rounded-2xl bg-[#101827] border border-cyan-500/20 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase">
              ACTIVE INCIDENTS QUEUE
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#080B12] border border-slate-700 text-slate-300 rounded px-2 py-0.5 text-[10px] font-mono focus:outline-none"
            >
              <option value="all">All</option>
              <option value="New">New</option>
              <option value="Investigating">Investigating</option>
              <option value="Contained">Contained</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
            {incidents.map((inc) => {
              const isSelected = selectedIncident?.incident_id === inc.incident_id;
              return (
                <div
                  key={inc.incident_id}
                  onClick={() => handleSelectIncident(inc.incident_id)}
                  className={`p-3 rounded-xl cursor-pointer transition border text-xs font-mono ${
                    isSelected
                      ? 'bg-[#080B12] border-cyan-400 shadow-[0_0_15px_rgba(0,218,218,0.2)]'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-cyan-400">{inc.incident_id}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        inc.severity === 'Critical'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : inc.severity === 'High'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-blue-950 text-blue-400 border border-blue-800'
                      }`}
                    >
                      {inc.severity}
                    </span>
                  </div>

                  <div className="font-bold text-white text-xs truncate font-sans">{inc.title}</div>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{inc.assigned_analyst}</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-slate-300">
                      {inc.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Incident Full Detail View */}
        {selectedIncident ? (
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#101827] border border-cyan-500/30 shadow-xl space-y-5">
            {/* Detail Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded font-bold">
                    {selectedIncident.incident_id}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Opened: {selectedIncident.created_at}
                  </span>
                </div>
                <h2 className="text-base font-bold font-mono text-white mt-1">
                  {selectedIncident.title}
                </h2>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl font-sans">
                  {selectedIncident.description}
                </p>
              </div>

              {/* Status & Severity Controls */}
              <div className="flex flex-col items-end space-y-2">
                <div className="flex items-center space-x-2 text-xs font-mono">
                  <span className="text-slate-400">Status:</span>
                  <select
                    value={selectedIncident.status}
                    onChange={(e) => handleStatusUpdate(e.target.value)}
                    className="bg-[#080B12] border border-cyan-500/50 rounded-lg px-2.5 py-1 text-cyan-300 font-bold focus:outline-none"
                  >
                    <option value="New">New</option>
                    <option value="Investigating">Investigating</option>
                    <option value="Contained">Contained</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2 text-xs font-mono">
                  <span className="text-slate-400">Severity:</span>
                  <select
                    value={selectedIncident.severity}
                    onChange={(e) => handleSeverityUpdate(e.target.value)}
                    className="bg-[#080B12] border border-slate-700 rounded-lg px-2 py-0.5 text-slate-300 focus:outline-none"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Incident Metadata Attributes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-[#080B12] rounded-xl border border-slate-800 text-xs font-mono">
              <div>
                <span className="text-slate-500 text-[10px] block uppercase">Assigned Analyst</span>
                <span className="text-slate-200 font-bold">{selectedIncident.assigned_analyst}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block uppercase">Affected Assets</span>
                <span className="text-cyan-400">
                  {selectedIncident.affected_assets?.join(', ') || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block uppercase">MITRE Techniques</span>
                <span className="text-amber-400">
                  {selectedIncident.mitre_techniques?.join(', ') || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block uppercase">Related Alerts</span>
                <span className="text-slate-300">
                  {selectedIncident.related_alerts?.join(', ') || 'None'}
                </span>
              </div>
            </div>

            {/* Chronological Incident Timeline */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block">
                Investigation & Containment Timeline
              </span>

              <div className="space-y-2 max-h-48 overflow-y-auto p-3 bg-[#080B12] rounded-xl border border-slate-800 font-mono text-xs">
                {(selectedIncident.timeline_events || []).map((ev, i) => (
                  <div key={i} className="flex items-start space-x-2 text-slate-300 text-[11px] pb-1.5 border-b border-slate-900 last:border-0">
                    <span className="text-slate-500 shrink-0">[{ev.time}]</span>
                    <span className="text-cyan-400 font-bold shrink-0">{ev.author}:</span>
                    <span className="text-slate-200 font-sans">{ev.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Analyst Investigation Notes Thread */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block">
                Analyst Investigation Notes ({(selectedIncident.notes || []).length})
              </span>

              <div className="space-y-2 max-h-36 overflow-y-auto p-3 bg-[#080B12] rounded-xl border border-slate-800 text-xs">
                {(selectedIncident.notes || []).length > 0 ? (
                  selectedIncident.notes.map((n, i) => (
                    <div key={i} className="p-2 rounded bg-slate-900/60 border border-slate-800/80 space-y-0.5">
                      <div className="flex justify-between text-[10px] font-mono text-slate-500">
                        <span className="text-cyan-400">{n.author}</span>
                        <span>{n.time}</span>
                      </div>
                      <p className="text-slate-200 font-sans text-xs">{n.note}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-500 text-xs py-2">No notes recorded yet.</div>
                )}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="flex space-x-2 pt-1">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Append timestamped investigation finding or containment evidence..."
                  className="flex-1 bg-[#080B12] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs transition flex items-center space-x-1"
                >
                  <Send className="w-3.5 h-3.5 fill-black" />
                  <span>Post Note</span>
                </button>
              </form>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setActivePage('CERT-In Reporting')}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
              >
                <span>Draft CERT-In Compliance Report</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleStatusUpdate('Closed')}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 text-xs font-mono transition"
              >
                Close Incident Case
              </button>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 p-12 rounded-2xl bg-[#101827] border border-cyan-500/20 shadow-xl flex flex-col items-center justify-center text-center text-slate-500">
            <ShieldAlert className="w-12 h-12 text-slate-600 mb-2" />
            <p className="text-sm font-mono">Select an incident from the queue to view full investigation records.</p>
          </div>
        )}
      </div>

      {/* Create New Incident Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-lg bg-[#080B12] border border-cyan-500/40 rounded-2xl shadow-2xl p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <FolderPlus className="w-4 h-4 text-cyan-400" />
                <span>OPEN NEW CNI CYBER SECURITY INCIDENT</span>
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-3">
              <div>
                <label className="block text-slate-400 uppercase text-[10px] mb-1">Incident Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Substation Breaker Unscheduled Modbus Write Spike"
                  className="w-full bg-[#101827] border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase text-[10px] mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe observed adversary indicators, target Purdue zone, and operational impact..."
                  className="w-full bg-[#101827] border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 uppercase text-[10px] mb-1">Severity</label>
                  <select
                    value={newSev}
                    onChange={(e) => setNewSev(e.target.value)}
                    className="w-full bg-[#101827] border border-slate-700 rounded-lg p-2 text-white focus:outline-none"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase text-[10px] mb-1">Affected Asset</label>
                  <select
                    value={newAsset}
                    onChange={(e) => setNewAsset(e.target.value)}
                    className="w-full bg-[#101827] border border-slate-700 rounded-lg p-2 text-white focus:outline-none"
                  >
                    <option value="CNI-PWR-SCADA-01">Power Grid SCADA HMI</option>
                    <option value="CNI-SUB-RTU-12">Substation 400kV RTU</option>
                    <option value="CNI-DC-CORE-01">Active Directory DC01</option>
                    <option value="CNI-DATA-VAULT">Historian Database</option>
                    <option value="CNI-ENG-WS-45">Grid Engineering Station 45</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 uppercase text-[10px] mb-1">Assigned Analyst</label>
                <input
                  type="text"
                  value={newAnalyst}
                  onChange={(e) => setNewAnalyst(e.target.value)}
                  className="w-full bg-[#101827] border border-slate-700 rounded-lg p-2 text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-[0_0_15px_rgba(0,218,218,0.3)]"
                >
                  Open Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
