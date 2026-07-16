import os
import sys
import subprocess
import json
import datetime
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

# --- Dynamic path setup (works on ANY machine, any OS) ---
API_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(API_DIR)
DATA_DIR = os.path.join(BACKEND_DIR, "data")
DATA_GEN_DIR = os.path.join(BACKEND_DIR, "data_gen")
DETECTION_DIR = os.path.join(BACKEND_DIR, "detection")

# Add backend to sys.path so imports work
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
if DETECTION_DIR not in sys.path:
    sys.path.insert(0, DETECTION_DIR)

from detection.correlation import correlate_alerts
from response.orchestrator import fetch_audit_logs, handle_action_response, trigger_playbook_for_campaign

# File paths
ALERTS_PATH = os.path.join(DATA_DIR, "alerts.csv")
CAMPAIGNS_PATH = os.path.join(DATA_DIR, "campaigns.json")
GROUND_TRUTH_PATH = os.path.join(DATA_DIR, "ground_truth.json")
DB_PATH = os.path.join(DATA_DIR, "sentinelgrid.db")

app = FastAPI(title="SentinelGrid SOAR & SIEM API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/alerts")
def get_alerts():
    if not os.path.exists(ALERTS_PATH):
        return []
    import pandas as pd
    try:
        df = pd.read_csv(ALERTS_PATH)
        return df.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/campaigns")
def get_campaigns():
    if not os.path.exists(CAMPAIGNS_PATH):
        return []
    try:
        with open(CAMPAIGNS_PATH, "r") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/audit-log")
def get_audit_log():
    try:
        return fetch_audit_logs()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/simulate/run")
def run_simulation():
    try:
        # Clean old database for fresh simulation
        if os.path.exists(DB_PATH):
            try:
                os.remove(DB_PATH)
                print("Cleaned old simulation database.")
            except Exception as db_err:
                print(f"Could not remove database, continuing: {db_err}")

        # Script paths (dynamic, works on any machine)
        generate_script = os.path.join(DATA_GEN_DIR, "generate_logs.py")
        inject_script = os.path.join(DATA_GEN_DIR, "inject_attack.py")
        anomaly_script = os.path.join(DETECTION_DIR, "anomaly_engine.py")

        # sys.executable = the exact Python that is currently running (works on Windows, Mac, Linux)
        print("Running generate_logs.py...")
        subprocess.run([sys.executable, generate_script], check=True)

        print("Running inject_attack.py...")
        subprocess.run([sys.executable, inject_script], check=True)

        print("Running anomaly_engine.py...")
        subprocess.run([sys.executable, anomaly_script], check=True)

        print("Correlating alerts...")
        campaigns = correlate_alerts()

        print("Triggering response playbooks...")
        for camp in campaigns:
            trigger_playbook_for_campaign(camp)

        return {
            "status": "success",
            "message": "Simulation ran successfully. Data generated, analyzed and responses orchestrated.",
            "campaign_count": len(campaigns)
        }
    except subprocess.CalledProcessError as ce:
        raise HTTPException(status_code=500, detail=f"Simulation script failed: {str(ce)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/actions/{action_id}/approve")
def approve_action(action_id: int):
    success = handle_action_response(action_id, approve=True)
    if not success:
        raise HTTPException(status_code=400, detail="Action not found or not in pending state.")
    return {"status": "success", "message": f"Action {action_id} approved and executed."}


@app.post("/api/actions/{action_id}/deny")
def deny_action(action_id: int):
    success = handle_action_response(action_id, approve=False)
    if not success:
        raise HTTPException(status_code=400, detail="Action not found or not in pending state.")
    return {"status": "success", "message": f"Action {action_id} denied."}


@app.get("/api/report/cert-in")
def get_cert_in_report():
    import pandas as pd
    try:
        campaigns = []
        if os.path.exists(CAMPAIGNS_PATH):
            with open(CAMPAIGNS_PATH, "r") as f:
                campaigns = json.load(f)

        sharma_campaign = next((c for c in campaigns if c["username"] == "dr_sharma"), None)

        if not sharma_campaign:
            raise HTTPException(
                status_code=404,
                detail="Dr. Sharma attack campaign not found. Please run simulation first."
            )

        stages = sharma_campaign.get("stages", [])

        # Pull real timestamps from the actual campaign data
        def get_stage_time(mitre_id):
            stage = next((s for s in stages if s.get("mitre_id") == mitre_id), None)
            if stage:
                return stage.get("timestamp", "Unknown")
            return "Unknown"

        # Pull real attacker IP from alerts if available
        attacker_ip = "95.213.255.1 (Attacker-controlled)"
        if os.path.exists(ALERTS_PATH):
            try:
                alerts_df = pd.read_csv(ALERTS_PATH)
                sharma_alerts = alerts_df[alerts_df["username"] == "dr_sharma"]
                foreign_alerts = sharma_alerts[sharma_alerts["country"] != "India"]
                if not foreign_alerts.empty:
                    attacker_ip = f"{foreign_alerts.iloc[0]['ip_address']} (Attacker-controlled)"
            except Exception:
                pass

        report = {
            "incident_type": "Multi-Stage Target Cyber Campaign (APT / Compromise)",
            "cert_in_ref": f"CERT-IN/INC/{datetime.datetime.now().year}/{datetime.datetime.now().strftime('%m%d%H%M')}",
            "reporting_organization": "SentinelGrid Security Operations Center",
            "date_of_reporting": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "system_details": {
                "compromised_system": "Internal Active Directory & Backup System",
                "ip_addresses_involved": [attacker_ip, "122.161.45.23 (Target user base IP)"],
                "geographical_location": "Moscow, Russian Federation (Attacker source IP)",
                "affected_users": ["dr_sharma"]
            },
            "timeline": {
                "initial_access": get_stage_time("T1078"),
                "lateral_movement": get_stage_time("T1021"),
                "privilege_escalation": get_stage_time("T1098"),
                "exfiltration_time": get_stage_time("T1041"),
            },
            "incident_description": (
                "A sophisticated 4-stage cyber security incident targeting credential abuse, "
                "administrative takeover, and data exfiltration. The threat actor logged in from "
                "an anomalous geography (Russia) at an unusual hour (2 AM), escalated to "
                "administrator level, and extracted 4.5 GB of backup records."
            ),
            "remediation_actions": [
                "Forced MFA challenge on user account immediately upon anomalous login detection.",
                "Restricted session to read-only mode upon detection of lateral movement.",
                "Frozen credentials for user dr_sharma after privilege escalation detected.",
                "Quarantined external exfiltration destination IP from host network.",
            ],
            "severity_level": sharma_campaign.get("severity", "Critical"),
            "blast_radius": {
                "direct_impact": "Primary Backup Server isolated.",
                "indirect_systems_offline": ["Finance DB sync agent", "HR archive sync agent"],
                "mitigation_priority": "High"
            }
        }
        return report
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
