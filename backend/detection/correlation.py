import os
import sys
import json
import pandas as pd
from datetime import datetime, timedelta

# --- Dynamic path setup (works on ANY machine, any OS) ---
THIS_DIR   = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(THIS_DIR)
DATA_DIR   = os.path.join(BACKEND_DIR, "data")

# Fix the import — use a package-style import so it works when called from FastAPI
if THIS_DIR not in sys.path:
    sys.path.insert(0, THIS_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from detection.attck_mapper import map_event_to_mitre, get_technique_details

INPUT_ALERTS     = os.path.join(DATA_DIR, "alerts.csv")
OUTPUT_CAMPAIGNS = os.path.join(DATA_DIR, "campaigns.json")


def correlate_alerts():
    if not os.path.exists(INPUT_ALERTS):
        print(f"Error: {INPUT_ALERTS} does not exist.")
        return []

    df = pd.read_csv(INPUT_ALERTS)
    if df.empty:
        print("No alerts to correlate.")
        return []

    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values(by=["username", "timestamp"])

    campaigns = []
    campaign_id_counter = 1

    for username, group in df.groupby("username"):
        group_events = group.to_dict("records")
        current_campaign_events = []
        last_time = None

        for event in group_events:
            event_time = event["timestamp"]

            if last_time is None or (event_time - last_time) <= timedelta(hours=4):
                current_campaign_events.append(event)
            else:
                # Gap > 4 hours — save current campaign, start a new one
                campaigns.append(
                    build_campaign_object(username, current_campaign_events, campaign_id_counter)
                )
                campaign_id_counter += 1
                current_campaign_events = [event]

            last_time = event_time

        if current_campaign_events:
            campaigns.append(
                build_campaign_object(username, current_campaign_events, campaign_id_counter)
            )
            campaign_id_counter += 1

    with open(OUTPUT_CAMPAIGNS, "w") as f:
        json.dump(campaigns, f, default=str, indent=2)

    print(f"Correlated alerts into {len(campaigns)} campaigns → {OUTPUT_CAMPAIGNS}")
    return campaigns


def build_campaign_object(username, events, campaign_id):
    stages = []

    for event in events:
        technique_id = map_event_to_mitre(
            event["event_type"],
            event["country"],
            event["server"],
            float(event["data_transferred_mb"]),
            event["privilege_level"],
        )
        tech_info = get_technique_details(technique_id) if technique_id else {}

        # Map technique to logical stage number
        stage_map = {"T1078": 1, "T1021": 2, "T1098": 3, "T1041": 4}
        stage_num = stage_map.get(technique_id, 1)

        ts = event["timestamp"]
        ts_iso = ts.isoformat() if isinstance(ts, datetime) else str(ts)

        stages.append({
            "stage_id":           stage_num,
            "timestamp":          ts_iso,
            "event_type":         event["event_type"],
            "server":             event["server"],
            "data_transferred_mb": event["data_transferred_mb"],
            "privilege_level":    event["privilege_level"],
            "anomaly_score":      event["anomaly_score"],
            "mitre_id":           technique_id,
            "mitre_name":         tech_info.get("name", "Anomalous Activity"),
            "mitre_stage":        tech_info.get("stage", "Initial Access"),
            "description":        tech_info.get("description", "Unclassified threat event"),
        })

    stages.sort(key=lambda x: x["stage_id"])

    max_stage = max((s["stage_id"] for s in stages), default=1)
    severity_map = {4: "Critical", 3: "High", 2: "Medium", 1: "Low"}
    severity = severity_map.get(max_stage, "Low")

    return {
        "campaign_id": f"CAMP-{campaign_id:03d}",
        "username":    username,
        "severity":    severity,
        "status":      "Active" if max_stage >= 3 else "Investigating",
        "start_time":  min(s["timestamp"] for s in stages),
        "end_time":    max(s["timestamp"] for s in stages),
        "stages":      stages,
    }


if __name__ == "__main__":
    correlate_alerts()
