import os
import sys
import subprocess
import json
import datetime
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add backend directory to sys.path so we can import our modules
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
detection_dir = os.path.join(backend_dir, "detection")
if backend_dir not in sys.path:
    sys.path.append(backend_dir)
if detection_dir not in sys.path:
    sys.path.append(detection_dir)

from detection.correlation import correlate_alerts
from response.orchestrator import fetch_audit_logs, handle_action_response, trigger_playbook_for_campaign

app = FastAPI(title="SentinelGrid SOAR & SIEM API", version="1.0.0")

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# File Paths
ALERTS_PATH = "E:/cyber-resilience/backend/data/alerts.csv"
CAMPAIGNS_PATH = "E:/cyber-resilience/backend/data/campaigns.json"
GROUND_TRUTH_PATH = "E:/cyber-resilience/backend/data/ground_truth.json"

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
        # Delete old database for a clean simulation state
        db_path = "E:/cyber-resilience/backend/data/sentinelgrid.db"
        if os.path.exists(db_path):
            try:
                # Close connection if any, then remove
                os.remove(db_path)
                print("Cleaned old simulation database.")
            except Exception as db_err:
                print(f"Could not remove database, continuing: {db_err}")

        # 1. Run generate_logs.py
        print("Running generate_logs.py...")
        subprocess.run(["py", "E:/cyber-resilience/backend/data_gen/generate_logs.py"], check=True)
        
        # 2. Run inject_attack.py
        print("Running inject_attack.py...")
        subprocess.run(["py", "E:/cyber-resilience/backend/data_gen/inject_attack.py"], check=True)
        
        # 3. Run anomaly_engine.py
        print("Running anomaly_engine.py...")
        subprocess.run(["py", "E:/cyber-resilience/backend/detection/anomaly_engine.py"], check=True)
        
        # 4. Correlate alerts
        print("Correlating alerts...")
        campaigns = correlate_alerts()
        
        # 5. Trigger playbooks for each campaign
        print("Triggering response playbooks...")
        for camp in campaigns:
            trigger_playbook_for_campaign(camp)
            
        return {"status": "success", "message": "Simulation ran successfully. Data generated, analyzed and responses orchestrated.", "campaign_count": len(campaigns)}
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
    # Build standard CERT-In Incident Reporting format (Form I)
    import pandas as pd
    try:
        # Load campaigns and alerts
        campaigns = []
        if os.path.exists(CAMPAIGNS_PATH):
            with open(CAMPAIGNS_PATH, "r") as f:
                campaigns = json.load(f)
                
        # Find dr_sharma campaign
        sharma_campaign = next((c for c in campaigns if c["username"] == "dr_sharma"), None)
        
        if not sharma_campaign:
            raise HTTPException(status_code=404, detail="Dr. Sharma attack campaign not found. Please run simulation first.")
            
        stages = sharma_campaign.get("stages", [])
        
        report = {
            "incident_type": "Multi-Stage Target Cyber Campaign (APT / Compromise)",
            "cert_in_ref": "CERT-IN/INC/2026/1109",
            "reporting_organization": "SentinelGrid Security Operations Center",
            "date_of_reporting": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "system_details": {
                "compromised_system": "Internal Active Directory & Backup System",
                "ip_addresses_involved": ["95.213.255.1 (Attacker-controlled)", "122.161.45.23 (Target user base IP)"],
                "geographical_location": "Moscow, Russian Federation (Attacker source IP)",
                "affected_users": ["dr_sharma"]
            },
            "timeline": {
                "initial_access": next((s["timestamp"] for s in stages if s["mitre_id"] == "T1078"), "Unknown"),
                "privilege_escalation": next((s["timestamp"] for s in stages if s["mitre_id"] == "T1098"), "Unknown"),
                "exfiltration_time": next((s["timestamp"] for s in stages if s["mitre_id"] == "T1041"), "Unknown")
            },
            "incident_description": "A sophisticated 4-stage cyber security incident targetting credential abuse, administrative takeover, and data exfiltration. The threat actor logged in from an anomalous geography, escalated to administrator level, and extracted 4.5 GB of backup records.",
            "remediation_actions": [
                "Forced MFA challenge on user account.",
                "Quarantined external exfiltration destination IP.",
                "Frozen credentials for user dr_sharma.",
                "Isolated source server machine from host network."
            ],
            "severity_level": "Critical",
            "blast_radius": {
                "direct_impact": "Primary Backup Server isolated.",
                "indirect_systems_offline": ["Finance DB sync agent", "HR archive sync agent"],
                "mitigation_priority": "High"
            }
        }
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
