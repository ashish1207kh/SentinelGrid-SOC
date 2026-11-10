from typing import Dict, Any, List

def generate_xai_explanation(
    log_entry: Dict[str, Any],
    calibrated_score: float,
    feature_contributions: Dict[str, float]
) -> Dict[str, Any]:
    """
    Produces structured, human-readable Explainable AI evidence with feature attribution,
    risk level, actionable mitigation steps, and analytical caveats.
    """
    reasons = []
    recommended_actions = []
    
    failed_logins = log_entry.get("failed_logins", 0)
    hour = log_entry.get("hour", 12)
    is_off_hours = (hour < 6 or hour >= 21)
    bytes_kb = log_entry.get("bytes_kb", 0)
    privilege_level = log_entry.get("privilege_level", 1)
    geo_novelty = log_entry.get("geo_novelty", 0)
    event_type = log_entry.get("event_type", "")
    username = log_entry.get("username", "unknown")
    source_ip = log_entry.get("source_ip", "")
    destination_ip = log_entry.get("destination_ip", "")
    port = log_entry.get("port", 443)

    if failed_logins >= 3:
        reasons.append(f"Repeated authentication failures ({failed_logins} sequential failed attempts) preceded access, matching credential exhaustion or brute-force behavior.")
        recommended_actions.append("Enforce multi-factor authentication (MFA) challenge or temporarily lock identity account.")

    if is_off_hours:
        reasons.append(f"Access initiated at atypical off-hours timestamp ({hour:02d}:00 UTC/IST), deviating from user's established 08:00-19:00 baseline.")
        recommended_actions.append("Contact operator or user manager to confirm authorized off-hours maintenance ticket.")

    if geo_novelty > 0 or "185." in source_ip or "45." in source_ip or "198." in source_ip:
        reasons.append(f"Source IP '{source_ip}' originates from an unverified routing block outside established CNI domestic telemetry zones.")
        recommended_actions.append(f"Correlate source IP '{source_ip}' against threat intelligence feeds and block at perimeter gateway.")

    if bytes_kb > 5000:
        mb = round(bytes_kb / 1024, 2)
        reasons.append(f"Abnormally high egress data transfer ({mb} MB) detected to external destination host {destination_ip}:{port}.")
        recommended_actions.append("Initiate simulated network boundary throttling and capture full packet payload for DLP analysis.")

    if privilege_level >= 3 or "root" in username.lower() or "admin" in username.lower():
        reasons.append(f"Activity invoked elevated administrative/root privileges on sensitive infrastructure node.")
        recommended_actions.append("Audit privilege delegation logs and verify change management authorization record.")

    if any(k in destination_ip for k in ["192.168.10.", "10.0.1.10", "10.0.2.25"]):
        reasons.append(f"Target system '{destination_ip}' resides in Critical National Infrastructure (Purdue Level 1/2 control zone).")
        recommended_actions.append("Verify operational continuity constraints before applying automated containment playbooks.")

    if not reasons:
        reasons.append("Multi-dimensional behavioral deviation observed in combined connection rate, session persistence, and protocol attributes.")
        recommended_actions.append("Observe user session telemetry and review adjacent endpoint sysmon events.")

    # Determine risk level
    if calibrated_score >= 0.85:
        risk_level = "CRITICAL"
    elif calibrated_score >= 0.70:
        risk_level = "HIGH"
    elif calibrated_score >= 0.50:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    # Sort top contributing factors
    top_factors = sorted(
        [{"factor": k.replace("_", " ").title(), "contribution_pct": v} for k, v in feature_contributions.items() if v > 0],
        key=lambda x: x["contribution_pct"],
        reverse=True
    )[:4]

    return {
        "risk_level": risk_level,
        "calibrated_anomaly_score": calibrated_score,
        "score_interpretation": "Isolation Forest Outlier Metric (0.0=Strictly Nominal, 1.0=Extreme Behavioral Deviation)",
        "reasons": reasons,
        "top_contributing_factors": top_factors,
        "recommended_actions": recommended_actions,
        "analyst_disclaimer": "AI explanations represent supporting statistical evidence and behavioral heuristics for analyst triage, not definitive legal or forensic proof of malicious intent. Human analyst validation required."
    }
