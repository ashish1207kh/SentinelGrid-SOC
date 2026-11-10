import React from 'react';
import {
  X,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Info,
  CheckCircle,
  Zap,
  FolderPlus
} from 'lucide-react';

export default function XAIModal({ alertItem, onClose, onPromote, onTriggerSoar }) {
  if (!alertItem) return null;

  const xai = alertItem.xai_explanation || {};
  const reasons = xai.reasons || [
    'Outlier detected in multi-dimensional space via Isolation Forest.',
    'Feature telemetry deviates significantly from normal enterprise baseline.'
  ];
  const factors = xai.top_contributing_factors || [
    { factor: 'Behavioral Deviation', contribution_pct: 42.0 },
    { factor: 'Temporal Off-Hours', contribution_pct: 28.0 },
    { factor: 'Asset Criticality', contribution_pct: 18.0 }
  ];
  const actions = xai.recommended_actions || [
    'Review active handles and open network sockets on target asset.',
    'Verify identity authentication source with user manager.',
    'Isolate affected host if anomalous egress continues.'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl bg-[#080B12] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,218,218,0.25)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-cyan-950/40 via-[#101827] to-blue-950/40 border-b border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded font-bold">
                  EXPLAINABLE AI (XAI)
                </span>
                <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                  alertItem.severity === 'Critical' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}>
                  {alertItem.severity} RISK
                </span>
              </div>
              <h2 className="text-sm font-bold text-white font-mono mt-0.5 truncate max-w-md">
                {alertItem.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Metadata Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-[#101827] rounded-xl border border-slate-800 text-[11px] font-mono">
            <div>
              <span className="text-slate-500 block">Alert ID:</span>
              <span className="text-cyan-400 font-bold">{alertItem.alert_id}</span>
            </div>
            <div>
              <span className="text-slate-500 block">User Account:</span>
              <span className="text-slate-200">{alertItem.username || 'unknown'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Source IP:</span>
              <span className="text-slate-200">{alertItem.source_ip}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Target IP:</span>
              <span className="text-slate-200">{alertItem.destination_ip}</span>
            </div>
          </div>

          {/* Anomaly Score Clarification Box */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-cyan-500/25 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-slate-300 font-bold">ISOLATION FOREST OUTLIER METRIC</span>
              <span className="text-cyan-400 font-mono font-extrabold text-base">
                {alertItem.anomaly_score} / 1.00
              </span>
            </div>

            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 rounded-full"
                style={{ width: `${Math.min(100, (alertItem.anomaly_score || 0.8) * 100)}%` }}
              />
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
              <strong className="text-cyan-400">Statistical Distinction:</strong> This score reflects geometric tree isolation depth in 8-dimensional space (calibrated via sigmoid transformation), measuring how severely the event deviates from normal operational telemetry. It is not an unverified probability of malicious intent.
            </p>
          </div>

          {/* Top Contributing Factors */}
          <div className="space-y-2">
            <h4 className="font-mono font-bold text-slate-300 uppercase tracking-wider text-[11px]">
              Feature Attribution Decomposition
            </h4>
            <div className="space-y-1.5">
              {factors.map((f, i) => (
                <div key={i} className="p-2 rounded-lg bg-[#101827] border border-slate-800 flex items-center justify-between">
                  <span className="font-mono text-slate-300">{f.factor}</span>
                  <div className="flex items-center space-x-2 w-48">
                    <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 rounded-full"
                        style={{ width: `${f.contribution_pct}%` }}
                      />
                    </div>
                    <span className="font-mono font-bold text-cyan-400 text-[11px] w-12 text-right">
                      +{f.contribution_pct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Plain English AI Explanation */}
          <div className="space-y-2">
            <h4 className="font-mono font-bold text-slate-300 uppercase tracking-wider text-[11px]">
              AI Diagnostic Narrative
            </h4>
            <ul className="space-y-1.5 text-slate-300 bg-[#101827] p-3 rounded-xl border border-slate-800">
              {reasons.map((r, i) => (
                <li key={i} className="flex items-start space-x-2">
                  <span className="text-cyan-400 mt-0.5">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recommended Actions */}
          <div className="space-y-2">
            <h4 className="font-mono font-bold text-slate-300 uppercase tracking-wider text-[11px]">
              Actionable Defense Recommendations
            </h4>
            <ul className="space-y-1.5 text-slate-300 bg-[#101827] p-3 rounded-xl border border-slate-800">
              {actions.map((act, i) => (
                <li key={i} className="flex items-start space-x-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Regulatory / Academic Disclaimer */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[10px] text-slate-500 flex items-start space-x-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p>
              {xai.analyst_disclaimer ||
                'AI explanations represent supporting statistical evidence and behavioral heuristics for analyst triage, not definitive legal or forensic proof of malicious intent. Human analyst validation required prior to destructive containment actions.'}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 bg-[#101827] border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition text-xs font-mono"
          >
            Close
          </button>

          <div className="flex items-center space-x-2">
            {onTriggerSoar && (
              <button
                onClick={() => onTriggerSoar(alertItem)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold transition"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Trigger SOAR Playbook</span>
              </button>
            )}

            {onPromote && (
              <button
                onClick={() => onPromote(alertItem)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-mono font-bold transition shadow-[0_0_15px_rgba(0,218,218,0.3)]"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Promote to Incident</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
