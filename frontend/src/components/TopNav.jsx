import React, { useState, useEffect } from 'react';
import {
  Shield,
  Bell,
  Play,
  RotateCcw,
  User,
  LogOut,
  ChevronDown,
  Activity,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDemo } from '../context/DemoContext';
import { api } from '../services/api';

export default function TopNav({ activePage, setActivePage }) {
  const { user, logout, quickLogin } = useAuth();
  const { setIsDemoModalOpen, currentStep, isPlaying } = useDemo();
  const [time, setTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [recentAlerts, setRecentAlerts] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    api.getRecentAlerts(4)
      .then(data => setRecentAlerts(data))
      .catch(() => {});
  }, []);

  const formatTimeIST = (d) => {
    return d.toLocaleTimeString('en-IN', { hour12: false });
  };

  const formatDate = (d) => {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-[#080B12]/90 backdrop-blur-md border-b border-cyan-500/20 px-4 md:px-6 flex items-center justify-between">
      {/* Left: Brand & Tagline */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2.5">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 shadow-[0_0_15px_rgba(0,218,218,0.25)]">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold tracking-wider text-lg text-white font-mono flex items-center">
                SENTINEL<span className="text-cyan-400">GRID</span>
              </span>
              <span className="text-[10px] font-semibold tracking-widest uppercase bg-cyan-950/70 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/30">
                CNI SOC
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden lg:block tracking-tight font-sans">
              Intelligence • Detection • Response • Resilience
            </p>
          </div>
        </div>

        {/* System Pulse Status */}
        <div className="hidden xl:flex items-center space-x-2 ml-6 pl-6 border-l border-slate-800">
          <div className="flex items-center space-x-1.5 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-medium text-emerald-400">GRID DEFENSE ACTIVE</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">99.98% UPTIME</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Real-time Clock */}
        <div className="hidden md:flex items-center space-x-2 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{formatDate(time)}</span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-400 font-bold">{formatTimeIST(time)} IST</span>
        </div>

        {/* DEMO MODE TRIGGER BUTTON */}
        <button
          onClick={() => setIsDemoModalOpen(true)}
          className={`relative group flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all duration-300 border ${
            isPlaying
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.3)] animate-pulse'
              : 'bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 text-cyan-300 border-cyan-400/50 hover:border-cyan-400 shadow-[0_0_15px_rgba(0,218,218,0.25)] hover:shadow-[0_0_25px_rgba(0,218,218,0.4)]'
          }`}
        >
          <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>DEMO SIMULATION</span>
          {currentStep > 0 && (
            <span className="bg-cyan-500 text-black px-1.5 py-0.2 rounded text-[10px] font-bold">
              {currentStep}/12
            </span>
          )}
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg bg-slate-900/70 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition relative"
            title="System Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#101827] border border-cyan-500/30 rounded-xl shadow-2xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200 tracking-wider">ACTIVE THREAT NOTIFICATIONS</span>
                <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-mono">LIVE</span>
              </div>
              <div className="divide-y divide-slate-800/60 max-h-64 overflow-y-auto mt-2">
                {recentAlerts.length > 0 ? (
                  recentAlerts.map(alt => (
                    <div
                      key={alt.id}
                      onClick={() => {
                        setShowNotifications(false);
                        setActivePage('Security Alerts');
                      }}
                      className="py-2 px-1 hover:bg-slate-800/40 rounded cursor-pointer transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-200 truncate">{alt.title}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                          alt.severity === 'Critical' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {alt.severity}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                        <span>{alt.source_ip}</span>
                        <span className="font-mono text-cyan-400">Score: {alt.anomaly_score}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 py-4 text-center">No active critical alerts</div>
                )}
              </div>
              <button
                onClick={() => {
                  setShowNotifications(false);
                  setActivePage('Security Alerts');
                }}
                className="w-full mt-2 text-center text-xs text-cyan-400 hover:text-cyan-300 font-medium py-1"
              >
                View all security alerts →
              </button>
            </div>
          )}
        </div>

        {/* Current Analyst Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2 bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 px-2.5 py-1.5 rounded-lg transition"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
              {user?.full_name ? user.full_name[0] : 'A'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-slate-200 leading-tight">
                {user?.full_name || 'Priya Sharma'}
              </div>
              <div className="text-[10px] text-cyan-400 font-mono leading-none">
                {user?.role || 'SOC Analyst'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-[#101827] border border-cyan-500/30 rounded-xl shadow-2xl p-2 z-50">
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-xs font-bold text-white">{user?.full_name}</p>
                <p className="text-[11px] text-slate-400">{user?.email}</p>
                <div className="mt-1 flex items-center space-x-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30 font-mono">
                    {user?.role}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {user?.badge_id}
                  </span>
                </div>
              </div>

              {/* Role Switcher helper for review */}
              <div className="p-2 border-b border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">Switch Demo Role</p>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => {
                      quickLogin('Analyst');
                      setShowProfileMenu(false);
                    }}
                    className={`text-[11px] py-1 px-2 rounded text-center transition ${
                      user?.role === 'SOC Analyst'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-slate-800/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    SOC Analyst
                  </button>
                  <button
                    onClick={() => {
                      quickLogin('Admin');
                      setShowProfileMenu(false);
                    }}
                    className={`text-[11px] py-1 px-2 rounded text-center transition ${
                      user?.role === 'Security Administrator'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-slate-800/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    Sec Admin
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  logout();
                  setShowProfileMenu(false);
                }}
                className="w-full flex items-center space-x-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 px-3 py-2 rounded-lg transition mt-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout Session</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
