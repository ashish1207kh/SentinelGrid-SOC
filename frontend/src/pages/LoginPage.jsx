import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Server,
  Zap,
  AlertCircle,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, quickLogin, loading } = useAuth();
  const [email, setEmail] = useState('analyst@sentinelgrid.cni');
  const [password, setPassword] = useState('Analyst@2026');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(email, password);
    if (!res.success) {
      setError(res.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleQuick = async (role) => {
    setError('');
    const res = await quickLogin(role);
    if (!res.success) {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B12] text-slate-100 flex flex-col justify-center items-center p-4 cyber-grid-bg relative overflow-hidden select-none">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-slate-900 border border-cyan-400/40 shadow-[0_0_30px_rgba(0,218,218,0.3)] mb-3">
            <Shield className="w-8 h-8 text-cyan-400" />
          </div>

          <h1 className="text-2xl font-extrabold font-mono tracking-wider text-white">
            SENTINEL<span className="text-cyan-400">GRID</span>
          </h1>

          <p className="text-xs text-slate-400 font-sans tracking-wide mt-1">
            AI-Driven Cyber Resilience Platform for Critical National Infrastructure
          </p>

          <div className="inline-flex items-center space-x-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Secure Worldz AI Security Analyst Internship</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="p-6 md:p-8 rounded-2xl bg-[#101827]/80 backdrop-blur-xl border border-cyan-500/20 shadow-2xl space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold font-mono text-white tracking-wide">
              AUTHENTICATE SOC ANALYST SESSION
            </h2>
            <p className="text-[11px] text-slate-400">
              Enter your CNI operations credentials or select a pre-configured role below.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                Analyst Identity (Email)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="analyst@sentinelgrid.cni"
                  className="w-full bg-[#080B12] border border-slate-700 focus:border-cyan-400 rounded-lg pl-9 pr-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-[#080B12] border border-slate-700 focus:border-cyan-400 rounded-lg pl-9 pr-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-400 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-mono font-bold text-xs uppercase tracking-wider transition shadow-[0_0_20px_rgba(0,218,218,0.35)] flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Establish Secure Session'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider block text-center">
              Quick 1-Click Demo Profiles
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuick('Analyst')}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/40 text-left transition group"
              >
                <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-400">
                  <span>Priya Sharma</span>
                  <span className="text-[9px] bg-cyan-950 px-1 py-0.2 rounded border border-cyan-800">Analyst</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">analyst@sentinelgrid.cni</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuick('Admin')}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/40 text-left transition group"
              >
                <div className="flex items-center justify-between text-xs font-mono font-bold text-blue-400">
                  <span>Vikram Malhotra</span>
                  <span className="text-[9px] bg-blue-950 px-1 py-0.2 rounded border border-blue-800">Admin</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">admin@sentinelgrid.cni</div>
              </button>
            </div>
          </div>
        </div>

        {/* Feature Badges Footer */}
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-[10px] font-mono text-slate-500">
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Isolation Forest ML</span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">XAI Explanations</span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">MITRE ATT&CK</span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">CERT-In Reporting</span>
        </div>
      </div>
    </div>
  );
}
