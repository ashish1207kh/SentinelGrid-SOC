import os
import csv
import json
import pandas as pd
from datetime import datetime, timedelta
from attck_mapper import map_event_to_mitre, get_technique_details

INPUT_ALERTS = "E:/cyber-resilience/backend/data/alerts.csv"
OUTPUT_CAMPAIGNS = "E:/cyber-resilience/backend/data/campaigns.json"

def correlate_alerts():
    if not os.path.exists(INPUT_ALERTS):
        print(f"Error: {INPUT_ALERTS} does not exist.")
        return []
        
    df = pd.read_csv(INPUT_ALERTS)
    if df.empty:
        print("No alerts to correlate.")
        return []
        
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    # Sort alerts by username and timestamp
    df = df.sort_values(by=['username', 'timestamp'])
    
    campaigns = []
    campaign_id_counter = 1
    
    # Group alerts by username
    for username, group in df.groupby('username'):
        group_events = group.to_dict('records')
        
        current_campaign_events = []
        last_time = None
        
        for event in group_events:
            event_time = event['timestamp']
            
            # Check 4 hour correlation window
            if last_time is None or (event_time - last_time) <= timedelta(hours=4):
                current_campaign_events.append(event)
            else:
                # Save previous campaign and start a new one
                campaigns.append(build_campaign_object(username, current_campaign_events, campaign_id_counter))
                campaign_id_counter += 1
                current_campaign_events = [event]
                
            last_time = event_time
            
        if current_campaign_events:
            campaigns.append(build_campaign_object(username, current_campaign_events, campaign_id_counter))
            campaign_id_counter += 1
            
    # Save campaigns to JSON
    with open(OUTPUT_CAMPAIGNS, 'w') as f:
        json.dump(campaigns, f, default=str, indent=2)
        
    print(f"Correlated alerts into {len(campaigns)} campaigns. Saved to {OUTPUT_CAMPAIGNS}")
    return campaigns

def build_campaign_object(username, events, campaign_id):
    stages = []
    
    for event in events:
        technique_id = map_event_to_mitre(
            event['event_type'], 
            event['country'], 
            event['server'], 
            event['data_transferred_mb'], 
            event['privilege_level']
        )
        tech_info = get_technique_details(technique_id) if technique_id else {}
        
        # Determine the logical attack stage number if it fits the schema
        stage_num = 1
        if technique_id == "T1078":
            stage_num = 1
        elif technique_id == "T1021":
            stage_num = 2
        elif technique_id == "T1098":
            stage_num = 3
        elif technique_id == "T1041":
            stage_num = 4
            
        stages.append({
            "stage_id": stage_num,
            "timestamp": event['timestamp'].isoformat() if isinstance(event['timestamp'], datetime) else event['timestamp'],
            "event_type": event['event_type'],
            "server": event['server'],
            "data_transferred_mb": event['data_transferred_mb'],
            "privilege_level": event['privilege_level'],
            "anomaly_score": event['anomaly_score'],
            "mitre_id": technique_id,
            "mitre_name": tech_info.get("name", "Anomalous Activity"),
            "mitre_stage": tech_info.get("stage", "Initial Access"),
            "description": tech_info.get("description", "Unclassified threat event")
        })
        
    # Sort stages by stage_id
    stages.sort(key=lambda x: x['stage_id'])
    
    # Determine severity based on maximum stage reached
    max_stage = max([s['stage_id'] for s in stages]) if stages else 1
    severity = "Low"
    if max_stage == 4:
        severity = "Critical"
    elif max_stage == 3:
        severity = "High"
    elif max_stage == 2:
        severity = "Medium"
        
    return {
        "campaign_id": f"CAMP-{campaign_id:03d}",
        "username": username,
        "severity": severity,
        "status": "Active" if max_stage >= 3 else "Investigating",
        "start_time": min([s['timestamp'] for s in stages]),
        "end_time": max([s['timestamp'] for s in stages]),
        "stages": stages
    }

if __name__ == "__main__":
    correlate_alerts()
