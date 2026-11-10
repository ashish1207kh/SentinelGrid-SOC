from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database.connection import get_db
from app.database.models import AuditLog
from app.services.audit_service import verify_audit_chain, record_audit

router = APIRouter(prefix="/api/audit", tags=["Tamper-Evident Audit Trail"])

@router.get("/logs")
def list_audit_logs(
    action: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if action and action.lower() != "all":
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))

    logs = query.order_by(AuditLog.id.desc()).limit(limit).all()

    return [
        {
            "id": l.id,
            "audit_id": l.audit_id,
            "user_email": l.user_email,
            "action": l.action,
            "timestamp": l.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "entity": l.entity,
            "event_details": l.event_details,
            "integrity_hash": l.integrity_hash,
            "previous_hash": l.previous_hash
        }
        for l in logs
    ]

@router.post("/verify")
def verify_integrity(db: Session = Depends(get_db)):
    result = verify_audit_chain(db)
    
    # Also log this audit check into the chain itself
    record_audit(
        db=db,
        user_email="soc_auditor@sentinelgrid.cni",
        action="AUDIT_CHAIN_VERIFICATION",
        entity="SECURITY_LEDGER",
        event_details=f"Cryptographic hash chain verification evaluated: Valid={result['is_valid']}, Verified={result['verified_records']}/{result['total_records']} blocks."
    )

    return result
