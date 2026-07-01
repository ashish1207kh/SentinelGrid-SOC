from typing import Dict, List


class AnomalyEngine:
    def __init__(self):
        self.thresholds = {
            "high": 80,
            "medium": 50,
            "low": 20,
        }

    def detect(self, events: List[Dict]) -> List[Dict]:
        anomalies = []
        for event in events:
            score = event.get("score", 0)
            if score >= self.thresholds["high"]:
                anomalies.append({**event, "alert": "high"})
            elif score >= self.thresholds["medium"]:
                anomalies.append({**event, "alert": "medium"})
            elif score >= self.thresholds["low"]:
                anomalies.append({**event, "alert": "low"})
        return anomalies


if __name__ == "__main__":
    sample_events = [
        {"id": 1, "score": 92},
        {"id": 2, "score": 63},
        {"id": 3, "score": 15},
    ]
    engine = AnomalyEngine()
    print(engine.detect(sample_events))
