import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

// Relative path — Vite's dev server proxy (see vite.config.js) forwards
// anything under /api to http://127.0.0.1:8000, so the browser only ever
// talks to its own origin and CORS never enters the picture in dev.
// In production, put the same backend behind the same origin/reverse proxy
// (or set this back to an absolute URL with CORS enabled on the backend).
const API_BASE = "/api";

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');

:root {
  --void:         #080B14;
  --panel:        #0E1424;
  --panel-raised: #131C31;
  --hairline:     #1D2740;
  --text:         #EAEEF7;
  --dim:          #8992AC;
  --faint:        #4C5674;
  --amber:        #2DD9EE;
  --amber-dim:    #0E5C6B;
  --ok:           #33E29B;
  --crit:         #FF4D66;
  --med:          #FFB13D;
  --low:          #4C8DFF;
  --violet:       #8B7BFF;
  --mono:         'JetBrains Mono', monospace;
  --sans:         'Inter', sans-serif;
  --display:      'Space Grotesk', sans-serif;
}

.sg {
  background:
    radial-gradient(1100px 600px at 12% -10%, rgba(45,217,238,0.07), transparent 60%),
    radial-gradient(900px 500px at 100% 0%, rgba(139,123,255,0.06), transparent 55%),
    var(--void);
  color: var(--text);
  font-family: var(--sans);
  min-height: 100vh;
}

.sg *, .sg *::before, .sg *::after { box-sizing: border-box; margin: 0; padding: 0; }
.sg ::selection { background: var(--amber); color: var(--void); }
.sg :focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
.sg a, .sg button { font-family: inherit; }

/* ── SHELL ── */
.sg .wrap { max-width: 1480px; margin: 0 auto; padding: 0 28px 60px; }

/* ── TOPBAR ── */
.sg .topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 22px 0 18px; gap: 20px; flex-wrap: wrap;
  border-bottom: 1px solid var(--hairline); margin-bottom: 4px;
}
.sg .brand { display: flex; align-items: center; gap: 14px; }
.sg .brand-text .word {
  font-family: var(--display); font-weight: 700; font-size: 20px;
  letter-spacing: 0.5px; color: var(--text);
}
.sg .brand-text .eyebrow {
  font-family: var(--mono); font-size: 10px; letter-spacing: 1.6px;
  color: var(--faint); margin-top: 3px;
}
.sg .top-right { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.sg .clock { font-family: var(--mono); font-size: 12.5px; color: var(--dim); letter-spacing: 1px; }
.sg .status-pill {
  display: flex; align-items: center; gap: 8px; font-family: var(--mono);
  font-size: 10.5px; letter-spacing: 1.5px; color: var(--ok); font-weight: 600;
  border: 1px solid var(--hairline); padding: 8px 13px;
  border-radius: 8px; background: var(--panel);
}
.sg .status-pill .dot {
  width: 7px; height: 7px; border-radius: 50%; background: var(--ok);
  box-shadow: 0 0 8px var(--ok); animation: sg-pulse 2s ease-in-out infinite;
}
.sg .status-pill.assessing { color: var(--amber); }
.sg .status-pill.assessing .dot { background: var(--amber); box-shadow: 0 0 8px var(--amber); }
@keyframes sg-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }

.sg .btn-run {
  background: linear-gradient(135deg, var(--amber), var(--low)); color: #06121A; border: none;
  font-family: var(--sans); font-weight: 700; font-size: 12.5px;
  letter-spacing: 0.3px; padding: 12px 20px; cursor: pointer;
  display: flex; align-items: center; gap: 9px; border-radius: 9px;
  transition: filter 0.15s ease, transform 0.1s ease;
}
.sg .btn-run:hover { filter: brightness(1.08); }
.sg .btn-run:active { transform: scale(0.97); }
.sg .btn-run:disabled { background: var(--amber-dim); color: #9fb1b6; cursor: progress; filter: none; }
.sg .btn-run svg { width: 14px; height: 14px; }

/* ── TICKER ── */
.sg .ticker {
  border-top: 1px solid var(--hairline); border-bottom: 1px solid var(--hairline);
  background: var(--panel); overflow: hidden; white-space: nowrap; border-radius: 9px; margin-top: 16px;
}
.sg .ticker-track {
  display: inline-block; font-family: var(--mono); font-size: 11px;
  letter-spacing: 1.5px; color: var(--dim); padding: 10px 0;
  animation: sg-scroll 28s linear infinite;
}
.sg .ticker-track span { margin-right: 48px; }
.sg .ticker-track .accent { color: var(--amber); }
@keyframes sg-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }

/* ── MAIN 2-COL LAYOUT: RAIL + CONTENT ── */
.sg .main { display: grid; grid-template-columns: 240px 1fr; gap: 22px; margin-top: 24px; align-items: start; }

/* ── RAIL (SIDE PANEL) ── */
.sg .rail {
  display: flex; flex-direction: column; gap: 4px;
  background: var(--panel); border: 1px solid var(--hairline); border-radius: 16px;
  padding: 16px 12px; position: sticky; top: 24px;
}
.sg .rail-heading {
  font-family: var(--mono); font-size: 10px; letter-spacing: 2px; color: var(--faint);
  padding: 4px 10px 12px;
}
.sg .rail-btn {
  width: 100%; height: auto; display: flex; align-items: center; gap: 12px;
  justify-content: flex-start; text-align: left;
  background: transparent; border: 1px solid transparent; color: var(--dim);
  cursor: pointer; border-radius: 10px; position: relative; padding: 11px 12px;
  font-family: var(--sans); font-size: 12.5px; font-weight: 500;
  transition: color 0.12s ease, border-color 0.12s ease, background 0.12s ease;
}
.sg .rail-btn svg { width: 17px; height: 17px; flex-shrink: 0; }
.sg .rail-btn:hover { color: var(--text); border-color: var(--hairline); background: var(--panel-raised); }
.sg .rail-btn.active {
  color: #06121A; border-color: transparent;
  background: linear-gradient(135deg, var(--amber), var(--low));
  box-shadow: 0 0 18px rgba(45,217,238,0.28);
  font-weight: 600;
}
.sg .rail-btn.active svg { color: #06121A; }
.sg .rail-label { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sg .rail-divider { height: 1px; background: var(--hairline); margin: 10px 4px; }

/* ── CONTENT ── */
.sg .content { min-width: 0; }

/* ── HERO ROW: radar (wide) + stat stack (narrow) ── */
.sg .hero-row {
  display: grid; grid-template-columns: 1fr 310px;
  gap: 20px; margin-bottom: 22px;
}

/* ── RADAR PANEL ── */
.sg .radar-panel {
  background: var(--panel); border: 1px solid var(--hairline);
  border-radius: 16px; padding: 22px; position: relative; overflow: hidden;
}
.sg .radar-head {
  display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;
}
.sg .radar-head .title { font-family: var(--display); font-weight: 700; font-size: 14.5px; letter-spacing: 0.3px; color: var(--text); }
.sg .radar-head .sub { font-family: var(--mono); font-size: 10px; color: var(--faint); letter-spacing: 1.5px; margin-top: 4px; }
.sg .radar-head .win { font-family: var(--mono); font-size: 10px; color: var(--dim); text-align: right; line-height: 1.6; }
.sg .radar-svg-wrap { display: flex; justify-content: center; padding: 6px 0 0; }
.sg .sweep-group { transform-origin: 250px 250px; animation: sg-spin 6s linear infinite; }
.sg .sweep-group.fast { animation-duration: 1.4s; }
@keyframes sg-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.sg .ring { fill: none; stroke: var(--hairline); stroke-width: 1; }
.sg .spoke { stroke: var(--hairline); stroke-width: 1; }
.sg .ring-label { font-family: var(--mono); font-size: 9px; fill: var(--faint); letter-spacing: 1px; }
.sg .node { fill: var(--low); opacity: 0.9; }
.sg .node-core { fill: var(--ok); }
.sg .log-entry {
  margin-top: 14px; font-family: var(--mono); font-size: 11px; color: var(--dim);
  border-top: 1px solid var(--hairline); padding-top: 12px; display: flex; gap: 10px;
}
.sg .log-entry .t { color: var(--faint); }
.sg .blink {
  display: inline-block; width: 7px; height: 12px; background: var(--amber);
  margin-left: 4px; animation: sg-blink 1s steps(1) infinite; vertical-align: -2px;
}
@keyframes sg-blink { 50% { opacity: 0; } }

/* ── STAT STACK ── */
.sg .stat-stack { display: flex; flex-direction: column; gap: 10px; }
.sg .stat {
  background: var(--panel); border: 1px solid var(--hairline);
  border-radius: 13px; padding: 16px 18px; position: relative; overflow: hidden;
}
.sg .stat::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--hairline); border-radius: 3px 0 0 3px; }
.sg .stat.on::before { background: var(--ok); }
.sg .stat.warn::before { background: var(--amber); }
.sg .stat-label { font-family: var(--mono); font-size: 10px; letter-spacing: 1.5px; color: var(--faint); }
.sg .stat-val { font-family: var(--display); font-size: 28px; font-weight: 700; margin-top: 8px; color: var(--text); }
.sg .stat.on .stat-val { color: var(--ok); }
.sg .stat.warn .stat-val { color: var(--amber); }
.sg .stat-val .unit { font-size: 14px; color: var(--dim); margin-left: 4px; }

