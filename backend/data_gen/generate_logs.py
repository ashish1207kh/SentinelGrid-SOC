import os
import csv
import random
import datetime

# --- Dynamic path setup (works on ANY machine, any OS) ---
THIS_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(THIS_DIR)
DATA_DIR = os.path.join(BACKEND_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

OUTPUT_FILE = os.path.join(DATA_DIR, "normal_logs.csv")

# Configuration
NUM_USERS = 50
DAYS = 7
START_DATE = datetime.datetime(2026, 6, 25, 0, 0, 0)

# Indian cities and corresponding IP ranges (simulated)
INDIAN_GEOS = [
    {"city": "Mumbai",    "ip_prefix": "115.112."},
    {"city": "Delhi",     "ip_prefix": "122.161."},
    {"city": "Bengaluru", "ip_prefix": "182.74."},
    {"city": "Hyderabad", "ip_prefix": "120.59."},
    {"city": "Chennai",   "ip_prefix": "117.193."},
]

SERVERS = ["mail_server", "hr_portal", "git_repo", "file_share", "wiki", "finance_db"]

# CSV headers
HEADERS = [
    "timestamp", "username", "event_type", "ip_address", "country",
    "city", "server", "data_transferred_mb", "privilege_level", "status"
]

# ---------------------------------------------------------------
# Build user profiles
# ---------------------------------------------------------------
users = []

# Add dr_sharma first as a known, normal Chennai-based user.
# This is important: the anomaly engine builds a baseline from these
# normal logs, so when the attack is injected (Russia, 2 AM) it will
# stand out sharply against this established profile.
users.append({
    "username": "dr_sharma",
    "ip": "117.193.45.22",
    "city": "Chennai",
    "country": "India",
    "start_hour": 9,
    "end_hour": 18,
    "servers": ["hr_portal", "wiki", "file_share"],  # dr_sharma never touches backup_server normally
})

# Generate the rest of the 50 users
for i in range(1, NUM_USERS + 1):
    username = f"user_{i}"
    geo = random.choice(INDIAN_GEOS)
    ip_address = geo["ip_prefix"] + str(random.randint(2, 254))

    shift_type = random.choice(["day", "day", "day", "night"])  # 75% day, 25% night
    if shift_type == "day":
        start_hour = random.randint(8, 10)
        end_hour = random.randint(17, 19)
    else:
        start_hour = random.randint(20, 22)
        end_hour = random.randint(5, 7)

    allowed_servers = random.sample(SERVERS, random.randint(2, 4))

    users.append({
        "username": username,
        "ip": ip_address,
        "city": geo["city"],
        "country": "India",
        "start_hour": start_hour,
        "end_hour": end_hour,
        "servers": allowed_servers,
    })

print(f"Configured profiles for {len(users)} users (including dr_sharma).")

# ---------------------------------------------------------------
# Generate events
# ---------------------------------------------------------------
event_count = 0

with open(OUTPUT_FILE, mode="w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(HEADERS)

    for day in range(DAYS):
        day_date = START_DATE + datetime.timedelta(days=day)

        for user in users:
            sessions = random.randint(3, 8)

            for _ in range(sessions):
                # Pick a time within the user's normal working hours
                if user["start_hour"] < user["end_hour"]:
                    hour = random.randint(user["start_hour"], user["end_hour"])
                else:  # Overnight shift wraps midnight
                    hours_pool = list(range(user["start_hour"], 24)) + list(range(0, user["end_hour"] + 1))
                    hour = random.choice(hours_pool)

                minute = random.randint(0, 59)
                second = random.randint(0, 59)
                timestamp = day_date.replace(hour=hour, minute=minute, second=second)

                # 1. Login event
                writer.writerow([
                    timestamp.isoformat(),
                    user["username"],
                    "login",
                    user["ip"],
                    user["country"],
                    user["city"],
                    "domain_controller",
                    0.0,
                    "user",
                    "success",
                ])
                event_count += 1

                # 2. Server access events within the session
                num_accesses = random.randint(2, 5)
                session_time = timestamp
                for _ in range(num_accesses):
                    session_time += datetime.timedelta(minutes=random.randint(5, 30))
                    server = random.choice(user["servers"])
                    data_mb = round(random.uniform(0.1, 15.0), 2)

                    writer.writerow([
                        session_time.isoformat(),
                        user["username"],
                        "access_server",
                        user["ip"],
                        user["country"],
                        user["city"],
                        server,
                        data_mb,
                        "user",
                        "success",
                    ])
                    event_count += 1

print(f"Generated {event_count} normal events → {OUTPUT_FILE}")
