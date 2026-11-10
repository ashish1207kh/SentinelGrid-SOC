import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from typing import List, Dict, Any, Tuple
import json

class AnomalyDetector:
    def __init__(self, contamination: float = 0.08):
        self.contamination = contamination
        self.model = IsolationForest(
            n_estimators=120,
            contamination=self.contamination,
            random_state=42,
            max_samples="auto"
        )
        self.is_trained = False
        self.feature_names = [
            "failed_logins",
            "is_off_hours",
            "bytes_transferred_kb",
            "privilege_level",
            "port_risk",
            "geo_novelty",
            "conn_freq_per_min",
            "cni_critical_asset"
        ]
        self._init_baseline_model()

    def _extract_features(self, log_entry: Dict[str, Any]) -> List[float]:
        # Failed logins
        failed_count = float(log_entry.get("failed_logins", 0))
        
        # Off-hours check (default normal is 8am - 7pm local)
        hour = log_entry.get("hour", 12)
        is_off_hours = 1.0 if (hour < 6 or hour >= 21) else 0.0
        
        # Data volume in KB
        bytes_kb = float(log_entry.get("bytes_kb", 25.0))
        
        # Privilege level: user=1, operator=2, admin/root=3
        priv = float(log_entry.get("privilege_level", 1.0))
        
        # Port risk
        port = int(log_entry.get("port", 443))
        high_risk_ports = [22, 3389, 445, 502, 20000, 4444, 8888]
        port_risk = 1.0 if port in high_risk_ports else (0.5 if port in [80, 8080] else 0.1)
        
        # Geo novelty: 1 if foreign/anomalous, 0 if internal/domestic
        geo_novelty = float(log_entry.get("geo_novelty", 0.0))
        
        # Connection frequency per min
        freq = float(log_entry.get("conn_freq_per_min", 2.0))
        
        # Critical CNI asset target
        dest = str(log_entry.get("destination_ip", ""))
        cni_critical = 1.0 if any(k in dest for k in ["192.168.10.", "10.0.1.10", "10.0.2.25"]) else 0.0

        return [
            failed_count,
            is_off_hours,
            np.log1p(bytes_kb),
            priv,
            port_risk,
            geo_novelty,
            freq,
            cni_critical
        ]

    def _init_baseline_model(self):
        """Train on realistic normal CNI baseline telemetry."""
        np.random.seed(42)
        n_samples = 300
        
        normal_data = []
        for _ in range(n_samples):
            # Normal distribution: low failed logins, work hours, modest byte transfers
            hour = np.random.choice([8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18])
            failed = np.random.choice([0, 0, 0, 0, 0, 1], p=[0.75, 0.15, 0.05, 0.03, 0.01, 0.01])
            bytes_kb = np.random.exponential(scale=45.0)
            priv = np.random.choice([1.0, 1.0, 1.0, 2.0, 3.0], p=[0.7, 0.15, 0.05, 0.07, 0.03])
            port = np.random.choice([443, 80, 53, 123])
            geo = 0.0
            freq = np.random.uniform(0.5, 4.0)
            dest = "10.0.3.15"

            entry = {
                "failed_logins": failed,
                "hour": hour,
                "bytes_kb": bytes_kb,
                "privilege_level": priv,
                "port": port,
                "geo_novelty": geo,
                "conn_freq_per_min": freq,
                "destination_ip": dest
            }
            normal_data.append(self._extract_features(entry))

        X_train = np.array(normal_data)
        self.model.fit(X_train)
        self.is_trained = True

    def predict_anomaly(self, log_entry: Dict[str, Any]) -> Tuple[bool, float, Dict[str, float]]:
        """
        Returns:
            is_anomaly: bool
            calibrated_anomaly_score: float (0.0 to 1.0)
            feature_contributions: dict
        """
        feats = self._extract_features(log_entry)
        X = np.array([feats])
        
        # Raw decision function: negative values indicate outliers
        raw_score = self.model.decision_function(X)[0]
        # Raw score typically spans [-0.35, 0.25].
        # Map to calibrated 0.0 (strictly normal) -> 1.0 (highly anomalous)
        # Using sigmoid transformation
        calibrated_score = float(1.0 / (1.0 + np.exp(raw_score * 8.5)))
        calibrated_score = round(min(1.0, max(0.02, calibrated_score)), 3)
        
        is_anomaly = calibrated_score >= 0.60 or raw_score < 0.0

        # Feature contribution estimation (heuristic perturbation)
        contributions = {}
        baseline_means = [0.1, 0.05, 3.5, 1.2, 0.2, 0.0, 2.5, 0.1]
        feature_weights = [0.22, 0.12, 0.18, 0.16, 0.10, 0.14, 0.12, 0.16]

        total_weight = 0.0
        for i, val in enumerate(feats):
            deviation = max(0.0, val - baseline_means[i])
            contr = deviation * feature_weights[i]
            contributions[self.feature_names[i]] = float(round(contr, 3))
            total_weight += contr

        if total_weight > 0:
            for k in contributions:
                contributions[k] = round((contributions[k] / total_weight) * 100.0, 1)
        else:
            for k in contributions:
                contributions[k] = 0.0

        return is_anomaly, calibrated_score, contributions

detector = AnomalyDetector()
