import os
import sys
import sqlite3
import datetime

# --- Dynamic path setup (works on ANY machine, any OS) ---
THIS_DIR    = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(THIS_DIR)
DATA_DIR    = os.path.join(BACKEND_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

DB_PATH = os.path.join(DATA_DIR, "sentinelgrid.db")


def init_db():
    """Create the audit_logs table if it doesn't exist yet."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            campaign_id TEXT    NOT NULL,
            mitre_id    TEXT,
            action_name TEXT    NOT NULL,
            status      TEXT    NOT NULL,
            target      TEXT    NOT NULL,
            reason      TEXT    NOT NULL,
            timestamp   TEXT    NOT NULL
        )
    """)
    conn.commit()
    conn.close()


def get_playbook_action(mitre_id):
    """
    Confidence-based response playbook:
      T1078 (Valid Accounts)       → Force MFA challenge       [Auto-Execute — low blast radius]
      T1021 (Remote Services)      → Restrict to read-only     [Auto-Execute — low blast radius]
      T1098 (Account Manipulation) → Freeze account            [Needs Human Approval — high impact]
      T1041 (Exfiltration)         → Isolate host machine      [Needs Human Approval — high impact]
    """
    playbook = {
        "T1078": {
            "action_name":       "Force MFA Challenge",
            "requires_approval": False,
            "reason": (
                "Anomalous login: geography (Russia) and time (2 AM) deviate from "
                "user baseline (Chennai, 9AM–6PM). Immediate MFA challenge sent to "
                "registered device to verify identity before any data access is allowed."
            )
        },
        "T1021": {
            "action_name":       "Restrict Access to Read-Only",
            "requires_approval": False,
            "reason": (
                "Lateral movement detected: session accessed backup_server, a host "
                "never accessed by this user in baseline period. Session restricted to "
                "read-only — no downloads or transfers permitted until review."
            )
        },
        "T1098": {
            "action_name":       "Freeze User Account",
            "requires_approval": True,
            "reason": (
                "Privilege escalation detected: standard account elevated to admin level "
                "at 3:10 AM with no change request on record. High blast-radius action — "
                "requires security officer approval before account is frozen."
            )
        },
        "T1041": {
            "action_name":       "Isolate Host Machine",
            "requires_approval": True,
            "reason": (
                "Exfiltration in progress: 4,500 MB transferred to external_exfil_ip "
                "(300x above user baseline). High blast-radius action — isolating the "
                "host will take dependent services offline. Requires human approval."
            )
        }
    }
    return playbook.get(mitre_id)


def trigger_playbook_for_campaign(campaign):
    """
    For each stage in a campaign, look up the playbook action and log it.
    Auto-executed actions are marked 'Executed' immediately.
    High-risk actions are marked 'Pending Approval' until a human approves/denies.
    """
    init_db()
    conn   = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    campaign_id = campaign.get("campaign_id")
    username    = campaign.get("username")
    actions_logged = []

    for stage in campaign.get("stages", []):
        mitre_id    = stage.get("mitre_id")
        action_spec = get_playbook_action(mitre_id)

        if not action_spec:
            continue

        # Avoid duplicate entries if simulation is re-run
        cursor.execute(
            "SELECT id FROM audit_logs WHERE campaign_id = ? AND mitre_id = ?",
            (campaign_id, mitre_id)
        )
        if cursor.fetchone():
            continue

        status    = "Pending Approval" if action_spec["requires_approval"] else "Executed"
        target    = username if mitre_id != "T1041" else stage.get("server", "unknown_host")
        timestamp = datetime.datetime.now().isoformat()

        cursor.execute("""
            INSERT INTO audit_logs
                (campaign_id, mitre_id, action_name, status, target, reason, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            campaign_id,
            mitre_id,
            action_spec["action_name"],
            status,
            target,
            action_spec["reason"],
            timestamp
        ))

        actions_logged.append({
            "campaign_id": campaign_id,
            "mitre_id":    mitre_id,
            "action_name": action_spec["action_name"],
            "status":      status,
            "target":      target,
            "reason":      action_spec["reason"],
            "timestamp":   timestamp
        })

    conn.commit()
    conn.close()
    return actions_logged


def handle_action_response(action_id, approve=True):
    """
    Approve or deny a pending action.
    Returns True if the update succeeded, False if the action wasn't found
    or wasn't in Pending Approval state.
    """
    init_db()
    conn      = sqlite3.connect(DB_PATH)
    cursor    = conn.cursor()
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
    """Return all audit log rows as a list of dicts, newest first."""
    init_db()
    conn   = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, campaign_id, mitre_id, action_name, status, target, reason, timestamp
        FROM audit_logs
        ORDER BY timestamp DESC
    """)
    rows = cursor.fetchall()
    conn.close()

    keys = ["id", "campaign_id", "mitre_id", "action_name", "status", "target", "reason", "timestamp"]
    return [dict(zip(keys, row)) for row in rows]
