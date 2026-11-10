import json
import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.database.connection import get_db
from app.database.models import (
    SecurityLog, Alert, Anomaly, AttackCampaign,
    Incident, Playbook, PlaybookExecution, ComplianceReport, Asset
)
from app.database.seed_data import seed_database
from app.ai_engine.detector import detector
from app.ai_engine.explainer import generate_xai_explanation
from app.services.audit_service import record_audit

router = APIRouter(prefix="/api/simulation", tags=["Demo Mode & Attack Simulation"])

class RunStepRequest(BaseModel):
    step: int # 1 to 12
    speed: Optional[str] = "Normal"

@router.post("/reset-demo")
def reset_demo_database(db: Session = Depends(get_db)):
    """Restores the initial clean demonstration dataset."""
    seed_database(db, force_reset=True)
    return {
        "status": "success",
        "message": "SentinelGrid demo database successfully restored to pristine demonstration baseline."
    }

@router.post("/single/{attack_type}")
def run_single_simulation(attack_type: str, db: Session = Depends(get_db)):
    """Triggers an isolated individual attack simulation scenario."""
    now = datetime.utcnow()
    attack_map = {
        "brute-force": {
            "title": "Simulated Brute-Force Authentication Spike",
            "source_ip": "185.220.101.55",
            "dest_ip": "10.0.1.10",
            "user": "admin_scada",
            "device": "CNI-DC-CORE-01",
            "event_type": "Windows Auth",
            "protocol": "Kerberos",
            "port": 88,
            "category": "Initial Access",
            "mitre": "T1110",
            "tactic": "Credential Access",
            "desc": "Simulated dictionary spray: 32 failed authentication requests from foreign IP within 40 seconds.",
            "features": {"failed_logins": 12, "hour": 2, "bytes_kb": 18, "privilege_level": 3, "port": 88, "geo_novelty": 1, "conn_freq_per_min": 14, "destination_ip": "10.0.1.10"}
        },
        "suspicious-login": {
            "title": "Simulated Foreign Geolocation Access",
            "source_ip": "194.26.29.98",
            "dest_ip": "10.0.0.1",
            "user": "ops_kumar",
            "device": "CNI-FW-GATEWAY",
            "event_type": "Firewall",
            "protocol": "HTTPS",
            "port": 443,
            "category": "Initial Access",
            "mitre": "T1078",
            "tactic": "Defense Evasion",
            "desc": "SSL-VPN session authentication originated from anomalous Romanian IP without device compliance check.",
            "features": {"failed_logins": 1, "hour": 3, "bytes_kb": 90, "privilege_level": 2, "port": 443, "geo_novelty": 1, "conn_freq_per_min": 3, "destination_ip": "10.0.0.1"}
        },
        "privilege-escalation": {
            "title": "Simulated Token Impersonation (SYSTEM)",
            "source_ip": "10.0.3.45",
            "dest_ip": "10.0.3.45",
            "user": "svc_grid_worker",
            "device": "CNI-ENG-WS-45",
            "event_type": "Endpoint Activity",
            "protocol": "System",
            "port": 0,
            "category": "Privilege Escalation",
            "mitre": "T1068",
            "tactic": "Privilege Escalation",
            "desc": "Service account elevated privileges to NT AUTHORITY\\SYSTEM via unquoted binary path exploit.",
            "features": {"failed_logins": 0, "hour": 1, "bytes_kb": 55, "privilege_level": 3, "port": 445, "geo_novelty": 0, "conn_freq_per_min": 6, "destination_ip": "10.0.3.45"}
        },
        "lateral-movement": {
            "title": "Simulated Lateral RDP Pivot",
            "source_ip": "10.0.1.10",
            "dest_ip": "10.0.3.45",
            "user": "admin_scada",
            "device": "CNI-ENG-WS-45",
            "event_type": "Network Flow",
            "protocol": "RDP",
            "port": 3389,
            "category": "Lateral Movement",
            "mitre": "T1021",
            "tactic": "Lateral Movement",
            "desc": "Direct RDP connection established across Level 4 to Level 3 zone without MFA jump-host proxy.",
            "features": {"failed_logins": 1, "hour": 23, "bytes_kb": 420, "privilege_level": 3, "port": 3389, "geo_novelty": 0, "conn_freq_per_min": 8, "destination_ip": "10.0.3.45"}
        },
        "data-exfiltration": {
            "title": "Simulated High-Volume Database Exfiltration",
            "source_ip": "10.0.2.25",
            "dest_ip": "45.33.32.190",
            "user": "historian_export",
            "device": "CNI-DATA-VAULT",
            "event_type": "Network Flow",
            "protocol": "TLS",
            "port": 8443,
            "category": "Exfiltration",
            "mitre": "T1041",
            "tactic": "Exfiltration",
            "desc": "Unusual egress stream transferring 520 MB of SCADA operational telemetry archives to external VPS.",
            "features": {"failed_logins": 0, "hour": 2, "bytes_kb": 532480, "privilege_level": 2, "port": 8443, "geo_novelty": 1, "conn_freq_per_min": 30, "destination_ip": "10.0.2.25"}
        }
    }

    sc = attack_map.get(attack_type.lower().strip())
    if not sc:
        raise HTTPException(status_code=400, detail=f"Unknown attack simulation '{attack_type}'")

    # Run through AI Detector
    is_ano, score, contr = detector.predict_anomaly(sc["features"])
    xai = generate_xai_explanation(
        log_entry={
            "failed_logins": sc["features"].get("failed_logins", 0),
            "hour": sc["features"].get("hour", 12),
            "bytes_kb": sc["features"].get("bytes_kb", 0),
            "privilege_level": sc["features"].get("privilege_level", 1),
            "geo_novelty": sc["features"].get("geo_novelty", 0),
            "source_ip": sc["source_ip"],
            "destination_ip": sc["dest_ip"],
            "port": sc["port"],
            "username": sc["user"],
            "event_type": sc["event_type"]
        },
        calibrated_score=score,
        feature_contributions=contr
    )

    # Insert SecurityLog
    eid = f"EVT-SIM-{uuid.uuid4().hex[:5].upper()}"
    new_log = SecurityLog(
        event_id=eid,
        timestamp=now,
        source_ip=sc["source_ip"],
        destination_ip=sc["dest_ip"],
        username=sc["user"],
        device=sc["device"],
        event_type=sc["event_type"],
        protocol=sc["protocol"],
        port=sc["port"],
        description=sc["desc"],
        severity="Critical" if score >= 0.85 else "High",
        status="Flagged" if is_ano else "Analyzed",
        raw_data=json.dumps({"simulated": True, "type": attack_type, "score": score})
    )
    db.add(new_log)

    # Insert Alert
    aid = f"ALT-SIM-{uuid.uuid4().hex[:5].upper()}"
    asset = db.query(Asset).filter(Asset.name.ilike(f"%{sc['device']}%")).first()
    new_alt = Alert(
        alert_id=aid,
        title=sc["title"],
        timestamp=now,
        source_ip=sc["source_ip"],
        destination_ip=sc["dest_ip"],
        username=sc["user"],
        threat_category=sc["category"],
        severity="Critical" if score >= 0.85 else "High",
        detection_status="New",
        anomaly_score=score,
        xai_explanation=json.dumps(xai),
        mitre_technique_id=sc["mitre"],
        mitre_tactic=sc["tactic"],
        evidence=sc["desc"],
        asset_id=asset.id if asset else 1,
        campaign_id=1
    )
    db.add(new_alt)
    db.commit()

    record_audit(
        db=db,
        user_email="demo_operator@sentinelgrid.cni",
        action="ATTACK_SIMULATION_TRIGGERED",
        entity=f"SIMULATION:{attack_type.upper()}",
        event_details=f"Generated simulated attack vector '{sc['title']}' targeting {sc['device']}. Anomaly score: {score}"
    )

    return {
        "status": "success",
        "attack_type": attack_type,
        "event_id": eid,
        "alert_id": aid,
        "anomaly_score": score,
        "is_anomaly": is_ano,
        "xai_explanation": xai
    }

