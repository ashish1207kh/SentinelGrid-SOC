# MITRE ATT&CK Mapping Lookup Table
# No changes needed for paths — this file has no file I/O.
# Fixed: added to detection/ package so imports work correctly from FastAPI.

MITRE_MAPPING = {
    "T1078": {
        "name": "Valid Accounts",
        "stage": "Initial Access / Defense Evasion",
        "description": (
            "Adversaries may obtain and abuse credentials of existing accounts. "
            "Login originated from an anomalous geography (Russia) at an unusual hour (2 AM), "
            "deviating sharply from the user's established Chennai-based 9AM–6PM baseline."
        )
    },
    "T1021": {
        "name": "Remote Services",
        "stage": "Lateral Movement",
        "description": (
            "Adversaries may use Valid Accounts to log into remote services and access other systems. "
            "Session accessed backup_server — a host this user has never touched in 7 days of baseline."
        )
    },
    "T1098": {
        "name": "Account Manipulation",
        "stage": "Persistence / Privilege Escalation",
        "description": (
            "Adversaries may manipulate accounts to maintain access or escalate privileges. "
            "Standard user account was elevated to administrator level at 3:10 AM with no change ticket."
        )
    },
    "T1041": {
        "name": "Exfiltration Over C2 Channel",
        "stage": "Exfiltration",
        "description": (
            "Adversaries steal data by transferring it to an external destination. "
            "4,500 MB transferred to external_exfil_ip — 300x above this user's normal data volume."
        )
    }
}


def map_event_to_mitre(event_type, country, server, data_mb, privilege_level):
    """
    Maps a single log event to the most relevant MITRE ATT&CK technique ID.
    Priority order: Exfiltration > Privilege change > Lateral movement > Initial access
    """
    # Stage 4 — Exfiltration
    if event_type == "data_transfer" or data_mb > 1000.0 or server == "external_exfil_ip":
        return "T1041"

    # Stage 3 — Privilege escalation
    if event_type == "privilege_change" or privilege_level == "admin":
        return "T1098"

    # Stage 2 — Lateral movement to unusual servers
    if event_type == "access_server" and server in ("backup_server", "admin_console", "finance_db"):
        return "T1021"

    # Stage 1 — Anomalous login (foreign country or unusual credentials)
    if event_type == "login" and country != "India":
        return "T1078"

    # No technique matched
    return None


def get_technique_details(technique_id):
    """Returns the full technique dict for a given MITRE ID."""
    return MITRE_MAPPING.get(technique_id, {
        "name": "Anomalous Activity",
        "stage": "Unknown",
        "description": "Suspicious behavior detected that does not match a known baseline pattern."
    })
