import React, { useState, useEffect } from 'react';
import {
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Link2,
  ShieldAlert,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { useDemo } from '../context/DemoContext';

export default function AuditLogs() {
  const { refreshKey } = useDemo();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs(actionFilter === 'all' ? null : actionFilter);
      setLogs(data);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [actionFilter, refreshKey]);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await api.verifyAuditIntegrity();
      setVerificationResult(res);
      fetchAuditLogs();
    } catch (err) {
      alert(`Integrity verification check failed: ${err.message}`);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold font-mono text-white tracking-wide flex items-center space-x-2">
            <span>TAMPER-EVIDENT AUDIT TRAIL</span>
            <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800 font-mono font-bold">
              SHA-256 HASH CHAINING
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Cryptographic lineage preservation for SOC analyst investigations, approvals, and containment actions
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs transition shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
          >
            <ShieldCheck className="w-3.5 h-3.5 fill-black" />
            <span>{verifying ? 'Verifying Block Hashes...' : 'Verify Audit Integrity'}</span>
          </button>

          <button
            onClick={fetchAuditLogs}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-mono transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Verification Result Banner */}
      {verificationResult && (
        <div
          className={`p-4 rounded-xl border flex items-start space-x-3 text-xs font-mono transition-all duration-300 ${
            verificationResult.is_valid
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
              : 'bg-red-950/60 border-red-500/60 text-red-200'
          }`}
        >
          {verificationResult.is_valid ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          )}

          <div className="space-y-1">
            <div className="font-bold text-sm">
              {verificationResult.is_valid ? 'CRYPTOGRAPHIC INTEGRITY VERIFIED' : 'INTEGRITY ANOMALY DETECTED'}
            </div>
            <p className="leading-relaxed">{verificationResult.message}</p>
            <div className="text-[11px] text-slate-400 pt-1">
              Verified <strong>{verificationResult.verified_records}</strong> of <strong>{verificationResult.total_records}</strong> chained blocks from genesis hash.
            </div>
          </div>
        </div>
      )}

      {/* Demonstration Disclaimer Banner */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start space-x-2 font-mono">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <span>
          PROTOTYPE LEDGER NOTICE: This module demonstrates sequential cryptographic SHA-256 hash chaining to detect post-event tampering. It is designed for demonstration and forensic traceability rather than a certified immutable hardware storage system.
        </span>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-[#101827] border border-cyan-500/20 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-slate-400">Action Filter:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-[#080B12] border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none"
          >
            <option value="all">All Actions</option>
            <option value="USER_LOGIN">User Logins</option>
            <option value="ALERT_">Alert Actions</option>
            <option value="SOAR_">SOAR Executions & Approvals</option>
            <option value="INCIDENT_">Incident Updates</option>
            <option value="CERT_IN_">Compliance Reports</option>
            <option value="ASSET_">Asset Isolations</option>
          </select>
        </div>

        <div className="text-xs font-mono text-cyan-400">
          Chained Records: <strong>{logs.length}</strong>
        </div>
      </div>

      {/* Chained Audit Table */}
      <div className="rounded-2xl bg-[#101827] border border-cyan-500/20 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                <th className="py-3 px-3">Audit ID</th>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">User Email</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Entity Target</th>
                <th className="py-3 px-3">Event Details</th>
                <th className="py-3 px-3">SHA-256 Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-2.5 px-3 font-bold text-cyan-400 whitespace-nowrap">
                    {l.audit_id}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">{l.timestamp}</td>
                  <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">{l.user_email}</td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-900 border border-slate-700 text-slate-200">
                      {l.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-cyan-300 font-bold whitespace-nowrap">{l.entity}</td>
                  <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate" title={l.event_details}>
                    {l.event_details}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[10px]">
                    <div className="flex items-center space-x-1">
                      <Link2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="text-emerald-400 truncate max-w-[120px]" title={l.integrity_hash}>
                        {l.integrity_hash.slice(0, 16)}...
                      </span>
                    </div>
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
