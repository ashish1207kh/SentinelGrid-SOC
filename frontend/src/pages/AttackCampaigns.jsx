import React, { useState, useEffect } from 'react';
import {
  Crosshair,
  ShieldAlert,
  ArrowRight,
  Clock,
  Layers,
  Activity,
  AlertTriangle,
  Server,
  Zap,
  CheckCircle2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { useDemo } from '../context/DemoContext';

export default function AttackCampaigns({ setActivePage }) {
  const { refreshKey } = useDemo();
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const data = await api.getCampaigns();
      setCampaigns(data);
      if (data.length > 0 && !selectedCampaign) {
        // Fetch detailed campaign 1
        const detail = await api.getCampaignDetail(data[0].campaign_id);
        setSelectedCampaign(detail);
      } else if (selectedCampaign) {
        const detail = await api.getCampaignDetail(selectedCampaign.campaign_id);
        setSelectedCampaign(detail);
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [refreshKey]);

  const handleSelectCampaign = async (cid) => {
    try {
      const detail = await api.getCampaignDetail(cid);
      setSelectedCampaign(detail);
    } catch (err) {
      console.error('Error fetching campaign detail:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold font-mono text-white tracking-wide flex items-center space-x-2">
            <span>ATTACK CAMPAIGN CORRELATION</span>
            <span className="text-[10px] bg-red-950 text-red-400 px-2 py-0.5 rounded border border-red-800 font-mono font-bold">
              MULTI-STAGE CLUSTERING
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Synthesize disconnected low-level alerts across Purdue OT/IT boundaries into cohesive adversary campaigns
          </p>
        </div>

        <button
          onClick={fetchCampaigns}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-mono transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Campaigns Selector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {campaigns.map((c) => {
          const isSelected = selectedCampaign?.campaign_id === c.campaign_id;
          return (
            <div
              key={c.campaign_id}
              onClick={() => handleSelectCampaign(c.campaign_id)}
              className={`p-4 rounded-xl cursor-pointer transition border text-xs font-mono relative overflow-hidden ${
                isSelected
                  ? 'bg-[#101827] border-cyan-400 shadow-[0_0_20px_rgba(0,218,218,0.2)]'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-cyan-400">{c.campaign_id}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    c.risk_score >= 85
                      ? 'bg-red-950 text-red-400 border border-red-800'
                      : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}
                >
                  RISK {c.risk_score}
                </span>
              </div>

              <div className="font-bold text-white text-xs truncate font-sans">{c.name}</div>
              <div className="text-[10px] text-slate-500 mt-0.5 truncate">{c.threat_actor}</div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                <span>Alerts: <strong className="text-slate-200">{c.alerts_count}</strong></span>
                <span>Devices: <strong className="text-slate-200">{c.affected_devices_count}</strong></span>
                <span className="text-emerald-400">{c.status}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Campaign Detailed Investigation */}
      {selectedCampaign && (
        <div className="space-y-6">
          {/* Campaign Overview Card */}
          <div className="p-6 rounded-2xl bg-[#101827] border border-cyan-500/30 shadow-xl space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded font-bold">
                    {selectedCampaign.campaign_id}
                  </span>
                  <span className="text-xs font-mono text-slate-400">Threat Actor: {selectedCampaign.threat_actor}</span>
                </div>
                <h2 className="text-lg font-bold font-mono text-white mt-1">
                  {selectedCampaign.name}
                </h2>
                <p className="text-xs text-slate-300 max-w-3xl mt-1 leading-relaxed">
                  {selectedCampaign.description}
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-right font-mono">
                  <span className="text-[10px] text-slate-400 block uppercase">Campaign Risk Score</span>
                  <span className="text-3xl font-extrabold text-red-400">
                    {selectedCampaign.risk_score}
                    <span className="text-xs text-slate-500 font-normal"> / 100</span>
                  </span>
                </div>

                <button
                  onClick={() => setActivePage('SOAR Automation')}
                  className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-mono text-xs font-bold transition shadow-[0_0_15px_rgba(239,68,68,0.4)] flex items-center space-x-1.5"
                >
                  <Zap className="w-4 h-4" />
                  <span>Enact Campaign Containment</span>
                </button>
              </div>
            </div>

            {/* Visual Attack Progression Diagram */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <span className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
                Visual Attack Progression Diagram
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 pt-2">
                {(selectedCampaign.stages || []).map((st, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-[#080B12] border border-cyan-500/20 relative flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                        <span className="text-cyan-400 font-bold">STAGE {st.stage}</span>
                        <span className={`px-1.5 py-0.2 rounded ${
                          st.status === 'Completed' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                        }`}>
                          {st.status}
                        </span>
                      </div>
                      <div className="font-bold text-white text-xs">{st.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">{st.technique}</div>
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono mt-2 pt-1 border-t border-slate-800/80">
                      {st.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chronological Correlated Alerts Table */}
          <div className="p-5 rounded-2xl bg-[#101827] border border-cyan-500/20 shadow-xl space-y-4">
            <div>
              <h3 className="text-sm font-bold font-mono text-white">CHRONOLOGICAL ATTACK CHAIN ALERTS</h3>
              <p className="text-[11px] text-slate-400">
                Discrete security events automatically correlated by threat clustering heuristics
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                    <th className="py-2.5 px-3">Alert ID</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Source → Destination</th>
                    <th className="py-2.5 px-3">Threat Category</th>
                    <th className="py-2.5 px-3">MITRE ID</th>
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">Observed Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(selectedCampaign.alerts || []).map((a) => (
                    <tr key={a.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-2.5 px-3 font-bold text-cyan-400">{a.alert_id}</td>
                      <td className="py-2.5 px-3 text-slate-400">{a.timestamp}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-slate-200">{a.source_ip}</span>
                        <span className="text-slate-500 mx-1">→</span>
                        <span className="text-slate-200">{a.destination_ip}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{a.threat_category}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px]">
                          {a.mitre_technique_id}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            a.severity === 'Critical'
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {a.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 max-w-sm text-slate-300 truncate" title={a.evidence}>
                        {a.evidence}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
