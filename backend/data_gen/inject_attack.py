import csv
import json
import datetime
import os

# --- Dynamic path setup (works on ANY machine, any OS) ---
THIS_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(THIS_DIR)
DATA_DIR = os.path.join(BACKEND_DIR, "data")

NORMAL_LOGS = os.path.join(DATA_DIR, "normal_logs.csv")
FULL_LOGS   = os.path.join(DATA_DIR, "full_logs.csv")
GROUND_TRUTH = os.path.join(DATA_DIR, "ground_truth.json")

if not os.path.exists(NORMAL_LOGS):
    print(f"Error: {NORMAL_LOGS} does not exist. Please run generate_logs.py first.")
    exit(1)

# Read normal logs
with open(NORMAL_LOGS, mode="r") as f:
    reader = csv.reader(f)
    headers = list(next(reader))
    rows = list(reader)

print(f"Loaded {len(rows)} normal log rows.")

# Attack actor details
attack_username = "dr_sharma"
attack_ip       = "95.213.255.1"   # Russian IP
attack_country  = "Russia"
attack_city     = "Moscow"

# Attack timestamps — Day 5 of the simulation (2026-06-29), between 2 AM and 4 AM
attack_date = datetime.date(2026, 6, 29)
t1 = datetime.datetime.combine(attack_date, datetime.time(2, 15, 0)).isoformat()
t2 = datetime.datetime.combine(attack_date, datetime.time(2, 45, 0)).isoformat()
t3 = datetime.datetime.combine(attack_date, datetime.time(3, 10, 0)).isoformat()
t4 = datetime.datetime.combine(attack_date, datetime.time(3, 50, 0)).isoformat()

# 4-stage attack chain
attack_events = [
    {
        "timestamp":          t1,
        "username":           attack_username,
        "event_type":         "login",
        "ip_address":         attack_ip,
        "country":            attack_country,
        "city":               attack_city,
        "server":             "domain_controller",
        "data_transferred_mb": 0.0,
        "privilege_level":    "user",
        "status":             "success",
        # metadata only used for ground_truth.json, not written to the CSV
        "stage":              1,
        "description":        "Stage 1: Login from Russia at 2 AM",
    },
    {
        "timestamp":          t2,
        "username":           attack_username,
        "event_type":         "access_server",
        "ip_address":         attack_ip,
        "country":            attack_country,
        "city":               attack_city,
        "server":             "backup_server",   # dr_sharma never touches this normally
        "data_transferred_mb": 15.5,
        "privilege_level":    "user",
        "status":             "success",
        "stage":              2,
        "description":        "Stage 2: Access unusual backup server",
    },
    {
        "timestamp":          t3,
        "username":           attack_username,
        "event_type":         "privilege_change",
        "ip_address":         attack_ip,
        "country":            attack_country,
        "city":               attack_city,
        "server":             "domain_controller",
        "data_transferred_mb": 0.0,
        "privilege_level":    "admin",
        "status":             "success",
        "stage":              3,
        "description":        "Stage 3: Account privilege escalation to admin",
    },
    {
        "timestamp":          t4,
        "username":           attack_username,
        "event_type":         "data_transfer",
        "ip_address":         attack_ip,
        "country":            attack_country,
        "city":               attack_city,
        "server":             "external_exfil_ip",
        "data_transferred_mb": 4500.0,   # 4.5 GB
        "privilege_level":    "admin",
        "status":             "success",
        "stage":              4,
        "description":        "Stage 4: Exfiltration of 4.5 GB to external IP",
    },
]

# Merge normal logs + attack events
all_events = [dict(zip(headers, row)) for row in rows]
for ae in attack_events:
    # Only keep columns that exist in the CSV headers
    clean_ae = {k: v for k, v in ae.items() if k in headers}
    all_events.append(clean_ae)

# Sort everything by timestamp so the log looks realistic
all_events.sort(key=lambda x: x["timestamp"])

# Write full_logs.csv
with open(FULL_LOGS, mode="w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    for row in all_events:
        writer.writerow(row)

print(f"Wrote {len(all_events)} events -> {FULL_LOGS}")

# Save ground truth (includes stage/description metadata for evaluation)
with open(GROUND_TRUTH, mode="w") as f:
    json.dump(attack_events, f, indent=2)

print(f"Ground truth saved -> {GROUND_TRUTH}")
