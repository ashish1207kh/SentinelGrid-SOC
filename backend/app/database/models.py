from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="SOC Analyst") # 'SOC Analyst' or 'Security Administrator'
    full_name = Column(String(100), nullable=False)
    department = Column(String(100), default="CNI Cyber Defense Unit")
    badge_id = Column(String(50), default="SEC-0492")
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, default=datetime.utcnow)


class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    asset_tag = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    ip_address = Column(String(50), index=True, nullable=False)
    mac_address = Column(String(50))
    asset_type = Column(String(50)) # SCADA Controller, RTU Substation, Domain Controller, etc.
    os = Column(String(100))
    purdue_level = Column(String(50)) # 'Level 1 - Control', 'Level 2 - Supervisory', etc.
    criticality = Column(String(20), default="High") # Critical, High, Medium, Low
    status = Column(String(50), default="Online") # Online, Compromised, Quarantined
    isolation_status = Column(Boolean, default=False)
    vulnerabilities_count = Column(Integer, default=0)
    last_seen = Column(DateTime, default=datetime.utcnow)

    alerts = relationship("Alert", back_populates="asset")


class SecurityLog(Base):
    __tablename__ = "security_logs"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(50), unique=True, index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    source_ip = Column(String(50), index=True, nullable=False)
    destination_ip = Column(String(50), index=True, nullable=False)
    username = Column(String(100), index=True, default="system")
    device = Column(String(100), nullable=False)
    event_type = Column(String(50), index=True, nullable=False) # Windows Auth, Firewall, Network, etc.
    protocol = Column(String(20), default="TCP")
    port = Column(Integer, default=443)
    description = Column(Text, nullable=False)
    severity = Column(String(20), default="Informational", index=True) # Critical, High, Medium, Low, Informational
    status = Column(String(50), default="Ingested") # Ingested, Analyzed, Flagged, Correlated
    raw_data = Column(Text, nullable=True) # JSON payload


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    source_ip = Column(String(50), nullable=False)
    destination_ip = Column(String(50), nullable=False)
    username = Column(String(100), default="unknown")
    threat_category = Column(String(100), index=True, nullable=False)
    severity = Column(String(20), index=True, nullable=False) # Critical, High, Medium, Low
    detection_status = Column(String(50), default="New", index=True) # New, Triaged, Investigating, Contained, Resolved, False Positive
    anomaly_score = Column(Float, default=0.0)
    xai_explanation = Column(Text, nullable=True) # JSON or markdown string
    mitre_technique_id = Column(String(20), index=True, default="T1078")
    mitre_tactic = Column(String(100), default="Initial Access")
    evidence = Column(Text, nullable=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=True)
    campaign_id = Column(Integer, ForeignKey("attack_campaigns.id"), nullable=True)

    asset = relationship("Asset", back_populates="alerts")
    campaign = relationship("AttackCampaign", back_populates="alerts")


class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(Integer, primary_key=True, index=True)
    detection_id = Column(String(50), unique=True, index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    username = Column(String(100), default="system")
    source_ip = Column(String(50), nullable=False)
    device = Column(String(100), nullable=False)
    anomaly_score = Column(Float, nullable=False)
    severity = Column(String(20), default="Medium")
    reason = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    feature_attributions = Column(Text, nullable=True) # JSON
    status = Column(String(50), default="Flagged") # Flagged, Investigating, Confirmed, Benign


class AttackCampaign(Base):
    __tablename__ = "attack_campaigns"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    threat_actor = Column(String(100), default="UNCERTAIN_APT")
    risk_score = Column(Integer, default=85) # 0 to 100
    status = Column(String(50), default="Active") # Active, Monitoring, Contained, Closed
    start_time = Column(DateTime, default=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow)
    affected_devices_count = Column(Integer, default=1)
    alerts_count = Column(Integer, default=1)
    stages_data = Column(Text, nullable=True) # JSON of chronological attack steps

    alerts = relationship("Alert", back_populates="campaign")


class MitreTechnique(Base):
    __tablename__ = "mitre_techniques"

    id = Column(Integer, primary_key=True, index=True)
    technique_id = Column(String(20), unique=True, index=True, nullable=False)
    technique_name = Column(String(100), nullable=False)
    tactic = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    mitigation = Column(Text, nullable=False)
    detection_guidance = Column(Text, nullable=True)


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(20), default="High")
    status = Column(String(50), default="New") # New, Investigating, Contained, Resolved, Closed
    assigned_analyst = Column(String(100), default="Unassigned")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    affected_assets = Column(Text, default="[]") # JSON list
    mitre_techniques = Column(Text, default="[]") # JSON list
    related_alerts = Column(Text, default="[]") # JSON list
    timeline_events = Column(Text, default="[]") # JSON list of objects
    notes = Column(Text, default="[]") # JSON list of notes


class Playbook(Base):
    __tablename__ = "playbooks"

    id = Column(Integer, primary_key=True, index=True)
    playbook_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    trigger_condition = Column(String(200), nullable=False)
    automated_actions = Column(Text, nullable=False) # JSON list
    requires_approval = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)


class PlaybookExecution(Base):
    __tablename__ = "playbook_executions"

    id = Column(Integer, primary_key=True, index=True)
    execution_id = Column(String(50), unique=True, index=True, nullable=False)
    playbook_id = Column(String(50), nullable=False)
    playbook_name = Column(String(150), nullable=False)
    triggered_by = Column(String(100), default="SOAR Engine")
    target_entity = Column(String(100), nullable=False)
    status = Column(String(50), default="Completed") # Completed, Pending Approval, Executing, Rejected, Failed
    approval_status = Column(String(50), default="Not Required") # Approved, Rejected, Not Required, Pending
    approved_by = Column(String(100), nullable=True)
    response_actions = Column(Text, nullable=False) # JSON list
    timestamp = Column(DateTime, default=datetime.utcnow)
    log_output = Column(Text, nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(String(50), unique=True, index=True, nullable=False)
    user_email = Column(String(100), nullable=False)
    action = Column(String(100), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    entity = Column(String(100), nullable=False)
    event_details = Column(Text, nullable=False)
    integrity_hash = Column(String(64), nullable=False)
    previous_hash = Column(String(64), nullable=False)


class ComplianceReport(Base):
    __tablename__ = "compliance_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_reference = Column(String(100), unique=True, index=True, nullable=False)
    incident_id = Column(String(50), nullable=False)
    incident_category = Column(String(100), nullable=False)
    detection_time = Column(DateTime, default=datetime.utcnow)
    occurrence_time = Column(DateTime, default=datetime.utcnow)
    affected_systems = Column(Text, nullable=False)
    source_ip = Column(String(50), nullable=False)
    destination_ip = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    iocs = Column(Text, nullable=False) # JSON or formatted string
    impact_assessment = Column(Text, nullable=False)
    actions_taken = Column(Text, nullable=False)
    status = Column(String(50), default="Draft")
    remarks = Column(Text, nullable=True)
    generated_by = Column(String(100), default="SOC Analyst")
    created_at = Column(DateTime, default=datetime.utcnow)
