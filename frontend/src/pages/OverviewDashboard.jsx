import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Activity,
  AlertTriangle,
  Cpu,
  Server,
  FileWarning,
  TrendingUp,
  RefreshCw,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Eye,
  Filter
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid
} from 'recharts';
import { api } from '../services/api';
import { useDemo } from '../context/DemoContext';
import XAIModal from '../components/XAIModal';

export default function OverviewDashboard({ setActivePage }) {
  const { refreshKey, triggerDataRefresh } = useDemo();
  const [kpis, setKpis] = useState(null);
  const [timelineData, setTimelineData] = useState([]);
  const [timeframe, setTimeframe] = useState('24h');
  const [severities, setSeverities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAlertForXAI, setSelectedAlertForXAI] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const [kpiRes, timeRes, sevRes, catRes, alertRes, healthRes] = await Promise.all([
        api.getKPIs(),
        api.getTimeline(timeframe),
        api.getSeverityDistribution(),
        api.getCategoryDistribution(),
        api.getRecentAlerts(6),
        api.getHealth()
      ]);

      setKpis(kpiRes);
      setTimelineData(timeRes.timeline || []);
      setSeverities(sevRes);
      setCategories(catRes);
      setRecentAlerts(alertRes);
      setHealth(healthRes);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [timeframe, refreshKey]);

  const kpiCards = [
    {
      title: 'Total Security Events',
      value: kpis?.total_security_events ?? '73',
      sub: `${kpis?.event_ingestion_rate_eps || 14.8} EPS Live Ingestion`,
      icon: Activity,
      color: 'text-cyan-400',
      border: 'border-cyan-500/30',
      bg: 'from-cyan-950/30'
    },
    {
      title: 'Active Threats',
      value: kpis?.active_threats ?? '9',
      sub: 'Multi-vector telemetry alerts',
      icon: ShieldAlert,
      color: 'text-amber-400',
      border: 'border-amber-500/30',
      bg: 'from-amber-950/30'
    },
    {
      title: 'Critical Alerts',
      value: kpis?.critical_alerts ?? '4',
      sub: 'P1 Infrastructure threats',
      icon: AlertTriangle,
      color: 'text-red-400',
      border: 'border-red-500/30',
      bg: 'from-red-950/30'
    },
    {
      title: 'Detected Anomalies',
      value: kpis?.detected_anomalies ?? '7',
      sub: 'Isolation Forest ML flag',
      icon: Cpu,
      color: 'text-purple-400',
      border: 'border-purple-500/30',
      bg: 'from-purple-950/30'
    },
    {
      title: 'Active Incidents',
      value: kpis?.active_incidents ?? '4',
      sub: 'Under triage / response',
      icon: FileWarning,
      color: 'text-blue-400',
      border: 'border-blue-500/30',
      bg: 'from-blue-950/30'
    },
    {
      title: 'Protected CNI Assets',
      value: kpis?.protected_assets ?? '8',
      sub: 'Purdue Levels 1-4 nodes',
      icon: Server,
      color: 'text-emerald-400',
      border: 'border-emerald-500/30',
      bg: 'from-emerald-950/30'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold font-mono text-white tracking-wide flex items-center space-x-2">
            <span>OPERATIONAL SOC DASHBOARD</span>
            <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800 font-mono">
              REAL-TIME
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Critical National Infrastructure (CNI) Continuous Threat Monitoring & Behavioral Anomaly Telemetry
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setLoading(true);
              fetchDashboardData();
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-mono transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`p-3.5 rounded-xl bg-gradient-to-b ${kpi.bg} to-[#101827] border ${kpi.border} shadow-lg relative overflow-hidden`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400 truncate">{kpi.title}</span>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className={`text-2xl font-extrabold font-mono tracking-tight ${kpi.color}`}>
                  {kpi.value}
                </span>
              </div>
              <div className="mt-1 text-[10px] text-slate-400 truncate">{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* A. Security Events Timeline (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#101827] border border-cyan-500/20 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold font-mono text-white">SECURITY EVENTS & DETECTIONS TIMELINE</h3>
              <p className="text-[11px] text-slate-400">Ingested network packets, anomaly triggers, and escalated alerts</p>
            </div>

            {/* Timeframe buttons */}
            <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
              {['1h', '24h', '7d', '30d'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-2 py-0.5 rounded text-[11px] transition ${
                    timeframe === t
                      ? 'bg-cyan-500 text-black font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00DADA" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00DADA" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#080B12',
                    borderColor: 'rgba(0, 218, 218, 0.3)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}
                />
                <Area type="monotone" dataKey="events" name="Total Events" stroke="#00DADA" strokeWidth={2} fillOpacity={1} fill="url(#colorEvents)" />
                <Area type="monotone" dataKey="alerts" name="Escalated Alerts" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorAlerts)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-end space-x-4 text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
              <span>Telemetry Ingestion</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              <span>Escalated Threats</span>
            </span>
          </div>
        </div>

        {/* B. Threat Severity Distribution (1 col) */}
        <div className="p-5 rounded-2xl bg-[#101827] border border-cyan-500/20 shadow-xl space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold font-mono text-white">THREAT SEVERITY BREAKDOWN</h3>
            <p className="text-[11px] text-slate-400">Distribution of active security alerts</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severities}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                >
                  {severities.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#080B12',
                    borderColor: 'rgba(0, 218, 218, 0.3)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-800">
            {severities.map((s) => (
              <div key={s.name} className="flex items-center justify-between p-1.5 bg-slate-900/60 rounded">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-slate-300">{s.name}:</span>
                </span>
                <span className="font-bold text-white">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* C. Attack Category & E. System Health Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attack Category Distribution (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#101827] border border-cyan-500/20 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold font-mono text-white">ATTACK CATEGORY DISTRIBUTION (MITRE ATT&CK)</h3>
              <p className="text-[11px] text-slate-400">Tactics observed across critical substation & SCADA telemetry</p>
            </div>
            <button
              onClick={() => setActivePage('MITRE ATT&CK')}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
            >
              <span>Explore Matrix</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis dataKey="category" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} width={110} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#080B12',
                    borderColor: 'rgba(0, 218, 218, 0.3)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}
                />
                <Bar dataKey="count" fill="#238BFF" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* E. System Health Card (1 col) */}
        <div className="p-5 rounded-2xl bg-[#101827] border border-cyan-500/20 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-mono text-white">CNI PLATFORM HEALTH</h3>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                {health?.status || 'HEALTHY'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Microservice telemetry & execution latency</p>
          </div>

          <div className="space-y-2.5">
            {health?.services?.map((svc, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs font-mono">
                <span className="text-slate-300">{svc.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-slate-500">{svc.latency_ms}ms</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Uptime: <strong className="text-cyan-400">{health?.uptime || '99.98%'}</strong></span>
            <span>Mode: <strong className="text-emerald-400">CNI ACTIVE DEFENSE</strong></span>
          </div>
        </div>
      </div>

      {/* D. Recent Security Alerts Table */}
      <div className="p-5 rounded-2xl bg-[#101827] border border-cyan-500/20 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold font-mono text-white">RECENT SECURITY ALERTS</h3>
            <p className="text-[11px] text-slate-400">High priority detections classified by AI Engine</p>
          </div>
          <button
            onClick={() => setActivePage('Security Alerts')}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
          >
            <span>View All Alerts</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                <th className="py-2.5 px-3">Alert ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Source → Destination</th>
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Threat Category</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentAlerts.map((alt) => (
                <tr key={alt.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 px-3 font-bold text-cyan-400">{alt.alert_id}</td>
                  <td className="py-2.5 px-3 text-slate-400">{alt.timestamp}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-slate-200">{alt.source_ip}</span>
                    <span className="text-slate-500 mx-1">→</span>
                    <span className="text-slate-200">{alt.destination_ip}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">{alt.username}</td>
                  <td className="py-2.5 px-3 text-slate-400">{alt.threat_category}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        alt.severity === 'Critical'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : alt.severity === 'High'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-blue-950 text-blue-400 border border-blue-800'
                      }`}
                    >
                      {alt.severity}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 text-slate-300 border border-slate-700">
                      {alt.detection_status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={async () => {
                        const detail = await api.getAlertDetail(alt.alert_id);
                        setSelectedAlertForXAI(detail);
                      }}
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
      {selectedAlertForXAI && (
        <XAIModal
          alertItem={selectedAlertForXAI}
          onClose={() => setSelectedAlertForXAI(null)}
          onPromote={() => {
            setSelectedAlertForXAI(null);
            setActivePage('Incident Management');
          }}
          onTriggerSoar={() => {
            setSelectedAlertForXAI(null);
            setActivePage('SOAR Automation');
          }}
        />
      )}
    </div>
  );
}
