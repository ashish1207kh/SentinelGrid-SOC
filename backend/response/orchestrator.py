import sqlite3
import datetime
import os

DB_PATH = "E:/cyber-resilience/backend/data/sentinelgrid.db"

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create actions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            campaign_id TEXT NOT NULL,
            mitre_id TEXT,
            action_name TEXT NOT NULL,
            status TEXT NOT NULL,
            target TEXT NOT NULL,
            reason TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    """)
    
    conn.commit()
    conn.close()
    print("SQLite database initialized at", DB_PATH)

def get_playbook_action(mitre_id):
    """
    Playbook:
    T1078 (Valid Accounts) -> Force MFA challenge (Auto-Executed)
    T1021 (Remote Services) -> Restrict to read-only (Auto-Executed)
    T1098 (Account Manipulation) -> Freeze account (Needs Human Approval)
    T1041 (Exfiltration) -> Isolate host (Needs Human Approval)
    """
    playbook = {
        "T1078": {
            "action_name": "Force MFA Challenge",
            "requires_approval": False,
            "reason": "Suspicious login details (anomalous country/time). Immediate MFA forced."
        },
        "T1021": {
            "action_name": "Restrict Access to Read-Only",
            "requires_approval": False,
            "reason": "Anomalous lateral movement via remote services detected. Read-only session restriction applied."
        },
        "T1098": {
            "action_name": "Freeze User Account",
            "requires_approval": True,
            "reason": "Privilege change to administrator level on standard account. Needs urgent admin review."
        },
        "T1041": {
            "action_name": "Isolate Host Machine",
            "requires_approval": True,
            "reason": "High-volume data transfer exceeding baseline (Exfiltration indicator). Needs host quarantine review."
        }
    }
    return playbook.get(mitre_id)

def trigger_playbook_for_campaign(campaign):
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    campaign_id = campaign.get("campaign_id")
    username = campaign.get("username")
    
    actions_logged = []
    
    for stage in campaign.get("stages", []):
        mitre_id = stage.get("mitre_id")
        action_spec = get_playbook_action(mitre_id)
        
        if not action_spec:
            continue
            
        # Check if this action already exists for this stage of the campaign
        cursor.execute(
            "SELECT id FROM audit_logs WHERE campaign_id = ? AND mitre_id = ?", 
            (campaign_id, mitre_id)
        )
        if cursor.fetchone():
            # Action already logged previously
            continue
            
        # Determine status
        status = "Pending Approval" if action_spec["requires_approval"] else "Executed"
        target = username if mitre_id != "T1041" else stage.get("server", "unknown_host")
        
        timestamp = datetime.datetime.now().isoformat()
        
        cursor.execute("""
            INSERT INTO audit_logs (campaign_id, mitre_id, action_name, status, target, reason, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (campaign_id, mitre_id, action_spec["action_name"], status, target, action_spec["reason"], timestamp))
        
        actions_logged.append({
            "campaign_id": campaign_id,
            "mitre_id": mitre_id,
            "action_name": action_spec["action_name"],
            "status": status,
            "target": target,
            "reason": action_spec["reason"],
            "timestamp": timestamp
        })
        
    conn.commit()
    conn.close()
    return actions_logged

def handle_action_response(action_id, approve=True):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    new_status = "Executed" if approve else "Denied"
    
    cursor.execute(
        "UPDATE audit_logs SET status = ? WHERE id = ? AND status = 'Pending Approval'",
        (new_status, action_id)
    )
    success = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return success

def fetch_audit_logs():
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, campaign_id, mitre_id, action_name, status, target, reason, timestamp FROM audit_logs ORDER BY timestamp DESC")
    rows = cursor.fetchall()
    conn.close()
    
    keys = ["id", "campaign_id", "mitre_id", "action_name", "status", "target", "reason", "timestamp"]
    return [dict(zip(keys, row)) for row in rows]
