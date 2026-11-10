import React from 'react';
import {
  LayoutDashboard,
  AlertTriangle,
  Cpu,
  Crosshair,
  Grid,
  Terminal,
  Server,
  Zap,
  ShieldAlert,
  FileText,
  Lock,
  Settings,
  ShieldCheck,
  Radio
} from 'lucide-react';

const navItems = [
  { name: 'Overview Dashboard', icon: LayoutDashboard, badge: null },
  { name: 'Security Alerts', icon: AlertTriangle, badge: 'Active' },
  { name: 'AI Threat Detection', icon: Cpu, badge: 'ML' },
  { name: 'Attack Campaigns', icon: Crosshair, badge: '4' },
  { name: 'MITRE ATT&CK', icon: Grid, badge: null },
  { name: 'Security Logs', icon: Terminal, badge: null },
  { name: 'Asset & Device Inventory', icon: Server, badge: '8' },
  { name: 'SOAR Automation', icon: Zap, badge: 'Playbooks' },
  { name: 'Incident Management', icon: ShieldAlert, badge: 'Open' },
  { name: 'CERT-In Reporting', icon: FileText, badge: 'Sec 70B' },
  { name: 'Audit Logs', icon: Lock, badge: 'Chained' },
  { name: 'Settings', icon: Settings, badge: null },
];

export default function Sidebar({ activePage, setActivePage }) {
  return (
    <aside className="w-64 bg-[#080B12] border-r border-cyan-500/15 flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 select-none shrink-0 overflow-y-auto">
      {/* Navigation Header */}
      <div className="p-3">
        <div className="px-3 py-2 text-[10px] uppercase font-bold tracking-widest text-slate-500 flex items-center justify-between">
          <span>OPERATIONS MODULES</span>
          <span className="flex h-1.5 w-1.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500" />
          </span>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1 mt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.name;

            return (
              <button
                key={item.name}
                onClick={() => setActivePage(item.name)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-950/80 to-blue-950/30 text-cyan-300 border-l-2 border-cyan-400 font-semibold shadow-[0_0_12px_rgba(0,218,218,0.12)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  <span className="truncate">{item.name}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold tracking-tight ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* CNI Shield Footer Card */}
      <div className="p-3 border-t border-slate-900">
        <div className="p-2.5 rounded-lg bg-gradient-to-b from-[#101827] to-[#0A0F1D] border border-cyan-500/20 shadow-inner">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="text-[11px] font-bold text-slate-200 font-mono">CRITICAL INFRASTRUCTURE</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 leading-snug">
            Power Transmission & SCADA Grid telemetry secured under IEC 62443 & CERT-In guidelines.
          </p>
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-mono text-cyan-400/80">
            <span>ISOLATION FOREST v1.9</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <Radio className="w-2.5 h-2.5 animate-pulse" /> LIVE SYNC
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
