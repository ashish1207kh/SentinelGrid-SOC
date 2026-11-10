import React, { useState, useEffect } from 'react';
import {
  Grid,
  Shield,
  Search,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Info,
  RefreshCw,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { useDemo } from '../context/DemoContext';

export default function MitreAttack({ setActivePage }) {
  const { refreshKey } = useDemo();
  const [matrixData, setMatrixData] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedTech, setSelectedTech] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMitreData = async () => {
    try {
      setLoading(true);
      const [matRes, mapRes] = await Promise.all([
        api.getMitreMatrix(),
        api.getMitreMappings()
      ]);
      setMatrixData(matRes.matrix || []);
      setMappings(mapRes || []);
    } catch (err) {
      console.error('Error fetching MITRE:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMitreData();
  }, [refreshKey]);

  const filteredMappings = mappings.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.technique_id.toLowerCase().includes(q) ||
      m.technique_name.toLowerCase().includes(q) ||
      m.alert_title.toLowerCase().includes(q) ||
      m.tactic.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold font-mono text-white tracking-wide flex items-center space-x-2">
            <span>MITRE ATT&CK® DEFENSIVE MATRIX</span>
            <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800 font-mono font-bold">
              ENTERPRISE & ICS
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Mapping simulated adversary behaviors to official tactics, techniques, and recommended defensive mitigations
          </p>
        </div>

        <button
          onClick={fetchMitreData}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-mono transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Notice Banner */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center space-x-2">
        <Info className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>
          DEFENSIVE CLASSIFICATION NOTICE: Mappings classify synthetic and simulated security events within SentinelGrid. Technique IDs reference the official MITRE ATT&CK knowledge base.
        </span>
      </div>

      {/* Visual MITRE Matrix Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
          TACTICAL COVERAGE MATRIX
        </h3>

        <div className="overflow-x-auto pb-2">
          <div className="flex space-x-3 min-w-[1100px]">
            {matrixData.map((tac) => (
              <div
                key={tac.tactic_id}
                className="flex-1 min-w-[150px] bg-[#101827] border border-cyan-500/20 rounded-xl p-3 flex flex-col space-y-2 shadow-lg"
              >
                <div className="pb-2 border-b border-slate-800">
                  <span className="text-[10px] font-mono text-cyan-400 block font-bold">{tac.tactic_id}</span>
                  <span className="text-xs font-bold text-slate-200 font-mono leading-tight">{tac.tactic_name}</span>
                </div>

                <div className="space-y-2">
                  {tac.techniques.map((tech) => (
                    <div
                      key={tech.technique_id}
                      onClick={() => setSelectedTech(tech)}
                      className={`p-2 rounded-lg border transition cursor-pointer text-xs font-mono ${
                        tech.active_alerts_count > 0
                          ? 'bg-red-950/40 border-red-500/40 hover:border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-cyan-300">{tech.technique_id}</span>
                        {tech.active_alerts_count > 0 && (
                          <span className="w-4 h-4 rounded-full bg-red-500 text-black flex items-center justify-center font-bold text-[9px] animate-pulse">
                            {tech.active_alerts_count}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-200 mt-0.5 truncate" title={tech.technique_name}>
                        {tech.technique_name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Technique Modal Details if clicked */}
      {selectedTech && (
        <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="text-xs bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800 font-bold">
                {selectedTech.technique_id}
              </span>
              <h3 className="text-sm font-bold text-white">{selectedTech.technique_name}</h3>
            </div>
            <button
              onClick={() => setSelectedTech(null)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
            <div className="p-3 bg-[#101827] rounded-lg border border-slate-800 space-y-1">
              <span className="text-[10px] text-cyan-400 font-bold block uppercase">Technique Description:</span>
              <p className="text-[11px] leading-relaxed font-sans">{selectedTech.description}</p>
            </div>

            <div className="p-3 bg-[#101827] rounded-lg border border-slate-800 space-y-1">
              <span className="text-[10px] text-emerald-400 font-bold block uppercase">Defensive Mitigation:</span>
              <p className="text-[11px] leading-relaxed font-sans">{selectedTech.mitigation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Mapped Detections & Evidence Table */}
      <div className="p-5 rounded-2xl bg-[#101827] border border-cyan-500/20 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold font-mono text-white">MAPPED DETECTIONS & DEFENSIVE MITIGATIONS</h3>
            <p className="text-[11px] text-slate-400">
              Correlated security alerts linked to technique IDs with defensive countermeasures
            </p>
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search mappings..."
              className="w-full bg-[#080B12] border border-slate-700 rounded-lg pl-8 pr-2.5 py-1 text-xs text-white font-mono focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                <th className="py-2.5 px-3">Technique ID</th>
                <th className="py-2.5 px-3">Technique Name</th>
                <th className="py-2.5 px-3">Tactic</th>
                <th className="py-2.5 px-3">Associated Alert</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Observed Evidence</th>
                <th className="py-2.5 px-3">Recommended Mitigation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredMappings.map((m, i) => (
                <tr key={i} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 px-3 font-bold text-cyan-400">{m.technique_id}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-200">{m.technique_name}</td>
                  <td className="py-2.5 px-3 text-slate-400">{m.tactic}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-slate-300 font-bold">{m.alert_id}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.severity === 'Critical'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {m.severity}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 max-w-xs text-slate-300 truncate" title={m.evidence}>
                    {m.evidence}
                  </td>
                  <td className="py-2.5 px-3 max-w-xs text-emerald-400/90 truncate" title={m.recommended_mitigation}>
                    {m.recommended_mitigation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
