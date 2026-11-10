import React, { useState, useEffect } from 'react';
import {
  Zap,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  RefreshCw,
  Info,
  Server,
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import { useDemo } from '../context/DemoContext';

export default function SoarAutomation() {
  const { refreshKey, triggerDataRefresh } = useDemo();
  const [playbooks, setPlaybooks] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningId, setRunningId] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);

  const fetchSoarData = async () => {
    try {
      setLoading(true);
      const [pbData, execData] = await Promise.all([
        api.getPlaybooks(),
        api.getExecutions()
      ]);
      setPlaybooks(pbData);
      setExecutions(execData);
    } catch (err) {
      console.error('Error fetching SOAR data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSoarData();
  }, [refreshKey]);

  const handleRunPlaybook = async (pb) => {
    setRunningId(pb.playbook_id);
    try {
      await api.runPlaybook(pb.playbook_id, 'Simulated CNI Node & Account', 'Manual SOC Analyst Trigger');
      fetchSoarData();
      triggerDataRefresh();
    } catch (err) {
      alert(`Playbook execution failed: ${err.message}`);
    } finally {
      setRunningId(null);
    }
  };

  const handleApprove = async (execId) => {
    setActionInProgress(execId);
    try {
      await api.approveExecution(execId, 'Priya Sharma (SOC Analyst)', 'Authorized for CNI containment');
      fetchSoarData();
      triggerDataRefresh();
    } catch (err) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (execId) => {
    setActionInProgress(execId);
    try {
      await api.rejectExecution(execId, 'Priya Sharma (SOC Analyst)', 'Rejected due to operational continuity requirement');
      fetchSoarData();
      triggerDataRefresh();
    } catch (err) {
      alert(`Rejection failed: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold font-mono text-white tracking-wide flex items-center space-x-2">
            <span>SOAR AUTOMATION ENGINE</span>
            <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800 font-mono font-bold">
              ORCHESTRATION & PLAYBOOKS
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Automated defensive response playbooks with human-in-the-loop authorization gates for high-impact actions
          </p>
        </div>

        <button
          onClick={fetchSoarData}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-mono transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Mandatory Safety Notice */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-[#101827] to-slate-900 border border-cyan-500/30 text-xs flex items-start space-x-3">
        <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold font-mono text-slate-200 uppercase tracking-wide">
            SIMULATION SAFETY BOUNDARIES VERIFIED
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed font-sans">
            All containment, account restriction, and network boundary actions execute strictly in a sandbox simulation testbed. No physical grid switchgear, production active directory domains, or firewall interfaces are disrupted. High-impact containment actions require explicit analyst authorization.
          </p>
        </div>
      </div>

      {/* 4 Core Playbooks Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
          ACTIVE RESPONSE PLAYBOOKS
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {playbooks.map((pb) => (
            <div
              key={pb.playbook_id}
              className="p-5 rounded-2xl bg-[#101827] border border-cyan-500/20 hover:border-cyan-500/40 shadow-xl space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-cyan-400">{pb.playbook_id}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      pb.requires_approval
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}
                  >
                    {pb.requires_approval ? 'Approval Required' : 'Auto-Enacted'}
                  </span>
                </div>

                <h4 className="font-bold text-white text-sm font-sans">{pb.name}</h4>
                <p className="text-xs text-slate-400 leading-snug">{pb.description}</p>

                <div className="p-2.5 bg-[#080B12] rounded-lg border border-slate-800 text-[11px] font-mono space-y-1">
                  <span className="text-slate-500 block">Trigger Condition:</span>
                  <span className="text-slate-300">{pb.trigger_condition}</span>
                </div>

                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                    Orchestrated Actions:
                  </span>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {(pb.automated_actions || []).map((act, i) => (
                      <li key={i} className="flex items-start space-x-1.5 text-[11px]">
                        <span className="text-cyan-400 mt-0.5">›</span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] font-mono text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Playbook Active</span>
                </span>

                <button
                  onClick={() => handleRunPlaybook(pb)}
                  disabled={runningId === pb.playbook_id}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs transition shadow-[0_0_15px_rgba(0,218,218,0.3)] flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>{runningId === pb.playbook_id ? 'Executing...' : 'Run Playbook'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Execution History & Approval Queue */}
      <div className="p-5 rounded-2xl bg-[#101827] border border-cyan-500/20 shadow-xl space-y-4">
        <div>
          <h3 className="text-sm font-bold font-mono text-white">PLAYBOOK EXECUTION & APPROVAL HISTORY</h3>
          <p className="text-[11px] text-slate-400">
            Audit trail of automated and analyst-authorized containment actions
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                <th className="py-2.5 px-3">Execution ID</th>
                <th className="py-2.5 px-3">Playbook</th>
                <th className="py-2.5 px-3">Target Entity</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Approval Gate</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3 text-right">Analyst Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {executions.map((e) => (
                <tr key={e.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-3 font-bold text-cyan-400 whitespace-nowrap">{e.execution_id}</td>
                  <td className="py-3 px-3 max-w-xs truncate font-semibold text-slate-200">{e.playbook_name}</td>
                  <td className="py-3 px-3 text-slate-300 max-w-xs truncate">{e.target_entity}</td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        e.status === 'Completed'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : e.status === 'Pending Approval'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                          : 'bg-red-950 text-red-400 border border-red-800'
                      }`}
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                    {e.approval_status === 'Approved' ? (
                      <span className="text-emerald-400 font-bold">✓ Approved</span>
                    ) : e.approval_status === 'Pending' ? (
                      <span className="text-amber-400 font-bold">⏳ Awaiting Decision</span>
                    ) : e.approval_status === 'Rejected' ? (
                      <span className="text-red-400 font-bold">✗ Rejected</span>
                    ) : (
                      <span className="text-slate-500">Auto-Enacted</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-400 whitespace-nowrap">{e.timestamp}</td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    {e.status === 'Pending Approval' ? (
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleApprove(e.execution_id)}
                          disabled={actionInProgress === e.execution_id}
                          className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold transition flex items-center space-x-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleReject(e.execution_id)}
                          disabled={actionInProgress === e.execution_id}
                          className="px-2.5 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-[10px] font-bold transition flex items-center space-x-1"
                        >
                          <X className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500">
                        {e.approved_by || 'Completed'}
                      </span>
                    )}
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
