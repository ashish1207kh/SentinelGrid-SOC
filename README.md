# SENTINELGRID (v2.4.0)
## AI-Driven Cyber Resilience Platform for Critical National Infrastructure

> **Internship Capstone Project**  
> Developed for **Secure Worldz - AI Security Analyst Internship**  
> **Tagline:** *Intelligence. Detection. Response. Resilience.*

---

## 1. Project Overview & Architecture

**SentinelGrid** is a complete, interactive, enterprise-grade Security Operations Center (SOC) platform engineered to defend Critical National Infrastructure (CNI) — specifically Power Distribution Grids, 400kV Substation RTUs, SCADA Master HMIs, and associated Enterprise IT identity nodes.

The platform demonstrates the complete autonomous and human-in-the-loop analyst lifecycle:
1. **Log Aggregation:** Multi-source ingestion across Purdue Model Levels 1 through 4 (Windows Event 4624/4625, Linux auth, Edge Firewalls, Network Flow, OT Modbus/DNP3, and Cloud IAM).
2. **AI Anomaly Detection:** Real-time geometric outlier detection using an unsupervised **Isolation Forest** ML pipeline (120 decision trees, Scikit-Learn 1.9).
3. **Explainable AI (XAI):** Decomposes multi-dimensional feature contributions (failed logins, off-hours circadian shifts, egress byte spikes, Purdue asset criticality, geo/ASN novelty) into plain-English diagnostic reasoning with actionable mitigations.
4. **Attack Campaign Correlation:** Automatically synthesizes discrete alerts into coordinated campaigns (*Operation GridBreaker*, *DarkLocker*, *Substation Override*).
5. **MITRE ATT&CK Mapping:** Defensively classifies threats into official Enterprise and ICS tactics/techniques (T1110, T1078, T1021, T1098, T1041, T1068, T0855).
6. **SOAR Response Automation:** Orchestrates 4 automated response playbooks with safety isolation boundaries and human-in-the-loop approval gates.
7. **Incident Case Management:** Case tracking with assigned analysts, severity controls, audit timeline logs, and notes.
8. **Statutory CERT-In Compliance Reporting:** Form generator and live PDF/JSON exporter compliant with Section 70B of The Information Technology Act, 2000.
9. **Tamper-Evident Audit Trail:** Chained SHA-256 cryptographic ledger with one-click full chain mathematical verification.
10. **Interactive Demo Engine:** Real-time 12-step Multi-Stage APT simulation with controllable speed, play/pause/resume/step controls, and instant database reflection.

```
                              ┌───────────────────────────────────┐
                              │     SENTINELGRID REACT WEB UI     │
                              │ (Vite, Tailwind, Recharts, Icons) │
                              └─────────────────┬─────────────────┘
                                                │ REST API / JWT
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          FASTAPI APPLICATION BACKEND                            │
│                                                                                 │
│  ┌───────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐  │
│  │   Telemetry Ingestion │  │ Isolation Forest ML   │  │  XAI Explainer       │  │
│  │   (Windows/OT/Network)│  │ (120 Estimator Trees) │  │  (Feature Shapley)   │  │
│  └───────────┬───────────┘  └──────────┬───────────┘  └──────────┬───────────┘  │
│              │                         │                         │              │
│  ┌───────────▼───────────┐  ┌──────────▼───────────┐  ┌──────────▼───────────┐  │
│  │  Campaign Correlator  │  │ MITRE ATT&CK Matrix  │  │ SOAR Playbook Engine │  │
│  │  (Attack Graph Clust) │  │ (Enterprise & ICS)   │  │ (Approval Gateways)  │  │
│  └───────────┬───────────┘  └──────────┬───────────┘  └──────────┬───────────┘  │
│              │                         │                         │              │
│  ┌───────────▼───────────┐  ┌──────────▼───────────┐  ┌──────────▼───────────┐  │
│  │  Incident Case Mgmt   │  │ CERT-In Sec 70B Rprt │  │ Tamper-Evident Audit │  │
│  │  (Full Lifecycle)     │  │ (PDF & JSON Engine)  │  │ (Chained SHA-256)    │  │
│  └───────────────────────┘  └──────────────────────┘  └──────────────────────┘  │
└───────────────────────────────────────┬─────────────────────────────────────────┘
                                        │ SQLAlchemy ORM
                                        ▼
                      ┌───────────────────────────────────┐
                      │    SQLITE CNI PERSISTENT STORE    │
                      │   (Seeded Baseline & Telemetry)   │
                      └───────────────────────────────────┘
```

---

## 2. Technology Stack

- **Frontend:** React 19, Vite, Tailwind CSS v4, Recharts, Lucide React icons
- **Backend:** Python 3.11, FastAPI, Uvicorn, Pydantic v2
- **Machine Learning & Data Science:** Scikit-Learn 1.9 (`IsolationForest`), Pandas, NumPy
- **Database & Cryptography:** SQLite, SQLAlchemy 2.0, bcrypt, hashlib (SHA-256 chaining), python-jose (JWT)
- **Compliance & PDF Export:** fpdf2 (Official Section 70B CERT-In formatted reports)

