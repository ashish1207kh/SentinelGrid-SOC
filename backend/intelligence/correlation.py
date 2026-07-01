from typing import Dict, List


def correlate_events(events: List[Dict]) -> List[Dict]:
    correlated = []
    event_map = {}

    for event in events:
        key = (event.get("source_ip"), event.get("destination_ip"))
        event_map.setdefault(key, []).append(event)

    for key, matches in event_map.items():
        if len(matches) > 1:
            correlated.append({
                "source_ip": key[0],
                "destination_ip": key[1],
                "count": len(matches),
                "events": matches,
            })

    return correlated


if __name__ == "__main__":
    sample = [
        {"source_ip": "192.168.1.10", "destination_ip": "10.0.0.5", "event": "login"},
        {"source_ip": "192.168.1.10", "destination_ip": "10.0.0.5", "event": "file_access"},
    ]
    print(correlate_events(sample))
