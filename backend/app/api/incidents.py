import json
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database.connection import get_db
from app.database.models import Incident
from app.services.audit_service import record_audit

router = APIRouter(prefix="/api/incidents", tags=["Incident Management"])

class CreateIncidentRequest(BaseModel):
    title: str
    description: str
    severity: str = "High"
    assigned_analyst: str = "Priya Sharma"
    affected_assets: List[str] = ["CNI-PWR-SCADA-01"]
    mitre_techniques: List[str] = ["T1078"]
    related_alerts: List[str] = []

class UpdateIncidentRequest(BaseModel):
    status: Optional[str] = None
    severity: Optional[str] = None
    assigned_analyst: Optional[str] = None
    notes: Optional[str] = None

class AddNoteRequest(BaseModel):
    author: Optional[str] = "Priya Sharma"
    note: str

@router.get("")
def list_incidents(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Incident)
    if status and status.lower() != "all":
        query = query.filter(Incident.status.ilike(status))
    if severity and severity.lower() != "all":
        query = query.filter(Incident.severity.ilike(severity))
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Incident.title.ilike(search_filter)) |
            (Incident.incident_id.ilike(search_filter)) |
            (Incident.description.ilike(search_filter)) |
            (Incident.assigned_analyst.ilike(search_filter))
        )

    incidents = query.order_by(Incident.updated_at.desc()).all()
    return [
        {
            "id": inc.id,
            "incident_id": inc.incident_id,
            "title": inc.title,
            "description": inc.description,
            "severity": inc.severity,
            "status": inc.status,
            "assigned_analyst": inc.assigned_analyst,
            "created_at": inc.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "updated_at": inc.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
            "affected_assets": json.loads(inc.affected_assets) if inc.affected_assets else [],
            "mitre_techniques": json.loads(inc.mitre_techniques) if inc.mitre_techniques else [],
            "related_alerts": json.loads(inc.related_alerts) if inc.related_alerts else [],
            "notes_count": len(json.loads(inc.notes)) if inc.notes else 0
        }
        for inc in incidents
    ]

@router.get("/{incident_id}")
def get_incident_detail(incident_id: str, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(
        (Incident.incident_id == incident_id) | (Incident.id == (int(incident_id) if incident_id.isdigit() else -1))
    ).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    return {
        "id": inc.id,
        "incident_id": inc.incident_id,
        "title": inc.title,
        "description": inc.description,
        "severity": inc.severity,
        "status": inc.status,
        "assigned_analyst": inc.assigned_analyst,
        "created_at": inc.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "updated_at": inc.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
        "affected_assets": json.loads(inc.affected_assets) if inc.affected_assets else [],
        "mitre_techniques": json.loads(inc.mitre_techniques) if inc.mitre_techniques else [],
        "related_alerts": json.loads(inc.related_alerts) if inc.related_alerts else [],
        "timeline_events": json.loads(inc.timeline_events) if inc.timeline_events else [],
        "notes": json.loads(inc.notes) if inc.notes else []
    }

@router.post("")
def create_incident(payload: CreateIncidentRequest, db: Session = Depends(get_db)):
    now = datetime.utcnow()
    inc_id = f"INC-2026-{uuid.uuid4().hex[:4].upper()}"

    initial_timeline = [
        {
            "time": now.strftime("%Y-%m-%d %H:%M:%S"),
            "author": payload.assigned_analyst,
            "text": f"Incident {inc_id} formally initiated by analyst."
        }
    ]

    new_inc = Incident(
        incident_id=inc_id,
        title=payload.title,
        description=payload.description,
        severity=payload.severity,
        status="New",
        assigned_analyst=payload.assigned_analyst,
        created_at=now,
        updated_at=now,
        affected_assets=json.dumps(payload.affected_assets),
        mitre_techniques=json.dumps(payload.mitre_techniques),
        related_alerts=json.dumps(payload.related_alerts),
        timeline_events=json.dumps(initial_timeline),
        notes=json.dumps([])
    )
    db.add(new_inc)
    db.commit()

    record_audit(
        db=db,
        user_email="analyst@sentinelgrid.cni",
        action="INCIDENT_CREATED",
        entity=f"INCIDENT:{inc_id}",
        event_details=f"Created incident '{payload.title}' with severity {payload.severity}"
    )

    return {"status": "success", "incident_id": inc_id, "id": new_inc.id}

@router.patch("/{incident_id}")
def update_incident(incident_id: str, payload: UpdateIncidentRequest, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(
        (Incident.incident_id == incident_id) | (Incident.id == (int(incident_id) if incident_id.isdigit() else -1))
    ).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    now = datetime.utcnow()
    timeline = json.loads(inc.timeline_events) if inc.timeline_events else []
    changes = []

    if payload.status and payload.status != inc.status:
        changes.append(f"Status changed from {inc.status} -> {payload.status}")
        inc.status = payload.status
    if payload.severity and payload.severity != inc.severity:
        changes.append(f"Severity changed from {inc.severity} -> {payload.severity}")
        inc.severity = payload.severity
    if payload.assigned_analyst and payload.assigned_analyst != inc.assigned_analyst:
        changes.append(f"Assigned analyst changed from {inc.assigned_analyst} -> {payload.assigned_analyst}")
        inc.assigned_analyst = payload.assigned_analyst

    if changes:
        timeline.append({
            "time": now.strftime("%Y-%m-%d %H:%M:%S"),
            "author": payload.assigned_analyst or inc.assigned_analyst,
            "text": "; ".join(changes)
        })
        inc.timeline_events = json.dumps(timeline)

    inc.updated_at = now
    db.commit()

    record_audit(
        db=db,
        user_email="analyst@sentinelgrid.cni",
        action="INCIDENT_UPDATED",
        entity=f"INCIDENT:{inc.incident_id}",
        event_details=f"Incident {inc.incident_id} modified: {'; '.join(changes) if changes else 'Timestamp refreshed'}"
    )

    return {"status": "success", "incident_id": inc.incident_id, "updated_at": inc.updated_at}

@router.post("/{incident_id}/notes")
def add_incident_note(incident_id: str, payload: AddNoteRequest, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(
        (Incident.incident_id == incident_id) | (Incident.id == (int(incident_id) if incident_id.isdigit() else -1))
    ).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    now = datetime.utcnow()
    notes = json.loads(inc.notes) if inc.notes else []
    notes.append({
        "time": now.strftime("%Y-%m-%d %H:%M:%S"),
        "author": payload.author or "Priya Sharma",
        "note": payload.note
    })
    inc.notes = json.dumps(notes)
    inc.updated_at = now
    db.commit()

    record_audit(
        db=db,
        user_email="analyst@sentinelgrid.cni",
        action="INCIDENT_NOTE_ADDED",
        entity=f"INCIDENT:{inc.incident_id}",
        event_details=f"Analyst {payload.author} appended investigation note to {inc.incident_id}"
    )

    return {"status": "success", "notes_count": len(notes)}
