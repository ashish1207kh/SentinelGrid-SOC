import json
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database.connection import get_db
from app.database.models import Alert, Asset, Incident
from app.services.audit_service import record_audit

router = APIRouter(prefix="/api/alerts", tags=["Security Alerts"])

class AlertStatusUpdate(BaseModel):
    status: str # 'New', 'Triaged', 'Investigating', 'Contained', 'Resolved', 'False Positive'

class PromoteIncidentRequest(BaseModel):
    assigned_analyst: Optional[str] = "Priya Sharma"
    additional_notes: Optional[str] = ""

@router.get("")
def list_alerts(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    if severity and severity.lower() != "all":
        query = query.filter(Alert.severity.ilike(severity))
    if status and status.lower() != "all":
        query = query.filter(Alert.detection_status.ilike(status))
    if category and category.lower() != "all":
        query = query.filter(Alert.threat_category.ilike(f"%{category}%"))
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Alert.title.ilike(search_filter)) |
            (Alert.alert_id.ilike(search_filter)) |
            (Alert.source_ip.ilike(search_filter)) |
            (Alert.destination_ip.ilike(search_filter)) |
            (Alert.username.ilike(search_filter)) |
            (Alert.mitre_technique_id.ilike(search_filter))
        )

    total = query.count()
    alerts = query.order_by(Alert.timestamp.desc()).offset(offset).limit(limit).all()

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "alerts": [
            {
                "id": a.id,
                "alert_id": a.alert_id,
                "title": a.title,
                "timestamp": a.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                "source_ip": a.source_ip,
                "destination_ip": a.destination_ip,
                "username": a.username,
                "threat_category": a.threat_category,
                "severity": a.severity,
                "detection_status": a.detection_status,
                "anomaly_score": a.anomaly_score,
                "mitre_technique_id": a.mitre_technique_id,
                "mitre_tactic": a.mitre_tactic,
                "evidence": a.evidence,
                "asset_id": a.asset_id,
                "asset_name": a.asset.name if a.asset else "Unassigned CNI Asset",
                "campaign_id": a.campaign_id,
                "xai_explanation": json.loads(a.xai_explanation) if a.xai_explanation else None
            }
            for a in alerts
        ]
    }

@router.get("/{alert_id}")
def get_alert_detail(alert_id: str, db: Session = Depends(get_db)):
    a = db.query(Alert).filter((Alert.alert_id == alert_id) | (Alert.id == (int(alert_id) if alert_id.isdigit() else -1))).first()
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found")

    return {
        "id": a.id,
        "alert_id": a.alert_id,
        "title": a.title,
        "timestamp": a.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
        "source_ip": a.source_ip,
        "destination_ip": a.destination_ip,
        "username": a.username,
        "threat_category": a.threat_category,
        "severity": a.severity,
        "detection_status": a.detection_status,
        "anomaly_score": a.anomaly_score,
        "mitre_technique_id": a.mitre_technique_id,
        "mitre_tactic": a.mitre_tactic,
        "evidence": a.evidence,
        "asset": {
            "id": a.asset.id,
            "name": a.asset.name,
            "asset_tag": a.asset.asset_tag,
            "ip_address": a.asset.ip_address,
            "purdue_level": a.asset.purdue_level,
            "criticality": a.asset.criticality,
            "isolation_status": a.asset.isolation_status
        } if a.asset else None,
        "campaign_id": a.campaign_id,
        "xai_explanation": json.loads(a.xai_explanation) if a.xai_explanation else None
    }

@router.patch("/{alert_id}/status")
def update_alert_status(alert_id: str, payload: AlertStatusUpdate, db: Session = Depends(get_db)):
    a = db.query(Alert).filter((Alert.alert_id == alert_id) | (Alert.id == (int(alert_id) if alert_id.isdigit() else -1))).first()
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found")

    old_status = a.detection_status
    a.detection_status = payload.status
    db.commit()

    record_audit(
        db=db,
        user_email="analyst@sentinelgrid.cni",
        action="ALERT_STATUS_UPDATE",
        entity=f"ALERT:{a.alert_id}",
        event_details=f"Alert status modified from '{old_status}' to '{payload.status}'"
    )

    return {"status": "success", "alert_id": a.alert_id, "detection_status": a.detection_status}

@router.post("/{alert_id}/promote-incident")
def promote_alert_to_incident(alert_id: str, payload: PromoteIncidentRequest, db: Session = Depends(get_db)):
    a = db.query(Alert).filter((Alert.alert_id == alert_id) | (Alert.id == (int(alert_id) if alert_id.isdigit() else -1))).first()
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found")

    inc_id = f"INC-2026-{uuid.uuid4().hex[:4].upper()}"
    now = datetime.utcnow()

    affected_assets = [a.asset.name] if a.asset else ["Critical CNI Asset"]
    mitre_techs = [a.mitre_technique_id] if a.mitre_technique_id else ["T1078"]
    related_alerts = [a.alert_id]

    timeline = [
        {
            "time": now.strftime("%Y-%m-%d %H:%M:%S"),
            "author": payload.assigned_analyst or "SOC Analyst",
            "text": f"Incident formally opened via alert promotion from {a.alert_id} ({a.title})."
        }
    ]

    notes = []
    if payload.additional_notes:
        notes.append({
            "time": now.strftime("%Y-%m-%d %H:%M:%S"),
            "author": payload.assigned_analyst or "SOC Analyst",
            "note": payload.additional_notes
        })

    new_inc = Incident(
        incident_id=inc_id,
        title=f"Promoted: {a.title}",
        description=f"Auto-generated incident from Alert {a.alert_id}. Source: {a.source_ip} -> Destination: {a.destination_ip}. Evidence: {a.evidence}",
        severity=a.severity,
        status="Investigating",
        assigned_analyst=payload.assigned_analyst or "Priya Sharma",
        created_at=now,
        updated_at=now,
        affected_assets=json.dumps(affected_assets),
        mitre_techniques=json.dumps(mitre_techs),
        related_alerts=json.dumps(related_alerts),
        timeline_events=json.dumps(timeline),
        notes=json.dumps(notes)
    )
    db.add(new_inc)

    # Update alert status
    a.detection_status = "Investigating"
    db.commit()

    record_audit(
        db=db,
        user_email="analyst@sentinelgrid.cni",
        action="ALERT_PROMOTED_TO_INCIDENT",
        entity=f"ALERT:{a.alert_id}",
        event_details=f"Alert {a.alert_id} elevated to Incident {inc_id} assigned to {new_inc.assigned_analyst}"
    )

    return {
        "status": "success",
        "incident_id": inc_id,
        "title": new_inc.title,
        "assigned_analyst": new_inc.assigned_analyst
    }
