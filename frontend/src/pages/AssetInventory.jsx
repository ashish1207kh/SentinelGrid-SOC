import React, { useState, useEffect } from 'react';
import {
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Radio,
  Search,
  Filter,
  RefreshCw,
  Lock,
  Unlock,
  AlertTriangle,
  Cpu,
  Activity,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { useDemo } from '../context/DemoContext';

export default function AssetInventory() {
  const { refreshKey, triggerDataRefresh } = useDemo();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [purdueFilter, setPurdueFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const data = await api.getAssets();
      setAssets(data);
    } catch (err) {
      console.error('Error fetching assets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [refreshKey]);

  const handleQuarantine = async (assetId, currentStatus) => {
    setActionLoading(assetId);
    try {
      if (currentStatus) {
        await api.unquarantineAsset(assetId);
      } else {
        await api.quarantineAsset(assetId);
      }
      fetchAssets();
      triggerDataRefresh();
    } catch (err) {
      alert(`Asset state change failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAssets = assets.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch =
      a.name.toLowerCase().includes(q) ||
      a.asset_tag.toLowerCase().includes(q) ||
      a.ip_address.includes(q) ||
      a.os.toLowerCase().includes(q);
    const matchPurdue = purdueFilter === 'all' || a.purdue_level.toLowerCase().includes(purdueFilter.toLowerCase());
    return matchSearch && matchPurdue;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold font-mono text-white tracking-wide flex items-center space-x-2">
            <span>ASSET & DEVICE INVENTORY</span>
            <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800 font-mono font-bold">
              PURDUE MODEL ALIGNED
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Critical National Infrastructure OT/IT topology covering Level 1 Physical Control through Level 4 Enterprise IT
          </p>
        </div>

        <button
          onClick={fetchAssets}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-mono transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Purdue Hierarchy Quick Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-xl">
          <span className="text-[10px] text-red-400 uppercase font-bold block">Purdue Level 1</span>
          <span className="font-bold text-slate-200">Basic Process & RTUs</span>
          <div className="text-[10px] text-slate-400 mt-1">Direct Physical Switchgear</div>
        </div>
        <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl">
          <span className="text-[10px] text-amber-400 uppercase font-bold block">Purdue Level 2</span>
          <span className="font-bold text-slate-200">Area Supervisory & HMI</span>
          <div className="text-[10px] text-slate-400 mt-1">SCADA Master Controllers</div>
        </div>
        <div className="p-3 bg-blue-950/20 border border-blue-500/30 rounded-xl">
          <span className="text-[10px] text-blue-400 uppercase font-bold block">Purdue Level 3</span>
          <span className="font-bold text-slate-200">Site Operations & Historian</span>
          <div className="text-[10px] text-slate-400 mt-1">Engineering Jumpboxes & DBs</div>
        </div>
        <div className="p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-xl">
          <span className="text-[10px] text-cyan-400 uppercase font-bold block">Purdue Level 4</span>
          <span className="font-bold text-slate-200">Enterprise IT & Identity</span>
          <div className="text-[10px] text-slate-400 mt-1">Active Directory & Gateways</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-xl bg-[#101827] border border-cyan-500/20 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets by tag, name, IP, or OS..."
            className="w-full bg-[#080B12] border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-slate-400">Purdue Level:</span>
          <select
            value={purdueFilter}
            onChange={(e) => setPurdueFilter(e.target.value)}
            className="bg-[#080B12] border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none"
          >
            <option value="all">All Levels</option>
            <option value="Level 1">Level 1 - Basic Control</option>
            <option value="Level 2">Level 2 - Area Supervisory</option>
            <option value="Level 3">Level 3 - Site Operations</option>
            <option value="Level 4">Level 4 - Enterprise IT</option>
          </select>
        </div>
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssets.map((asset) => (
          <div
            key={asset.id}
            className={`p-4 rounded-xl border transition-all text-xs font-mono flex flex-col justify-between ${
              asset.isolation_status
                ? 'bg-red-950/20 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                : 'bg-[#101827] border-cyan-500/20 hover:border-cyan-500/40 shadow-lg'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-400 text-xs">{asset.asset_tag}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    asset.criticality === 'Critical'
                      ? 'bg-red-950 text-red-400 border border-red-800'
                      : asset.criticality === 'High'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-blue-950 text-blue-400 border border-blue-800'
                  }`}
                >
                  {asset.criticality} CRITICALITY
                </span>
              </div>

              <div>
                <h3 className="font-bold text-white text-sm font-sans">{asset.name}</h3>
                <div className="text-[10px] text-cyan-300/80 mt-0.5">{asset.asset_type}</div>
              </div>

              <div className="p-2.5 bg-[#080B12] rounded-lg border border-slate-800 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">IP Address:</span>
                  <span className="text-slate-200">{asset.ip_address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Purdue Zone:</span>
                  <span className="text-slate-300 font-bold">{asset.purdue_level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Operating System:</span>
                  <span className="text-slate-300 truncate max-w-[170px]" title={asset.os}>{asset.os}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Associated Alerts:</span>
                  <span className={asset.associated_alerts_count > 0 ? 'text-red-400 font-bold' : 'text-slate-400'}>
                    {asset.associated_alerts_count} active
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-[11px]">
                <span
                  className={`w-2 h-2 rounded-full ${
                    asset.isolation_status
                      ? 'bg-red-500 animate-ping'
                      : asset.status === 'Compromised'
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                />
                <span className={asset.isolation_status ? 'text-red-400 font-bold' : 'text-slate-300'}>
                  {asset.isolation_status ? 'QUARANTINED' : asset.status}
                </span>
              </div>

              <button
                onClick={() => handleQuarantine(asset.id, asset.isolation_status)}
                disabled={actionLoading === asset.id}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                  asset.isolation_status
                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                    : 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40'
                }`}
              >
                {asset.isolation_status ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>{actionLoading === asset.id ? 'Updating...' : asset.isolation_status ? 'Release Quarantine' : 'Quarantine Host'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
