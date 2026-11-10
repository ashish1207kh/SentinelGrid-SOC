import json
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database.connection import get_db
from app.database.models import Playbook, PlaybookExecution, Asset
from app.services.audit_service import record_audit

router = APIRouter(prefix="/api/soar", tags=["SOAR Automation"])

class RunPlaybookRequest(BaseModel):
    target_entity: Optional[str] = "Simulated CNI Host"
    triggered_by: Optional[str] = "SOC Analyst Manual Trigger"

class ApprovalActionRequest(BaseModel):
    analyst_name: Optional[str] = "Priya Sharma"
    comments: Optional[str] = "Authorized by SOC Lead for containment."

@router.get("/playbooks")
def list_playbooks(db: Session = Depends(get_db)):
    playbooks = db.query(Playbook).all()
    return [
        {
            "id": p.id,
            "playbook_id": p.playbook_id,
            "name": p.name,
            "description": p.description,
            "trigger_condition": p.trigger_condition,
            "automated_actions": json.loads(p.automated_actions),
            "requires_approval": p.requires_approval,
            "is_active": p.is_active
        }
        for p in playbooks
    ]

@router.get("/executions")
def list_executions(limit: int = 50, db: Session = Depends(get_db)):
    executions = db.query(PlaybookExecution).order_by(PlaybookExecution.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": e.id,
            "execution_id": e.execution_id,
            "playbook_id": e.playbook_id,
            "playbook_name": e.playbook_name,
            "triggered_by": e.triggered_by,
            "target_entity": e.target_entity,
            "status": e.status,
            "approval_status": e.approval_status,
            "approved_by": e.approved_by,
            "response_actions": json.loads(e.response_actions) if e.response_actions else [],
            "timestamp": e.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "log_output": e.log_output
        }
        for e in executions
    ]

@router.post("/playbooks/{playbook_id}/run")
def execute_playbook(playbook_id: str, payload: RunPlaybookRequest, db: Session = Depends(get_db)):
    p = db.query(Playbook).filter((Playbook.playbook_id == playbook_id) | (Playbook.id == (int(playbook_id) if playbook_id.isdigit() else -1))).first()
    if not p:
        raise HTTPException(status_code=404, detail="Playbook not found")

    exec_id = f"EXE-{uuid.uuid4().hex[:6].upper()}"
    now = datetime.utcnow()
    raw_actions = json.loads(p.automated_actions)

    if p.requires_approval:
        status_val = "Pending Approval"
        appr_status = "Pending"
        appr_by = None
        actions_list = [f"[SIMULATION - QUEUED] {act}" for act in raw_actions]
        log_out = f"Playbook {p.playbook_id} staged. High-impact containment action requires approval from Security Administrator."
    else:
        status_val = "Completed"
        appr_status = "Not Required"
        appr_by = "System Auto-Enacted"
        actions_list = [f"[SIMULATION - EXECUTED] {act}" for act in raw_actions]
        log_out = f"Playbook {p.playbook_id} completed successfully in 280ms. Containment applied on simulated target {payload.target_entity}."

    new_exec = PlaybookExecution(
        execution_id=exec_id,
        playbook_id=p.playbook_id,
        playbook_name=p.name,
        triggered_by=payload.triggered_by or "Analyst",
        target_entity=payload.target_entity,
        status=status_val,
        approval_status=appr_status,
        approved_by=appr_by,
        response_actions=json.dumps(actions_list),
        timestamp=now,
        log_output=log_out
    )
    db.add(new_exec)
    db.commit()

    record_audit(
        db=db,
        user_email="analyst@sentinelgrid.cni",
        action="PLAYBOOK_TRIGGERED",
        entity=f"SOAR:{p.playbook_id}",
        event_details=f"Playbook {p.name} invoked on {payload.target_entity}. Status: {status_val}"
    )

    return {
        "status": "success",
        "execution_id": exec_id,
        "playbook_id": p.playbook_id,
        "playbook_name": p.name,
        "execution_status": status_val,
        "approval_status": appr_status,
        "actions": actions_list,
        "log_output": log_out
    }

@router.post("/executions/{execution_id}/approve")
def approve_playbook_execution(execution_id: str, payload: ApprovalActionRequest, db: Session = Depends(get_db)):
    exec_record = db.query(PlaybookExecution).filter(
        (PlaybookExecution.execution_id == execution_id) | (PlaybookExecution.id == (int(execution_id) if execution_id.isdigit() else -1))
    ).first()
    if not exec_record:
        raise HTTPException(status_code=404, detail="Execution not found")

    exec_record.status = "Completed"
    exec_record.approval_status = "Approved"
    exec_record.approved_by = payload.analyst_name or "Vikram Malhotra (Security Admin)"
    
    # Update action notes
    raw_actions = json.loads(exec_record.response_actions)
    updated_actions = [act.replace("QUEUED", "APPROVED & ENACTED") for act in raw_actions]
    exec_record.response_actions = json.dumps(updated_actions)
    exec_record.log_output += f" | APPROVED by {exec_record.approved_by} at {datetime.utcnow().strftime('%H:%M:%S')}. {payload.comments}"
    db.commit()

    record_audit(
        db=db,
        user_email="admin@sentinelgrid.cni",
        action="SOAR_APPROVAL_GRANTED",
        entity=f"SOAR_EXEC:{exec_record.execution_id}",
        event_details=f"Approved containment action for {exec_record.target_entity}. Commenced simulated isolation."
    )

    return {
        "status": "success",
        "execution_id": exec_record.execution_id,
        "approval_status": "Approved",
        "approved_by": exec_record.approved_by,
        "message": f"[SIMULATION] Action approved and executed on {exec_record.target_entity}."
    }

@router.post("/executions/{execution_id}/reject")
def reject_playbook_execution(execution_id: str, payload: ApprovalActionRequest, db: Session = Depends(get_db)):
    exec_record = db.query(PlaybookExecution).filter(
        (PlaybookExecution.execution_id == execution_id) | (PlaybookExecution.id == (int(execution_id) if execution_id.isdigit() else -1))
    ).first()
    if not exec_record:
        raise HTTPException(status_code=404, detail="Execution not found")

    exec_record.status = "Rejected"
    exec_record.approval_status = "Rejected"
    exec_record.approved_by = payload.analyst_name or "Security Admin"
    exec_record.log_output += f" | REJECTED by {exec_record.approved_by}. Containment aborted. Comments: {payload.comments}"
    db.commit()

    record_audit(
        db=db,
        user_email="admin@sentinelgrid.cni",
        action="SOAR_APPROVAL_REJECTED",
        entity=f"SOAR_EXEC:{exec_record.execution_id}",
        event_details=f"Containment action for {exec_record.target_entity} was rejected by analyst."
    )

    return {
        "status": "success",
        "execution_id": exec_record.execution_id,
        "approval_status": "Rejected",
        "message": "Action rejected. Simulated containment cancelled."
    }
