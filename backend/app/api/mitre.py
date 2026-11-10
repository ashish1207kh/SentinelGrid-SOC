from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import MitreTechnique, Alert

router = APIRouter(prefix="/api/mitre", tags=["MITRE ATT&CK"])

@router.get("/matrix")
def get_mitre_matrix(db: Session = Depends(get_db)):
    """
    Returns enterprise MITRE ATT&CK tactics and techniques with active alerts count.
    """
    tactics = [
        {"id": "TA0001", "name": "Initial Access", "techniques": ["T1110", "T1078", "T1566"]},
        {"id": "TA0002", "name": "Execution", "techniques": ["T1059", "T0855"]},
        {"id": "TA0003", "name": "Persistence", "techniques": ["T1098", "T1078"]},
        {"id": "TA0004", "name": "Privilege Escalation", "techniques": ["T1068", "T1098"]},
        {"id": "TA0008", "name": "Lateral Movement", "techniques": ["T1021", "T1078"]},
        {"id": "TA0011", "name": "Command and Control", "techniques": ["T1071", "T1041"]},
        {"id": "TA0010", "name": "Exfiltration", "techniques": ["T1041"]}
    ]

    all_techs = db.query(MitreTechnique).all()
    tech_map = {t.technique_id: t for t in all_techs}

    matrix = []
    for tac in tactics:
        tech_list = []
        for tid in tac["techniques"]:
            t_obj = tech_map.get(tid)
            alert_count = db.query(Alert).filter(Alert.mitre_technique_id == tid).count()
            if t_obj:
                tech_list.append({
                    "technique_id": t_obj.technique_id,
                    "technique_name": t_obj.technique_name,
                    "description": t_obj.description,
                    "mitigation": t_obj.mitigation,
                    "active_alerts_count": alert_count,
                    "status": "Critical Detections" if alert_count > 1 else ("Active Alerts" if alert_count > 0 else "Nominal")
                })
        matrix.append({
            "tactic_id": tac["id"],
            "tactic_name": tac["name"],
            "techniques": tech_list
        })

    return {
        "framework": "MITRE ATT&CK Enterprise & ICS Matrix (Simulated Defensive Classification)",
        "tactics_count": len(matrix),
        "disclaimer": "Defensive mapping classification of simulated security events for SOC analyst investigation.",
        "matrix": matrix
    }

@router.get("/mappings")
def get_mitre_mappings(db: Session = Depends(get_db)):
    """
    Returns every mapped security alert linked to its MITRE technique with evidence and mitigation.
    """
    alerts = db.query(Alert).filter(Alert.mitre_technique_id != None).order_by(Alert.timestamp.desc()).all()
    all_techs = {t.technique_id: t for t in db.query(MitreTechnique).all()}

    results = []
    for a in alerts:
        tech = all_techs.get(a.mitre_technique_id)
        results.append({
            "alert_id": a.alert_id,
            "alert_title": a.title,
            "timestamp": a.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "source_ip": a.source_ip,
            "destination_ip": a.destination_ip,
            "severity": a.severity,
            "evidence": a.evidence or "Observed anomalous activity signature",
            "tactic": a.mitre_tactic or (tech.tactic if tech else "Defense"),
            "technique_id": a.mitre_technique_id,
            "technique_name": tech.technique_name if tech else "Unknown Technique",
            "technique_description": tech.description if tech else "",
            "recommended_mitigation": tech.mitigation if tech else "Apply endpoint isolation and inspect session credentials.",
            "detection_guidance": tech.detection_guidance if tech else ""
        })

    return results
