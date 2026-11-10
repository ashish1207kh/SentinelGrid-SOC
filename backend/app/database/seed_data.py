import json
import hashlib
from datetime import datetime, timedelta
import bcrypt
from sqlalchemy.orm import Session
from app.database.connection import engine, Base, SessionLocal
from app.database.models import (
    User, Asset, SecurityLog, Alert, Anomaly, AttackCampaign,
    MitreTechnique, Incident, Playbook, PlaybookExecution,
    AuditLog, ComplianceReport
)
from app.services.audit_service import calculate_audit_hash, GENESIS_HASH

def hash_pw(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def seed_database(db: Session, force_reset: bool = False):
    # If already seeded and not force_reset, skip
    if not force_reset and db.query(User).first() is not None:
        return

    # Clear existing tables if reset
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    now = datetime.utcnow()

    # 1. USERS
    analyst_user = User(
        username="analyst_priya",
        email="analyst@sentinelgrid.cni",
        hashed_password=hash_pw("Analyst@2026"),
        role="SOC Analyst",
        full_name="Priya Sharma",
        department="Critical Infrastructure Defense Unit (CIDU)",
        badge_id="SEC-0492",
        created_at=now - timedelta(days=60),
        last_login=now - timedelta(minutes=14)
    )
    admin_user = User(
        username="admin_vikram",
        email="admin@sentinelgrid.cni",
        hashed_password=hash_pw("Admin@2026"),
        role="Security Administrator",
        full_name="Vikram Malhotra",
        department="National Cyber Operations Command",
        badge_id="ADM-0018",
        created_at=now - timedelta(days=90),
        last_login=now - timedelta(hours=2)
    )
    db.add_all([analyst_user, admin_user])
    db.commit()

    # 2. ASSETS
    assets_data = [
        Asset(
            asset_tag="CNI-PWR-SCADA-01",
            name="Power Grid SCADA Master HMI",
            ip_address="192.168.10.5",
            mac_address="00:1B:44:11:3A:B7",
            asset_type="SCADA / HMI Server",
            os="Windows Server 2022 Datacenter (ICS Hardened)",
            purdue_level="Level 2 - Area Supervisory",
            criticality="Critical",
            status="Online",
            isolation_status=False,
            vulnerabilities_count=2,
            last_seen=now - timedelta(minutes=1)
        ),
        Asset(
            asset_tag="CNI-SUB-RTU-12",
            name="Substation 400kV Feeder RTU",
            ip_address="192.168.10.12",
            mac_address="00:1B:44:89:C2:5E",
            asset_type="Remote Terminal Unit (RTU)",
            os="VxWorks 7.0 RTOS",
            purdue_level="Level 1 - Basic Control",
            criticality="Critical",
            status="Online",
            isolation_status=False,
            vulnerabilities_count=0,
            last_seen=now - timedelta(minutes=3)
        ),
        Asset(
            asset_tag="CNI-DC-CORE-01",
            name="Active Directory Domain Controller 01",
            ip_address="10.0.1.10",
            mac_address="52:54:00:8A:FE:91",
            asset_type="Identity & Access Server",
            os="Windows Server 2022 Core",
            purdue_level="Level 4 - Enterprise IT",
            criticality="Critical",
            status="Online",
            isolation_status=False,
            vulnerabilities_count=3,
            last_seen=now - timedelta(seconds=45)
        ),
        Asset(
            asset_tag="CNI-FW-GATEWAY",
            name="Core Perimeter NextGen Firewall",
            ip_address="10.0.0.1",
            mac_address="00:0C:29:4F:8D:12",
            asset_type="Security Gateway / UTM",
            os="FortiOS 7.4.2",
            purdue_level="Level 3.5 - DMZ Gateway",
            criticality="Critical",
            status="Online",
            isolation_status=False,
            vulnerabilities_count=1,
            last_seen=now - timedelta(seconds=15)
        ),
        Asset(
            asset_tag="CNI-ENG-WS-45",
            name="Grid Engineering Workstation 45",
            ip_address="10.0.3.45",
            mac_address="E8:6A:64:12:90:3F",
            asset_type="Engineering Workstation",
            os="Windows 11 Pro Enterprise",
            purdue_level="Level 3 - Site Operations",
            criticality="High",
            status="Compromised",
            isolation_status=False,
            vulnerabilities_count=4,
            last_seen=now - timedelta(minutes=5)
        ),
        Asset(
            asset_tag="CNI-DATA-VAULT",
            name="Grid Telemetry & Historian DB",
            ip_address="10.0.2.25",
            mac_address="00:50:56:B3:91:77",
            asset_type="SCADA Historian Database",
            os="Red Hat Enterprise Linux 9.2",
            purdue_level="Level 3 - Site Operations",
            criticality="Critical",
            status="Online",
            isolation_status=False,
            vulnerabilities_count=1,
            last_seen=now - timedelta(minutes=2)
        ),
        Asset(
            asset_tag="CNI-CLOUD-GW",
            name="Cloud SCADA Analytics Bridge",
            ip_address="172.16.50.12",
            mac_address="02:42:AC:10:32:0C",
            asset_type="Cloud Bridge Node",
            os="Ubuntu 22.04 LTS (Docker Host)",
            purdue_level="Level 4 - Enterprise IT",
            criticality="Medium",
            status="Online",
            isolation_status=False,
            vulnerabilities_count=2,
            last_seen=now - timedelta(minutes=8)
        ),
        Asset(
            asset_tag="CNI-BACKUP-NODE",
            name="Air-Gapped Cold Backup Vault",
            ip_address="10.0.5.8",
            mac_address="00:15:5D:7A:41:BC",
            asset_type="Backup Storage Appliance",
            os="Debian 12 Bookworm",
            purdue_level="Level 4 - Enterprise IT",
            criticality="High",
            status="Online",
            isolation_status=False,
            vulnerabilities_count=0,
            last_seen=now - timedelta(minutes=22)
        )
    ]
    db.add_all(assets_data)
    db.commit()

    # 3. MITRE TECHNIQUES
    mitre_data = [
        MitreTechnique(
            technique_id="T1110",
            technique_name="Brute Force",
            tactic="Credential Access",
            description="Adversaries may use brute force techniques to attempt authentication credentials for systems, accounts, or services.",
            mitigation="Implement account lockout thresholds, continuous behavioral monitoring, adaptive MFA, and rate limiting on edge services.",
            detection_guidance="Monitor for anomalous frequency of event ID 4625 (failed logon) and SSH auth failure bursts across subnet boundaries."
        ),
        MitreTechnique(
            technique_id="T1078",
            technique_name="Valid Accounts",
            tactic="Defense Evasion, Persistence, Initial Access",
            description="Adversaries may obtain and abuse credentials of existing legitimate accounts as a means of gaining Initial Access or Persistence.",
            mitigation="Audit privileged account credentials, enforce MFA across all external access vectors, and establish baseline login telemetry.",
            detection_guidance="Correlate user authentications originating from novel ASNs, unusual geolocations, or off-hours working shifts."
        ),
        MitreTechnique(
            technique_id="T1021",
            technique_name="Remote Services",
            tactic="Lateral Movement",
            description="Adversaries may use Valid Accounts to log into remote services such as SSH, RDP, or SMB to pivot within the environment.",
            mitigation="Segment operational OT networks from corporate enterprise IT, enforce jump-host bastions with strict session recording.",
            detection_guidance="Inspect East-West traffic traversing Purdue Level 3 to Level 2 boundaries over ports 3389, 22, 445, or 502."
        ),
        MitreTechnique(
            technique_id="T1098",
            technique_name="Account Manipulation",
            tactic="Persistence, Privilege Escalation",
            description="Adversaries may manipulate accounts to maintain access to victim systems, such as modifying credentials, group memberships, or tokens.",
            mitigation="Restrict domain administrator delegation, monitor Active Directory object changes, enforce four-eyes approval.",
            detection_guidance="Alert on changes to Enterprise Admins, Schema Admins, or unexpected sudoers updates in CNI Linux environments."
        ),
        MitreTechnique(
            technique_id="T1041",
            technique_name="Exfiltration Over C2 Channel",
            tactic="Exfiltration",
            description="Adversaries may steal data by transferring it over an existing command and control channel or high-entropy outbound session.",
            mitigation="Enforce outbound DLP inspection, restrict unapproved DNS query forwarding, egress rate-limit critical SCADA databases.",
            detection_guidance="Detect high ratio of outbound byte transfer spikes over HTTPS/TCP connections toward unclassified public IP addresses."
        ),
        MitreTechnique(
            technique_id="T1059",
            technique_name="Command and Scripting Interpreter",
            tactic="Execution",
            description="Adversaries may abuse command and script interpreters (PowerShell, Bash, Python) to execute commands, scripts, or binaries.",
            mitigation="Enable Script Block Logging, Constrained Language Mode in PowerShell, restrict execution via AppLocker/WDAC.",
            detection_guidance="Analyze command-line arguments for obfuscated base64, download cradles, or invocation of hidden subprocesses."
        ),
        MitreTechnique(
            technique_id="T1068",
            technique_name="Exploitation for Privilege Escalation",
            tactic="Privilege Escalation",
            description="Adversaries may exploit software vulnerabilities in an attempt to elevate privileges from standard user to system/root.",
            mitigation="Rapidly patch known vulnerabilities, enforce endpoint detection and response (EDR), disable unquoted service paths.",
            detection_guidance="Inspect process parent-child lineage (e.g. word.exe spawning powershell.exe, or spoolsv.exe spawning cmd.exe)."
        ),
        MitreTechnique(
            technique_id="T1566",
            technique_name="Phishing",
            tactic="Initial Access",
            description="Adversaries may send phishing messages with malicious attachments or links to persuade users to execute code or surrender credentials.",
            mitigation="Deploy secure email gateways with attachment sandboxing, anti-spoofing DMARC/DKIM/SPF, user security awareness.",
            detection_guidance="Correlate inbound external email sender anomalies with initial process executions on recipient endpoint."
        ),
        MitreTechnique(
            technique_id="T1071",
            technique_name="Application Layer Protocol",
            tactic="Command and Control",
            description="Adversaries may communicate using application layer protocols (HTTP, HTTPS, DNS) to blend in with normal network traffic.",
            mitigation="Deploy SSL/TLS deep packet inspection, enforce egress proxy with category filtering, block direct IP addresses.",
            detection_guidance="Monitor for periodic beaconing jitter, high frequency small payload POST requests to newly registered domains."
        ),
        MitreTechnique(
            technique_id="T0855",
            technique_name="Unauthorized Command Message",
            tactic="Inhibit Response Function (ICS)",
            description="Adversaries may send unauthorized command messages to industrial control devices (RTUs, PLCs, IEDs) to disrupt operations.",
            mitigation="Deploy deep packet inspection for OT protocols (Modbus, DNP3, IEC 60870-5-104), restrict writes via unidirection diodes.",
            detection_guidance="Inspect Modbus Function Code 05 (Write Single Coil) or Function Code 15 (Write Multiple Coils) from unauthorized hosts."
        )
    ]
    db.add_all(mitre_data)
    db.commit()

    # 4. ATTACK CAMPAIGNS
    campaign1 = AttackCampaign(
        campaign_id="SG-APT-001",
        name="Operation GridBreaker (Volt Typhoon Derived)",
        description="Targeted multi-stage advanced persistent campaign infiltrating CNI Power Grid SCADA controls via external DMZ gateway, lateral movement through engineering jumpbox, and exfiltrating substation telemetry.",
        threat_actor="VOLT TYPHOON (SIMULATED)",
        risk_score=94,
        status="Active",
        start_time=now - timedelta(hours=36),
        last_active=now - timedelta(minutes=18),
        affected_devices_count=4,
        alerts_count=6,
        stages_data=json.dumps([
            {"stage": 1, "name": "Initial Access", "technique": "T1078 (Valid Accounts)", "status": "Completed", "timestamp": (now - timedelta(hours=36)).strftime("%Y-%m-%d %H:%M:%S")},
            {"stage": 2, "name": "Lateral Movement", "technique": "T1021 (Remote Services - RDP)", "status": "Completed", "timestamp": (now - timedelta(hours=22)).strftime("%Y-%m-%d %H:%M:%S")},
            {"stage": 3, "name": "Privilege Escalation", "technique": "T1068 (Kernel Token Impersonation)", "status": "Completed", "timestamp": (now - timedelta(hours=14)).strftime("%Y-%m-%d %H:%M:%S")},
            {"stage": 4, "name": "OT Command Infiltration", "technique": "T0855 (Modbus Unauthorized Write)", "status": "In Progress", "timestamp": (now - timedelta(hours=2)).strftime("%Y-%m-%d %H:%M:%S")},
            {"stage": 5, "name": "Data Exfiltration", "technique": "T1041 (Encrypted C2 Channel)", "status": "Attempted", "timestamp": (now - timedelta(minutes=18)).strftime("%Y-%m-%d %H:%M:%S")}
        ])
    )
    campaign2 = AttackCampaign(
        campaign_id="SG-RANSOM-002",
        name="DarkLocker CNI Extortion",
        description="Double-extortion ransomware campaign staging data staging on Historian database server with shadow copy deletion preparations.",
        threat_actor="DARKLOCKER RESIDUAL (SIMULATED)",
        risk_score=88,
        status="Monitoring",
        start_time=now - timedelta(days=3),
        last_active=now - timedelta(hours=6),
        affected_devices_count=2,
        alerts_count=4,
        stages_data=json.dumps([
            {"stage": 1, "name": "Phishing Ingress", "technique": "T1566 (Phishing Attachment)", "status": "Completed", "timestamp": (now - timedelta(days=3)).strftime("%Y-%m-%d %H:%M:%S")},
            {"stage": 2, "name": "Credential Dumping", "technique": "T1003 (OS Credential Dumping)", "status": "Completed", "timestamp": (now - timedelta(days=2)).strftime("%Y-%m-%d %H:%M:%S")},
            {"stage": 3, "name": "Historian Staging", "technique": "T1074 (Data Staging)", "status": "Detected & Contained", "timestamp": (now - timedelta(hours=6)).strftime("%Y-%m-%d %H:%M:%S")}
        ])
    )
    campaign3 = AttackCampaign(
        campaign_id="SG-INSIDER-003",
        name="Substation Logic Override Investigation",
        description="Anomalous out-of-band configuration download to 400kV RTU controller executed using valid engineering credentials outside scheduled change windows.",
        threat_actor="INSIDER / COMPROMISED CREDENTIAL",
        risk_score=76,
        status="Active",
        start_time=now - timedelta(days=1),
        last_active=now - timedelta(hours=4),
        affected_devices_count=2,
        alerts_count=3,
        stages_data=json.dumps([
            {"stage": 1, "name": "Atypical VPN Auth", "technique": "T1078 (Valid Accounts)", "status": "Completed", "timestamp": (now - timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S")},
            {"stage": 2, "name": "ICS Logic Upload", "technique": "T0855 (Unauthorized Command)", "status": "Investigating", "timestamp": (now - timedelta(hours=4)).strftime("%Y-%m-%d %H:%M:%S")}
        ])
    )
    campaign4 = AttackCampaign(
        campaign_id="SG-RECON-004",
        name="Perimeter Gateway Vulnerability Sweep",
        description="Automated mass reconnaissance scanning probing external perimeter gateways for SSL-VPN and exposed Modbus gateway interfaces.",
        threat_actor="MIRAI-CNI-SCANNER (SIMULATED)",
        risk_score=42,
        status="Contained",
        start_time=now - timedelta(days=4),
        last_active=now - timedelta(hours=12),
        affected_devices_count=1,
        alerts_count=2,
        stages_data=json.dumps([
            {"stage": 1, "name": "Port Sweep", "technique": "T1046 (Network Service Discovery)", "status": "Blocked", "timestamp": (now - timedelta(hours=12)).strftime("%Y-%m-%d %H:%M:%S")}
        ])
    )
    db.add_all([campaign1, campaign2, campaign3, campaign4])
    db.commit()

    # 5. ALERTS
    alerts_data = [
        Alert(
            alert_id="ALT-2026-001",
            title="Brute-Force Authentication Spike on Domain Controller",
            timestamp=now - timedelta(hours=36),
            source_ip="185.220.101.44",
            destination_ip="10.0.1.10",
            username="admin_scada",
            threat_category="Initial Access",
            severity="Critical",
            detection_status="Investigating",
            anomaly_score=0.94,
            mitre_technique_id="T1110",
            mitre_tactic="Credential Access",
            evidence="Over 48 failed Kerberos/NTLM authentication attempts within 60 seconds followed by single successful login.",
            asset_id=3,
            campaign_id=1,
            xai_explanation=json.dumps({
                "risk_level": "CRITICAL",
                "calibrated_anomaly_score": 0.94,
                "reasons": [
                    "Repeated authentication failures (48 failed attempts) preceded access, matching credential stuffing behavior.",
                    "Source IP '185.220.101.44' originates from a known Tor exit node outside domestic CNI IP ranges.",
                    "Access initiated at atypical off-hours timestamp (02:42 AM IST)."
                ],
                "top_contributing_factors": [
                    {"factor": "Failed Logins", "contribution_pct": 46.2},
                    {"factor": "Geo Novelty", "contribution_pct": 28.5},
                    {"factor": "Is Off Hours", "contribution_pct": 16.1},
                    {"factor": "Port Risk", "contribution_pct": 9.2}
                ],
                "recommended_actions": [
                    "Enforce emergency lock on 'admin_scada' identity account.",
                    "Revoke active Kerberos ticket granting tokens (TGT).",
                    "Block IP 185.220.101.44 at perimeter firewall."
                ],
                "analyst_disclaimer": "AI explanations provide heuristic supporting evidence for analyst triage, not conclusive legal proof of malicious intent."
            })
        ),
        Alert(
            alert_id="ALT-2026-002",
            title="RDP Lateral Movement to Engineering Workstation 45",
            timestamp=now - timedelta(hours=22),
            source_ip="10.0.1.10",
            destination_ip="10.0.3.45",
            username="admin_scada",
            threat_category="Lateral Movement",
            severity="High",
            detection_status="Investigating",
            anomaly_score=0.88,
            mitre_technique_id="T1021",
            mitre_tactic="Lateral Movement",
            evidence="Inbound RDP session initiated across zone boundary without jumpbox bastion authorization.",
            asset_id=5,
            campaign_id=1,
            xai_explanation=json.dumps({
                "risk_level": "HIGH",
                "calibrated_anomaly_score": 0.88,
                "reasons": [
                    "East-West connection crossed Purdue Level 4 to Level 3 boundary without MFA proxy verification.",
                    "Workstation 45 has not previously received administrative RDP connections from this IP.",
                    "Privileged token pass-through detected in process LSASS."
                ],
                "top_contributing_factors": [
                    {"factor": "Port Risk", "contribution_pct": 36.0},
                    {"factor": "Privilege Level", "contribution_pct": 32.5},
                    {"factor": "Cni Critical Asset", "contribution_pct": 21.0},
                    {"factor": "Conn Freq Per Min", "contribution_pct": 10.5}
                ],
                "recommended_actions": [
                    "Isolate Engineering Workstation 45 via SOAR network quarantine.",
                    "Review active handles and open sockets on CNI-ENG-WS-45.",
                    "Verify engineer shift roster for authorized maintenance."
                ],
                "analyst_disclaimer": "AI explanations provide heuristic supporting evidence for analyst triage."
            })
        ),
        Alert(
            alert_id="ALT-2026-003",
            title="Token Impersonation & Sudoers Privilege Escalation",
            timestamp=now - timedelta(hours=14),
            source_ip="10.0.3.45",
            destination_ip="10.0.3.45",
            username="svc_grid_sync",
            threat_category="Privilege Escalation",
            severity="Critical",
            detection_status="Triaged",
            anomaly_score=0.91,
            mitre_technique_id="T1068",
            mitre_tactic="Privilege Escalation",
            evidence="Service account svc_grid_sync spawned PowerShell with SeDebugPrivilege enabled, acquiring SYSTEM integrity.",
            asset_id=5,
            campaign_id=1,
            xai_explanation=json.dumps({
                "risk_level": "CRITICAL",
                "calibrated_anomaly_score": 0.91,
                "reasons": [
                    "Low-privilege service account elevated to NT AUTHORITY\\SYSTEM unexpectedly.",
                    "Parent process was an unverified binary launched from %TEMP% directory.",
                    "Security Event ID 4672 (Special Privileges Assigned) triggered without scheduled task linkage."
                ],
                "top_contributing_factors": [
                    {"factor": "Privilege Level", "contribution_pct": 48.0},
                    {"factor": "Bytes Transferred Kb", "contribution_pct": 22.0},
                    {"factor": "Cni Critical Asset", "contribution_pct": 18.0},
                    {"factor": "Is Off Hours", "contribution_pct": 12.0}
                ],
                "recommended_actions": [
                    "Simulate service account credential rotation.",
                    "Kill rogue process tree and extract memory dump for sandbox triage.",
                    "Promote incident to Tier-2 SOC lead."
                ],
                "analyst_disclaimer": "AI explanations provide heuristic supporting evidence for analyst triage."
            })
        ),
        Alert(
            alert_id="ALT-2026-004",
            title="Unauthorized Modbus TCP Force Write to Substation RTU",
            timestamp=now - timedelta(hours=2),
            source_ip="10.0.3.45",
            destination_ip="192.168.10.12",
            username="unknown_pipe",
            threat_category="Execution",
            severity="Critical",
            detection_status="New",
            anomaly_score=0.98,
            mitre_technique_id="T0855",
            mitre_tactic="Inhibit Response Function",
            evidence="Modbus TCP Function 05 (Write Single Coil) sent to Register 0x002A on 400kV Feeder breaker without interlock permit.",
            asset_id=2,
            campaign_id=1,
            xai_explanation=json.dumps({
                "risk_level": "CRITICAL",
                "calibrated_anomaly_score": 0.98,
                "reasons": [
                    "Direct Modbus packet injected into Purdue Level 1 substation controller from enterprise host.",
                    "Target is critical physical grid infrastructure with safety integrity level requirements.",
                    "Function code alters physical breaker coil state outside supervisory SCADA control."
                ],
                "top_contributing_factors": [
                    {"factor": "Cni Critical Asset", "contribution_pct": 45.0},
                    {"factor": "Port Risk", "contribution_pct": 32.0},
                    {"factor": "Conn Freq Per Min", "contribution_pct": 14.0},
                    {"factor": "Privilege Level", "contribution_pct": 9.0}
                ],
                "recommended_actions": [
                    "Trigger Emergency SOAR Playbook: Disconnect OT/IT bridging router.",
                    "Dispatch field electrical engineer to verify substation breaker physical lockouts.",
                    "File immediate CERT-In Priority 1 notification within 6-hour regulatory window."
                ],
                "analyst_disclaimer": "AI explanations provide heuristic supporting evidence for analyst triage."
            })
        ),
        Alert(
            alert_id="ALT-2026-005",
            title="Abnormal Outbound Data Exfiltration over Encrypted HTTPS",
            timestamp=now - timedelta(minutes=18),
            source_ip="10.0.2.25",
            destination_ip="45.33.32.156",
            username="oracle_sync",
            threat_category="Exfiltration",
            severity="Critical",
            detection_status="New",
            anomaly_score=0.96,
            mitre_technique_id="T1041",
            mitre_tactic="Exfiltration",
            evidence="Continuous encrypted stream uploading 840 MB of compressed telemetry archives to unclassified foreign VPS.",
            asset_id=6,
            campaign_id=1,
            xai_explanation=json.dumps({
                "risk_level": "CRITICAL",
                "calibrated_anomaly_score": 0.96,
                "reasons": [
                    "Abnormally high egress data transfer (840 MB) from SCADA Historian database server.",
                    "Destination IP '45.33.32.156' has no business affiliation with national grid analytics.",
                    "Data transfer was initiated over non-standard TLS port 8443 with self-signed certificate."
                ],
                "top_contributing_factors": [
                    {"factor": "Bytes Transferred Kb", "contribution_pct": 52.0},
                    {"factor": "Geo Novelty", "contribution_pct": 24.0},
                    {"factor": "Cni Critical Asset", "contribution_pct": 14.0},
                    {"factor": "Is Off Hours", "contribution_pct": 10.0}
                ],
                "recommended_actions": [
                    "Execute SOAR Playbook 3: Sever outbound socket connection immediately.",
                    "Isolate Historian DB egress route at firewall.",
                    "Capture pcap snapshot for forensic file extraction."
                ],
                "analyst_disclaimer": "AI explanations provide heuristic supporting evidence for analyst triage."
            })
        ),
        Alert(
            alert_id="ALT-2026-006",
            title="Suspicious Login from High-Risk Foreign Geolocation",
            timestamp=now - timedelta(hours=48),
            source_ip="194.26.29.112",
            destination_ip="10.0.0.1",
            username="vk_ops",
            threat_category="Initial Access",
            severity="High",
            detection_status="Triaged",
            anomaly_score=0.82,
            mitre_technique_id="T1078",
            mitre_tactic="Initial Access",
            evidence="SSL-VPN login for operator vk_ops initiated from Romanian autonomous system AS49981.",
            asset_id=4,
            campaign_id=None,
            xai_explanation=json.dumps({
                "risk_level": "HIGH",
                "calibrated_anomaly_score": 0.82,
                "reasons": [
                    "User 'vk_ops' usually logs in exclusively from New Delhi/Mumbai telecom routes.",
                    "Geographic impossibility: user was active in Bangalore office 3 hours prior.",
                    "MFA push notification was accepted on a secondary unregistered mobile device."
                ],
                "top_contributing_factors": [
                    {"factor": "Geo Novelty", "contribution_pct": 55.0},
                    {"factor": "Is Off Hours", "contribution_pct": 25.0},
                    {"factor": "Failed Logins", "contribution_pct": 12.0},
                    {"factor": "Privilege Level", "contribution_pct": 8.0}
                ],
                "recommended_actions": [
                    "Terminate active VPN session.",
                    "Revoke session refresh tokens.",
                    "Contact operator vk_ops via out-of-band telephone verification."
                ],
                "analyst_disclaimer": "AI explanations provide heuristic supporting evidence for analyst triage."
            })
        ),
        Alert(
            alert_id="ALT-2026-007",
            title="Suspicious Scheduled Task Creation on Historian DB",
            timestamp=now - timedelta(days=2),
            source_ip="10.0.2.25",
            destination_ip="10.0.2.25",
            username="root",
            threat_category="Persistence",
            severity="Medium",
            detection_status="Investigating",
            anomaly_score=0.68,
            mitre_technique_id="T1098",
            mitre_tactic="Persistence",
            evidence="Cron job created calling base64-encoded curl script in /etc/cron.d/sync_service.",
            asset_id=6,
            campaign_id=2,
            xai_explanation=json.dumps({
                "risk_level": "MEDIUM",
                "calibrated_anomaly_score": 0.68,
                "reasons": [
                    "Cron task added outside standard puppet/ansible orchestration push.",
                    "Command contains obfuscated base64 decoded at runtime."
                ],
                "top_contributing_factors": [
                    {"factor": "Privilege Level", "contribution_pct": 40.0},
                    {"factor": "Is Off Hours", "contribution_pct": 35.0},
                    {"factor": "Bytes Transferred Kb", "contribution_pct": 25.0}
                ],
                "recommended_actions": [
                    "Remove unauthorized cron job entry.",
                    "Inspect /tmp for cached payload drops."
                ],
                "analyst_disclaimer": "AI explanations provide heuristic supporting evidence."
            })
        ),
        Alert(
            alert_id="ALT-2026-008",
            title="Beaconing C2 Heartbeat Detected Over DNS Tunneling",
            timestamp=now - timedelta(hours=8),
            source_ip="10.0.3.45",
            destination_ip="8.8.8.8",
            username="system",
            threat_category="Command and Control",
            severity="High",
            detection_status="Investigating",
            anomaly_score=0.86,
            mitre_technique_id="T1071",
            mitre_tactic="Command and Control",
            evidence="High entropy subdomain TXT queries sent at rigid 30.0-second intervals to ns1.cni-telemetry-fake.org.",
            asset_id=5,
            campaign_id=1,
            xai_explanation=json.dumps({
                "risk_level": "HIGH",
                "calibrated_anomaly_score": 0.86,
                "reasons": [
                    "DNS query payload entropy exceeds 4.8 bits/byte (characteristic of exfiltration/C2 tunneling).",
                    "Jitter analysis shows robotic 30.0s intervals with 0.1s standard deviation."
                ],
                "top_contributing_factors": [
                    {"factor": "Conn Freq Per Min", "contribution_pct": 42.0},
                    {"factor": "Port Risk", "contribution_pct": 28.0},
                    {"factor": "Bytes Transferred Kb", "contribution_pct": 18.0},
                    {"factor": "Geo Novelty", "contribution_pct": 12.0}
                ],
                "recommended_actions": [
                    "Sinkhole domain 'cni-telemetry-fake.org' at internal DNS forwarders.",
                    "Sever DNS egress from workstation 45."
                ],
                "analyst_disclaimer": "AI explanations provide heuristic supporting evidence."
            })
        ),
        Alert(
            alert_id="ALT-2026-009",
            title="Mass Port Scan Directed Against CNI Perimeter",
            timestamp=now - timedelta(hours=12),
            source_ip="198.51.100.89",
            destination_ip="10.0.0.1",
            username="anonymous",
            threat_category="Initial Access",
            severity="Low",
            detection_status="Resolved",
            anomaly_score=0.52,
            mitre_technique_id="T1046",
            mitre_tactic="Discovery",
            evidence="SYN packet probe targeting 1024 sequential ports in 3 seconds.",
            asset_id=4,
            campaign_id=4,
            xai_explanation=json.dumps({
                "risk_level": "LOW",
                "calibrated_anomaly_score": 0.52,
                "reasons": [
                    "Fast SYN scan dropped by perimeter firewall rules.",
                    "No responsive internal services discovered."
                ],
                "top_contributing_factors": [
                    {"factor": "Conn Freq Per Min", "contribution_pct": 60.0},
                    {"factor": "Geo Novelty", "contribution_pct": 25.0},
                    {"factor": "Port Risk", "contribution_pct": 15.0}
                ],
                "recommended_actions": [
                    "IP automatically blacklisted for 72 hours by firewall auto-defense."
                ],
                "analyst_disclaimer": "AI explanations provide heuristic supporting evidence."
            })
        ),
        Alert(
            alert_id="ALT-2026-010",
            title="Atypical Out-of-Hours SCADA Config Sync",
            timestamp=now - timedelta(hours=4),
            source_ip="10.0.3.45",
            destination_ip="192.168.10.5",
            username="eng_rajesh",
            threat_category="Persistence",
            severity="Medium",
            detection_status="Investigating",
            anomaly_score=0.74,
            mitre_technique_id="T1098",
            mitre_tactic="Persistence",
            evidence="HMI Project file uploaded to master SCADA node at 03:22 AM without approved maintenance window ticket.",
            asset_id=1,
            campaign_id=3,
            xai_explanation=json.dumps({
                "risk_level": "MEDIUM",
                "calibrated_anomaly_score": 0.74,
                "reasons": [
                    "Engineer workstation initiated logic download to Master HMI outside 10:00-17:00 shift window.",
                    "Engineering change log #CHG-4912 was marked as draft, not approved."
                ],
                "top_contributing_factors": [
                    {"factor": "Is Off Hours", "contribution_pct": 45.0},
                    {"factor": "Cni Critical Asset", "contribution_pct": 30.0},
                    {"factor": "Privilege Level", "contribution_pct": 15.0},
                    {"factor": "Bytes Transferred Kb", "contribution_pct": 10.0}
                ],
                "recommended_actions": [
                    "Verify with Grid Shift In-Charge if emergency hotfix was authorized.",
                    "Back up current HMI project runtime binary."
                ],
                "analyst_disclaimer": "AI explanations provide heuristic supporting evidence."
            })
        )
    ]
    db.add_all(alerts_data)
    db.commit()

    # 6. ANOMALIES
    anomalies_data = [
        Anomaly(
            detection_id="ANO-742",
            timestamp=now - timedelta(hours=36),
            username="admin_scada",
            source_ip="185.220.101.44",
            device="CNI-DC-CORE-01",
            anomaly_score=0.94,
            severity="Critical",
            reason="Unprecedented burst of 48 authentication failures from Tor exit IP followed by administrative privilege elevation.",
            recommended_action="Lock account, terminate active Kerberos sessions, blackhole source IP at perimeter edge.",
            feature_attributions=json.dumps({"failed_logins": 46.2, "geo_novelty": 28.5, "is_off_hours": 16.1, "port_risk": 9.2}),
            status="Confirmed"
        ),
        Anomaly(
            detection_id="ANO-743",
            timestamp=now - timedelta(hours=22),
            username="admin_scada",
            source_ip="10.0.1.10",
            device="CNI-ENG-WS-45",
            anomaly_score=0.88,
            severity="High",
            reason="Anomalous inter-zone RDP jump crossing Purdue Level 4 to Level 3 without bastion verification.",
            recommended_action="Quarantine workstation network interface, verify user badge presence in physical substation.",
            feature_attributions=json.dumps({"port_risk": 36.0, "privilege_level": 32.5, "cni_critical_asset": 21.0, "conn_freq_per_min": 10.5}),
            status="Investigating"
        ),
        Anomaly(
            detection_id="ANO-744",
            timestamp=now - timedelta(hours=14),
            username="svc_grid_sync",
            source_ip="10.0.3.45",
            device="CNI-ENG-WS-45",
            anomaly_score=0.91,
            severity="Critical",
            reason="Low-privilege service account spawned interactive shell and obtained SeDebugPrivilege token.",
            recommended_action="Revoke service credentials, analyze memory dump for Mimikatz/reflective DLL injection.",
            feature_attributions=json.dumps({"privilege_level": 48.0, "bytes_transferred_kb": 22.0, "cni_critical_asset": 18.0, "is_off_hours": 12.0}),
            status="Confirmed"
        ),
        Anomaly(
            detection_id="ANO-745",
            timestamp=now - timedelta(hours=2),
            username="unknown_pipe",
            source_ip="10.0.3.45",
            device="CNI-SUB-RTU-12",
            anomaly_score=0.98,
            severity="Critical",
            reason="Direct Modbus function 05 coil write to 400kV circuit breaker register from unapproved engineering IP.",
            recommended_action="Sever bridging router, inspect substation breaker physical interlock status.",
            feature_attributions=json.dumps({"cni_critical_asset": 45.0, "port_risk": 32.0, "conn_freq_per_min": 14.0, "privilege_level": 9.0}),
            status="Confirmed"
        ),
        Anomaly(
            detection_id="ANO-746",
            timestamp=now - timedelta(minutes=18),
            username="oracle_sync",
            source_ip="10.0.2.25",
            device="CNI-DATA-VAULT",
            anomaly_score=0.96,
            severity="Critical",
            reason="Massive outbound data egress (840 MB) from Historian DB over encrypted socket to unverified foreign host.",
            recommended_action="Execute SOAR Playbook 3: Sever outbound connection, isolate Historian DB egress route.",
            feature_attributions=json.dumps({"bytes_transferred_kb": 52.0, "geo_novelty": 24.0, "cni_critical_asset": 14.0, "is_off_hours": 10.0}),
            status="Confirmed"
        ),
        Anomaly(
            detection_id="ANO-747",
            timestamp=now - timedelta(hours=48),
            username="vk_ops",
            source_ip="194.26.29.112",
            device="CNI-FW-GATEWAY",
            anomaly_score=0.82,
            severity="High",
            reason="SSL-VPN session authentication originated from Romanian AS block, impossible travel from Bangalore.",
            recommended_action="Revoke active SSL-VPN session token, force MFA re-enrollment.",
            feature_attributions=json.dumps({"geo_novelty": 55.0, "is_off_hours": 25.0, "failed_logins": 12.0, "privilege_level": 8.0}),
            status="Investigating"
        ),
        Anomaly(
            detection_id="ANO-748",
            timestamp=now - timedelta(hours=4),
            username="eng_rajesh",
            source_ip="10.0.3.45",
            device="CNI-PWR-SCADA-01",
            anomaly_score=0.74,
            severity="Medium",
            reason="Off-hours SCADA HMI runtime binary upload without formal change management ticket.",
            recommended_action="Verify with Shift In-Charge, restore verified baseline HMI project configuration.",
            feature_attributions=json.dumps({"is_off_hours": 45.0, "cni_critical_asset": 30.0, "privilege_level": 15.0, "bytes_transferred_kb": 10.0}),
            status="Investigating"
        )
    ]
    db.add_all(anomalies_data)
    db.commit()

    # 7. SECURITY LOGS (60+ realistic logs)
    log_entries = []
    base_time = now - timedelta(hours=48)
    
    # Predefined sample events
    raw_samples = [
        # Normal baseline logs
        ("EVT-1001", base_time + timedelta(hours=1), "10.0.3.12", "10.0.1.10", "operator1", "CNI-DC-CORE-01", "Windows Auth", "Kerberos", 88, "Successful user authentication for domain account operator1", "Informational", "Analyzed"),
        ("EVT-1002", base_time + timedelta(hours=2), "10.0.3.15", "10.0.2.25", "historian_svc", "CNI-DATA-VAULT", "Application API", "HTTPS", 443, "Standard SCADA telemetry ingestion batch #4812 committed", "Informational", "Analyzed"),
        ("EVT-1003", base_time + timedelta(hours=3), "10.0.0.1", "10.0.1.10", "system", "CNI-FW-GATEWAY", "Firewall", "NTP", 123, "NTP synchronization complete with national time server", "Informational", "Analyzed"),
        ("EVT-1004", base_time + timedelta(hours=4), "10.0.3.22", "10.0.0.1", "analyst_priya", "CNI-FW-GATEWAY", "Windows Auth", "HTTPS", 443, "SOC Analyst web console login from internal operations subnet", "Informational", "Analyzed"),
        ("EVT-1005", base_time + timedelta(hours=5), "192.168.10.5", "192.168.10.12", "scada_poller", "CNI-SUB-RTU-12", "Network Flow", "Modbus", 502, "Routine Read Holding Registers (Function 03) polling 400kV bus voltage", "Informational", "Analyzed"),
        ("EVT-1006", base_time + timedelta(hours=6), "10.0.5.8", "10.0.2.25", "backup_agent", "CNI-BACKUP-NODE", "Endpoint Activity", "SSH", 22, "Scheduled incremental backup snapshot completed successfully", "Informational", "Analyzed"),
        ("EVT-1007", base_time + timedelta(hours=7), "10.0.3.45", "10.0.1.10", "eng_rajesh", "CNI-DC-CORE-01", "Windows Auth", "Kerberos", 88, "Kerberos TGS request for CIFS share on file server", "Informational", "Analyzed"),
        ("EVT-1008", base_time + timedelta(hours=8), "10.0.0.1", "172.16.50.12", "cloud_sync", "CNI-CLOUD-GW", "Cloud Security", "TLS", 8443, "Cloud SCADA Analytics Bridge healthcheck ping successful", "Informational", "Analyzed"),
        
        # Suspicious & Attack sequence logs (Operation GridBreaker)
        ("EVT-2001", base_time + timedelta(hours=11, minutes=58), "185.220.101.44", "10.0.0.1", "root", "CNI-FW-GATEWAY", "Firewall", "HTTPS", 443, "Failed external SSL-VPN authentication attempt 1/48 (Bad password)", "Low", "Flagged"),
        ("EVT-2002", base_time + timedelta(hours=11, minutes=59), "185.220.101.44", "10.0.0.1", "admin", "CNI-FW-GATEWAY", "Firewall", "HTTPS", 443, "Failed external SSL-VPN authentication attempt 12/48 (Account does not exist)", "Low", "Flagged"),
        ("EVT-2003", base_time + timedelta(hours=12), "185.220.101.44", "10.0.1.10", "admin_scada", "CNI-DC-CORE-01", "Windows Auth", "Kerberos", 88, "Repeated 48 authentication failures from Tor exit node within 60s", "High", "Flagged"),
        ("EVT-2004", base_time + timedelta(hours=12, minutes=2), "185.220.101.44", "10.0.1.10", "admin_scada", "CNI-DC-CORE-01", "Windows Auth", "Kerberos", 88, "Event ID 4624: Successful Logon for admin_scada via stolen credential", "Critical", "Correlated"),
        ("EVT-2005", base_time + timedelta(hours=15), "10.0.1.10", "10.0.3.45", "admin_scada", "CNI-ENG-WS-45", "Network Flow", "RDP", 3389, "Inbound RDP session established from Domain Controller to Engineering Workstation 45", "High", "Correlated"),
        ("EVT-2006", base_time + timedelta(hours=16), "10.0.3.45", "10.0.3.45", "admin_scada", "CNI-ENG-WS-45", "Endpoint Activity", "NTLM", 445, "Pass-the-Hash artifact detected in Local Security Authority Subsystem Service (LSASS)", "High", "Correlated"),
        ("EVT-2007", base_time + timedelta(hours=20), "10.0.3.45", "10.0.3.45", "svc_grid_sync", "CNI-ENG-WS-45", "Endpoint Activity", "Process", 0, "Suspicious process execution: powershell.exe invoking encoded token stealing script", "Critical", "Correlated"),
        ("EVT-2008", base_time + timedelta(hours=20, minutes=5), "10.0.3.45", "10.0.3.45", "svc_grid_sync", "CNI-ENG-WS-45", "Windows Auth", "System", 0, "Privilege Escalation: SeDebugPrivilege enabled, process running as NT AUTHORITY\\SYSTEM", "Critical", "Correlated"),
        ("EVT-2009", base_time + timedelta(hours=26), "10.0.3.45", "8.8.8.8", "system", "CNI-ENG-WS-45", "Network Flow", "DNS", 53, "High entropy DNS queries beaconing to suspicious domain ns1.cni-telemetry-fake.org", "High", "Correlated"),
        ("EVT-2010", base_time + timedelta(hours=34), "10.0.3.45", "192.168.10.12", "unknown_pipe", "CNI-SUB-RTU-12", "Network Flow", "Modbus", 502, "Unauthorized Modbus TCP command: Function Code 05 (Force Single Coil) to Substation RTU", "Critical", "Correlated"),
        ("EVT-2011", base_time + timedelta(hours=47, minutes=42), "10.0.2.25", "45.33.32.156", "oracle_sync", "CNI-DATA-VAULT", "Network Flow", "TLS", 8443, "Abnormal outbound egress: 840 MB telemetry database archive streamed to foreign VPS", "Critical", "Correlated"),
        
        # Additional background noise logs
        ("EVT-3001", base_time + timedelta(hours=9), "10.0.3.18", "10.0.1.10", "operator2", "CNI-DC-CORE-01", "Windows Auth", "Kerberos", 88, "User operator2 logged on at workstation 18", "Informational", "Analyzed"),
        ("EVT-3002", base_time + timedelta(hours=10), "10.0.0.1", "198.51.100.89", "system", "CNI-FW-GATEWAY", "Firewall", "TCP", 22, "Port scan probe dropped on external interface (Port 22/SSH)", "Low", "Flagged"),
        ("EVT-3003", base_time + timedelta(hours=10, minutes=1), "10.0.0.1", "198.51.100.89", "system", "CNI-FW-GATEWAY", "Firewall", "TCP", 3389, "Port scan probe dropped on external interface (Port 3389/RDP)", "Low", "Flagged"),
        ("EVT-3004", base_time + timedelta(hours=10, minutes=2), "10.0.0.1", "198.51.100.89", "system", "CNI-FW-GATEWAY", "Firewall", "TCP", 502, "Port scan probe dropped on external interface (Port 502/Modbus)", "Medium", "Flagged"),
        ("EVT-3005", base_time + timedelta(hours=13), "10.0.2.25", "10.0.2.25", "postgres", "CNI-DATA-VAULT", "Linux Auth", "Local", 0, "Routine database vacuum and auto-analyze job finished", "Informational", "Analyzed"),
        ("EVT-3006", base_time + timedelta(hours=17), "10.0.3.30", "10.0.0.1", "analyst_priya", "CNI-FW-GATEWAY", "Endpoint Activity", "HTTPS", 443, "Admin console session refreshed with valid JWT token", "Informational", "Analyzed"),
        ("EVT-3007", base_time + timedelta(hours=19), "194.26.29.112", "10.0.0.1", "vk_ops", "CNI-FW-GATEWAY", "Firewall", "HTTPS", 443, "SSL-VPN connection from anomalous Romanian geolocation (AS49981)", "High", "Flagged"),
        ("EVT-3008", base_time + timedelta(hours=21), "10.0.3.45", "10.0.1.10", "eng_rajesh", "CNI-DC-CORE-01", "Windows Auth", "Kerberos", 88, "Kerberos ticket granted for engineering project files", "Informational", "Analyzed"),
        ("EVT-3009", base_time + timedelta(hours=23), "192.168.10.5", "192.168.10.12", "scada_poller", "CNI-SUB-RTU-12", "Network Flow", "DNP3", 20000, "DNP3 unsolicited status response received: Breaker #1 Closed / Normal", "Informational", "Analyzed"),
        ("EVT-3010", base_time + timedelta(hours=25), "10.0.5.8", "10.0.1.10", "backup_agent", "CNI-DC-CORE-01", "Windows Auth", "SMB", 445, "Active Directory System State volume shadow copy archive pulled", "Informational", "Analyzed"),
        ("EVT-3011", base_time + timedelta(hours=28), "10.0.3.12", "10.0.0.1", "operator1", "CNI-FW-GATEWAY", "Endpoint Activity", "DNS", 53, "DNS lookup for int.cni.grid/telemetry-docs resolved to 10.0.1.20", "Informational", "Analyzed"),
        ("EVT-3012", base_time + timedelta(hours=30), "10.0.2.25", "10.0.2.25", "root", "CNI-DATA-VAULT", "Linux Auth", "Cron", 0, "Atypical cron task created /etc/cron.d/sync_service executing base64 payload", "Medium", "Flagged"),
        ("EVT-3013", base_time + timedelta(hours=32), "10.0.3.45", "192.168.10.5", "eng_rajesh", "CNI-PWR-SCADA-01", "Application API", "HTTP", 8080, "SCADA HMI project configuration file upload initiated at 03:22 AM", "Medium", "Flagged"),
        ("EVT-3014", base_time + timedelta(hours=38), "172.16.50.12", "10.0.0.1", "cloud_sync", "CNI-CLOUD-GW", "Cloud Security", "TLS", 8443, "AWS KMS key rotation verification check passed", "Informational", "Analyzed"),
        ("EVT-3015", base_time + timedelta(hours=40), "10.0.3.19", "10.0.1.10", "operator3", "CNI-DC-CORE-01", "Windows Auth", "Kerberos", 88, "Morning shift logon for operator3 from workstation 19", "Informational", "Analyzed"),
        ("EVT-3016", base_time + timedelta(hours=42), "10.0.0.1", "10.0.0.1", "system", "CNI-FW-GATEWAY", "Firewall", "Syslog", 514, "Perimeter firewall IPS rule signature definitions updated to v2026.11.08", "Informational", "Analyzed"),
        ("EVT-3017", base_time + timedelta(hours=44), "10.0.1.10", "10.0.1.10", "admin_vikram", "CNI-DC-CORE-01", "Windows Auth", "Kerberos", 88, "Security Administrator Vikram Malhotra logged on to review audit logs", "Informational", "Analyzed"),
        ("EVT-3018", base_time + timedelta(hours=45), "192.168.10.5", "192.168.10.12", "scada_poller", "CNI-SUB-RTU-12", "Network Flow", "Modbus", 502, "Continuous Modbus status poll: Bus frequency 50.02 Hz (Nominal)", "Informational", "Analyzed"),
        ("EVT-3019", base_time + timedelta(hours=46), "10.0.3.22", "10.0.0.1", "analyst_priya", "CNI-FW-GATEWAY", "Endpoint Activity", "HTTPS", 443, "Analyst initiated SOAR containment approval workflow", "Informational", "Analyzed"),
        ("EVT-3020", base_time + timedelta(hours=47), "10.0.0.1", "10.0.2.25", "system", "CNI-FW-GATEWAY", "Firewall", "TCP", 8443, "Firewall dynamic rule enacted: Blocking egress to 45.33.32.156", "Informational", "Analyzed"),
    ]

    for item in raw_samples:
        log_entries.append(SecurityLog(
            event_id=item[0],
            timestamp=item[1],
            source_ip=item[2],
            destination_ip=item[3],
            username=item[4],
            device=item[5],
            event_type=item[6],
            protocol=item[7],
            port=item[8],
            description=item[9],
            severity=item[10],
            status=item[11],
            raw_data=json.dumps({"event_id": item[0], "src": item[2], "dst": item[3], "user": item[4], "desc": item[9]})
        ))

    # Add 30 more randomized procedural logs to reach > 50 logs total
    devices_pool = ["CNI-PWR-SCADA-01", "CNI-SUB-RTU-12", "CNI-DC-CORE-01", "CNI-FW-GATEWAY", "CNI-ENG-WS-45", "CNI-DATA-VAULT", "CNI-CLOUD-GW", "CNI-BACKUP-NODE"]
    for i in range(1, 35):
        t = base_time + timedelta(minutes=i * 80)
        eid = f"EVT-4{i:03d}"
        dev = devices_pool[i % len(devices_pool)]
        src = f"10.0.3.{(i * 3) % 50 + 10}"
        dst = f"10.0.1.{(i * 2) % 30 + 5}"
        log_entries.append(SecurityLog(
            event_id=eid,
            timestamp=t,
            source_ip=src,
            destination_ip=dst,
            username=f"grid_user_{i%8 + 1}",
            device=dev,
            event_type="Network Flow" if i % 2 == 0 else "Windows Auth",
            protocol="TCP",
            port=443 if i % 3 == 0 else (88 if i % 2 == 0 else 502),
            description=f"Automated background telemetry exchange packet #{eid} processed across boundary",
            severity="Informational",
            status="Analyzed",
            raw_data=json.dumps({"event_id": eid, "src": src, "dst": dst, "status": "nominal"})
        ))

    db.add_all(log_entries)
    db.commit()

    # 8. PLAYBOOKS
    pb1 = Playbook(
        playbook_id="SOAR-PB-01",
        name="Brute Force Credential Lock & MFA Challenge",
        description="Identifies repeated authentication failures, generates critical alert, simulates temporary identity restriction, enforces MFA challenge, and logs incident.",
        trigger_condition="Authentication failures >= 5 within 60s or Anomaly Score >= 0.85 on credential endpoints",
        automated_actions=json.dumps([
            "Extract attacker source IP and target identity account",
            "Simulate temporary lock on user identity in Active Directory",
            "Revoke active Kerberos TGT and web session cookies",
            "Trigger automated out-of-band MFA verification challenge",
            "Generate high-priority Incident Record in SentinelGrid"
        ]),
        requires_approval=False,
        is_active=True
    )
    pb2 = Playbook(
        playbook_id="SOAR-PB-02",
        name="Suspicious Geo & Off-Hours Login Revocation",
        description="Detects anomalous geographic origin or off-hours shift login, invalidates current session token, and requests analyst authorization for account suspension.",
        trigger_condition="Geo Novelty > 0 and Off-Hours == True on perimeter VPN or administrative portals",
        automated_actions=json.dumps([
            "Flag session origin against CNI GeoIP whitelist",
            "Simulate instant SSL-VPN tunnel tear-down and token revocation",
            "Send push notification to account holder via secondary channel",
            "Queue analyst approval request for 24-hour account suspension"
        ]),
        requires_approval=True,
        is_active=True
    )
    pb3 = Playbook(
        playbook_id="SOAR-PB-03",
        name="Critical Data Exfiltration & Network Isolation",
        description="Identifies high-volume egress anomalies from critical databases, generates priority P1 incident, simulates network host isolation, and generates forensic record.",
        trigger_condition="Outbound egress > 500 MB to unclassified foreign IP or Anomaly Score >= 0.90",
        automated_actions=json.dumps([
            "Trigger immediate dynamic firewall drop rule on destination IP:Port",
            "Simulate host isolation by placing endpoint into quarantine VLAN",
            "Initiate memory dump and network pcap capture on affected database",
            "Generate formal CERT-In Priority 1 notification draft"
        ]),
        requires_approval=True,
        is_active=True
    )
    pb4 = Playbook(
        playbook_id="SOAR-PB-04",
        name="Privilege Escalation Containment & Token Revocation",
        description="Detects unauthorized privilege delegation or token impersonation, kills rogue process tree, simulates privilege stripping, and preserves audit trail.",
        trigger_condition="SeDebugPrivilege assignment or unexpected sudoers update on Level 2/3 CNI node",
        automated_actions=json.dumps([
            "Identify spawned PID and parent process lineage",
            "Simulate process termination (SIGKILL) on offending process tree",
            "Strip administrative security group memberships from service account",
            "Dispatch alert notification to Chief Information Security Officer (CISO)"
        ]),
        requires_approval=False,
        is_active=True
    )
    db.add_all([pb1, pb2, pb3, pb4])
    db.commit()

    # 9. PLAYBOOK EXECUTIONS
    executions_data = [
        PlaybookExecution(
            execution_id="EXE-9014",
            playbook_id="SOAR-PB-01",
            playbook_name="Brute Force Credential Lock & MFA Challenge",
            triggered_by="AI Anomaly Engine (ANO-742)",
            target_entity="Account: admin_scada / Host: CNI-DC-CORE-01",
            status="Completed",
            approval_status="Not Required",
            approved_by=None,
            response_actions=json.dumps([
                "[SIMULATION] Locked account 'admin_scada' on simulated DC01",
                "[SIMULATION] Invalidated 3 active Kerberos session tokens",
                "[SIMULATION] Enforced hardware token MFA challenge",
                "[SIMULATION] Created incident INC-2026-0041"
            ]),
            timestamp=now - timedelta(hours=35, minutes=58),
            log_output="Playbook executed in 340ms. Simulation safety boundaries verified: Zero real endpoints altered."
        ),
        PlaybookExecution(
            execution_id="EXE-9015",
            playbook_id="SOAR-PB-02",
            playbook_name="Suspicious Geo & Off-Hours Login Revocation",
            triggered_by="Perimeter Rule Trigger (ALT-2026-006)",
            target_entity="Session: vk_ops / IP: 194.26.29.112",
            status="Completed",
            approval_status="Approved",
            approved_by="Vikram Malhotra (Security Admin)",
            response_actions=json.dumps([
                "[SIMULATION] Terminated VPN tunnel #49102",
                "[SIMULATION] Blacklisted IP 194.26.29.112 at perimeter edge",
                "[SIMULATION] Requested and received analyst approval for 24h credential suspension"
            ]),
            timestamp=now - timedelta(hours=47, minutes=30),
            log_output="Analyst approval confirmed via authenticated session. Target quarantined."
        ),
        PlaybookExecution(
            execution_id="EXE-9016",
            playbook_id="SOAR-PB-03",
            playbook_name="Critical Data Exfiltration & Network Isolation",
            triggered_by="Anomaly Engine (ANO-746)",
            target_entity="Host: CNI-DATA-VAULT (10.0.2.25) / Dest: 45.33.32.156",
            status="Pending Approval",
            approval_status="Pending",
            approved_by=None,
            response_actions=json.dumps([
                "[SIMULATION - QUEUED] Dynamic firewall egress block on 45.33.32.156:8443",
                "[SIMULATION - QUEUED] Isolate Historian DB (CNI-DATA-VAULT) into quarantine network segment",
                "[SIMULATION - QUEUED] Spawn live packet forensic dump"
            ]),
            timestamp=now - timedelta(minutes=16),
            log_output="High impact action requires explicit SOC Lead / Security Admin authorization."
        ),
        PlaybookExecution(
            execution_id="EXE-9017",
            playbook_id="SOAR-PB-04",
            playbook_name="Privilege Escalation Containment & Token Revocation",
            triggered_by="Sysmon Event (ALT-2026-003)",
            target_entity="Account: svc_grid_sync / Host: CNI-ENG-WS-45",
            status="Completed",
            approval_status="Not Required",
            approved_by=None,
            response_actions=json.dumps([
                "[SIMULATION] Killed rogue powershell process PID: 4982",
                "[SIMULATION] Stripped SeDebugPrivilege from token",
                "[SIMULATION] Reverted service account to least privilege"
            ]),
            timestamp=now - timedelta(hours=13, minutes=50),
            log_output="Process tree neutralized in simulation testbed."
        )
    ]
    db.add_all(executions_data)
    db.commit()

    # 10. INCIDENTS
    incidents_data = [
        Incident(
            incident_id="INC-2026-0041",
            title="Multi-Stage CNI Cyber Attack (Operation GridBreaker)",
            description="Coordinated advanced persistent threat targeting Indian Power Grid SCADA controls via external DMZ gateway, lateral movement through engineering jumpbox, unauthorized Modbus commands to 400kV RTU, and database exfiltration.",
            severity="Critical",
            status="Investigating",
            assigned_analyst="Priya Sharma",
            created_at=now - timedelta(hours=35),
            updated_at=now - timedelta(minutes=10),
            affected_assets=json.dumps(["CNI-DC-CORE-01", "CNI-ENG-WS-45", "CNI-SUB-RTU-12", "CNI-DATA-VAULT"]),
            mitre_techniques=json.dumps(["T1110", "T1078", "T1021", "T1068", "T0855", "T1041"]),
            related_alerts=json.dumps(["ALT-2026-001", "ALT-2026-002", "ALT-2026-003", "ALT-2026-004", "ALT-2026-005"]),
            timeline_events=json.dumps([
                {"time": (now - timedelta(hours=35)).strftime("%Y-%m-%d %H:%M:%S"), "author": "SOAR Engine", "text": "Incident auto-created following brute-force credential stuffing spike on Domain Controller."},
                {"time": (now - timedelta(hours=21)).strftime("%Y-%m-%d %H:%M:%S"), "author": "Priya Sharma", "text": "Correlated lateral movement from DC to Engineering Workstation 45 via RDP."},
                {"time": (now - timedelta(hours=13)).strftime("%Y-%m-%d %H:%M:%S"), "author": "Priya Sharma", "text": "Confirmed privilege escalation on Workstation 45; SOAR playbook 4 auto-neutralized rogue process."},
                {"time": (now - timedelta(hours=2)).strftime("%Y-%m-%d %H:%M:%S"), "author": "Vikram Malhotra", "text": "CRITICAL: Direct Modbus write detected against Substation 12 RTU. Shift in-charge notified."},
                {"time": (now - timedelta(minutes=15)).strftime("%Y-%m-%d %H:%M:%S"), "author": "SOAR Engine", "text": "Exfiltration alert ALT-2026-005 linked to campaign SG-APT-001. SOAR PB-03 approval queued."}
            ]),
            notes=json.dumps([
                {"time": (now - timedelta(hours=20)).strftime("%Y-%m-%d %H:%M:%S"), "author": "Priya Sharma", "note": "Target IP 185.220.101.44 verified as Tor exit node. IOC pushed to perimeter threat list."},
                {"time": (now - timedelta(minutes=12)).strftime("%Y-%m-%d %H:%M:%S"), "author": "Vikram Malhotra", "note": "Preparing CERT-In mandatory report for Power Grid supervisory authority."}
            ])
        ),
        Incident(
            incident_id="INC-2026-0038",
            title="Unauthorized Off-Hours Geolocation Access Attempt",
            description="Operator account vk_ops logged in via SSL-VPN from Romania while physical operator was located in Bangalore.",
            severity="High",
            status="Contained",
            assigned_analyst="Vikram Malhotra",
            created_at=now - timedelta(hours=47),
            updated_at=now - timedelta(hours=46),
            affected_assets=json.dumps(["CNI-FW-GATEWAY"]),
            mitre_techniques=json.dumps(["T1078"]),
            related_alerts=json.dumps(["ALT-2026-006"]),
            timeline_events=json.dumps([
                {"time": (now - timedelta(hours=47)).strftime("%Y-%m-%d %H:%M:%S"), "author": "SOAR Engine", "text": "Session revoked; SOAR playbook executed."},
                {"time": (now - timedelta(hours=46)).strftime("%Y-%m-%d %H:%M:%S"), "author": "Vikram Malhotra", "text": "Spoke to user vk_ops. Confirmed credentials compromised in hotel Wi-Fi breach. Password reset."}
            ]),
            notes=json.dumps([
                {"time": (now - timedelta(hours=46)).strftime("%Y-%m-%d %H:%M:%S"), "author": "Vikram Malhotra", "note": "Incident closed. Credentials rotated. MFA hardware key assigned."}
            ])
        ),
        Incident(
            incident_id="INC-2026-0035",
            title="DarkLocker Ransomware Stage on SCADA Historian",
            description="Suspicious cron script staging base64 encoded strings detected on SCADA Historian database.",
            severity="High",
            status="Investigating",
            assigned_analyst="Priya Sharma",
            created_at=now - timedelta(days=2),
            updated_at=now - timedelta(hours=5),
            affected_assets=json.dumps(["CNI-DATA-VAULT"]),
            mitre_techniques=json.dumps(["T1098", "T1074"]),
            related_alerts=json.dumps(["ALT-2026-007"]),
            timeline_events=json.dumps([
                {"time": (now - timedelta(days=2)).strftime("%Y-%m-%d %H:%M:%S"), "author": "System", "text": "Persistence cron task flagged by behavioral detection engine."}
            ]),
            notes=json.dumps([
                {"time": (now - timedelta(hours=6)).strftime("%Y-%m-%d %H:%M:%S"), "author": "Priya Sharma", "note": "Payload decompiled. Identified staging directory in /tmp/.ice-unix."}
            ])
        ),
        Incident(
            incident_id="INC-2026-0031",
            title="External Port Reconnaissance against Perimeter Firewall",
            description="Automated external IP sweep targeting edge firewall ports 22, 443, 3389, and 502.",
            severity="Low",
            status="Closed",
            assigned_analyst="Priya Sharma",
            created_at=now - timedelta(days=4),
            updated_at=now - timedelta(days=3),
            affected_assets=json.dumps(["CNI-FW-GATEWAY"]),
            mitre_techniques=json.dumps(["T1046"]),
            related_alerts=json.dumps(["ALT-2026-009"]),
            timeline_events=json.dumps([
                {"time": (now - timedelta(days=4)).strftime("%Y-%m-%d %H:%M:%S"), "author": "Firewall", "text": "Automatic block enacted."}
            ]),
            notes=json.dumps([
                {"time": (now - timedelta(days=3)).strftime("%Y-%m-%d %H:%M:%S"), "author": "Priya Sharma", "note": "Standard internet background radiation. Closed."}
            ])
        ),
        Incident(
            incident_id="INC-2026-0029",
            title="Off-Hours SCADA HMI Configuration Overwrite",
            description="Engineer workstation uploaded unapproved HMI configuration file to primary SCADA controller.",
            severity="Medium",
            status="Investigating",
            assigned_analyst="Priya Sharma",
            created_at=now - timedelta(hours=4),
            updated_at=now - timedelta(hours=3),
            affected_assets=json.dumps(["CNI-PWR-SCADA-01", "CNI-ENG-WS-45"]),
            mitre_techniques=json.dumps(["T1098"]),
            related_alerts=json.dumps(["ALT-2026-010"]),
            timeline_events=json.dumps([
                {"time": (now - timedelta(hours=4)).strftime("%Y-%m-%d %H:%M:%S"), "author": "Detection Engine", "text": "Atypical off-hours change detected."}
            ]),
            notes=json.dumps([
                {"time": (now - timedelta(hours=3)).strftime("%Y-%m-%d %H:%M:%S"), "author": "Priya Sharma", "note": "Reviewing differences between current HMI project and last verified backup."}
            ])
        )
    ]
    db.add_all(incidents_data)
    db.commit()

    # 11. COMPLIANCE REPORTS (CERT-In format)
    reports_data = [
        ComplianceReport(
            report_reference="CERT-IN-2026-CNI-0819",
            incident_id="INC-2026-0041",
            incident_category="Targeted Cyber Attack / Intrusion on Critical National Infrastructure",
            detection_time=now - timedelta(hours=35),
            occurrence_time=now - timedelta(hours=36),
            affected_systems="Active Directory DC (10.0.1.10), Engineering Station (10.0.3.45), 400kV RTU (192.168.10.12), Historian DB (10.0.2.25)",
            source_ip="185.220.101.44 (Tor Exit), 45.33.32.156 (C2 Egress)",
            destination_ip="10.0.0.1 (DMZ), 10.0.1.10, 192.168.10.12, 10.0.2.25",
            description="Simulated advanced persistent threat (APT) demonstrating multi-stage cyber attack across critical power distribution network. The attack chain leveraged credential stuffing against perimeter identity endpoints, lateral movement into operational OT engineering stations, unauthorized Modbus TCP commands directed at high-voltage substation switchgear, and exfiltration of historical grid telemetry archives.",
            iocs="IPs: 185.220.101.44, 45.33.32.156 | Domains: ns1.cni-telemetry-fake.org | Hashes: SHA256: d41d8cd98f00b204e9800998ecf8427e | Modbus Register: 0x002A",
            impact_assessment="Physical Grid Impact: Potential localized tripping of 400kV transmission feeder averted via SOC isolation. Confidentiality: Telemetry schema and log data compromised. Criticality: Level 1 Critical National Infrastructure.",
            actions_taken="Account admin_scada disabled; Engineering Workstation 45 placed into quarantine VLAN; Outbound firewall socket to 45.33.32.156 severed; Substation physical interlocks placed on manual bypass.",
            status="Submitted (Demonstration Mode)",
            remarks="Simulated report generated in accordance with Cyber Security Directions under Section 70B of The Information Technology Act, 2000 (CERT-In Mandate).",
            generated_by="Priya Sharma (SOC Analyst)",
            created_at=now - timedelta(minutes=5)
        )
    ]
    db.add_all(reports_data)
    db.commit()

    # 12. AUDIT LOGS (Chained SHA-256)
    audit_chain = [
        ("analyst@sentinelgrid.cni", "USER_LOGIN", "AUTH", "Successful authentication via Web Portal (JWT Issued)", now - timedelta(hours=48)),
        ("admin@sentinelgrid.cni", "USER_LOGIN", "AUTH", "Administrator login from Secure Operations Terminal", now - timedelta(hours=47)),
        ("system", "ALERT_GENERATION", "ALERT", "Alert ALT-2026-001 created by AI Anomaly Engine", now - timedelta(hours=36)),
        ("system", "PLAYBOOK_TRIGGER", "SOAR", "SOAR Playbook SOAR-PB-01 triggered automatically", now - timedelta(hours=35, minutes=58)),
        ("analyst@sentinelgrid.cni", "INCIDENT_CREATION", "INCIDENT", "Incident INC-2026-0041 created for Operation GridBreaker", now - timedelta(hours=35)),
        ("admin@sentinelgrid.cni", "ANALYST_APPROVAL", "SOAR", "Approved SOAR-PB-02 execution for IP 194.26.29.112", now - timedelta(hours=47, minutes=30)),
        ("analyst@sentinelgrid.cni", "INCIDENT_UPDATE", "INCIDENT", "Updated incident INC-2026-0041 status to Investigating", now - timedelta(hours=21)),
        ("system", "ALERT_GENERATION", "ALERT", "Alert ALT-2026-004 created: Unauthorized Modbus write to RTU-12", now - timedelta(hours=2)),
        ("analyst@sentinelgrid.cni", "REPORT_GENERATION", "COMPLIANCE", "Generated CERT-In demonstration report CERT-IN-2026-CNI-0819", now - timedelta(minutes=5))
    ]

    prev_hash = GENESIS_HASH
    audit_records = []
    for i, (usr, act, ent, det, ts) in enumerate(audit_chain):
        aid = f"AUD-100{i+1:02d}"
        ts_str = ts.strftime("%Y-%m-%d %H:%M:%S")
        cur_hash = calculate_audit_hash(
            previous_hash=prev_hash,
            user_email=usr,
            action=act,
            timestamp_str=ts_str,
            entity=ent,
            event_details=det
        )
        audit_records.append(AuditLog(
            audit_id=aid,
            user_email=usr,
            action=act,
            timestamp=ts,
            entity=ent,
            event_details=det,
            integrity_hash=cur_hash,
            previous_hash=prev_hash
        ))
        prev_hash = cur_hash

    db.add_all(audit_records)
    db.commit()

if __name__ == "__main__":
    db = SessionLocal()
    seed_database(db, force_reset=True)
    db.close()
    print("Database successfully seeded with comprehensive demonstration data!")
