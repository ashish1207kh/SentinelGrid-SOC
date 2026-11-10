import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import AttackCampaign, Alert, Asset

router = APIRouter(prefix="/api/campaigns", tags=["Attack Campaigns"])

@router.get("")
def list_attack_campaigns(db: Session = Depends(get_db)):
    campaigns = db.query(AttackCampaign).order_by(AttackCampaign.risk_score.desc()).all()
    results = []
    for c in campaigns:
        alerts = db.query(Alert).filter(Alert.campaign_id == c.id).all()
        results.append({
            "id": c.id,
            "campaign_id": c.campaign_id,
            "name": c.name,
            "description": c.description,
            "threat_actor": c.threat_actor,
            "risk_score": c.risk_score,
            "status": c.status,
            "start_time": c.start_time.strftime("%Y-%m-%d %H:%M:%S"),
            "last_active": c.last_active.strftime("%Y-%m-%d %H:%M:%S"),
            "affected_devices_count": c.affected_devices_count,
            "alerts_count": max(c.alerts_count, len(alerts)),
            "stages": json.loads(c.stages_data) if c.stages_data else []
        })
    return results

@router.get("/{campaign_id}")
def get_campaign_detail(campaign_id: str, db: Session = Depends(get_db)):
    c = db.query(AttackCampaign).filter(
        (AttackCampaign.campaign_id == campaign_id) | (AttackCampaign.id == (int(campaign_id) if campaign_id.isdigit() else -1))
    ).first()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")

    alerts = db.query(Alert).filter(Alert.campaign_id == c.id).order_by(Alert.timestamp.asc()).all()

    return {
        "id": c.id,
        "campaign_id": c.campaign_id,
        "name": c.name,
        "description": c.description,
        "threat_actor": c.threat_actor,
        "risk_score": c.risk_score,
        "status": c.status,
        "start_time": c.start_time.strftime("%Y-%m-%d %H:%M:%S"),
        "last_active": c.last_active.strftime("%Y-%m-%d %H:%M:%S"),
        "affected_devices_count": c.affected_devices_count,
        "alerts_count": len(alerts),
        "stages": json.loads(c.stages_data) if c.stages_data else [],
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
                "mitre_technique_id": a.mitre_technique_id,
                "evidence": a.evidence
            }
            for a in alerts
        ]
    }