---

## 3. Quick Startup Instructions

### Prerequisites
- Node.js (v18+) and npm
- Python (v3.10+)

### Backend Startup
```bash
# From project root
cd backend

# Seed/Reset the database (optional, auto-seeds on first run)
py -m app.database.seed_data

# Launch the FastAPI server on port 8000
py -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend Swagger API Docs will be live at:* **`http://127.0.0.1:8000/docs`**

### Frontend Startup
```bash
# In a new terminal, from project root
cd frontend

# Install dependencies (already present in repository)
npm install

# Start Vite dev server on port 5173
npm run dev
```
*Frontend application will be live at:* **`http://localhost:5173`**

---

## 4. Demo Login Credentials

The platform includes two pre-configured role profiles. You can either type the credentials on the login screen or click the **1-Click Quick Demo Profile** buttons on the login card:

| Role | Username | Email | Password | Access Scope |
|---|---|---|---|---|
| **SOC Analyst** | `analyst_priya` | `analyst@sentinelgrid.cni` | `Analyst@2026` | Triage alerts, inspect XAI, open incidents, execute low-impact playbooks, generate CERT-In reports |
| **Security Administrator** | `admin_vikram` | `admin@sentinelgrid.cni` | `Admin@2026` | Full administrative control, authorize high-impact quarantine actions, verify audit integrity, tune AI sensitivity |

---

## 5. Feature & Module Checklist

- [x] **Dark Cyber Glassmorphism UI:** Palette strictly compliant with `#080B12` (dark black), `#101827` (dark navy), `#00DADA` (electric cyan), `#238BFF` (neon blue), glowing borders, and live pulse indicators.
- [x] **Module 1: Overview Dashboard:** Live KPI cards, timeframe filterable area timeline (1h, 24h, 7d, 30d), severity distribution donut chart, MITRE category bar chart, recent alerts, and microservice health telemetry.
- [x] **Module 2: Security Alerts:** Severity tabs, search input, status filters, XAI deep-dive modal, and "Promote to Incident" action.
- [x] **Module 3: AI Threat Detection:** Live model status (120 Isolation Forest trees), mathematical distinction callout (Score vs Probability), interactive feature vector slider playground with live inference, and historical anomaly table.
- [x] **Module 4: Explainable AI (XAI):** Feature attribution breakdown, plain-English diagnostic narrative, actionable mitigation steps, and analytical caveat disclaimers.
- [x] **Module 5: Attack Campaigns:** Multi-stage attack progression pipeline (Initial Access → Lateral Movement → Privilege Escalation → Exfiltration), risk scoring, and chronological attack timeline.
- [x] **Module 6: MITRE ATT&CK Matrix:** Interactive tactical coverage matrix, active detection counters, technique mitigation details, and mapped evidence table.
- [x] **Module 7: Security Logs:** Filter by severity, event type, IP, keyword search; complete raw JSON inspector modal; CSV export; and synthetic event injection engine.
- [x] **Module 8: Asset & Device Inventory:** Purdue Model topology (Levels 1-4), criticality badges, vulnerability counters, and simulated Host Quarantine / Release actions.
- [x] **Module 9: SOAR Automation:** 4 pre-built response playbooks, execution history, and interactive Analyst Approval/Rejection workflow for high-impact actions.
- [x] **Module 10: Incident Management:** Full lifecycle case tracking (New, Investigating, Contained, Resolved, Closed), severity adjustments, chronological timeline logging, and investigation notes thread.
- [x] **Module 11: CERT-In Compliance Reporting:** Section 70B compliance form generator, executive report preview, one-click official PDF download, and JSON export.
- [x] **Module 12: Audit Logs:** Chained SHA-256 cryptographic ledger with one-click full chain mathematical verification.
- [x] **Module 13: Demo Simulation Engine:** Top bar button, 12-step automated APT simulation, controllable speeds (Normal, Presentation, Fast), Play/Pause/Resume/Step/Reset, and 5 individual attack vectors.

---

## 6. Step-by-Step Presentation Demonstration Guide

Follow this proven script during your internship project demonstration to highlight the technical depth and operational value of SentinelGrid:

### Step 1: Login & Orientation (0:00 - 0:30)
1. Open `http://localhost:5173`.
2. Point out the enterprise dark theme, CNI SOC branding, and security credentials.
3. Click **"Priya Sharma (Analyst)"** to 1-click authenticate.
4. Showcase the top navigation: Real-time clock (IST), live "GRID DEFENSE ACTIVE" heartbeat pulse, notification center, and active analyst pill.

