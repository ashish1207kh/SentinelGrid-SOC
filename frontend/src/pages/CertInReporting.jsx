import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Eye,
  Plus,
  RefreshCw,
  Shield,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Code,
  Printer
} from 'lucide-react';
import { api } from '../services/api';
import { useDemo } from '../context/DemoContext';

export default function CertInReporting() {
  const { refreshKey, triggerDataRefresh } = useDemo();
  const [reports, setReports] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // Generator modal state
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [targetIncidentId, setTargetIncidentId] = useState('');
  const [category, setCategory] = useState('Targeted Intrusion / Critical Infrastructure Attack');
  const [remarks, setRemarks] = useState('Generated for CNI compliance audit demonstration.');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [repData, incData] = await Promise.all([
        api.getCertInReports(),
        api.getIncidents()
      ]);
      setReports(repData);
      setIncidents(incData);
      if (repData.length > 0 && !selectedReport) {
        const detail = await api.getCertInReportDetail(repData[0].report_reference);
        setSelectedReport(detail);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [refreshKey]);

  const handleSelectReport = async (refId) => {
    try {
      const detail = await api.getCertInReportDetail(refId);
      setSelectedReport(detail);
    } catch (err) {
      console.error('Error loading report:', err);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.generateCertInReport(targetIncidentId, category, remarks);
      setIsGenerateOpen(false);
      fetchReports();
      triggerDataRefresh();
      alert(`Report ${res.report_reference} generated successfully!`);
    } catch (err) {
      alert(`Generation failed: ${err.message}`);
    }
  };

  const handleDownloadPdf = (refId) => {
    window.open(api.getCertInPdfUrl(refId), '_blank');
  };

  const handleExportJson = (refId) => {
    window.open(api.getCertInJsonUrl(refId), '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold font-mono text-white tracking-wide flex items-center space-x-2">
            <span>CERT-In INCIDENT COMPLIANCE REPORTING</span>
            <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800 font-mono font-bold">
              SECTION 70B IT ACT 2000
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Automated statutory cyber security incident reporting framework aligned with Indian National CERT directives
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              if (incidents.length > 0) setTargetIncidentId(incidents[0].incident_id);
              setIsGenerateOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs transition shadow-[0_0_15px_rgba(0,218,218,0.3)]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate New Report</span>
          </button>

          <button
            onClick={fetchReports}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-mono transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Official Disclaimer Banner */}
      <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 flex items-start space-x-3 font-mono">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">MANDATORY DEMONSTRATION NOTICE:</span> Generated compliance records represent synthetic demonstration reports prepared within the SentinelGrid training testbed for academic & SOC evaluation purposes. They are not officially filed with CERT-In authorities.
        </div>
      </div>

      {/* Main Grid: Reports List (1 col) and Executive Preview (2 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports List */}
        <div className="p-4 rounded-2xl bg-[#101827] border border-cyan-500/20 shadow-xl space-y-4">
          <span className="text-xs font-mono font-bold text-slate-300 uppercase block">
            GENERATED COMPLIANCE FILINGS ({reports.length})
          </span>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {reports.map((r) => {
              const isSelected = selectedReport?.report_reference === r.report_reference;
              return (
                <div
                  key={r.report_reference}
                  onClick={() => handleSelectReport(r.report_reference)}
                  className={`p-3 rounded-xl cursor-pointer transition border text-xs font-mono ${
                    isSelected
                      ? 'bg-[#080B12] border-cyan-400 shadow-[0_0_15px_rgba(0,218,218,0.2)]'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-cyan-400">{r.report_reference}</span>
                    <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-800">
                      {r.status}
                    </span>
                  </div>

                  <div className="text-slate-200 text-xs font-sans font-bold truncate">
                    {r.incident_category}
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Incident: <strong className="text-slate-300">{r.incident_id}</strong></span>
                    <span>{r.created_at.split(' ')[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Executive Report Preview Document */}
        {selectedReport ? (
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#101827] border border-cyan-500/30 shadow-xl space-y-5">
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <span className="font-mono font-bold text-white text-sm">
                  OFFICIAL INCIDENT REPORT PREVIEW
                </span>
              </div>

              <div className="flex items-center space-x-2 text-xs font-mono">
                <button
                  onClick={() => handleDownloadPdf(selectedReport.report_reference)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition shadow-[0_0_15px_rgba(0,218,218,0.3)]"
                >
                  <Download className="w-3.5 h-3.5 fill-black" />
                  <span>Download Official PDF</span>
                </button>

                <button
                  onClick={() => handleExportJson(selectedReport.report_reference)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 transition"
                >
                  <Code className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Export JSON</span>
                </button>
              </div>
            </div>

            {/* Document Sheet Layout */}
            <div className="p-6 rounded-xl bg-[#080B12] border border-slate-800 space-y-5 text-xs font-mono shadow-inner">
              {/* Document Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div>
                  <div className="text-base font-extrabold text-white tracking-wider flex items-center space-x-2">
                    <span>SENTINELGRID</span>
                    <span className="text-cyan-400">DEFENSE OPERATIONS</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                    Critical National Infrastructure Cyber Security Operations Centre
                  </p>
                  <div className="mt-1 text-[10px] text-cyan-400">
                    Form Reference: CERT-In/SEC70B/2026/P1
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-cyan-400">{selectedReport.report_reference}</div>
                  <div className="text-[10px] text-slate-500">Classification: CNI PROTECTED</div>
                  <span className="inline-block mt-1 text-[10px] bg-red-950 text-red-400 px-2 py-0.5 rounded border border-red-800 font-bold">
                    DEMO SIMULATION
                  </span>
                </div>
              </div>

              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                <div className="p-3 bg-[#101827] rounded-lg border border-slate-800/80 space-y-0.5">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Incident Reference & Category</span>
                  <div className="text-white font-bold">{selectedReport.incident_id}</div>
                  <div className="text-cyan-400">{selectedReport.incident_category}</div>
                </div>

                <div className="p-3 bg-[#101827] rounded-lg border border-slate-800/80 space-y-0.5">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Detection & Occurrence Times</span>
                  <div className="text-slate-200">Detected: {selectedReport.detection_time} UTC</div>
                  <div className="text-slate-400">Occurred: {selectedReport.occurrence_time} UTC</div>
                </div>

                <div className="p-3 bg-[#101827] rounded-lg border border-slate-800/80 space-y-0.5">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Affected Critical Systems</span>
                  <div className="text-slate-200">{selectedReport.affected_systems}</div>
                </div>

                <div className="p-3 bg-[#101827] rounded-lg border border-slate-800/80 space-y-0.5">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Source & Destination IPs</span>
                  <div className="text-red-400">Src: {selectedReport.source_ip}</div>
                  <div className="text-slate-300">Dst: {selectedReport.destination_ip}</div>
                </div>
              </div>

              {/* Narrative Sections */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    1. Incident Description & Attack Vector Analysis:
                  </span>
                  <p className="p-3 rounded-lg bg-[#101827] border border-slate-800/80 text-slate-200 font-sans leading-relaxed text-xs">
                    {selectedReport.description}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    2. Indicators of Compromise (IOCs) & Forensics:
                  </span>
                  <div className="p-3 rounded-lg bg-[#101827] border border-slate-800/80 text-cyan-400 text-xs font-mono">
                    {selectedReport.iocs}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    3. Impact Assessment on Critical Services:
                  </span>
                  <p className="p-3 rounded-lg bg-[#101827] border border-slate-800/80 text-slate-200 font-sans leading-relaxed text-xs">
                    {selectedReport.impact_assessment}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    4. Remediation & Containment Measures Enacted:
                  </span>
                  <p className="p-3 rounded-lg bg-[#101827] border border-slate-800/80 text-slate-200 font-sans leading-relaxed text-xs">
                    {selectedReport.actions_taken}
                  </p>
                </div>
              </div>

              {/* Sign-off */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                <span>Filing Officer: <strong className="text-white">{selectedReport.generated_by}</strong></span>
                <span>Filing Timestamp: <strong className="text-cyan-400">{selectedReport.created_at} UTC</strong></span>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 p-12 rounded-2xl bg-[#101827] border border-cyan-500/20 shadow-xl flex flex-col items-center justify-center text-center text-slate-500">
            <FileText className="w-12 h-12 text-slate-600 mb-2" />
            <p className="text-sm font-mono">Select a generated report from the list to preview official filing.</p>
          </div>
        )}
      </div>

      {/* Generate Report Dialog */}
      {isGenerateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-lg bg-[#080B12] border border-cyan-500/40 rounded-2xl shadow-2xl p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>GENERATE CERT-In COMPLIANCE FILING</span>
              </h3>
              <button
                onClick={() => setIsGenerateOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-3">
              <div>
                <label className="block text-slate-400 uppercase text-[10px] mb-1">Select Trigger Incident</label>
                <select
                  value={targetIncidentId}
                  onChange={(e) => setTargetIncidentId(e.target.value)}
                  required
                  className="w-full bg-[#101827] border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-400"
                >
                  {incidents.map((inc) => (
                    <option key={inc.incident_id} value={inc.incident_id}>
                      {inc.incident_id} - {inc.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 uppercase text-[10px] mb-1">Statutory Incident Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#101827] border border-slate-700 rounded-lg p-2 text-white focus:outline-none"
                >
                  <option value="Targeted Intrusion / Critical Infrastructure Attack">Targeted Intrusion / Critical Infrastructure Attack</option>
                  <option value="Ransomware / Malicious Code Attack">Ransomware / Malicious Code Attack</option>
                  <option value="Unauthorized Access of IT Systems / Data Breach">Unauthorized Access of IT Systems / Data Breach</option>
                  <option value="Identity Theft, Spoofing and Phishing Attacks">Identity Theft, Spoofing and Phishing Attacks</option>
                  <option value="Denial of Service (DoS) / Distributed DoS (DDoS)">Denial of Service (DoS) / Distributed DoS (DDoS)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 uppercase text-[10px] mb-1">Additional Regulatory Remarks</label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full bg-[#101827] border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsGenerateOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-[0_0_15px_rgba(0,218,218,0.3)]"
                >
                  Generate Filing Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
