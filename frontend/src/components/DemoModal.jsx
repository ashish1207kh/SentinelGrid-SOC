import React, { useState } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Clock,
  Activity,
  Terminal,
  Zap,
  Radio,
  ExternalLink
} from 'lucide-react';
import { useDemo, APT_STEPS } from '../context/DemoContext';
import { api } from '../services/api';

export default function DemoModal({ setActivePage }) {
  const {
    isDemoModalOpen,
    setIsDemoModalOpen,
    currentStep,
    isPlaying,
    isPaused,
    speed,
    setSpeed,
    logs,
    startAptSimulation,
    pauseAptSimulation,
    resumeAptSimulation,
    resetAptSimulation,
    stepForward
  } = useDemo();

  const [activeTab, setActiveTab] = useState('apt'); // 'apt' or 'individual'
  const [singleLoading, setSingleLoading] = useState(null);
  const [singleSuccess, setSingleSuccess] = useState(null);

  if (!isDemoModalOpen) return null;

  const triggerSingle = async (type, label) => {
    setSingleLoading(type);
    setSingleSuccess(null);
    try {
      const res = await api.runSingleAttack(type);
      setSingleSuccess(`Triggered ${label}! Created Event: ${res.event_id}, Alert: ${res.alert_id}`);
    } catch (err) {
      alert(`Error triggering ${label}: ${err.message}`);
    } finally {
      setSingleLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-4xl bg-[#080B12] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,218,218,0.2)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-cyan-950/40 via-[#101827] to-blue-950/40 border-b border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,218,218,0.3)]">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white font-mono tracking-wide">
                  SENTINELGRID INTERACTIVE DEMO ENGINE
                </h2>
                <span className="text-[10px] font-mono uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded font-bold">
                  SIMULATION
                </span>
              </div>
              <p className="text-xs text-slate-400">
                End-to-end multi-stage cyber incident demonstration for critical infrastructure defense
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDemoModalOpen(false)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="px-6 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('apt')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center space-x-2 ${
                activeTab === 'apt'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Multi-Stage APT Simulation (12 Steps)</span>
            </button>
            <button
              onClick={() => setActiveTab('individual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center space-x-2 ${
                activeTab === 'individual'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Individual Attack Vectors</span>
            </button>
          </div>

          {/* Speed selector */}
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-slate-500">Speed:</span>
            {['Normal', 'Presentation', 'Fast'].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                  speed === s
                    ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(0,218,218,0.4)]'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'apt' ? (
            <>
              {/* Simulation Controls Bar */}
              <div className="p-4 rounded-xl bg-[#101827] border border-cyan-500/25 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center space-x-3">
                  {!isPlaying && (
                    <button
                      onClick={startAptSimulation}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs transition shadow-[0_0_15px_rgba(0,218,218,0.4)]"
                    >
                      <Play className="w-4 h-4 fill-black" />
                      <span>{currentStep === 0 ? 'Start APT Simulation' : 'Restart Simulation'}</span>
                    </button>
                  )}

                  {isPlaying && !isPaused && (
                    <button
                      onClick={pauseAptSimulation}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs transition shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                    >
                      <Pause className="w-4 h-4 fill-black" />
                      <span>Pause</span>
                    </button>
                  )}

                  {isPlaying && isPaused && (
                    <button
                      onClick={resumeAptSimulation}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs transition shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                    >
                      <Play className="w-4 h-4 fill-black" />
                      <span>Resume</span>
                    </button>
                  )}

                  <button
                    onClick={stepForward}
                    disabled={currentStep >= 12}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-mono text-xs border border-slate-700 transition"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    <span>Next Step</span>
                  </button>

                  <button
                    onClick={resetAptSimulation}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-xs border border-slate-800 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Database</span>
                  </button>
                </div>

                {/* Status indicator */}
                <div className="flex items-center space-x-2 text-xs font-mono">
                  <span className="text-slate-400">Progress:</span>
                  <span className="text-cyan-400 font-bold text-sm">
                    {currentStep} / 12 Steps
                  </span>
                  <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700 ml-2">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
                      style={{ width: `${(currentStep / 12) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 12-Step Interactive Timeline */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Attack Lifecycle Progression Flow</span>
                  <span className="text-cyan-400 font-mono text-[11px]">
                    {currentStep === 12
                      ? '✓ COMPLETE DEMONSTRATION RECORDED'
                      : isPlaying
                      ? '● EXECUTING SEQUENCE'
                      : 'WAITING FOR TRIGGER'}
                  </span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
                  {APT_STEPS.map((s) => {
                    const isCompleted = currentStep >= s.step;
                    const isCurrent = currentStep === s.step;

                    return (
                      <div
                        key={s.step}
                        className={`p-3 rounded-xl border transition-all text-xs ${
                          isCurrent
                            ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(0,218,218,0.25)]'
                            : isCompleted
                            ? 'bg-slate-900/60 border-emerald-500/40 text-slate-300'
                            : 'bg-slate-950/40 border-slate-800/80 opacity-60 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px] ${
                                isCurrent
                                  ? 'bg-cyan-400 text-black animate-pulse'
                                  : isCompleted
                                  ? 'bg-emerald-500 text-black'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {s.step}
                            </span>
                            <span className="font-bold text-slate-200 font-mono">{s.title}</span>
                          </div>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                              isCurrent
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                                : isCompleted
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {isCurrent ? 'ACTIVE' : isCompleted ? 'DONE' : 'PENDING'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">{s.summary}</p>
                        <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-cyan-400">
                          <span>Target: {s.target}</span>
                          <span className="text-slate-400">{s.technique}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Execution Logs */}
              {logs.length > 0 && (
                <div className="p-3 bg-black/60 border border-slate-800 rounded-xl space-y-1">
                  <div className="text-[11px] font-mono font-bold text-cyan-400 flex items-center space-x-2">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>REAL-TIME SIMULATION TELEMETRY STREAM</span>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto font-mono text-[11px]">
                    {logs.map((l) => (
                      <div key={l.id} className="text-slate-300 flex items-start space-x-2">
                        <span className="text-slate-500 shrink-0">[{l.time}]</span>
                        <span className="text-cyan-400 shrink-0">STEP {l.step}:</span>
                        <span className="text-white">{l.name}</span>
                        <span className="text-emerald-400">→ {l.action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Individual Attack Scenarios */
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Trigger targeted simulated security incidents to observe real-time AI detection, XAI explanations, and SOAR response behavior.
              </p>

              {singleSuccess && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-mono">
                  {singleSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  {
                    id: 'brute-force',
                    title: '1. Brute-Force Password Spray',
                    desc: 'Simulate 32 rapid failed Kerberos authentications targeting CNI Domain Controller from external Tor IP.',
                    mitre: 'T1110',
                    target: 'CNI-DC-CORE-01'
                  },
                  {
                    id: 'suspicious-login',
                    title: '2. Suspicious Foreign SSL-VPN Login',
                    desc: 'Simulate operator login session initiated from foreign IP without verified hardware key certificate.',
                    mitre: 'T1078',
                    target: 'CNI-FW-GATEWAY'
                  },
                  {
                    id: 'privilege-escalation',
                    title: '3. Token Impersonation (SYSTEM)',
                    desc: 'Simulate service account token theft elevating standard user to NT AUTHORITY\\SYSTEM integrity.',
                    mitre: 'T1068',
                    target: 'CNI-ENG-WS-45'
                  },
                  {
                    id: 'lateral-movement',
                    title: '4. Non-Bastion RDP Lateral Pivot',
                    desc: 'Simulate unauthorized East-West RDP jump traversing Purdue Level 4 to Level 3 SCADA network.',
                    mitre: 'T1021',
                    target: 'CNI-PWR-SCADA-01'
                  },
                  {
                    id: 'data-exfiltration',
                    title: '5. High-Volume Telemetry Exfiltration',
                    desc: 'Simulate 520 MB encrypted outbound egress spike from SCADA Historian database to unclassified foreign host.',
                    mitre: 'T1041',
                    target: 'CNI-DATA-VAULT'
                  }
                ].map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-[#101827] border border-slate-800 hover:border-cyan-500/40 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-200 text-xs font-mono">{item.title}</span>
                        <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-800">
                          {item.mitre}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">{item.desc}</p>
                      <div className="text-[10px] font-mono text-slate-500 mt-2">Target Asset: {item.target}</div>
                    </div>

                    <button
                      onClick={() => triggerSingle(item.id, item.title)}
                      disabled={singleLoading === item.id}
                      className="mt-3 w-full py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold transition flex items-center justify-center space-x-1.5"
                    >
                      <Zap className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{singleLoading === item.id ? 'Injecting Telemetry...' : 'Inject Attack Vector'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#101827] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2 font-mono text-[11px]">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Safety Isolation Active: 100% simulated sandbox execution</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setIsDemoModalOpen(false);
                setActivePage('Overview Dashboard');
              }}
              className="text-cyan-400 hover:text-cyan-300 font-mono flex items-center space-x-1"
            >
              <span>View Dashboard Updates</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
