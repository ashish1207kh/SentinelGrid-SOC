import json
import uuid
import io
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List
from fpdf import FPDF

from app.database.connection import get_db
from app.database.models import ComplianceReport, Incident, Alert
from app.services.audit_service import record_audit

router = APIRouter(prefix="/api/cert-in", tags=["CERT-In Compliance Reporting"])

class GenerateReportRequest(BaseModel):
    incident_id: str
    incident_category: Optional[str] = "Targeted Intrusion / Critical Infrastructure Attack"
    remarks: Optional[str] = "Generated for National Cyber Coordination Centre (NCCC) / CERT-In compliance demonstration."

class CustomReportRequest(BaseModel):
    incident_id: str
    incident_category: str
    affected_systems: str
    source_ip: str
    destination_ip: str
    description: str
    iocs: str
    impact_assessment: str
    actions_taken: str
    status: str = "Draft"
    remarks: Optional[str] = "Demonstration report"

@router.get("/reports")
def list_reports(db: Session = Depends(get_db)):
    reports = db.query(ComplianceReport).order_by(ComplianceReport.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "report_reference": r.report_reference,
            "incident_id": r.incident_id,
            "incident_category": r.incident_category,
            "detection_time": r.detection_time.strftime("%Y-%m-%d %H:%M:%S"),
            "occurrence_time": r.occurrence_time.strftime("%Y-%m-%d %H:%M:%S"),
            "affected_systems": r.affected_systems,
            "source_ip": r.source_ip,
            "destination_ip": r.destination_ip,
            "description": r.description,
            "iocs": r.iocs,
            "impact_assessment": r.impact_assessment,
            "actions_taken": r.actions_taken,
            "status": r.status,
            "remarks": r.remarks,
            "generated_by": r.generated_by,
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }
        for r in reports
    ]

@router.get("/{report_id}")
def get_report_detail(report_id: str, db: Session = Depends(get_db)):
    r = db.query(ComplianceReport).filter(
        (ComplianceReport.report_reference == report_id) | (ComplianceReport.id == (int(report_id) if report_id.isdigit() else -1))
    ).first()
    if not r:
        raise HTTPException(status_code=404, detail="Compliance report not found")

    return {
        "id": r.id,
        "report_reference": r.report_reference,
        "incident_id": r.incident_id,
        "incident_category": r.incident_category,
        "detection_time": r.detection_time.strftime("%Y-%m-%d %H:%M:%S"),
        "occurrence_time": r.occurrence_time.strftime("%Y-%m-%d %H:%M:%S"),
        "affected_systems": r.affected_systems,
        "source_ip": r.source_ip,
        "destination_ip": r.destination_ip,
        "description": r.description,
        "iocs": r.iocs,
        "impact_assessment": r.impact_assessment,
        "actions_taken": r.actions_taken,
        "status": r.status,
        "remarks": r.remarks,
        "generated_by": r.generated_by,
        "created_at": r.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "regulatory_disclaimer": "DEMONSTRATION REPORT - Prepared in accordance with CERT-In directions under Section 70B of The IT Act, 2000 for SOC analyst evaluation."
    }