@router.post("/apt-step/{step_number}")
def execute_apt_step(step_number: int, db: Session = Depends(get_db)):
    """Executes a specific step of the 12-stage automated APT demonstration."""
    now = datetime.utcnow()

    step_definitions = {
        1: {
            "name": "Step 1: Suspicious Initial Access",
            "desc": "External credential brute force targeting Domain Controller from Tor Exit IP (185.220.101.44).",
            "action": "Generate external auth logs & failure bursts."
        },
        2: {
            "name": "Step 2: Lateral Movement",
            "desc": "Compromised credential used to pivot via RDP from DC01 into Engineering Workstation 45 across zone boundaries.",
            "action": "Generate East-West network flow logs."
        },
        3: {
            "name": "Step 3: Privilege Escalation",
            "desc": "Service account spawns PowerShell with SeDebugPrivilege, obtaining NT AUTHORITY\\SYSTEM token on Workstation 45.",
            "action": "Generate endpoint process injection & security event logs."
        },
        4: {
            "name": "Step 4: Abnormal Outbound Data Egress",
            "desc": "SCADA Historian database streams 840 MB of compressed telemetry tables to external command host 45.33.32.156.",
            "action": "Generate high-volume network telemetry egress log."
        },
        5: {
            "name": "Step 5: AI Anomaly Detection",
            "desc": "Isolation Forest ML engine evaluates 8 high-dimensional behavioral features, flagging multi-vector anomaly score 0.96.",
            "action": "Isolation forest pipeline flags anomalies."
        },
        6: {
            "name": "Step 6: Explainable AI (XAI) Generation",
            "desc": "XAI engine computes feature attribution contributions (Bytes: 52%, Geo: 24%, Asset: 14%) with human-readable rationale.",
            "action": "Generate plain-English explainability report & recommendations."
        },
        7: {
            "name": "Step 7: Attack Campaign Correlation",
            "desc": "System correlates 5 discrete alerts across Purdue levels into single unified campaign 'SG-APT-001: Operation GridBreaker'.",
            "action": "Link alerts into chronological campaign timeline."
        },
        8: {
            "name": "Step 8: MITRE ATT&CK Mapping",
            "desc": "Adversary actions mapped to defensive framework: T1110 (Brute Force), T1078 (Valid Accounts), T1021 (RDP), T1068 (Escalation), T1041 (C2 Egress).",
            "action": "Update MITRE ATT&CK matrix view with active badges."
        },
        9: {
            "name": "Step 9: SOAR Response Recommendation",
            "desc": "SOAR Playbook PB-03 automatically prepares host quarantine, firewall drop rule, and credential revocation actions.",
            "action": "Queue SOAR execution EXE-9016 with 'Pending Approval' status."
        },
        10: {
            "name": "Step 10: Analyst Response Approval",
            "desc": "Security Administrator approves simulated high-impact network isolation and egress socket termination in single click.",
            "action": "Mark SOAR execution as 'Approved' and apply simulated quarantine."
        },
        11: {
            "name": "Step 11: Incident Management Update",
            "desc": "Incident INC-2026-0041 updated to 'Contained' with complete step-by-step investigation timeline and notes.",
            "action": "Persist incident status update to SQLite database."
        },
        12: {
            "name": "Step 12: CERT-In Compliance Reporting",
            "desc": "Generate official CERT-In Section 70B incident compliance report draft (CERT-IN-2026-CNI-0819) with PDF & JSON exports.",
            "action": "Persist compliance report draft and verify audit trail integrity."
        }
    }

    if step_number not in step_definitions:
        raise HTTPException(status_code=400, detail="Step number must be between 1 and 12")

    current_step_info = step_definitions[step_number]

    # Specific database mutations based on step:
    if step_number in [1, 2, 3, 4]:
        # Generate corresponding log entry
        eid = f"EVT-APT-S{step_number}-{uuid.uuid4().hex[:4].upper()}"
        new_log = SecurityLog(
            event_id=eid,
            timestamp=now,
            source_ip="185.220.101.44" if step_number == 1 else ("10.0.1.10" if step_number == 2 else "10.0.3.45"),
            destination_ip="10.0.1.10" if step_number == 1 else ("10.0.3.45" if step_number == 2 else "45.33.32.156"),
            username="admin_scada" if step_number <= 2 else "svc_grid_sync",
            device="CNI-DC-CORE-01" if step_number == 1 else ("CNI-ENG-WS-45" if step_number <= 3 else "CNI-DATA-VAULT"),
            event_type="Windows Auth" if step_number == 1 else ("Network Flow" if step_number in [2, 4] else "Endpoint Activity"),
            protocol="Kerberos" if step_number == 1 else ("RDP" if step_number == 2 else "TLS"),
            port=88 if step_number == 1 else (3389 if step_number == 2 else 8443),
            description=current_step_info["desc"],
            severity="Critical" if step_number in [1, 3, 4] else "High",
            status="Correlated",
            raw_data=json.dumps({"apt_step": step_number, "phase": current_step_info["name"]})
        )
        db.add(new_log)
        db.commit()

    elif step_number == 10:
        # Auto-approve any pending execution
        pending_exec = db.query(PlaybookExecution).filter(PlaybookExecution.status == "Pending Approval").first()
        if pending_exec:
            pending_exec.status = "Completed"
            pending_exec.approval_status = "Approved"
            pending_exec.approved_by = "Priya Sharma (SOC Lead)"
            pending_exec.log_output += " | [DEMO MODE AUTO-APPROVAL] Simulated containment verified."
            db.commit()

    elif step_number == 11:
        inc = db.query(Incident).filter(Incident.incident_id == "INC-2026-0041").first()
        if inc:
            inc.status = "Contained"
            timeline = json.loads(inc.timeline_events) if inc.timeline_events else []
            timeline.append({
                "time": now.strftime("%Y-%m-%d %H:%M:%S"),
                "author": "Priya Sharma (SOC Analyst)",
                "text": "Threat contained following SOAR Playbook 3 approval. Outbound exfiltration severed. Workstation 45 quarantined."
            })
            inc.timeline_events = json.dumps(timeline)
            db.commit()

    # Record tamper-evident audit
    record_audit(
        db=db,
        user_email="demo_controller@sentinelgrid.cni",
        action="APT_SIMULATION_STEP",
        entity=f"APT_STEP_{step_number}",
        event_details=f"Executed {current_step_info['name']}: {current_step_info['desc']}"
    )

    return {
        "status": "success",
        "step": step_number,
        "name": current_step_info["name"],
        "description": current_step_info["desc"],
        "action_taken": current_step_info["action"],
        "timestamp": now.strftime("%Y-%m-%d %H:%M:%S")
    }
