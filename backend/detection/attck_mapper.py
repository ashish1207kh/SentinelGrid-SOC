# MITRE ATT&CK Mapping Lookup Table

MITRE_MAPPING = {
    "T1078": {
        "name": "Valid Accounts",
        "stage": "Initial Access / Defense Evasion",
        "description": "Adversaries may obtain and abuse credentials of existing accounts. In this case, login originated from an anomalous geography (Russia) at an unusual hour (2 AM)."
    },
    "T1021": {
        "name": "Remote Services",
        "stage": "Lateral Movement",
        "description": "Adversaries may use Valid Accounts to log into a service in the network (such as backup servers) to access other systems."
    },
    "T1098": {
        "name": "Account Manipulation",
        "stage": "Persistence / Privilege Escalation",
        "description": "Adversaries may manipulate accounts to maintain access or gain elevated privileges. Admin rights were assigned to a standard user."
    },
    "T1041": {
        "name": "Exfiltration",
        "stage": "Exfiltration",
        "description": "Adversaries may steal data by transferring it over an established connection or directly to an external IP address (4.5GB transferred)."
    }
}

def map_event_to_mitre(event_type, country, server, data_mb, privilege_level):
    """
    Decides the MITRE ATT&CK technique based on log characteristics
    """
    if event_type == "data_transfer" or data_mb > 1000.0 or server == "external_exfil_ip":
        return "T1041"
    elif event_type == "privilege_change":
        return "T1098"
    elif event_type == "access_server" and (server == "backup_server" or server == "admin_console"):
        return "T1021"
    elif event_type == "login" and (country == "Russia" or country != "India"):
        return "T1078"
    elif privilege_level == "admin":
        return "T1098"
    
    # Default or fallback
    return None

def get_technique_details(technique_id):
    return MITRE_MAPPING.get(technique_id, {
        "name": "Unknown Technique",
        "stage": "Unknown",
        "description": "Suspicious anomalous behavior detected."
    })