@router.post("/generate")
def generate_report_from_incident(payload: GenerateReportRequest, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.incident_id == payload.incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident ID not found")

    ref_num = f"CERT-IN-2026-CNI-{uuid.uuid4().hex[:4].upper()}"
    now = datetime.utcnow()

    affected_assets = ", ".join(json.loads(inc.affected_assets)) if inc.affected_assets else "CNI Core Infrastructure"
    techs = ", ".join(json.loads(inc.mitre_techniques)) if inc.mitre_techniques else "T1078, T1021"

    new_report = ComplianceReport(
        report_reference=ref_num,
        incident_id=inc.incident_id,
        incident_category=payload.incident_category or "Targeted Intrusion / Critical National Infrastructure",
        detection_time=inc.created_at,
        occurrence_time=inc.created_at - timedelta(hours=1),
        affected_systems=affected_assets,
        source_ip="185.220.101.44 (Tor Exit), 45.33.32.156 (C2 Egress)",
        destination_ip="10.0.0.1 (DMZ Firewall), 10.0.1.10, 192.168.10.12",
        description=inc.description,
        iocs=f"MITRE Techniques: {techs} | C2 IP: 45.33.32.156:8443 | Breaker Register: 0x002A",
        impact_assessment=f"Incident Severity: {inc.severity}. Potential disruption to substation electrical distribution mitigated via rapid SOAR isolation.",
        actions_taken="Account locked; target endpoints isolated in quarantine VLAN; perimeter firewall drop rule enacted; evidence preserved.",
        status="Generated (Demonstration)",
        remarks=payload.remarks or "Mandatory report drafted under IT Act Section 70B compliance module.",
        generated_by=inc.assigned_analyst or "SOC Analyst",
        created_at=now
    )
    db.add(new_report)
    db.commit()

    record_audit(
        db=db,
        user_email="analyst@sentinelgrid.cni",
        action="CERT_IN_REPORT_GENERATED",
        entity=f"REPORT:{ref_num}",
        event_details=f"Generated CERT-In compliance report for Incident {inc.incident_id} ({ref_num})"
    )

    return {
        "status": "success",
        "report_reference": ref_num,
        "id": new_report.id,
        "message": "CERT-In demonstration report generated successfully."
    }

@router.get("/{report_id}/export-json")
def export_report_json(report_id: str, db: Session = Depends(get_db)):
    r = db.query(ComplianceReport).filter(
        (ComplianceReport.report_reference == report_id) | (ComplianceReport.id == (int(report_id) if report_id.isdigit() else -1))
    ).first()
    if not r:
        raise HTTPException(status_code=404, detail="Report not found")

    payload = {
        "compliance_standard": "Indian Computer Emergency Response Team (CERT-In) Section 70B IT Act 2000",
        "report_type": "Cyber Security Incident Demonstration Report",
        "report_reference": r.report_reference,
        "incident_id": r.incident_id,
        "incident_category": r.incident_category,
        "detection_timestamp_utc": r.detection_time.isoformat(),
        "occurrence_timestamp_utc": r.occurrence_time.isoformat(),
        "affected_systems": r.affected_systems,
        "source_ip": r.source_ip,
        "destination_ip": r.destination_ip,
        "incident_narrative": r.description,
        "indicators_of_compromise": r.iocs,
        "impact_assessment": r.impact_assessment,
        "remediation_actions": r.actions_taken,
        "current_status": r.status,
        "remarks": r.remarks,
        "generated_by": r.generated_by,
        "generated_at_utc": r.created_at.isoformat(),
        "simulation_notice": "THIS IS A DEMONSTRATION DOCUMENT GENERATED WITHIN SENTINELGRID FOR ACADEMIC & SOC EVALUATION PURPOSES ONLY."
    }

    return Response(
        content=json.dumps(payload, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={r.report_reference}.json"}
    )

@router.get("/{report_id}/pdf")
def download_report_pdf(report_id: str, db: Session = Depends(get_db)):
    r = db.query(ComplianceReport).filter(
        (ComplianceReport.report_reference == report_id) | (ComplianceReport.id == (int(report_id) if report_id.isdigit() else -1))
    ).first()
    if not r:
        raise HTTPException(status_code=404, detail="Report not found")

    # Generate PDF using fpdf2
    pdf = FPDF(orientation="P", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    # Header styling
    pdf.set_fill_color(8, 11, 18) # Dark background
    pdf.rect(0, 0, 210, 35, "F")
    
    # Title
    pdf.set_text_color(0, 218, 218) # Cyan
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_xy(12, 10)
    pdf.cell(186, 8, "SENTINELGRID | CERT-In INCIDENT REPORT", ln=True)

    pdf.set_text_color(160, 175, 200)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_xy(12, 20)
    pdf.cell(186, 5, f"REF: {r.report_reference}  |  STATUS: DEMONSTRATION RECORD  |  PURSUANT TO SECTION 70B IT ACT", ln=True)

    # Watermark Notice
    pdf.set_text_color(220, 50, 50)
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_xy(12, 40)
    pdf.cell(186, 6, "*** DEMONSTRATION MODE - NOT AN OFFICIAL CERT-In FILING ***", ln=True, align="C")

    # Content table
    pdf.set_text_color(20, 30, 50)
    pdf.set_font("Helvetica", "B", 11)
    
    fields = [
        ("Incident Reference ID", r.report_reference),
        ("Internal Incident ID", r.incident_id),
        ("Incident Category", r.incident_category),
        ("Detection Date & Time", r.detection_time.strftime("%Y-%m-%d %H:%M:%S UTC")),
        ("Occurrence Date & Time", r.occurrence_time.strftime("%Y-%m-%d %H:%M:%S UTC")),
        ("Affected Systems / CNI Nodes", r.affected_systems),
        ("Source IP Address(es)", r.source_ip),
        ("Destination IP Address(es)", r.destination_ip),
        ("Incident Description & Narrative", r.description),
        ("Indicators of Compromise (IOCs)", r.iocs),
        ("Impact Assessment", r.impact_assessment),
        ("Remedial Actions Enacted", r.actions_taken),
        ("Reporting Officer", r.generated_by),
        ("Report Generation Timestamp", r.created_at.strftime("%Y-%m-%d %H:%M:%S UTC"))
    ]

    pdf.set_xy(12, 50)
    for title, val in fields:
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(0, 70, 130)
        pdf.cell(65, 7, f"{title}:", border=0)
        
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(30, 40, 50)
        # Check if text is long
        if len(str(val)) > 65:
            pdf.ln(6)
            pdf.set_x(14)
            pdf.multi_cell(182, 5, str(val))
            pdf.ln(2)
        else:
            pdf.cell(120, 7, str(val), ln=True)

    pdf_bytes = bytes(pdf.output())

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={r.report_reference}.pdf"}
    )
