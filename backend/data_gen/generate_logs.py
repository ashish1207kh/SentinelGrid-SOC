import os
import csv
import random
import datetime

# Create data directory if it doesn't exist
os.makedirs("E:/cyber-resilience/backend/data", exist_ok=True)

# Configuration
NUM_USERS = 50
DAYS = 7
START_DATE = datetime.datetime(2026, 6, 25, 0, 0, 0)
OUTPUT_FILE = "E:/cyber-resilience/backend/data/normal_logs.csv"

# Indian cities and corresponding IP ranges (simulated)
INDIAN_GEOS = [
    {"city": "Mumbai", "ip_prefix": "115.112."},
    {"city": "Delhi", "ip_prefix": "122.161."},
    {"city": "Bengaluru", "ip_prefix": "182.74."},
    {"city": "Hyderabad", "ip_prefix": "120.59."},
    {"city": "Chennai", "ip_prefix": "117.193."}
]

SERVERS = ["mail_server", "hr_portal", "git_repo", "file_share", "wiki", "finance_db"]

# Initialize users profiles
users = []
for i in range(1, NUM_USERS + 1):
    username = f"user_{i}"
    # Assign each user a primary city and IP range
    geo = random.choice(INDIAN_GEOS)
    ip_address = geo["ip_prefix"] + str(random.randint(2, 254))
    
    # Usual working hours (most work 9 AM - 6 PM, some might do night shifts)
    shift_type = random.choice(["day", "day", "day", "night"]) # 75% day, 25% night
    if shift_type == "day":
        start_hour = random.randint(8, 10)
        end_hour = random.randint(17, 19)
    else:
        start_hour = random.randint(20, 22)
        end_hour = random.randint(5, 7)
        
    # Usual servers they access (2 to 4 servers)
    allowed_servers = random.sample(SERVERS, random.randint(2, 4))
    
    users.append({
        "username": username,
        "ip": ip_address,
        "city": geo["city"],
        "country": "India",
        "start_hour": start_hour,
        "end_hour": end_hour,
        "servers": allowed_servers
    })

print(f"Configured profiles for {NUM_USERS} users.")

# Generate events
events = []
current_time = START_DATE
end_time = START_DATE + datetime.timedelta(days=DAYS)

# Write CSV
headers = [
    "timestamp", "username", "event_type", "ip_address", "country", 
    "city", "server", "data_transferred_mb", "privilege_level", "status"
]

event_count = 0
with open(OUTPUT_FILE, mode="w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(headers)
    
    # Loop day by day, hour by hour to generate realistic sequences
    for day in range(DAYS):
        day_date = START_DATE + datetime.timedelta(days=day)
        for user in users:
            # Number of sessions per day
            sessions = random.randint(3, 8)
            for _ in range(sessions):
                # Generate session time within user's active hour range
                if user["start_hour"] < user["end_hour"]:
                    hour = random.randint(user["start_hour"], user["end_hour"])
                else: # Overnight shift
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
                    "success"
                ])
                event_count += 1
                
                # 2. Server access events within session
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
                        "success"
                    ])
                    event_count += 1

print(f"Generated {event_count} normal events in {OUTPUT_FILE}")
