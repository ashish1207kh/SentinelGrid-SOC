import json
import uuid
import csv
import io
import random
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database.connection import get_db
from app.database.models import SecurityLog, Alert, Anomaly, Asset
from app.ai_engine.detector import detector
from app.ai_engine.explainer import generate_xai_explanation
from app.services.audit_service import record_audit

router = APIRouter(prefix="/api/logs", tags=["Security Logs"])

class GenerateEventRequest(BaseModel):
    scenario_type: Optional[str] = "random" # 'random', 'brute_force', 'suspicious_login', 'privilege_escalation', 'data_exfiltration', 'lateral_movement'
    count: Optional[int] = 3

@router.get("")
def list_security_logs(
    search: Optional[str] = None,
    severity: Optional[str] = None,
    source_ip: Optional[str] = None,
    event_type: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(SecurityLog)

    if severity and severity.lower() != "all":
        query = query.filter(SecurityLog.severity.ilike(severity))
    if source_ip:
        query = query.filter(SecurityLog.source_ip.contains(source_ip))
    if event_type and event_type.lower() != "all":
        query = query.filter(SecurityLog.event_type.ilike(f"%{event_type}%"))
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (SecurityLog.description.ilike(search_filter)) |
            (SecurityLog.username.ilike(search_filter)) |
            (SecurityLog.device.ilike(search_filter)) |
            (SecurityLog.event_id.ilike(search_filter)) |
            (SecurityLog.source_ip.ilike(search_filter)) |
            (SecurityLog.destination_ip.ilike(search_filter))
        )

    total = query.count()
    logs = query.order_by(SecurityLog.timestamp.desc()).offset(offset).limit(limit).all()

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "logs": [
            {
                "id": log.id,
                "event_id": log.event_id,
                "timestamp": log.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                "source_ip": log.source_ip,
                "destination_ip": log.destination_ip,
                "username": log.username,
                "device": log.device,
                "event_type": log.event_type,
                "protocol": log.protocol,
                "port": log.port,
                "description": log.description,
                "severity": log.severity,
                "status": log.status,
                "raw_data": log.raw_data
            }
            for log in logs
        ]
    }

