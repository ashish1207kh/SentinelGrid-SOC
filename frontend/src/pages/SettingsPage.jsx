import React, { useState } from 'react';
import {
  Settings,
  Sliders,
  Shield,
  RotateCcw,
  CheckCircle2,
  Users,
  Server,
  Key,
  Bell,
  Cpu,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { useDemo } from '../context/DemoContext';

export default function SettingsPage() {
  const { triggerDataRefresh } = useDemo();
  const [threshold, setThreshold] = useState(0.62);
  const [thresholdSaved, setThresholdSaved] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState(null);

  const handleSaveThreshold = async () => {
    try {
      await api.updateAIThreshold(threshold);
      setThresholdSaved(true);
      setTimeout(() => setThresholdSaved(false), 3000);
      triggerDataRefresh();
    } catch (err) {
      alert(`Threshold update failed: ${err.message}`);
    }
  };

  const handleResetDatabase = async () => {
    if (!window.confirm('Restore factory demo seed data? This will reset all simulated alerts and incidents to their initial baseline.')) {
      return;
    }
    setResetting(true);
    setResetMessage(null);
    try {
      const res = await api.resetDemoData();
      setResetMessage(res.message);
      triggerDataRefresh();
    } catch (err) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold font-mono text-white tracking-wide flex items-center space-x-2">
            <span>PLATFORM CONFIGURATION & SETTINGS</span>
            <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800 font-mono font-bold">
              SYS-CONFIG
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Tune AI sensitivity parameters, review RBAC role boundaries, and manage demo simulation baselines
          </p>
        </div>
      </div>

      {resetMessage && (
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs font-mono text-emerald-300 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{resetMessage}</span>
        </div>
      )}

      {/* Grid of Settings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: AI Anomaly Sensitivity */}
        <div className="p-5 rounded-2xl bg-[#101827] border border-cyan-500/20 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold font-mono text-white">AI DETECTION SENSITIVITY</h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Adjust the geometric decision boundary threshold for the Isolation Forest ensemble. Lower values increase alert sensitivity; higher values reduce false positives.
          </p>

          <div className="space-y-2 p-3 bg-[#080B12] rounded-xl border border-slate-800 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Anomaly Trigger Threshold:</span>
              <span className="text-cyan-400 font-extrabold text-sm">{threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.45"
              max="0.85"
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0.45 (Aggressive Triage)</span>
              <span>0.62 (Default CNI)</span>
              <span>0.85 (Critical Only)</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {thresholdSaved ? (
              <span className="text-xs font-mono text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Threshold Saved</span>
              </span>
            ) : <span />}

            <button
              onClick={handleSaveThreshold}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs transition shadow-[0_0_15px_rgba(0,218,218,0.3)]"
            >
              Apply Sensitivity
            </button>
          </div>
        </div>

        {/* Card 2: Demo Environment Baseline Reset */}
        <div className="p-5 rounded-2xl bg-[#101827] border border-cyan-500/20 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
            <RotateCcw className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold font-mono text-white">DEMO DATASET RECOVERY</h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Restore the pristine initial demonstration seed data. Resets all security logs, alerts, attack campaigns, incidents, SOAR executions, and audit records to factory demonstration state.
          </p>

          <div className="p-3 bg-[#080B12] rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
            <div>• Re-seeds 8 Purdue Model CNI assets</div>
            <div>• Re-seeds 70+ baseline & attack telemetry logs</div>
            <div>• Restores 4 attack campaigns & 4 SOAR playbooks</div>
            <div>• Re-initializes chained SHA-256 genesis audit block</div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleResetDatabase}
              disabled={resetting}
              className="w-full py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{resetting ? 'Restoring Database...' : 'Restore Factory Seed Data'}</span>
            </button>
          </div>
        </div>

        {/* Card 3: RBAC Roles & Permissions Matrix */}
        <div className="md:col-span-2 p-5 rounded-2xl bg-[#101827] border border-cyan-500/20 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
            <Users className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold font-mono text-white">ROLE-BASED ACCESS CONTROL (RBAC) MATRIX</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                  <th className="py-2.5 px-3">Operational Capability</th>
                  <th className="py-2.5 px-3 text-cyan-400">SOC Analyst (Priya Sharma)</th>
                  <th className="py-2.5 px-3 text-blue-400">Security Administrator (Vikram Malhotra)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-[11px]">
                <tr>
                  <td className="py-2 px-3 text-slate-300">View Security Logs & Search Telemetry</td>
                  <td className="py-2 px-3 text-emerald-400 font-bold">✓ Granted</td>
                  <td className="py-2 px-3 text-emerald-400 font-bold">✓ Granted</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-300">Investigate AI Threat Anomaly Explanations (XAI)</td>
                  <td className="py-2 px-3 text-emerald-400 font-bold">✓ Granted</td>
                  <td className="py-2 px-3 text-emerald-400 font-bold">✓ Granted</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-300">Open Incidents & Post Investigation Notes</td>
                  <td className="py-2 px-3 text-emerald-400 font-bold">✓ Granted</td>
                  <td className="py-2 px-3 text-emerald-400 font-bold">✓ Granted</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-300">Generate Statutory CERT-In Compliance Filings</td>
                  <td className="py-2 px-3 text-emerald-400 font-bold">✓ Granted</td>
                  <td className="py-2 px-3 text-emerald-400 font-bold">✓ Granted</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-300">Execute Low-Impact Automated Playbooks</td>
                  <td className="py-2 px-3 text-emerald-400 font-bold">✓ Granted</td>
                  <td className="py-2 px-3 text-emerald-400 font-bold">✓ Granted</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-300">Authorize High-Impact Network Quarantine Actions</td>
                  <td className="py-2 px-3 text-amber-400">Requires Admin Gate</td>
                  <td className="py-2 px-3 text-emerald-400 font-bold">✓ Granted (Sole Sign-off)</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-300">Verify Cryptographic Audit Hash Chain Integrity</td>
                  <td className="py-2 px-3 text-slate-400">Read-Only</td>
                  <td className="py-2 px-3 text-emerald-400 font-bold">✓ Full Auditor Rights</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-300">Tune AI Detection Thresholds & Models</td>
                  <td className="py-2 px-3 text-slate-500">Restricted</td>
                  <td className="py-2 px-3 text-emerald-400 font-bold">✓ Admin Config</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 4: Platform Build Details */}
        <div className="md:col-span-2 p-4 rounded-xl bg-[#080B12] border border-slate-800 text-xs font-mono flex flex-wrap items-center justify-between gap-3 text-slate-400">
          <div>
            Platform: <strong className="text-white">SentinelGrid CNI Cyber Resilience v2.4.0</strong>
          </div>
          <div>
            Organization: <strong className="text-cyan-400">Secure Worldz AI Security Internship</strong>
          </div>
          <div>
            AI Architecture: <strong className="text-slate-200">Isolation Forest (120 Trees)</strong>
          </div>
          <div>
            Datastore: <strong className="text-slate-200">SQLite with Chained SHA-256</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
