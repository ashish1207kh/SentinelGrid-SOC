import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Search,
  Filter,
  Download,
  Sparkles,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Database,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import { useDemo } from '../context/DemoContext';

export default function SecurityLogs() {
  const { refreshKey, triggerDataRefresh } = useDemo();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const limit = 25;

  // Filters
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('all');
  const [eventType, setEventType] = useState('all');
  const [sourceIp, setSourceIp] = useState('');

  // Selected Log for detail modal
  const [selectedLog, setSelectedLog] = useState(null);

  // Demo Generation state
  const [genLoading, setGenLoading] = useState(false);
  const [genScenario, setGenScenario] = useState('random');
  const [genCount, setGenCount] = useState(3);
  const [genMessage, setGenMessage] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getLogs({
        search,
        severity,
        event_type: eventType,
        source_ip: sourceIp,
        limit,
        offset: page * limit
      });
      setLogs(res.logs || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, severity, eventType, refreshKey]);

  const handleGenerate = async () => {
    setGenLoading(true);
    setGenMessage(null);
    try {
      const res = await api.generateDemoLogs(genScenario, genCount);
      setGenMessage(`Generated ${res.events_generated} event(s) & triggered ${res.alerts_triggered} alert(s)!`);
      fetchLogs();
      triggerDataRefresh();
    } catch (err) {
      alert(`Generation failed: ${err.message}`);
    } finally {
      setGenLoading(false);
    }
  };

  const handleExportCSV = () => {
    window.open(api.getExportLogsCsvUrl(), '_blank');
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold font-mono text-white tracking-wide flex items-center space-x-2">
            <span>SECURITY LOG MANAGEMENT</span>
            <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800 font-mono font-bold">
              {total} TOTAL EVENTS
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Unified telemetry aggregation across Windows, Linux, Firewalls, OT Modbus/DNP3, and Cloud IAM feeds
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-mono transition"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={fetchLogs}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-mono transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Generator Control Panel */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#101827] via-[#0D1524] to-[#101827] border border-cyan-500/30 shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              SYNTHETIC SECURITY EVENT GENERATOR
            </span>
          </div>

          {genMessage && (
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-0.5 rounded">
              ✓ {genMessage}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Scenario:</span>
            <select
              value={genScenario}
              onChange={(e) => setGenScenario(e.target.value)}
              className="bg-[#080B12] border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
            >
              <option value="random">Randomized Mixture</option>
              <option value="brute_force">Brute-Force Spray</option>
              <option value="suspicious_login">Foreign SSL-VPN Login</option>
              <option value="privilege_escalation">Token Impersonation (SYSTEM)</option>
              <option value="lateral_movement">RDP Lateral Pivot</option>
              <option value="data_exfiltration">High-Volume Database Egress</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Count:</span>
            <select
              value={genCount}
              onChange={(e) => setGenCount(parseInt(e.target.value))}
              className="bg-[#080B12] border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
            >
              <option value={1}>1 event</option>
              <option value={3}>3 events</option>
              <option value={5}>5 events</option>
              <option value={10}>10 events</option>
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={genLoading}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono text-xs transition shadow-[0_0_15px_rgba(0,218,218,0.3)] disabled:opacity-50 flex items-center space-x-1.5"
          >
            <Database className="w-3.5 h-3.5 fill-black" />
            <span>{genLoading ? 'Ingesting & Analyzing...' : 'Generate Demo Security Events'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#101827] border border-cyan-500/20 shadow-lg flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
            placeholder="Search description, event ID, IP, or user..."
            className="w-full bg-[#080B12] border border-slate-700 focus:border-cyan-400 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white font-mono focus:outline-none"
          />
        </div>

        {/* Severity */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-slate-400">Severity:</span>
          <select
            value={severity}
            onChange={(e) => {
              setSeverity(e.target.value);
              setPage(0);
            }}
            className="bg-[#080B12] border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
            <option value="Informational">Informational</option>
          </select>
        </div>

        {/* Event Type */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-slate-400">Source:</span>
          <select
            value={eventType}
            onChange={(e) => {
              setEventType(e.target.value);
              setPage(0);
            }}
            className="bg-[#080B12] border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none"
          >
            <option value="all">All Sources</option>
            <option value="Windows Auth">Windows Auth</option>
            <option value="Linux Auth">Linux Auth</option>
            <option value="Firewall">Firewall</option>
            <option value="Network Flow">Network Flow</option>
            <option value="Endpoint Activity">Endpoint Sysmon</option>
            <option value="Application API">Application API</option>
            <option value="Cloud Security">Cloud Security</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl bg-[#101827] border border-cyan-500/20 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                <th className="py-3 px-3">Event ID</th>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Source IP → Destination</th>
                <th className="py-3 px-3">User / Device</th>
                <th className="py-3 px-3">Event Type</th>
                <th className="py-3 px-3">Protocol / Port</th>
                <th className="py-3 px-3">Severity</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logs.length > 0 ? (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-bold text-cyan-400 whitespace-nowrap">
                      {l.event_id}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                      {l.timestamp}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="text-slate-200">{l.source_ip}</span>
                      <span className="text-slate-600 mx-1">→</span>
                      <span className="text-slate-200">{l.destination_ip}</span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="text-slate-300">{l.username}</div>
                      <div className="text-[10px] text-slate-500 font-sans">{l.device}</div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-300">
                      {l.event_type}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-400">
                      {l.protocol} : {l.port}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          l.severity === 'Critical'
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : l.severity === 'High'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : l.severity === 'Medium'
                            ? 'bg-blue-950 text-blue-400 border border-blue-800'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {l.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 text-slate-400 border border-slate-800">
                        {l.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(l)}
                        className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-mono transition inline-flex items-center space-x-1"
                      >
                        <Eye className="w-3 h-3 text-cyan-400" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No security logs found matching the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <div>
            Showing {logs.length > 0 ? page * limit + 1 : 0} to {Math.min((page + 1) * limit, total)} of {total} records
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1 rounded bg-slate-900 border border-slate-800 disabled:opacity-40 hover:bg-slate-800 text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>Page {page + 1} of {Math.ceil(total / limit) || 1}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * limit >= total}
              className="p-1 rounded bg-slate-900 border border-slate-800 disabled:opacity-40 hover:bg-slate-800 text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-2xl bg-[#080B12] border border-cyan-500/40 rounded-2xl shadow-2xl p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="text-cyan-400 font-bold text-sm">SECURITY EVENT PAYLOAD:</span>
                <span className="text-white font-bold">{selectedLog.event_id}</span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Structured Fields */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-[#101827] rounded-xl border border-slate-800 text-[11px]">
              <div><strong className="text-slate-500">Timestamp:</strong> <span className="text-slate-200">{selectedLog.timestamp}</span></div>
              <div><strong className="text-slate-500">Severity:</strong> <span className="text-cyan-400">{selectedLog.severity}</span></div>
              <div><strong className="text-slate-500">Source Host:</strong> <span className="text-slate-200">{selectedLog.source_ip}</span></div>
              <div><strong className="text-slate-500">Destination:</strong> <span className="text-slate-200">{selectedLog.destination_ip}:{selectedLog.port}</span></div>
              <div><strong className="text-slate-500">Device Tag:</strong> <span className="text-slate-200">{selectedLog.device}</span></div>
              <div><strong className="text-slate-500">User Identity:</strong> <span className="text-slate-200">{selectedLog.username}</span></div>
              <div><strong className="text-slate-500">Protocol:</strong> <span className="text-slate-200">{selectedLog.protocol}</span></div>
              <div><strong className="text-slate-500">Pipeline Status:</strong> <span className="text-emerald-400">{selectedLog.status}</span></div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Description:</span>
              <p className="p-2.5 rounded-lg bg-[#101827] border border-slate-800 text-slate-200 font-sans text-xs leading-relaxed">
                {selectedLog.description}
              </p>
            </div>

            {/* Raw JSON */}
            {selectedLog.raw_data && (
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Raw Ingestion Telemetry:</span>
                <pre className="p-3 rounded-lg bg-black/80 border border-slate-800 text-cyan-400/90 text-[10px] overflow-x-auto max-h-40">
                  {JSON.stringify(JSON.parse(selectedLog.raw_data), null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
