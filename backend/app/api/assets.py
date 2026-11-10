from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import Asset, Alert
from app.services.audit_service import record_audit

router = APIRouter(prefix="/api/assets", tags=["Asset Inventory"])

@router.get("")
def list_assets(db: Session = Depends(get_db)):
    assets = db.query(Asset).all()
    results = []
    for a in assets:
        alerts_count = db.query(Alert).filter(Alert.asset_id == a.id).count()
        results.append({
            "id": a.id,
            "asset_tag": a.asset_tag,
            "name": a.name,
            "ip_address": a.ip_address,
            "mac_address": a.mac_address,
            "asset_type": a.asset_type,
            "os": a.os,
            "purdue_level": a.purdue_level,
            "criticality": a.criticality,
            "status": a.status,
            "isolation_status": a.isolation_status,
            "vulnerabilities_count": a.vulnerabilities_count,
            "last_seen": a.last_seen.strftime("%Y-%m-%d %H:%M:%S"),
            "associated_alerts_count": alerts_count
        })
    return results

@router.get("/{asset_id}")
def get_asset_detail(asset_id: int, db: Session = Depends(get_db)):
    a = db.query(Asset).filter(Asset.id == asset_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Asset not found")

    alerts = db.query(Alert).filter(Alert.asset_id == a.id).order_by(Alert.timestamp.desc()).all()

    return {
        "id": a.id,
        "asset_tag": a.asset_tag,
        "name": a.name,
        "ip_address": a.ip_address,
        "mac_address": a.mac_address,
        "asset_type": a.asset_type,
        "os": a.os,
        "purdue_level": a.purdue_level,
        "criticality": a.criticality,
        "status": a.status,
        "isolation_status": a.isolation_status,
        "vulnerabilities_count": a.vulnerabilities_count,
        "last_seen": a.last_seen.strftime("%Y-%m-%d %H:%M:%S"),
        "alerts": [
            {
                "id": al.id,
                "alert_id": al.alert_id,
                "title": al.title,
                "severity": al.severity,
                "detection_status": al.detection_status,
                "timestamp": al.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            }
            for al in alerts
        ]
    }

@router.post("/{asset_id}/quarantine")
def quarantine_asset(asset_id: int, db: Session = Depends(get_db)):
    a = db.query(Asset).filter(Asset.id == asset_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Asset not found")

    a.isolation_status = True
    a.status = "Quarantined"
    db.commit()

    record_audit(
        db=db,
        user_email="analyst@sentinelgrid.cni",
        action="ASSET_NETWORK_ISOLATION",
        entity=f"ASSET:{a.asset_tag}",
        event_details=f"[SIMULATION] Asset {a.name} ({a.ip_address}) placed into virtual quarantine network segment."
    )

    return {
        "status": "success",
        "message": f"[SIMULATION] Asset {a.name} isolated successfully. Egress & Ingress traffic blocked.",
        "isolation_status": a.isolation_status,
        "asset_status": a.status
    }

@router.post("/{asset_id}/unquarantine")
def unquarantine_asset(asset_id: int, db: Session = Depends(get_db)):
    a = db.query(Asset).filter(Asset.id == asset_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Asset not found")

    a.isolation_status = False
    a.status = "Online"
    db.commit()

    record_audit(
        db=db,
        user_email="admin@sentinelgrid.cni",
        action="ASSET_NETWORK_RESTORATION",
        entity=f"ASSET:{a.asset_tag}",
        event_details=f"[SIMULATION] Quarantine released for asset {a.name} ({a.ip_address}). Network connectivity restored."
    )

    return {
        "status": "success",
        "message": f"[SIMULATION] Asset {a.name} restored to operational network.",
        "isolation_status": a.isolation_status,
        "asset_status": a.status
    }
