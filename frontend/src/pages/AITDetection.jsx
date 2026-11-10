import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Activity,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Eye,
  Info,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { api } from '../services/api';
import { useDemo } from '../context/DemoContext';
import XAIModal from '../components/XAIModal';

export default function AITDetection({ setActivePage }) {
  const { refreshKey } = useDemo();
  const [stats, setStats] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnomalyForXAI, setSelectedAnomalyForXAI] = useState(null);

  // Interactive Live Feature Vector Tester
  const [tester, setTester] = useState({
    source_ip: '185.220.101.44',
    destination_ip: '10.0.1.10',
    username: 'admin_scada',
    port: 88,
    failed_logins: 8,
    hour: 3,
    bytes_kb: 450,
    privilege_level: 3,
    geo_novelty: 1,
    conn_freq_per_min: 15,
    event_type: 'Windows Auth'
  });
  const [inferenceResult, setInferenceResult] = useState(null);
  const [inferring, setInferring] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stRes, anRes] = await Promise.all([
        api.getAIStats(),
        api.getAnomalies()
      ]);
      setStats(stRes);
      setAnomalies(anRes);
    } catch (err) {
      console.error('Error fetching AI data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  const handleRunInference = async () => {
    setInferring(true);
    try {
      const res = await api.detectLiveAnomaly(tester);
      setInferenceResult(res);
    } catch (err) {
      alert(`Inference failed: ${err.message}`);
    } finally {
      setInferring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold font-mono text-white tracking-wide flex items-center space-x-2">
            <span>AI THREAT DETECTION ENGINE</span>
            <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800 font-mono font-bold">
              ISOLATION FOREST ML
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Unsupervised geometric anomaly detection across high-dimensional Critical Infrastructure operational telemetry
          </p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-mono transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Engine</span>
        </button>
      </div>

      {/* Model Status & Distinction Callout Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Model Status Card */}
        <div className="p-4 rounded-xl bg-[#101827] border border-cyan-500/20 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Model Architecture</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="text-sm font-bold font-mono text-white">{stats?.model_name || 'Isolation Forest'}</div>
            <div className="text-[11px] text-cyan-400 font-mono">{stats?.library || 'Scikit-Learn 1.9.0'}</div>
          </div>
          <div className="pt-2 border-t border-slate-800 flex justify-between text-[11px] font-mono text-slate-400">
            <span>Estimators: <strong>{stats?.estimators_count || 120} Trees</strong></span>
            <span>Status: <strong className="text-emerald-400">Active</strong></span>
          </div>
        </div>

        {/* Total Analyzed */}
        <div className="p-4 rounded-xl bg-[#101827] border border-cyan-500/20 shadow-lg space-y-3">
          <span className="text-xs font-mono text-slate-400 uppercase block">Events Analyzed</span>
          <div className="text-2xl font-extrabold font-mono text-cyan-400">
            {stats?.total_events_analyzed || '384'}
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
            Ingestion Speed: <strong className="text-slate-200">14.8 EPS</strong>
          </div>
        </div>

        {/* Anomalies Flagged */}
        <div className="p-4 rounded-xl bg-[#101827] border border-cyan-500/20 shadow-lg space-y-3">
          <span className="text-xs font-mono text-slate-400 uppercase block">Anomalies Identified</span>
          <div className="text-2xl font-extrabold font-mono text-amber-400">
            {stats?.anomalies_flagged || anomalies.length}
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
            Contamination: <strong className="text-slate-200">{((stats?.contamination_rate || 0.08) * 100).toFixed(0)}%</strong>
          </div>
        </div>

        {/* Threshold */}
        <div className="p-4 rounded-xl bg-[#101827] border border-cyan-500/20 shadow-lg space-y-3">
          <span className="text-xs font-mono text-slate-400 uppercase block">Detection Threshold</span>
          <div className="text-2xl font-extrabold font-mono text-red-400">
            0.62 <span className="text-xs text-slate-500 font-normal">/ 1.00</span>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
            Sensitivity: <strong className="text-cyan-400">Strict (CNI Baseline)</strong>
          </div>
        </div>
      </div>

      {/* Critical Statistical Distinction Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-[#101827] to-slate-900 border border-cyan-500/30 shadow-md flex items-start space-x-3 text-xs">
        <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-slate-200 font-mono tracking-wide">
            CRITICAL STATISTICAL DISTINCTION: ANOMALY SCORE vs. BAYESIAN PROBABILITY
          </div>
          <p className="text-slate-300 leading-relaxed font-sans text-[11px]">
            {stats?.metric_clarification?.distinction_note ||
              'This anomaly score represents the average path length required to isolate a telemetry vector across 120 decision trees, normalized via sigmoidal transformation. High scores indicate acute statistical deviation from established operational baselines, not an unverified legal certainty of compromise.'}
          </p>
        </div>
      </div>

      {/* Interactive Feature Vector Live Inference Playground */}
      <div className="p-5 rounded-2xl bg-[#101827] border border-cyan-500/20 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold font-mono text-white flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>LIVE FEATURE VECTOR INFERENCE PLAYGROUND</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Perturb high-dimensional telemetry parameters and evaluate real-time Isolation Forest scores & XAI explanations
            </p>
          </div>
          <button
            onClick={handleRunInference}
            disabled={inferring}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs transition shadow-[0_0_15px_rgba(0,218,218,0.3)] disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 fill-black" />
            <span>{inferring ? 'Evaluating Model...' : 'Execute ML Inference'}</span>
          </button>
        </div>

        {/* Feature Sliders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-[#080B12] rounded-xl border border-slate-800 text-xs font-mono">
          {/* Failed Logins */}
          <div className="space-y-1">
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Failed Logins:</span>
              <span className="text-cyan-400 font-bold">{tester.failed_logins}</span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              value={tester.failed_logins}
              onChange={(e) => setTester({ ...tester, failed_logins: parseInt(e.target.value) })}
              className="w-full accent-cyan-400"
            />
          </div>

          {/* Time of Access */}
          <div className="space-y-1">
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Hour of Access (UTC):</span>
              <span className="text-cyan-400 font-bold">{tester.hour}:00</span>
            </div>
            <input
              type="range"
              min="0"
              max="23"
              value={tester.hour}
              onChange={(e) => setTester({ ...tester, hour: parseInt(e.target.value) })}
              className="w-full accent-cyan-400"
            />
          </div>

          {/* Data Transfer KB */}
          <div className="space-y-1">
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Data Transfer (MB):</span>
              <span className="text-cyan-400 font-bold">{(tester.bytes_kb / 1024).toFixed(1)} MB</span>
            </div>
            <input
              type="range"
              min="10"
              max="1000000"
              step="50000"
              value={tester.bytes_kb}
              onChange={(e) => setTester({ ...tester, bytes_kb: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400"
            />
          </div>

          {/* Privilege Level */}
          <div className="space-y-1">
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Privilege Class:</span>
              <span className="text-cyan-400 font-bold">
                {tester.privilege_level === 3 ? 'Root/Admin' : tester.privilege_level === 2 ? 'Operator' : 'User'}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="3"
              value={tester.privilege_level}
              onChange={(e) => setTester({ ...tester, privilege_level: parseInt(e.target.value) })}
              className="w-full accent-cyan-400"
            />
          </div>

          {/* Geo Novelty */}
          <div className="space-y-1">
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Geo/ASN Novelty:</span>
              <span className="text-cyan-400 font-bold">{tester.geo_novelty ? 'Foreign AS' : 'Domestic'}</span>
            </div>
            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setTester({ ...tester, geo_novelty: 0 })}
                className={`flex-1 py-1 rounded text-[10px] ${
                  tester.geo_novelty === 0 ? 'bg-cyan-500 text-black font-bold' : 'bg-slate-900 text-slate-400'
                }`}
              >
                Domestic
              </button>
              <button
                type="button"
                onClick={() => setTester({ ...tester, geo_novelty: 1 })}
                className={`flex-1 py-1 rounded text-[10px] ${
                  tester.geo_novelty === 1 ? 'bg-red-500 text-white font-bold' : 'bg-slate-900 text-slate-400'
                }`}
              >
                Novel External
              </button>
            </div>
          </div>

          {/* Target Host */}
          <div className="space-y-1">
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Target Asset:</span>
              <span className="text-cyan-400 font-bold">
                {tester.destination_ip.includes('192.168.10') ? 'SCADA L1' : 'Corporate L4'}
              </span>
            </div>
            <select
              value={tester.destination_ip}
              onChange={(e) => setTester({ ...tester, destination_ip: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-[11px] focus:outline-none"
            >
              <option value="192.168.10.12">Substation RTU 12 (Purdue L1)</option>
              <option value="192.168.10.5">Power SCADA HMI (Purdue L2)</option>
              <option value="10.0.1.10">Active Directory DC (Enterprise L4)</option>
              <option value="10.0.2.25">Historian Database (Operations L3)</option>
            </select>
          </div>

          {/* Port */}
          <div className="space-y-1">
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Destination Port:</span>
              <span className="text-cyan-400 font-bold">{tester.port}</span>
            </div>
            <select
              value={tester.port}
              onChange={(e) => setTester({ ...tester, port: parseInt(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-[11px] focus:outline-none"
            >
              <option value="502">502 (Modbus ICS)</option>
              <option value="3389">3389 (RDP)</option>
              <option value="88">88 (Kerberos)</option>
              <option value="443">443 (HTTPS)</option>
              <option value="8443">8443 (TLS Egress)</option>
            </select>
          </div>

          {/* Connection Frequency */}
          <div className="space-y-1">
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Conn Freq (req/min):</span>
              <span className="text-cyan-400 font-bold">{tester.conn_freq_per_min}</span>
            </div>
            <input
              type="range"
              min="1"
              max="60"
              value={tester.conn_freq_per_min}
              onChange={(e) => setTester({ ...tester, conn_freq_per_min: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400"
            />
          </div>
        </div>

        {/* Live Inference Output Drawer */}
        {inferenceResult && (
          <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-3 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-white">INFERENCE EVALUATION:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  inferenceResult.is_anomaly ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                }`}>
                  {inferenceResult.is_anomaly ? 'ANOMALOUS OUTLIER DETECTED' : 'NOMINAL BEHAVIOR'}
                </span>
              </div>
              <div className="text-xs font-mono">
                Anomaly Score: <strong className="text-cyan-400 text-sm">{inferenceResult.anomaly_score}</strong> / 1.00
              </div>
            </div>

            {/* Diagnostic Narrative & Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Diagnostic Factors:</span>
                <ul className="space-y-1 text-slate-300">
                  {inferenceResult.xai_explanation?.reasons?.map((r, i) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <span className="text-cyan-400">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Actionable Steps:</span>
                <ul className="space-y-1 text-slate-300">
                  {inferenceResult.xai_explanation?.recommended_actions?.map((a, i) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Historical Detected Anomalies Table */}
      <div className="p-5 rounded-2xl bg-[#101827] border border-cyan-500/20 shadow-xl space-y-4">
        <div>
          <h3 className="text-sm font-bold font-mono text-white">HISTORICAL ANOMALY DETECTIONS</h3>
          <p className="text-[11px] text-slate-400">
            Telemetry vectors flagged by Isolation Forest for human analyst investigation
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                <th className="py-2.5 px-3">Detection ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Device / User</th>
                <th className="py-2.5 px-3">Source IP</th>
                <th className="py-2.5 px-3">Anomaly Score</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Reason Summary</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {anomalies.map((a) => (
                <tr key={a.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 px-3 font-bold text-cyan-400">{a.detection_id}</td>
                  <td className="py-2.5 px-3 text-slate-400">{a.timestamp}</td>
                  <td className="py-2.5 px-3">
                    <div className="text-slate-200">{a.device}</div>
                    <div className="text-[10px] text-slate-500">{a.username}</div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">{a.source_ip}</td>
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-cyan-400">{a.anomaly_score}</span>
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
                  <td className="py-2.5 px-3 max-w-xs text-slate-300 truncate" title={a.reason}>
                    {a.reason}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() =>
                        setSelectedAnomalyForXAI({
                          alert_id: a.detection_id,
                          title: `Anomaly ${a.detection_id}: ${a.device}`,
                          username: a.username,
                          source_ip: a.source_ip,
                          destination_ip: a.device,
                          severity: a.severity,
                          anomaly_score: a.anomaly_score,
                          xai_explanation: {
                            reasons: [a.reason],
                            recommended_actions: [a.recommended_action],
                            top_contributing_factors: Object.entries(a.feature_attributions || {}).map(
                              ([k, v]) => ({ factor: k.replace('_', ' ').toUpperCase(), contribution_pct: v })
                            )
                          }
                        })
                      }
                      className="px-2 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold transition flex items-center space-x-1 ml-auto"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Investigate</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* XAI Modal if open */}
      {selectedAnomalyForXAI && (
        <XAIModal
          alertItem={selectedAnomalyForXAI}
          onClose={() => setSelectedAnomalyForXAI(null)}
          onPromote={() => {
            setSelectedAnomalyForXAI(null);
            setActivePage('Incident Management');
          }}
          onTriggerSoar={() => {
            setSelectedAnomalyForXAI(null);
            setActivePage('SOAR Automation');
          }}
        />
      )}
    </div>
  );
}