@router.get("/export-csv")
def export_logs_csv(
    severity: Optional[str] = None,
    event_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(SecurityLog)
    if severity and severity.lower() != "all":
        query = query.filter(SecurityLog.severity.ilike(severity))
    if event_type and event_type.lower() != "all":
        query = query.filter(SecurityLog.event_type.ilike(f"%{event_type}%"))

    logs = query.order_by(SecurityLog.timestamp.desc()).limit(500).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Event ID", "Timestamp", "Source IP", "Destination IP", "Username",
        "Device", "Event Type", "Protocol", "Port", "Severity", "Status", "Description"
    ])
    for l in logs:
        writer.writerow([
            l.event_id, l.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            l.source_ip, l.destination_ip, l.username,
            l.device, l.event_type, l.protocol, l.port, l.severity, l.status, l.description
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=sentinelgrid_logs_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"}
    )

@router.post("/generate-demo")
def generate_demo_security_events(
    payload: GenerateEventRequest = None,
    db: Session = Depends(get_db)
):
    if payload is None:
        payload = GenerateEventRequest()

    count = payload.count or 3
    scenario = payload.scenario_type or "random"
    created_events = []
    generated_alerts = []
    now = datetime.utcnow()

    cni_scenarios = {
        "brute_force": {
            "source_ip": "185.220.101.99",
            "destination_ip": "10.0.1.10",
            "username": "admin_scada",
            "device": "CNI-DC-CORE-01",
            "event_type": "Windows Auth",
            "protocol": "Kerberos",
            "port": 88,
            "description": "Sequential authentication failure burst (NTLM/Kerberos code 0xC000006A) targeting admin_scada",
            "severity": "Critical",
            "features": {"failed_logins": 14, "hour": 2, "bytes_kb": 12, "privilege_level": 3, "port": 88, "geo_novelty": 1, "conn_freq_per_min": 18, "destination_ip": "10.0.1.10"},
            "threat_category": "Initial Access",
            "mitre_id": "T1110",
            "mitre_tactic": "Credential Access",
            "title": "Automated Credential Brute-Force Burst"
        },
        "suspicious_login": {
            "source_ip": "91.240.118.23",
            "destination_ip": "10.0.0.1",
            "username": "eng_rohit",
            "device": "CNI-FW-GATEWAY",
            "event_type": "Firewall",
            "protocol": "HTTPS",
            "port": 443,
            "description": "SSL-VPN session authentication from unexpected foreign ISP (Frankfurt datacenter pool) without device posture certificate",
            "severity": "High",
            "features": {"failed_logins": 2, "hour": 3, "bytes_kb": 85, "privilege_level": 2, "port": 443, "geo_novelty": 1, "conn_freq_per_min": 4, "destination_ip": "10.0.0.1"},
            "threat_category": "Initial Access",
            "mitre_id": "T1078",
            "mitre_tactic": "Defense Evasion",
            "title": "Anomalous Geolocation & Off-Hours SSL-VPN Access"
        },
        "privilege_escalation": {
            "source_ip": "10.0.3.45",
            "destination_ip": "10.0.3.45",
            "username": "svc_maintenance",
            "device": "CNI-ENG-WS-45",
            "event_type": "Endpoint Activity",
            "protocol": "System",
            "port": 0,
            "description": "Suspicious token manipulation: svc_maintenance enabled SeImpersonatePrivilege via unquoted service path exploit",
            "severity": "Critical",
            "features": {"failed_logins": 0, "hour": 23, "bytes_kb": 45, "privilege_level": 3, "port": 445, "geo_novelty": 0, "conn_freq_per_min": 8, "destination_ip": "10.0.3.45"},
            "threat_category": "Privilege Escalation",
            "mitre_id": "T1068",
            "mitre_tactic": "Privilege Escalation",
            "title": "Unauthorized Local Token Impersonation"
        },
        "lateral_movement": {
            "source_ip": "10.0.3.45",
            "destination_ip": "192.168.10.5",
            "username": "admin_scada",
            "device": "CNI-PWR-SCADA-01",
            "event_type": "Network Flow",
            "protocol": "RDP",
            "port": 3389,
            "description": "Non-bastion RDP connection crossing Level 3 to Level 2 SCADA zone with pass-the-hash ticket",
            "severity": "High",
            "features": {"failed_logins": 1, "hour": 22, "bytes_kb": 350, "privilege_level": 3, "port": 3389, "geo_novelty": 0, "conn_freq_per_min": 6, "destination_ip": "192.168.10.5"},
            "threat_category": "Lateral Movement",
            "mitre_id": "T1021",
            "mitre_tactic": "Lateral Movement",
            "title": "Inter-Zone Remote Desktop Lateral Pivot"
        },
        "data_exfiltration": {
            "source_ip": "10.0.2.25",
            "destination_ip": "198.51.100.188",
            "username": "db_exporter",
            "device": "CNI-DATA-VAULT",
            "event_type": "Network Flow",
            "protocol": "TLS",
            "port": 8443,
            "description": "High entropy outbound egress spike transferring 620 MB compressed telemetry tables to unknown external IP",
            "severity": "Critical",
            "features": {"failed_logins": 0, "hour": 1, "bytes_kb": 634880, "privilege_level": 2, "port": 8443, "geo_novelty": 1, "conn_freq_per_min": 25, "destination_ip": "10.0.2.25"},
            "threat_category": "Exfiltration",
            "mitre_id": "T1041",
            "mitre_tactic": "Exfiltration",
            "title": "High-Volume Telemetry Database Exfiltration"
        }
    }

    scenarios_keys = list(cni_scenarios.keys())

    for i in range(count):
        if scenario in cni_scenarios:
            template = cni_scenarios[scenario]
        elif scenario == "random":
            chosen_key = random.choice(scenarios_keys)
            template = cni_scenarios[chosen_key]
        else:
            # Generate nominal event
            template = {
                "source_ip": f"10.0.3.{random.randint(10, 80)}",
                "destination_ip": "10.0.1.10",
                "username": f"analyst_{random.randint(1, 6)}",
                "device": "CNI-DC-CORE-01",
                "event_type": "Windows Auth",
                "protocol": "Kerberos",
                "port": 88,
                "description": "Standard scheduled directory query from certified operations terminal",
                "severity": "Informational",
                "features": {"failed_logins": 0, "hour": 14, "bytes_kb": 15, "privilege_level": 1, "port": 88, "geo_novelty": 0, "conn_freq_per_min": 2, "destination_ip": "10.0.1.10"},
                "threat_category": "Nominal",
                "mitre_id": "N/A",
                "mitre_tactic": "Nominal",
                "title": "Nominal Telemetry Exchange"
            }

        event_uid = f"EVT-SYN-{uuid.uuid4().hex[:6].upper()}"
        event_time = now - timedelta(seconds=(count - i) * 12)

        # AI Detection Engine Evaluation
        features_dict = template["features"]
        is_anomaly, score, contributions = detector.predict_anomaly(features_dict)
        xai_breakdown = generate_xai_explanation(
            log_entry={
                "failed_logins": features_dict.get("failed_logins", 0),
                "hour": features_dict.get("hour", 12),
                "bytes_kb": features_dict.get("bytes_kb", 0),
                "privilege_level": features_dict.get("privilege_level", 1),
                "geo_novelty": features_dict.get("geo_novelty", 0),
                "source_ip": template["source_ip"],
                "destination_ip": template["destination_ip"],
                "port": template["port"],
                "username": template["username"],
                "event_type": template["event_type"]
            },
            calibrated_score=score,
            feature_contributions=contributions
        )

        status_val = "Flagged" if is_anomaly else "Analyzed"
        if score >= 0.75:
            status_val = "Correlated"

        # Save SecurityLog
        new_log = SecurityLog(
            event_id=event_uid,
            timestamp=event_time,
            source_ip=template["source_ip"],
            destination_ip=template["destination_ip"],
            username=template["username"],
            device=template["device"],
            event_type=template["event_type"],
            protocol=template["protocol"],
            port=template["port"],
            description=template["description"],
            severity=template["severity"],
            status=status_val,
            raw_data=json.dumps({
                "event_id": event_uid,
                "score": score,
                "is_anomaly": is_anomaly,
                "features": features_dict
            })
        )
        db.add(new_log)
        db.commit()
        db.refresh(new_log)
        created_events.append(new_log.event_id)

        # If Anomaly or High/Critical, generate Anomaly and Alert
        if is_anomaly or template["severity"] in ["High", "Critical"]:
            ano_id = f"ANO-{uuid.uuid4().hex[:5].upper()}"
            new_ano = Anomaly(
                detection_id=ano_id,
                timestamp=event_time,
                username=template["username"],
                source_ip=template["source_ip"],
                device=template["device"],
                anomaly_score=score,
                severity=template["severity"],
                reason=xai_breakdown["reasons"][0] if xai_breakdown["reasons"] else "Outlier detected by Isolation Forest.",
                recommended_action=xai_breakdown["recommended_actions"][0] if xai_breakdown["recommended_actions"] else "Investigate source endpoint.",
                feature_attributions=json.dumps(contributions),
                status="Investigating"
            )
            db.add(new_ano)

            # Find matching asset
            matched_asset = db.query(Asset).filter(Asset.name.ilike(f"%{template['device']}%")).first()
            asset_id = matched_asset.id if matched_asset else 1

            alt_id = f"ALT-SYN-{uuid.uuid4().hex[:6].upper()}"
            new_alt = Alert(
                alert_id=alt_id,
                title=template.get("title", f"AI Anomaly Alert: {template['event_type']}"),
                timestamp=event_time,
                source_ip=template["source_ip"],
                destination_ip=template["destination_ip"],
                username=template["username"],
                threat_category=template["threat_category"],
                severity=template["severity"],
                detection_status="New",
                anomaly_score=score,
                xai_explanation=json.dumps(xai_breakdown),
                mitre_technique_id=template["mitre_id"],
                mitre_tactic=template["mitre_tactic"],
                evidence=template["description"],
                asset_id=asset_id,
                campaign_id=1 if "10.0" in template["source_ip"] or "185." in template["source_ip"] else None
            )
            db.add(new_alt)
            db.commit()
            generated_alerts.append(alt_id)

    # Record Audit
    record_audit(
        db=db,
        user_email="soc_analyst@sentinelgrid.cni",
        action="DEMO_LOGS_GENERATED",
        entity="LOG_ENGINE",
        event_details=f"Generated {count} synthetic security event(s) under scenario '{scenario}'. Generated {len(generated_alerts)} alert(s)."
    )

    return {
        "status": "success",
        "events_generated": len(created_events),
        "event_ids": created_events,
        "alerts_triggered": len(generated_alerts),
        "alert_ids": generated_alerts,
        "message": f"Successfully simulated {count} security event(s) and evaluated via Isolation Forest pipeline."
    }
