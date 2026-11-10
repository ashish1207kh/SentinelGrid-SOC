import hashlib
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.database.models import AuditLog

GENESIS_HASH = "0" * 64

def calculate_audit_hash(previous_hash: str, user_email: str, action: str, timestamp_str: str, entity: str, event_details: str) -> str:
    raw_payload = f"{previous_hash}|{user_email}|{action}|{timestamp_str}|{entity}|{event_details}"
    return hashlib.sha256(raw_payload.encode("utf-8")).hexdigest()

def record_audit(
    db: Session,
    user_email: str,
    action: str,
    entity: str,
    event_details: str,
    audit_id: str = None,
    timestamp: datetime = None
) -> AuditLog:
    if timestamp is None:
        timestamp = datetime.utcnow()
    if audit_id is None:
        audit_id = f"AUD-{uuid.uuid4().hex[:8].upper()}"

    last_record = db.query(AuditLog).order_by(AuditLog.id.desc()).first()
    previous_hash = last_record.integrity_hash if last_record else GENESIS_HASH

    timestamp_str = timestamp.strftime("%Y-%m-%d %H:%M:%S")
    current_hash = calculate_audit_hash(
        previous_hash=previous_hash,
        user_email=user_email,
        action=action,
        timestamp_str=timestamp_str,
        entity=entity,
        event_details=event_details
    )

    new_log = AuditLog(
        audit_id=audit_id,
        user_email=user_email,
        action=action,
        timestamp=timestamp,
        entity=entity,
        event_details=event_details,
        integrity_hash=current_hash,
        previous_hash=previous_hash
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log

def verify_audit_chain(db: Session) -> dict:
    logs = db.query(AuditLog).order_by(AuditLog.id.asc()).all()
    if not logs:
        return {
            "is_valid": True,
            "total_records": 0,
            "verified_records": 0,
            "broken_at_id": None,
            "message": "Audit chain is empty. Genesis state intact."
        }

    expected_prev = GENESIS_HASH
    for i, log in enumerate(logs):
        if log.previous_hash != expected_prev:
            return {
                "is_valid": False,
                "total_records": len(logs),
                "verified_records": i,
                "broken_at_id": log.audit_id,
                "message": f"Hash chain discrepancy detected at Record {log.audit_id}. Previous hash does not match prior record."
            }
        
        timestamp_str = log.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        recomputed_hash = calculate_audit_hash(
            previous_hash=log.previous_hash,
            user_email=log.user_email,
            action=log.action,
            timestamp_str=timestamp_str,
            entity=log.entity,
            event_details=log.event_details
        )
        if recomputed_hash != log.integrity_hash:
            return {
                "is_valid": False,
                "total_records": len(logs),
                "verified_records": i,
                "broken_at_id": log.audit_id,
                "message": f"Integrity violation! Tampered content detected at Record {log.audit_id}. Stored hash does not match payload digest."
            }
        
        expected_prev = log.integrity_hash

    return {
        "is_valid": True,
        "total_records": len(logs),
        "verified_records": len(logs),
        "broken_at_id": None,
        "message": f"Cryptographic audit chain fully verified ({len(logs)} blocks). No tampering detected."
    }