/* ── SECTION HEAD ── */
.sg .section-head {
  display: flex; align-items: baseline; justify-content: space-between;
  margin-bottom: 12px; flex-wrap: wrap; gap: 8px;
}
.sg .section-head h2 { font-family: var(--display); font-weight: 700; font-size: 15px; letter-spacing: 0.3px; }
.sg .section-head .count { font-family: var(--mono); font-size: 11px; color: var(--faint); }
.sg .section-head-right { display: flex; align-items: center; gap: 14px; }

/* ── HAND-DRAWN ICON TREATMENT ── */
.sg .sketch-icon { filter: url(#handSketch); }

/* ── DOWNLOAD REPORT BUTTON ── */
.sg .btn-download {
  display: flex; align-items: center; gap: 8px;
  background: var(--panel-raised); border: 1px solid var(--hairline); color: var(--text);
  font-family: var(--sans); font-weight: 600; font-size: 11.5px; letter-spacing: 0.2px;
  padding: 9px 15px; border-radius: 8px; cursor: pointer; transition: all 0.15s ease;
}
.sg .btn-download:hover { border-color: var(--amber-dim); color: var(--amber); background: var(--panel); }
.sg .btn-download:active { transform: scale(0.97); }
.sg .btn-download svg { width: 14px; height: 14px; flex-shrink: 0; }

/* ── PANEL ── */
.sg .panel {
  background: var(--panel); border: 1px solid var(--hairline); border-radius: 14px; min-height: 220px;
}
.sg .panel-title {
  font-family: var(--display); font-weight: 700; font-size: 11.5px; letter-spacing: 1px; color: var(--text);
  padding: 15px 17px 0; margin-bottom: 10px;
  display: flex; align-items: baseline; justify-content: space-between;
}
.sg .panel-title .pcount { font-family: var(--mono); font-size: 10px; color: var(--faint); }

/* ── WIREFRAME DASHBOARD GRID (below hero) ── */
.sg .dash-grid {
  display: grid;
  grid-template-columns: 250px 1fr 250px;
  grid-template-rows: auto auto;
  gap: 18px;
  margin-bottom: 18px;
}
.sg .dg-left-top    { grid-column: 1; grid-row: 1; }
.sg .dg-center      { grid-column: 2; grid-row: 1 / 3; display: flex; flex-direction: column; gap: 14px; }
.sg .dg-right-top   { grid-column: 3; grid-row: 1; display: flex; flex-direction: column; gap: 12px; }
.sg .dg-left-bottom { grid-column: 1; grid-row: 2; }
.sg .dg-right-bot   { grid-column: 3; grid-row: 2; display: flex; flex-direction: column; gap: 12px; }

/* ── TWO-COLUMN TAB LAYOUT ── */
.sg .cols-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
@media (max-width: 760px) {
  .sg .cols-2 { grid-template-columns: 1fr; }
}

/* ── ANALYTICS: TREND CHART ── */
.sg .chart-pad { padding: 4px 17px 18px; }
.sg .legend { display: flex; gap: 16px; flex-wrap: wrap; padding: 0 17px; margin-bottom: 6px; }
.sg .legend-item { display: flex; align-items: center; gap: 6px; font-family: var(--mono); font-size: 10px; color: var(--dim); }
.sg .legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

/* ── ANALYTICS: SEVERITY DONUT ── */
.sg .donut-row { display: flex; align-items: center; gap: 22px; padding: 6px 17px 20px; flex-wrap: wrap; }
.sg .donut-legend { display: flex; flex-direction: column; gap: 11px; flex: 1; min-width: 160px; }
.sg .donut-legend-row { display: flex; align-items: center; justify-content: space-between; font-family: var(--mono); font-size: 11.5px; }
.sg .donut-legend-key { display: flex; align-items: center; gap: 8px; color: var(--dim); }
.sg .donut-legend-key .sw { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.sg .donut-legend-val { color: var(--text); font-weight: 600; }

/* ── ANALYTICS: ATTACK VECTORS ── */
.sg .vector-row { padding: 11px 17px; border-radius: 8px; transition: background 0.12s ease; }
.sg .vector-row:hover { background: var(--panel-raised); }
.sg .vector-label { display: flex; justify-content: space-between; align-items: baseline; font-family: var(--mono); font-size: 11px; color: var(--dim); margin-bottom: 7px; }
.sg .vector-label strong { color: var(--text); font-weight: 600; }
.sg .cbar-wrap-full { width: 100%; height: 7px; background: var(--hairline); border-radius: 4px; overflow: hidden; }
.sg .cbar-wrap-full .cbar { height: 100%; border-radius: 4px; transition: filter 0.12s ease; }
.sg .vector-row:hover .cbar { filter: brightness(1.25); }

/* ── ANALYTICS: HOVER TOOLTIP ── */
.sg .chart-tooltip {
  position: absolute; z-index: 6; pointer-events: none;
  background: var(--panel-raised); border: 1px solid var(--hairline);
  border-radius: 9px; padding: 9px 12px; min-width: 128px;
  box-shadow: 0 10px 26px rgba(0,0,0,0.45);
  transition: left 0.06s linear, top 0.06s linear;
}
.sg .chart-tooltip-day {
  font-family: var(--mono); font-size: 10px; font-weight: 700; letter-spacing: 1px;
  color: var(--text); margin-bottom: 6px;
}
.sg .chart-tooltip-row {
  display: flex; align-items: center; gap: 7px; font-family: var(--mono);
  font-size: 10.5px; color: var(--dim); margin-top: 4px; white-space: nowrap;
}
.sg .chart-tooltip-row:first-of-type { margin-top: 0; }
.sg .chart-tooltip-row .sw { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.sg .chart-tooltip-row strong { margin-left: auto; color: var(--text); padding-left: 12px; font-weight: 600; }

/* ── CORRELATED INCIDENTS PANEL ── */
.sg .ci-list { }
.sg .ci-item {
  padding: 14px 17px; border-bottom: 1px solid var(--hairline);
  font-family: var(--mono); font-size: 11px;
}
.sg .ci-item:last-child { border-bottom: none; }
.sg .ci-id { color: var(--amber); font-size: 10px; letter-spacing: 1px; margin-bottom: 4px; font-weight: 600; }
.sg .ci-desc { color: var(--dim); line-height: 1.55; font-size: 10.5px; }
.sg .ci-meta { color: var(--faint); font-size: 10px; margin-top: 5px; letter-spacing: 0.5px; }

/* ── ANOMALY ALERT ── */
.sg .anomaly-card {
  background: var(--panel); border: 1px solid var(--hairline);
  border-left: 3px solid var(--amber); border-radius: 14px; padding: 16px 18px;
}
.sg .anomaly-head {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 9px;
}
.sg .anomaly-title { font-family: var(--mono); font-size: 11px; letter-spacing: 1.5px; color: var(--amber); font-weight: 600; }
.sg .anomaly-time  { font-family: var(--mono); font-size: 10px; color: var(--faint); }
.sg .anomaly-body  { font-family: var(--mono); font-size: 11px; color: var(--dim); line-height: 1.6; }
.sg .anomaly-tags  { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px; }

/* ── EVENT HIGH / FEED ── */
.sg .feed-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 13px 17px; border-bottom: 1px solid var(--hairline);
}
.sg .feed-head-title { font-family: var(--display); font-weight: 700; font-size: 11px; letter-spacing: 1px; }
.sg .feed-live {
  display: flex; align-items: center; gap: 6px;
  font-family: var(--mono); font-size: 10px; color: var(--ok); letter-spacing: 1px;
}
.sg .feed-live .live-dot {
  width: 6px; height: 6px; border-radius: 50%; background: var(--ok);
  box-shadow: 0 0 6px var(--ok); animation: sg-pulse 2s ease-in-out infinite;
}
.sg .log-list { padding: 4px 0; }
.sg .log-row {
  display: flex; gap: 16px; padding: 12px 17px;
  font-family: var(--mono); font-size: 11.5px; color: var(--dim);
  border-bottom: 1px solid var(--hairline); transition: background 0.1s ease;
}
.sg .log-row:last-child { border-bottom: none; }
.sg .log-row:hover { background: var(--panel-raised); }
.sg .lt { color: var(--faint); flex-shrink: 0; width: 78px; }
.sg .lm { flex-shrink: 0; width: 64px; font-weight: 600; }
.sg .lm-ok   { color: var(--ok); }
.sg .lm-warn { color: var(--amber); }
.sg .lm-crit { color: var(--crit); }

/* ── EMAIL MSG ── */
.sg .mail-card {
  background: var(--panel); border: 1px solid var(--hairline); border-radius: 14px; padding: 15px 17px;
}
.sg .mail-head {
  display: flex; align-items: center; gap: 8px;
  border-bottom: 1px solid var(--hairline); padding-bottom: 10px; margin-bottom: 10px;
}
.sg .mail-icon { color: var(--amber); flex-shrink: 0; }
.sg .mail-subject { font-family: var(--mono); font-size: 11px; letter-spacing: 0.5px; color: var(--text); flex: 1; }
.sg .mail-from { font-family: var(--mono); font-size: 10px; color: var(--faint); }
.sg .mail-body { font-family: var(--mono); font-size: 10.5px; color: var(--dim); line-height: 1.65; }

/* ── RESPONSE PLAYBOOKS ── */
.sg .pb-item {
  display: flex; align-items: flex-start; gap: 11px;
  padding: 13px 15px; border-bottom: 1px solid var(--hairline);
}
.sg .pb-item:last-child { border-bottom: none; }
.sg .pb-num  { font-family: var(--display); font-weight: 700; font-size: 10px; color: var(--amber); flex-shrink: 0; letter-spacing: 1px; padding-top: 1px; }
.sg .pb-name { font-family: var(--mono); font-size: 11px; color: var(--text); margin-bottom: 3px; font-weight: 600; }
.sg .pb-desc { font-family: var(--mono); font-size: 10px; color: var(--faint); line-height: 1.5; }

/* ── CAMPAIGN MINI ── */
.sg .camp-row {
  padding: 12px 15px; border-bottom: 1px solid var(--hairline);
  font-family: var(--mono); font-size: 11px;
}
.sg .camp-row:last-child { border-bottom: none; }
.sg .camp-id   { color: var(--amber); font-size: 10px; letter-spacing: 1px; margin-bottom: 3px; font-weight: 600; }
.sg .camp-desc { color: var(--dim); line-height: 1.5; font-size: 10.5px; }

/* ── PLAYBOOK STAGE ── */
.sg .stage-row {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 12px 15px; border-bottom: 1px solid var(--hairline);
  font-family: var(--mono); font-size: 11px;
}
.sg .stage-row:last-child { border-bottom: none; }
.sg .stage-n    { color: var(--amber); font-size: 10px; flex-shrink: 0; width: 20px; font-weight: 600; }
.sg .stage-name { color: var(--text); font-size: 11px; margin-bottom: 2px; }
.sg .stage-mid  { color: var(--low); font-size: 10px; letter-spacing: 0.5px; }

/* ── BADGES ── */
.sg .badge {
  display: inline-block; padding: 4px 9px; border-radius: 6px;
  font-family: var(--mono); font-size: 10px; font-weight: 600; letter-spacing: 1px; margin-top: 6px;
}
.sg .badge-ok   { background: rgba(51,226,155,0.14); color: var(--ok); }
.sg .badge-warn { background: rgba(45,217,238,0.14);  color: var(--amber); }
.sg .badge-crit { background: rgba(255,77,102,0.14);   color: var(--crit); }
.sg .badge-lo   { background: rgba(76,141,255,0.14);  color: var(--low); }
.sg .badge-med  { background: rgba(255,177,61,0.14);  color: var(--med); }

/* ── UPTIME STRIP ── */
.sg .uptime-strip {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-top: 2px;
}
.sg .uptime-cell {
  background: var(--panel); border: 1px solid var(--hairline); border-radius: 13px;
  padding: 14px 17px; display: flex; align-items: center; justify-content: space-between;
}
.sg .uptime-label { font-family: var(--mono); font-size: 10px; color: var(--dim); letter-spacing: 1px; text-transform: uppercase; }
.sg .uptime-val   { font-family: var(--display); font-weight: 700; font-size: 13px; color: var(--ok); letter-spacing: 0.5px; }

/* ── EMPTY STATE ── */
.sg .empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 10px; padding: 70px 20px; text-align: center;
}
.sg .empty-state .glyph {
  color: var(--hairline); font-family: var(--display); font-size: 11px; letter-spacing: 3px;
}
.sg .empty-state p {
  font-family: var(--mono); font-size: 12.5px; color: var(--dim); max-width: 440px; line-height: 1.7;
}

/* ── TABLE ── */
.sg table { width: 100%; border-collapse: collapse; font-family: var(--mono); font-size: 11.5px; }
.sg thead th {
  text-align: left; padding: 14px 17px; color: var(--faint); font-weight: 600;
  letter-spacing: 1px; border-bottom: 1px solid var(--hairline);
  white-space: nowrap; text-transform: uppercase; font-size: 10px;
}
.sg tbody td { padding: 13px 17px; border-bottom: 1px solid var(--hairline); color: var(--dim); }
.sg tbody tr:last-child td { border-bottom: none; }
.sg tbody tr:hover { background: var(--panel-raised); }

/* ── DEVICE GRID ── */
.sg .device-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 1px; background: var(--hairline); border-radius: 14px; overflow: hidden;
}
.sg .device-card { background: var(--panel); padding: 17px 19px; }
.sg .dname  { font-family: var(--mono); font-size: 12.5px; color: var(--text); font-weight: 600; }
.sg .drole  { font-family: var(--mono); font-size: 10px; color: var(--faint); margin-top: 3px; letter-spacing: 1px; }
.sg .dstatus { display: flex; align-items: center; gap: 6px; margin-top: 12px; font-family: var(--mono); font-size: 10px; letter-spacing: 1px; font-weight: 600; }
.sg .dstatus .dot { width: 6px; height: 6px; border-radius: 50%; }

/* ── COMPLIANCE ── */
.sg .crow {
  display: flex; align-items: center; justify-content: space-between;
  padding: 17px 19px; border-bottom: 1px solid var(--hairline);
}
.sg .crow:last-child { border-bottom: none; }
.sg .cname  { font-family: var(--sans); font-weight: 600; font-size: 13px; color: var(--text); }
.sg .csub   { font-family: var(--mono); font-size: 10px; color: var(--faint); margin-top: 3px; letter-spacing: 1px; }
.sg .cbar-wrap { width: 160px; height: 6px; background: var(--hairline); border-radius: 3px; overflow: hidden; margin-top: 8px; }
.sg .cbar { height: 100%; background: var(--ok); border-radius: 3px; }

/* ── TOAST ── */
.sg .toast {
  position: fixed; bottom: 24px; right: 24px; background: var(--panel-raised);
  border: 1px solid var(--amber-dim); border-left: 3px solid var(--amber);
  padding: 14px 18px; font-family: var(--mono); font-size: 11.5px; color: var(--text);
  max-width: 320px; opacity: 0; transform: translateY(10px);
  transition: all 0.25s ease; z-index: 50; border-radius: 10px; pointer-events: none;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
}
.sg .toast.show { opacity: 1; transform: translateY(0); pointer-events: auto; }

/* ── TAB PANELS ── */
.sg .tab-panel { display: none; }
.sg .tab-panel.active { display: block; }

/* ── APPROVE / DENY BUTTONS ── */
.sg .btn-approve, .sg .btn-deny {
  font-family: var(--mono); font-size: 10px; font-weight: 600; letter-spacing: 1px;
  padding: 6px 11px; border-radius: 7px; cursor: pointer; border: 1px solid;
  transition: background 0.1s ease;
}
.sg .btn-approve { background: rgba(51,226,155,0.1); color: var(--ok); border-color: rgba(51,226,155,0.3); }
.sg .btn-approve:hover { background: rgba(51,226,155,0.2); }
.sg .btn-deny    { background: rgba(255,77,102,0.1); color: var(--crit); border-color: rgba(255,77,102,0.3); margin-left: 6px; }
.sg .btn-deny:hover { background: rgba(255,77,102,0.2); }

/* ── RESPONSIVE ── */
@media (max-width: 1100px) {
  .sg .dash-grid { grid-template-columns: 200px 1fr 200px; }
}
@media (max-width: 920px) {
  .sg .hero-row { grid-template-columns: 1fr; }
  .sg .main     { grid-template-columns: 1fr; }
  .sg .rail     { position: static; flex-direction: row; flex-wrap: wrap; margin-bottom: 18px; }
  .sg .rail-btn { width: auto; }
  .sg .rail-label { display: none; }
  .sg .content  { padding-left: 0; }
  .sg .dash-grid { grid-template-columns: 1fr; grid-template-rows: auto; }
  .sg .dg-left-top, .sg .dg-center, .sg .dg-right-top, .sg .dg-left-bottom, .sg .dg-right-bot { grid-column: 1; grid-row: auto; }
  .sg .dg-center { flex-direction: column; }
  .sg .uptime-strip { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 520px) {
  .sg .wrap { padding: 0 16px 40px; }
  .sg .uptime-strip { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .sg .sweep-group { animation: none; }
  .sg .status-pill .dot { animation: none; }
  .sg .ticker-track { animation: none; }
  .sg .blink { animation: none; }
  .sg .feed-live .live-dot { animation: none; }
}
`;

/* ═════════════════ STATIC/MOCK FALLBACKS ═════════════════ */

const TICKER_ITEMS = [
  { text: "ALL SYSTEMS NOMINAL", accent: false },
  { text: "DEFENSE INTEGRITY 100%", accent: true },
  { text: "0 ACTIVE ANOMALIES", accent: false },
  { text: "LAST SWEEP 14s AGO", accent: false },
  { text: "THREAT ENGINE — PASSIVE MONITORING", accent: true },
  { text: "WATCH FLOOR OPERATIONAL", accent: false },
];

const PLAYBOOKS = [
  { num: "PB-01", name: "Isolate Compromised Host",   desc: "Quarantine endpoint from all network segments pending forensic review." },
  { num: "PB-02", name: "Force Credential Reset",      desc: "Revoke active sessions and enforce re-authentication on affected accounts." },
  { num: "PB-03", name: "Block Source IP",             desc: "Push ACL deny-rule to perimeter firewall for attacker origin IP." },
  { num: "PB-04", name: "CERT-In Notification",        desc: "Auto-compile Form I and dispatch within the mandatory 6-hour window." },
];

const STAGES = [
  { n: "S1", name: "Initial Access",       mid: "T1078 — Valid Accounts"           },
  { n: "S2", name: "Lateral Movement",     mid: "T1021 — Remote Services"          },
  { n: "S3", name: "Privilege Escalation", mid: "T1098 — Exploit Misconfiguration" },
  { n: "S4", name: "Exfiltration",         mid: "T1041 — Exfil Over C2 Channel"   },
];

const DEVICES = [
  { name: "EDGE-FW-01",   role: "Perimeter Firewall",       status: "PROTECTED",  color: "#33E29B" },
  { name: "CORE-SW-02",   role: "Core Switch",              status: "PROTECTED",  color: "#33E29B" },
  { name: "SRV-AUTH-01",  role: "Identity Server",          status: "PROTECTED",  color: "#33E29B" },
  { name: "SRV-DB-03",    role: "Database Host",            status: "MONITORING", color: "#4C8DFF" },
  { name: "WKS-SOC-04",   role: "Analyst Workstation",      status: "PROTECTED",  color: "#33E29B" },
  { name: "VPN-GW-01",    role: "Remote Access Gateway",    status: "MONITORING", color: "#4C8DFF" },
];

const COMPLIANCE = [
  { name: "SOC 2 Type II",  sub: "CONTROLS MAPPED — LAST REVIEW 12-07-2026", pct: 96, color: "#33E29B", badge: "96% READY", bc: "badge-ok"   },
  { name: "ISO/IEC 27001",  sub: "CONTROLS MAPPED — LAST REVIEW 12-07-2026", pct: 88, color: "#33E29B", badge: "88% READY", bc: "badge-ok"   },
  { name: "NIST CSF 2.0",   sub: "CONTROLS MAPPED — LAST REVIEW 12-07-2026", pct: 72, color: "#FFB13D", badge: "72% READY", bc: "badge-med"  },
];

/* ── ANALYTICS DATA ── */
const TREND_DAYS = ["D1","D2","D3","D4","D5","D6","D7","D8","D9","D10","D11","D12","D13","D14"];
const THREAT_TREND = [
  { key: "malware",   label: "Malware",   hex: "#2DD9EE", data: [8,11,9,14,12,17,15,19,16,22,18,24,21,26] },
  { key: "phishing",  label: "Phishing",  hex: "#FF4D66", data: [5,7,6,10,8,12,9,14,11,15,12,17,14,18] },
  { key: "intrusion", label: "Intrusion", hex: "#FFB13D", data: [3,4,4,6,5,8,6,9,7,10,8,11,9,12] },
];

const ATTACK_VECTORS = [
  { name: "Credential Stuffing", pct: 34, color: "#FF4D66" },
  { name: "Phishing",            pct: 27, color: "#FFB13D" },
  { name: "Malware Payload",     pct: 19, color: "#2DD9EE" },
  { name: "Insider Threat",      pct: 12, color: "#8B7BFF" },
  { name: "Brute Force",         pct: 8,  color: "#33E29B" },
];

const RAIL_TABS = [
  {
    id: "feed", label: "Alert Feed",
    icon: (
      <svg className="sketch-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.6 12.3h3.7l1.4-4.6 1-3 2.8 11.6 1.1-3.3 1.7-4.9 1.4 4.1h4.2"/>
      </svg>
    )
  },
  {
    id: "analytics", label: "Threat Analytics",
    icon: (
      <svg className="sketch-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20.3c5.4.4 10.9.4 16.2 0"/>
        <path d="M6.4 17.3v-5.1M10.6 17.4V8.6M14.8 17.3v-8M18.6 17.3V6.1"/>
      </svg>
    )
  },
  {
    id: "campaigns", label: "Correlated Campaigns",
    icon: (
      <svg className="sketch-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.2 5.4c1.4-.3 2.7.7 2.6 2-.1 1.3-1.5 2.1-2.8 1.7-1.2-.4-1.7-1.9-.9-2.9.2-.3.6-.6 1.1-.8z"/>
        <path d="M17.8 5.6c1.3-.2 2.5.8 2.4 2-.1 1.2-1.4 2-2.6 1.6-1.1-.4-1.6-1.8-.8-2.7.2-.3.6-.6 1-.9z"/>
        <path d="M12.1 16.3c1.3-.2 2.5.8 2.3 2-.2 1.2-1.5 1.9-2.7 1.5-1.1-.4-1.5-1.8-.7-2.7.2-.3.6-.6 1.1-.8z"/>
        <path d="M8 8.7l2.7 6.4M16.2 8.9l-2.6 6.3"/>
      </svg>
    )
  },
  {
    id: "playbooks", label: "Playbooks & Orchestrations",
    icon: (
      <svg className="sketch-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 4.2c-.4 3.9-.5 11.6 0 15.6 4.9-.5 10.3-.4 15 .1-.5-5.3-.4-10.4.1-15.7-5-.5-10.4-.5-15.1 0z"/>
        <path d="M8.6 9.3l4.7 4.9M13.5 9.1l-.2 4.6-4.6.2"/>
      </svg>
    )
  },
  {
    id: "devices", label: "Device Inventory",
    icon: (
      <svg className="sketch-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.8 4.6c5.4-.5 10.9-.5 16.3 0 .3 2.9.3 5.9 0 8.8-5.5.5-10.9.5-16.4 0-.2-2.9-.2-5.9.1-8.8z"/>
        <path d="M8.6 18.4c2.4.3 4.6.3 6.9 0M12 13.6v4.6"/>
      </svg>
    )
  },
  {
    id: "compliance", label: "Compliance Reporting",
    icon: (
      <svg className="sketch-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.3 3.4h8.6l3 3.1c.4 4.8.4 9.6-.1 14.3-3.9.4-7.9.4-11.8-.1-.5-5.7-.4-11.5.3-17.3z"/>
        <path d="M8.9 11.6l2.1 2.3 4.3-4.4"/>
      </svg>
    )
  },
];

/* ═════════════════ HOOKS ═════════════════ */

function useClock() {
  const [t, setT] = useState("UTC --:--:--");
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const pad = n => String(n).padStart(2, "0");
      setT(`UTC ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

function useSweepTimer() {
  const [secs, setSecs] = useState(14);
  const reset = useCallback(() => setSecs(0), []);
  useEffect(() => {
    const id = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const fmt = s => {
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sc = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${sc}`;
  };
  return { display: fmt(secs), secs, reset, fmt };
}

/* ═════════════════ SUB-COMPONENTS ═════════════════ */

function BrandMark() {
  return (
    <div style={{
      width: 38, height: 38, flexShrink: 0, borderRadius: 10,
      background: "linear-gradient(140deg, #2DD9EE, #4C8DFF)",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 0 22px rgba(45,217,238,0.35)",
    }}>
      <svg className="sketch-icon" style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="none" stroke="#06121A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.1 1.8c2.7 1.1 5.4 1.9 8.1 2.4.4 3.7.5 7.3-.3 10.9-1.1 3.7-3.8 6.4-7.7 8.6-4-1.9-6.7-4.6-7.8-8.4-.9-3.7-.7-7.4-.2-11.1 2.7-.6 5.3-1.3 7.9-2.4z"/>
        <path d="M8.7 12.2l2.3 2.4 4.2-4.5"/>
      </svg>
    </div>
  );
}

function RunIcon() {
  return (
    <svg className="sketch-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.6 12.2h3.7l1.6-5.6 1-2.6 2.7 12.2 1.1-3.6 1.6-4.9 1.3 4.5h4.6"/>
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="sketch-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.4 4.7c6.5-.5 13-.5 19.3 0 .3 4.8.3 9.7-.1 14.5-6.4.5-12.8.5-19.1 0-.4-4.8-.4-9.7-.1-14.5z"/>
      <path d="M2.5 5.3l9.4 6.9 9.4-6.9"/>
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="sketch-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.4v11.4M8 11l4 4.1 4-4.1"/>
      <path d="M4.4 17.8c-.3 1.3-.2 2.3.2 2.9 4.9.7 10.1.7 15 0 .4-.6.5-1.6.2-2.9"/>
    </svg>
  );
}

function buildLinePath(data, w, h, max, pad = 8) {
  const stepX = (w - pad * 2) / (data.length - 1);
  const pts = data.map((v, i) => [pad + i * stepX, h - pad - (v / max) * (h - pad * 2)]);
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    d += ` C ${mx},${y0} ${mx},${y1} ${x1},${y1}`;
  }
  return { d, pts };
}

function TrendChart() {
  const w = 520, h = 190, pad = 8;
  const max = Math.max(...THREAT_TREND.flatMap(s => s.data)) * 1.15;
  const stepX = (w - pad * 2) / (TREND_DAYS.length - 1);
  const wrapRef = useRef(null);
  const [hover, setHover] = useState(null);

  const valueY = (v) => h - pad - (v / max) * (h - pad * 2);

  const handleMove = (e) => {
    const rect = wrapRef.current.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const vbX = (relX / rect.width) * w;
    let idx = Math.round((vbX - pad) / stepX);
    idx = Math.max(0, Math.min(TREND_DAYS.length - 1, idx));
    setHover({ idx, relX: (pad + idx * stepX) / w * rect.width });
  };
  const handleLeave = () => setHover(null);

  return (
    <div ref={wrapRef} style={{ position: "relative" }} onMouseMove={handleMove} onMouseLeave={handleLeave}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
        <defs>
          <linearGradient id="trendFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2DD9EE" stopOpacity="0.20"/>
            <stop offset="100%" stopColor="#2DD9EE" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map(i => (
          <line key={i} x1={8} x2={w - 8} y1={16 + i * 42} y2={16 + i * 42} stroke="var(--hairline)" strokeWidth="1"/>
        ))}
        {THREAT_TREND.map((s, si) => {
          const { d, pts } = buildLinePath(s.data, w, h, max);
          return (
            <g key={s.key}>
              {si === 0 && (
                <path d={`${d} L ${pts[pts.length - 1][0]},${h - 8} L ${pts[0][0]},${h - 8} Z`} fill="url(#trendFade)"/>
              )}
              <path d={d} fill="none" stroke={s.hex} strokeWidth="2.1" strokeLinecap="round" opacity={si === 0 ? 1 : 0.85}/>
            </g>
          );
        })}
        {hover && (
          <g pointerEvents="none">
            <line
              x1={pad + hover.idx * stepX} x2={pad + hover.idx * stepX}
              y1={8} y2={h - 14} stroke="var(--dim)" strokeWidth="1" strokeDasharray="3 3" opacity="0.6"
            />
            {THREAT_TREND.map(s => (
              <circle
                key={s.key}
                cx={pad + hover.idx * stepX} cy={valueY(s.data[hover.idx])}
                r="3.6" fill={s.hex} stroke="var(--void)" strokeWidth="1.6"
              />
            ))}
          </g>
        )}
        {TREND_DAYS.filter((_, i) => i % 2 === 0).map((day, idx) => {
          const i = idx * 2;
          return (
            <text key={day} x={8 + i * stepX} y={h - 2} fontFamily="JetBrains Mono" fontSize="8.5" fill="var(--faint)">{day}</text>
          );
        })}
      </svg>
      {hover && (
        <div
          className="chart-tooltip"
          style={{
            left: Math.min(Math.max(hover.relX + 14, 4), (wrapRef.current ? wrapRef.current.clientWidth - 140 : 380)),
            top: 6,
          }}
        >
          <div className="chart-tooltip-day">{TREND_DAYS[hover.idx]}</div>
          {THREAT_TREND.map(s => (
            <div className="chart-tooltip-row" key={s.key}>
              <span className="sw" style={{ background: s.hex }}/>
              <span>{s.label}</span>
              <strong>{s.data[hover.idx]}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SeverityDonut({ alerts }) {
  const breakdown = [
    { key: "critical", label: "Critical", val: 0, color: "#FF4D66" },
    { key: "high",     label: "High",     val: 0, color: "#FFB13D" },
    { key: "medium",   label: "Medium",   val: 0, color: "#2DD9EE" },
    { key: "low",      label: "Low",      val: 0, color: "#4C8DFF" },
  ];

  if (alerts && alerts.length > 0) {
    alerts.forEach(a => {
      const score = a.anomaly_score || 0;
      if (score >= 85) breakdown[0].val++;
      else if (score >= 70) breakdown[1].val++;
      else if (score >= 40) breakdown[2].val++;
      else breakdown[3].val++;
    });
  }

  const size = 148, r = 58, cx = size / 2, cy = size / 2, sw = 15;
  const circumference = 2 * Math.PI * r;
  const total = breakdown.reduce((sum, s) => sum + s.val, 0);
  const wrapRef = useRef(null);
  const [hover, setHover] = useState(null);
  let offset = 0;

  const handleEnter = (s, pct, e) => {
    const rect = wrapRef.current.getBoundingClientRect();
    setHover({ key: s.key, label: s.label, val: s.val, pct, color: s.color, x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  const handleMove = (e) => {
    if (!hover) return;
    const rect = wrapRef.current.getBoundingClientRect();
    setHover(h => (h ? { ...h, x: e.clientX - rect.left, y: e.clientY - rect.top } : h));
  };
  const handleLeave = () => setHover(null);

  return (
    <div ref={wrapRef} style={{ position: "relative", flexShrink: 0 }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--hairline)" strokeWidth={sw}/>
        {total > 0 ? breakdown.map(s => {
          if (s.val === 0) return null;
          const frac = s.val / total;
          const len = frac * circumference;
          const gap = circumference - len;
          const pct = Math.round(frac * 100);
          const el = (
            <circle
              key={s.key} cx={cx} cy={cy} r={r} fill="none"
              stroke={s.color} strokeWidth={hover && hover.key === s.key ? sw + 3 : sw} strokeLinecap="butt"
              strokeDasharray={`${len} ${gap}`} strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              opacity={hover && hover.key !== s.key ? 0.55 : 0.95}
              style={{ cursor: "pointer", transition: "stroke-width 0.12s ease, opacity 0.12s ease" }}
              onMouseEnter={(e) => handleEnter(s, pct, e)}
              onMouseMove={handleMove}
              onMouseLeave={handleLeave}
            />
          );
          offset += len;
          return el;
        }) : (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--hairline)" strokeWidth={sw} />
        )}
        <text x={cx} y={cy - 4} textAnchor="middle" fontFamily="Space Grotesk" fontWeight="700" fontSize="22" fill="var(--text)">{total}</text>
        <text x={cx} y={cy + 15} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="9" letterSpacing="1" fill="var(--faint)">EVENTS</text>
      </svg>
      {hover && (
        <div
          className="chart-tooltip"
          style={{
            left: Math.min(Math.max(hover.x + 12, 4), size - 118),
            top: Math.max(hover.y - 40, 4),
          }}
        >
          <div className="chart-tooltip-day" style={{ color: hover.color }}>{hover.label}</div>
          <div className="chart-tooltip-row"><span>Events</span><strong>{hover.val}</strong></div>
          <div className="chart-tooltip-row"><span>Share</span><strong>{hover.pct}%</strong></div>
        </div>
      )}
    </div>
  );
}

function Radar({ sweeping }) {
  return (
    <div className="radar-svg-wrap">
      <svg viewBox="0 0 500 500" width="100%" style={{ maxWidth: 420 }}>
        <circle className="ring" cx="250" cy="250" r="70"/>
        <circle className="ring" cx="250" cy="250" r="130"/>
        <circle className="ring" cx="250" cy="250" r="190"/>
        <circle className="ring" cx="250" cy="250" r="230"/>
        <line className="spoke" x1="20"  y1="250" x2="480" y2="250"/>
        <line className="spoke" x1="250" y1="20"  x2="250" y2="480"/>
        <line className="spoke" x1="86"  y1="86"  x2="414" y2="414"/>
        <line className="spoke" x1="414" y1="86"  x2="86"  y2="414"/>
        <text className="ring-label" x="255" y="184">5M</text>
        <text className="ring-label" x="255" y="124">15M</text>
        <text className="ring-label" x="255" y="64">1H</text>
        <text className="ring-label" x="255" y="24">24H</text>
        <circle className="node node-core" cx="250" cy="250" r="4"/>
        <circle className="node" cx="300" cy="220" r="3.2"/>
        <circle className="node" cx="195" cy="290" r="3.2"/>
        <circle className="node" cx="330" cy="310" r="3.2"/>
        <circle className="node" cx="180" cy="180" r="3.2"/>
        <circle className="node" cx="270" cy="370" r="3.2"/>
        <g className={`sweep-group${sweeping ? " fast" : ""}`}>
          <defs>
            <linearGradient id="sweepGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#2DD9EE" stopOpacity="0"/>
              <stop offset="100%" stopColor="#2DD9EE" stopOpacity="0.35"/>
            </linearGradient>
          </defs>
          <path d="M250,250 L250,20 A230,230 0 0,1 380,86 Z" fill="url(#sweepGrad)"/>
          <line x1="250" y1="250" x2="250" y2="20" stroke="#2DD9EE" strokeWidth="1.4" opacity="0.7"/>
        </g>
      </svg>
    </div>
  );
}

/* ═════════════════ ROOT APP ═════════════════ */

export default function App() {
  const clock = useClock();
  const sweep = useSweepTimer();

  const [activeTab, setActiveTab] = useState("feed");
  const [assessing, setAssessing] = useState(false);
  const [streams, setStreams] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [certReport, setCertReport] = useState(null);
  const [toast, setToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setToast(true);
    setTimeout(() => setToast(false), 4500);
  }, []);

  const fetchData = async () => {
    try {
      const resAlerts = await axios.get(`${API_BASE}/alerts`);
      const resCampaigns = await axios.get(`${API_BASE}/campaigns`);
      const resAudit = await axios.get(`${API_BASE}/audit-log`);

      setAlerts(resAlerts.data);
      setCampaigns(resCampaigns.data);
      setAuditLogs(resAudit.data);

      if (resAlerts.data.length > 0) {
        setStreams(2461);
      } else {
        setStreams(0);
      }

      if (resCampaigns.data.length > 0) {
        try {
          const resCert = await axios.get(`${API_BASE}/report/cert-in`);
          setCertReport(resCert.data);
        } catch (_) {
          setCertReport(null);
        }
      } else {
        setCertReport(null);
      }
    } catch (err) {
      console.error("Error loading data from API:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const runAssessment = useCallback(async () => {
    if (assessing) return;
    setAssessing(true);
    setStreams(0);

    let n = 0;
    const timer = setInterval(() => {
      n += Math.floor(Math.random() * 40) + 10;
      setStreams(n);
    }, 120);

    try {
      await axios.post(`${API_BASE}/simulate/run`);
      setTimeout(async () => {
        clearInterval(timer);
        setAssessing(false);
        sweep.reset();
        await fetchData();
        showToast("Full-spectrum assessment complete — anomalies loaded and SOAR playbook triggered");
      }, 2000);
    } catch (err) {
      clearInterval(timer);
      setAssessing(false);
      showToast("Threat assessment failed to communicate with backend");
      console.error(err);
    }
  }, [assessing, sweep, showToast]);

  const handleApprove = async (actionId) => {
    try {
      await axios.post(`${API_BASE}/actions/${actionId}/approve`);
      showToast("SOAR action execution approved successfully.");
      fetchData();
    } catch (err) {
      showToast("Failed to execute response: " + err.message);
    }
  };

  const handleDeny = async (actionId) => {
    try {
      await axios.post(`${API_BASE}/actions/${actionId}/deny`);
      showToast("SOAR action containment dismissed.");
      fetchData();
    } catch (err) {
      showToast("Failed to dismiss response: " + err.message);
    }
  };

  const downloadReport = useCallback(() => {
    if (!certReport) return;
    const lines = [
      "SENTINELGRID — COMPLIANCE REPORT (FORM I)",
      `Generated ${new Date().toUTCString()}`,
      "=".repeat(48),
      "",
      `Incident Ref:      ${certReport.cert_in_ref}`,
      `Reporting Org:     ${certReport.reporting_organization}`,
      `Severity:          ${certReport.severity_level}`,
      `Compromised:       ${certReport.system_details.compromised_system}`,
      `Attacker Source:   ${certReport.system_details.ip_addresses_involved[0]} (${certReport.system_details.geographical_location})`,
      `Timeline:`,
      `  - Initial Access:       ${certReport.timeline.initial_access}`,
      `  - Privilege Escalation: ${certReport.timeline.privilege_escalation}`,
      `  - Exfiltration Time:    ${certReport.timeline.exfiltration_time}`,
      "",
      "Remediation Playbook Actions Applied:",
      ...certReport.remediation_actions.map(act => `  - ${act}`),
      "",
      "Blast Radius:",
      `  - Direct Impact:   ${certReport.blast_radius.direct_impact}`,
      `  - Indirect Offline: ${certReport.blast_radius.indirect_systems_offline.join(', ')}`,
      "=".repeat(48),
      "Generated automatically from SentinelGrid SOAR control mapping audits.",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sentinelgrid-cert-in-report-${certReport.cert_in_ref}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [certReport]);

  const activeCampaignsCount = campaigns.length;
  const isQuarantineActive = auditLogs.some(
    (l) => l.action_name === "Isolate Host Machine" && l.status === "Executed"
  );

  const tickerAll = [...TICKER_ITEMS, ...TICKER_ITEMS];
  const latestAlert = alerts.length > 0 ? alerts[0] : null;

  return (
    <div className="sg">
      <style>{GLOBAL_CSS}</style>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          <filter id="handSketch" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="0.045 0.09" numOctaves="2" seed="4" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.6" xChannelSelector="R" yChannelSelector="G"/>
          </filter>
        </defs>
      </svg>
      <div className="wrap">

        {/* ══════════ TOPBAR ══════════ */}
        <header className="topbar">
          <div className="brand">
            <BrandMark/>
            <div className="brand-text">
              <div className="word">SENTINELGRID</div>
              <div className="eyebrow">ENTERPRISE CYBER DEFENSE &amp; SOAR SUITE</div>
            </div>
          </div>
          <div className="top-right">
            <div className="clock">{clock}</div>
            <div className={`status-pill${assessing ? " assessing" : ""}`}>
              <span className="dot"/>
              <span>{assessing ? "ASSESSING" : "MONITORING"}</span>
            </div>
            <button className="btn-run" onClick={runAssessment} disabled={assessing}>
              <RunIcon/>
              <span>{assessing ? "SCANNING…" : "RUN THREAT ASSESSMENT"}</span>
            </button>
          </div>
        </header>

        {/* ══════════ TICKER ══════════ */}
        <div className="ticker" aria-hidden="true">
          <div className="ticker-track">
            {tickerAll.map((item, idx) => (
              <span key={idx} className={item.accent ? "accent" : ""}>
                {item.text}
              </span>
            ))}
          </div>
        </div>

        {/* ══════════ MAIN 2-COL LAYOUT ══════════ */}
        <div className="main">

          {/* RAIL SIDE NAVIGATION */}
          <aside className="rail">
            <div className="rail-heading">NAVIGATION</div>
            {RAIL_TABS.map((tab) => (
              <button
                key={tab.id}
                className={`rail-btn${activeTab === tab.id ? " active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span className="rail-label">{tab.label}</span>
              </button>
            ))}
          </aside>

          {/* CONTENT SECTION */}
          <main className="content">

            {/* HERO ROW */}
            <div className="hero-row">
              <div className="radar-panel">
                <div className="radar-head">
                  <div>
                    <div className="title">THREAT RADAR</div>
                    <div className="sub">ACTIVE SCANS</div>
                  </div>
                  <div className="win">
                    SWEEP RATE: {assessing ? "1.4s" : "6.0s"}<br/>
                    LAST DETECTED: {sweep.display} AGO
                  </div>
                </div>
                <Radar sweeping={assessing}/>
                <div className="log-entry">
                  <span className="t">[{clock}]</span>
                  <span>{assessing ? "SCANNING NETWORK SEGMENTS..." : "STANDBY - ACTIVE PORT MONITORING"}</span>
                  <span className="blink"/>
                </div>
              </div>

              <div className="stat-stack">
                <div className={`stat${alerts.length > 0 ? " warn" : " on"}`}>
                  <div className="stat-label">ANOMALIES DETECTED</div>
                  <div className="stat-val">
                    {alerts.length}
                    <span className="unit">ACTIVE</span>
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-label">INGESTION STREAMS</div>
                  <div className="stat-val">
                    {streams.toLocaleString()}
                    <span className="unit">PPS</span>
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-label">DEFENSE INTEGRITY</div>
                  <div className="stat-val">100<span className="unit">%</span></div>
                </div>
              </div>
            </div>

            {/* TAB: FEED / DASHBOARD HOME */}
            <div className={`tab-panel${activeTab === "feed" ? " active" : ""}`}>
              <div className="section-head">
                <h2>ALERT FEED</h2>
                <span className="count">{alerts.length} ANOMALIES ACTIVE</span>
              </div>
              
              <div className="dash-grid">
                {/* Col 1 Top: Correlated Incidents */}
                <div className="dg-left-top panel">
                  <div className="panel-title">
                    <span>CORRELATED INCIDENTS</span>
                    <span className="pcount">{campaigns.length}</span>
                  </div>
                  <div className="ci-list">
                    {campaigns.length > 0 ? (
                      campaigns.map((c, i) => (
                        <div className="ci-item" key={i}>
                          <div className="ci-id">{c.campaign_id}</div>
                          <div className="ci-desc">MITRE cyber campaign targeting '{c.username}' identity.</div>
                          <div className="ci-meta">Severity: {c.severity}</div>
                          <span className={`badge ${c.severity === "Critical" ? "badge-crit" : "badge-warn"}`}>{c.severity}</span>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">
                        <div className="glyph">∅</div>
                        <p>No campaigns correlated.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Col 1 Bottom: Playbooks */}
                <div className="dg-left-bottom panel">
                  <div className="panel-title">RESPONSE PLAYBOOKS</div>
                  <div className="pb-list">
                    {PLAYBOOKS.map((pb, i) => (
                      <div className="pb-item" key={i}>
                        <div className="pb-num">{pb.num}</div>
                        <div>
                          <div className="pb-name">{pb.name}</div>
                          <div className="pb-desc">{pb.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Col 2: Center */}
                <div className="dg-center">
                  {latestAlert ? (
                    <>
                      <div className="anomaly-card">
                        <div className="anomaly-head">
                          <div className="anomaly-title">CRITICAL ANOMALY: {latestAlert.event_type.toUpperCase()}</div>
                          <div className="anomaly-time">{new Date(latestAlert.timestamp).toLocaleTimeString()}</div>
                        </div>
                        <div className="anomaly-body">
                          Host server <strong>{latestAlert.server}</strong> accessed by <strong>{latestAlert.username}</strong> from IP <strong>{latestAlert.ip_address}</strong> ({latestAlert.city}, {latestAlert.country}).<br/>
                          Data transfer: {latestAlert.data_transferred_mb} MB. Privilege rating: {latestAlert.privilege_level}.
                        </div>
                        {latestAlert.explanation && (
                          <div style={{
                            marginTop: '10px',
                            padding: '8px',
                            background: 'rgba(45, 217, 238, 0.05)',
                            borderLeft: '2px solid var(--amber)',
                            fontSize: '10.5px',
                            fontFamily: 'var(--mono)'
                          }}>
                            <strong>XAI ENGINE: </strong> {latestAlert.explanation}
                          </div>
                        )}
                        <div className="anomaly-tags">
                          <span className="badge badge-crit">{latestAlert.anomaly_score}% CONFIDENCE</span>
                          <span className="badge badge-med">{latestAlert.privilege_level}</span>
                        </div>
                      </div>

                      <div className="panel" style={{ minHeight: 'auto' }}>
                        <div className="feed-head">
                          <span className="feed-head-title">EVENT LOG STREAM</span>
                          <div className="feed-live">
                            <span className="live-dot"/>
                            <span>LIVE</span>
                          </div>
                        </div>
                        <div className="log-list">
                          {alerts.slice(0, 4).map((a, i) => (
                            <div className="log-row" key={i}>
                              <span className="lt">{new Date(a.timestamp).toLocaleTimeString()}</span>
                              <span className={`lm ${a.anomaly_score >= 80 ? 'lm-crit' : 'lm-warn'}`}>{a.event_type.toUpperCase()}</span>
                              <span>{a.username} @ {a.server} ({a.ip_address})</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mail-card">
                        <div className="mail-head">
                          <span className="mail-icon"><MailIcon/></span>
                          <div className="mail-subject">SOAR ALERTER: Triggered containment for {latestAlert.username}</div>
                          <span className="mail-from">soar-engine@sentinelgrid.internal</span>
                        </div>
                        <div className="mail-body">
                          Automated playbooks initiated: Force MFA Challenge, Restrict Remote Session. Pending security officer clearance for isolating server host.
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="empty-state" style={{ background: 'var(--panel)', borderRadius: '14px' }}>
                      <div className="glyph" style={{ fontSize: '32px' }}>✓</div>
                      <p>SentinelGrid is operating under normal baseline. No current active threats or alerts to display.</p>
                    </div>
                  )}
                </div>

                {/* Col 3 Top: Campaign mini */}
                <div className="dg-right-top panel">
                  <div className="panel-title">CAMPAIGN REGISTER</div>
                  <div className="camp-list">
                    {campaigns.length > 0 ? (
                      campaigns.map((c, i) => (
                        <div className="camp-row" key={i}>
                          <div className="camp-id">{c.campaign_id}</div>
                          <div className="camp-desc">User: {c.username} | Status: {c.status}</div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">
                        <div className="glyph">∅</div>
                        <p>No active campaigns.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Col 3 Bottom: Playbook Stage */}
                <div className="dg-right-bot panel">
                  <div className="panel-title">MITRE PLAYBOOK STAGE</div>
                  <div className="stage-list">
                    {STAGES.map((st, i) => {
                      const isActive = campaigns.length > 0 && i < (campaigns[0].stages?.length || 0);
                      return (
                        <div className="stage-row" key={i} style={{ opacity: isActive ? 1 : 0.4 }}>
                          <div className="stage-n" style={{ color: isActive ? "var(--ok)" : "var(--dim)" }}>{st.n}</div>
                          <div>
                            <div className="stage-name" style={{ fontWeight: isActive ? "bold" : "normal" }}>{st.name}</div>
                            <div className="stage-mid">{st.mid}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* TAB: ANALYTICS */}
            <div className={`tab-panel${activeTab === "analytics" ? " active" : ""}`}>
              <div className="section-head">
                <h2>THREAT ANALYTICS</h2>
              </div>
              <div className="cols-2">
                <div className="panel">
                  <div className="panel-title">ATTACK VECTOR TREND (LAST 14 DAYS)</div>
                  <TrendChart/>
                </div>
                <div className="panel">
                  <div className="panel-title">SEVERITY RATIO DETECTIONS</div>
                  <div className="donut-row">
                    <SeverityDonut alerts={alerts}/>
                    <div className="donut-legend">
                      <div className="donut-legend-row">
                        <div className="donut-legend-key"><span className="sw" style={{ background: "#FF4D66" }}/>Critical</div>
                        <div className="donut-legend-val">{alerts.filter(a => a.anomaly_score >= 85).length}</div>
                      </div>
                      <div className="donut-legend-row">
                        <div className="donut-legend-key"><span className="sw" style={{ background: "#FFB13D" }}/>High</div>
                        <div className="donut-legend-val">{alerts.filter(a => a.anomaly_score >= 70 && a.anomaly_score < 85).length}</div>
                      </div>
                      <div className="donut-legend-row">
                        <div className="donut-legend-key"><span className="sw" style={{ background: "#2DD9EE" }}/>Medium</div>
                        <div className="donut-legend-val">{alerts.filter(a => a.anomaly_score >= 40 && a.anomaly_score < 70).length}</div>
                      </div>
                      <div className="donut-legend-row">
                        <div className="donut-legend-key"><span className="sw" style={{ background: "#4C8DFF" }}/>Low</div>
                        <div className="donut-legend-val">{alerts.filter(a => a.anomaly_score < 40).length}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="panel" style={{ marginTop: '18px' }}>
                <div className="panel-title">TOP ATTACK VECTORS</div>
                <div style={{ padding: '0 17px 17px' }}>
                  {ATTACK_VECTORS.map((av, i) => (
                    <div className="vector-row" key={i}>
                      <div className="vector-label">
                        <strong>{av.name}</strong>
                        <span>{av.pct}%</span>
                      </div>
                      <div className="cbar-wrap-full">
                        <div className="cbar" style={{ width: `${av.pct}%`, background: av.color }}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* TAB: CORRELATED CAMPAIGNS */}
            <div className={`tab-panel${activeTab === "campaigns" ? " active" : ""}`}>
              <div className="section-head">
                <h2>CORRELATED CYBER CAMPAIGNS</h2>
              </div>
              {campaigns.length === 0 ? (
                <div className="empty-state" style={{ background: 'var(--panel)', borderRadius: '14px' }}>
                  <div className="glyph">∅</div>
                  <p>No active Campaigns correlated.</p>
                </div>
              ) : (
                campaigns.map((camp, idx) => (
                  <div key={idx} className="panel" style={{ padding: '22px', marginBottom: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--hairline)', paddingBottom: '12px', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ fontFamily: 'var(--mono)', color: 'var(--crit)', fontSize: '15px' }}>
                          TRAJECTORY ID: {camp.campaign_id} (Target: '{camp.username}')
                        </h3>
                        <p style={{ fontSize: '10.5px', color: 'var(--dim)', marginTop: '4px' }}>
                          Initiated: {new Date(camp.start_time).toLocaleString()} | Severity: {camp.severity}
                        </p>
                      </div>
                      <span className="badge badge-crit">{camp.status.toUpperCase()}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {camp.stages.map((stage, sIdx) => (
                        <div key={sIdx} style={{ display: 'flex', gap: '16px', background: 'var(--panel-raised)', borderRadius: '8px', padding: '12px 16px' }}>
                          <div style={{ background: 'var(--amber-dim)', color: 'var(--amber)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: '11px', flexShrink: 0 }}>
                            S{stage.stage_id}
                          </div>
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '12px', fontFamily: 'var(--mono)' }}>
                              {stage.mitre_id} — {stage.mitre_name}
                            </div>
                            <p style={{ fontSize: '11px', color: 'var(--dim)', marginTop: '4px', lineHeight: 1.5 }}>
                              {stage.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* TAB: PLAYBOOKS & ORCHESTRATION */}
            <div className={`tab-panel${activeTab === "playbooks" ? " active" : ""}`}>
              <div className="section-head">
                <h2>SOAR ORCHESTRATION AUDIT LOG</h2>
              </div>
              <div className="panel" style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Ref</th>
                      <th>MITRE ID</th>
                      <th>Playbook Name</th>
                      <th>Target</th>
                      <th>Status</th>
                      <th>Logged At</th>
                      <th>Operational Gate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--dim)' }}>
                          No playbook records logged. Security orchestration engine in standby.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id}>
                          <td style={{ fontFamily: 'var(--mono)' }}>EXE-{log.id}</td>
                          <td style={{ fontFamily: 'var(--mono)' }}>{log.campaign_id}</td>
                          <td style={{ fontFamily: 'var(--mono)', color: 'var(--amber)' }}>{log.mitre_id}</td>
                          <td style={{ fontWeight: '600' }}>{log.action_name}</td>
                          <td>{log.target}</td>
                          <td>
                            <span className={`badge ${log.status === "Executed" ? "badge-ok" : log.status === "Denied" ? "badge-crit" : "badge-warn"}`}>
                              {log.status}
                            </span>
                          </td>
                          <td style={{ fontSize: '10.5px' }}>{new Date(log.timestamp).toLocaleTimeString()}</td>
                          <td>
                            {log.status === 'Pending Approval' ? (
                              <div style={{ display: 'flex' }}>
                                <button className="btn-approve" onClick={() => handleApprove(log.id)}>Approve</button>
                                <button className="btn-deny" onClick={() => handleDeny(log.id)}>Dismiss</button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '10px', color: 'var(--ok)', fontFamily: 'var(--mono)', fontWeight: 'bold' }}>
                                COMPLETED
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TAB: DEVICES */}
            <div className={`tab-panel${activeTab === "devices" ? " active" : ""}`}>
              <div className="section-head">
                <h2>DEVICE REGISTER &amp; BLAST RADIUS MAP</h2>
              </div>
              <div className="cols-2" style={{ marginBottom: '18px' }}>
                <div className="panel" style={{ padding: '20px' }}>
                  <h3 style={{ fontFamily: 'var(--display)', fontSize: '14px', marginBottom: '12px' }}>Quarantine Blast Radius Topology</h3>
                  <p style={{ fontSize: '11px', color: 'var(--dim)', marginBottom: '16px' }}>
                    Active control actions instantly isolate targets and isolate network routes.
                  </p>
                  {isQuarantineActive ? (
                    <div>
                      <div style={{ marginBottom: '16px', padding: '10px', background: 'rgba(255,77,102,0.1)', border: '1px solid var(--crit)', borderRadius: '6px', fontSize: '11px' }}>
                        🔴 <strong>CRITICAL HOST CONVERSIONS:</strong> Host <code>external_exfil_ip</code> is now isolated from all segments.
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--crit)' }}>✕ Primary Data Mirror Sync (OFFLINE)</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--crit)' }}>✕ Finance DB Sync Agent (OFFLINE)</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--ok)' }}>✓ Active Directory (ONLINE)</div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ marginBottom: '16px', padding: '10px', background: 'rgba(51,226,155,0.1)', border: '1px solid var(--ok)', borderRadius: '6px', fontSize: '11px' }}>
                        🟢 <strong>ALL SEGMENTS OPERATIONAL:</strong> No active quarantines.
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--ok)' }}>✓ Primary Data Mirror Sync (ONLINE)</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--ok)' }}>✓ Finance DB Sync Agent (ONLINE)</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--ok)' }}>✓ Active Directory (ONLINE)</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="panel" style={{ padding: '20px' }}>
                  <h3 style={{ fontFamily: 'var(--display)', fontSize: '14px', marginBottom: '12px' }}>Inventory Register</h3>
                  <div className="device-grid">
                    {DEVICES.map((d, i) => {
                      const isHost04Offline = d.name === "SRV-DB-03" && isQuarantineActive;
                      return (
                        <div className="device-card" key={i} style={{ opacity: isHost04Offline ? 0.5 : 1 }}>
                          <div className="dname">{d.name}</div>
                          <div className="drole">{d.role}</div>
                          <div className="dstatus">
                            <span className="dot" style={{ background: isHost04Offline ? "var(--crit)" : d.color }}/>
                            <span style={{ color: isHost04Offline ? "var(--crit)" : d.color }}>{isHost04Offline ? "OFFLINE" : d.status}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* TAB: COMPLIANCE */}
            <div className={`tab-panel${activeTab === "compliance" ? " active" : ""}`}>
              <div className="section-head">
                <h2>COMPLIANCE REPORTING</h2>
                {certReport && (
                  <button className="btn-download" onClick={downloadReport}>
                    <DownloadIcon/>
                    <span>DOWNLOAD CERT-In Form I</span>
                  </button>
                )}
              </div>
              
              <div className="cols-2" style={{ marginBottom: '18px' }}>
                <div className="panel">
                  <div className="panel-title">Mapped Framework Integrity</div>
                  {COMPLIANCE.map((c, i) => (
                    <div className="crow" key={i}>
                      <div>
                        <div className="cname">{c.name}</div>
                        <div className="csub">{c.sub}</div>
                        <div className="cbar-wrap">
                          <div className="cbar" style={{ width: `${c.pct}%`, background: c.color }}/>
                        </div>
                      </div>
                      <span className={`badge ${c.bc}`}>{c.badge}</span>
                    </div>
                  ))}
                </div>

                <div className="panel" style={{ padding: '20px' }}>
                  <h3 style={{ fontFamily: 'var(--display)', fontSize: '14px', marginBottom: '12px' }}>CERT-In Incident Report Preview</h3>
                  {certReport ? (
                    <div style={{ fontSize: '11px', lineHeight: 1.6, background: 'var(--panel-raised)', padding: '14px', borderRadius: '8px', fontFamily: 'var(--mono)' }}>
                      <p><strong>REFERENCE:</strong> {certReport.cert_in_ref}</p>
                      <p><strong>REPORTING ORGANISATION:</strong> {certReport.reporting_organization}</p>
                      <p><strong>DATE OF NOTIFICATION:</strong> {certReport.date_of_reporting}</p>
                      <p><strong>COMPROMISED HOSTS:</strong> {certReport.system_details.compromised_system}</p>
                      <p><strong>ATTACKER ORIGIN IP:</strong> {certReport.system_details.ip_addresses_involved[0]} ({certReport.system_details.geographical_location})</p>
                      <p style={{ marginTop: '10px' }}><strong>INCIDENT DESCRIPTION:</strong></p>
                      <p style={{ color: 'var(--dim)' }}>{certReport.incident_description}</p>
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="glyph">∅</div>
                      <p>No active incidents or compliance notifications available. Run simulations to generate.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* UPTIME STRIP */}
            <div className="uptime-strip">
              <div className="uptime-cell">
                <span className="uptime-label">SOC Ingestion Layer</span>
                <span className="uptime-val">99.99%</span>
              </div>
              <div className="uptime-cell">
                <span className="uptime-label">SOAR Playbook Dispatch</span>
                <span className="uptime-val">100.00%</span>
              </div>
              <div className="uptime-cell">
                <span className="uptime-label">ML Profiler Baseline</span>
                <span className="uptime-val">99.85%</span>
              </div>
              <div className="uptime-cell">
                <span className="uptime-label">API Gateways</span>
                <span className="uptime-val">99.92%</span>
              </div>
            </div>

          </main>
        </div>

        {/* TOAST SYSTEM */}
        <div className={`toast${toast ? " show" : ""}`}>
          {toastMsg}
        </div>

      </div>
    </div>
  );
}
