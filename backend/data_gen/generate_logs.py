import csv
import random
from datetime import datetime

LOG_FIELDS = ["timestamp", "source_ip", "destination_ip", "event_type", "severity", "message"]
EVENT_TYPES = ["login", "file_access", "network_connection", "malware_detected", "configuration_change"]
SEVERITIES = ["low", "medium", "high"]


def generate_log_entry(index: int) -> dict:
    return {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "source_ip": f"192.168.1.{random.randint(2, 254)}",
        "destination_ip": f"10.0.0.{random.randint(2, 254)}",
        "event_type": random.choice(EVENT_TYPES),
        "severity": random.choice(SEVERITIES),
        "message": f"Generated event {index}"
    }


def save_logs(path: str, count: int = 100) -> None:
    with open(path, mode="w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=LOG_FIELDS)
        writer.writeheader()
        for i in range(count):
            writer.writerow(generate_log_entry(i + 1))


if __name__ == "__main__":
    save_logs("../data/generated_logs.csv", count=100)
    print("Generated 100 sample logs to backend/data/generated_logs.csv")