### Step 2: Overview Dashboard (0:30 - 1:00)
1. Walk through the 6 KPI cards (Total Events, Active Threats, Critical Alerts, Anomalies, Incidents, Assets). Emphasize that all numbers are backed by the live SQLite datastore.
2. Toggle the timeline filter (`1h`, `24h`, `7d`, `30d`) to show dynamic event distribution.
3. Point to the Severity Donut and MITRE Category charts showing threats mapped across Purdue boundaries.

### Step 3: Trigger the 12-Stage Multi-Stage APT Simulation (1:00 - 2:00)
1. Click the glowing cyan **"DEMO SIMULATION"** button in the top bar.
2. Select **"Presentation"** speed mode and click **"Start APT Simulation"**.
3. Watch the real-time animated timeline execute step-by-step:
   - **Step 1:** External credential spray against Domain Controller (Tor Exit IP).
   - **Step 2:** Lateral pivot via RDP into Engineering Workstation 45.
   - **Step 3:** Local privilege escalation acquiring `NT AUTHORITY\SYSTEM`.
   - **Step 4:** 840 MB outbound telemetry egress from Historian DB.
   - **Step 5-6:** AI engine flags anomaly score `0.96` and generates XAI explanation.
   - **Step 7-8:** Alerts correlated into *Operation GridBreaker* and mapped to MITRE ATT&CK.
   - **Step 9-10:** SOAR Playbook 3 staged and auto-approved for containment.
   - **Step 11-12:** Incident `INC-2026-0041` updated to *Contained* and CERT-In draft generated.
4. Close the modal to show the dashboard metrics updating in real-time.

### Step 4: Explainable AI & Machine Learning Deep Dive (2:00 - 2:45)
1. Navigate to **"AI Threat Detection"** on the sidebar.
2. Review the Isolation Forest model card (120 estimator trees, Scikit-Learn 1.9).
3. Highlight the statistical callout box explaining why geometric outlier score is distinct from an unverified Bayesian probability.
4. Scroll to the **"Live Feature Vector Playground"**: move the *Data Transfer* slider to `850 MB` and *Hour* to `3:00 AM`, then click **"Execute ML Inference"**. Show the instant model prediction and XAI breakdown.
5. In the historical anomalies table, click **"Investigate"** to open the XAI modal, showing feature attribution bars and recommended mitigation steps.

### Step 5: Incident Management, SOAR & CERT-In Reporting (2:45 - 3:30)
1. Navigate to **"SOAR Automation"** and highlight the safety boundary notice and execution log.
2. Navigate to **"Incident Management"**: select `INC-2026-0041`, review the chronological timeline, and type an analyst note to show live updates.
3. Navigate to **"CERT-In Reporting"**: select the generated report `CERT-IN-2026-CNI-0819`.
4. Click **"Download Official PDF"** to open the generated statutory compliance filing in a new tab.
5. Click **"Export JSON"** to demonstrate SIEM interoperability.

### Step 6: Tamper-Evident Audit Verification (3:30 - 4:00)
1. Navigate to **"Audit Logs"**.
2. Explain the SHA-256 hash chaining mechanism (`hash = SHA256(prev_hash + user + action + timestamp + details)`).
3. Click the green **"Verify Audit Integrity"** button.
4. Show the live verification card: *"Cryptographic audit chain fully verified. No tampering detected."*

---

## 7. Known Limitations & Architectural Notes

1. **Simulation Sandbox:** All automated network quarantines, account lockouts, and Modbus command mitigations operate strictly on simulated assets and software objects to protect production infrastructure.
2. **Local Cryptographic Ledger:** The audit chain implements software-based SHA-256 hash chaining suitable for demonstrative forensic traceability. It is not coupled to hardware TPM chips or immutable blockchain nodes.
3. **Statutory Notice:** Generated CERT-In compliance filings follow the official Section 70B format but are marked with synthetic demonstration headers.

---

## 8. Vercel & Cloud Deployment Guide

### Deploying the Frontend to Vercel

1. **Import to Vercel:**
   - Link your GitHub repository `https://github.com/ashish1207kh/SentinelGrid-SOC` in the [Vercel Dashboard](https://vercel.com/new).
   - If deploying from the root directory: The included `vercel.json` will automatically configure:
     - **Build Command:** `cd frontend && npm install && npm run build`
     - **Output Directory:** `frontend/dist`
   - If setting **Root Directory** to `frontend` in Vercel project settings:
     - **Framework Preset:** Vite
     - **Build Command:** `npm run build`
     - **Output Directory:** `dist`

2. **Environment Variables on Vercel:**
   - If your FastAPI backend is hosted on a cloud platform (e.g. Render, Railway, AWS, Fly.io), add this Environment Variable in your Vercel Project Settings:
     ```
     VITE_API_BASE_URL=https://your-backend-api.onrender.com/api
     ```
   - For standalone local preview, leave `VITE_API_BASE_URL` empty to use the local Vite proxy.

### Deploying the Backend to Render / Railway

- **Build Command:** `pip install -r backend/requirements.txt`
- **Start Command:** `cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`

