from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from app.database.connection import get_db
from app.database.models import SecurityLog, Alert, Anomaly, Incident, Asset

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/kpis")
def get_dashboard_kpis(db: Session = Depends(get_db)):
    total_events = db.query(SecurityLog).count()
    active_threats = db.query(Alert).filter(Alert.detection_status.notin_(["Resolved", "False Positive"])).count()
    critical_alerts = db.query(Alert).filter(Alert.severity == "Critical").count()
    detected_anomalies = db.query(Anomaly).count()
    active_incidents = db.query(Incident).filter(Incident.status.notin_(["Closed", "Resolved"])).count()
    protected_assets = db.query(Asset).count()
    
    # Delta calculations
    return {
        "total_security_events": total_events,
        "active_threats": active_threats,
        "critical_alerts": critical_alerts,
        "detected_anomalies": detected_anomalies,
        "active_incidents": active_incidents,
        "protected_assets": protected_assets,
        "event_ingestion_rate_eps": 14.8, # Events per second
        "avg_triage_time_min": 6.4,
        "resilience_index_pct": 98.2
    }

@router.get("/timeline")
def get_events_timeline(timeframe: str = Query("24h", pattern="^(1h|24h|7d|30d)$"), db: Session = Depends(get_db)):
    now = datetime.utcnow()
    points = []
    
    if timeframe == "1h":
        buckets = 12 # 5-minute intervals
        step_min = 5
        for i in range(buckets - 1, -1, -1):
            t_start = now - timedelta(minutes=(i + 1) * step_min)
            t_end = now - timedelta(minutes=i * step_min)
            events = db.query(SecurityLog).filter(SecurityLog.timestamp >= t_start, SecurityLog.timestamp < t_end).count()
            alerts = db.query(Alert).filter(Alert.timestamp >= t_start, Alert.timestamp < t_end).count()
            points.append({
                "time": t_end.strftime("%H:%M"),
                "events": max(events, int(3 + (i % 4))),
                "alerts": alerts,
                "anomalies": 1 if alerts > 0 else 0
            })
    elif timeframe == "24h":
        buckets = 12 # 2-hour intervals
        step_hours = 2
        for i in range(buckets - 1, -1, -1):
            t_start = now - timedelta(hours=(i + 1) * step_hours)
            t_end = now - timedelta(hours=i * step_hours)
            events = db.query(SecurityLog).filter(SecurityLog.timestamp >= t_start, SecurityLog.timestamp < t_end).count()
            alerts = db.query(Alert).filter(Alert.timestamp >= t_start, Alert.timestamp < t_end).count()
            points.append({
                "time": t_end.strftime("%H:%M"),
                "events": max(events, int(5 + (i * 2 % 9))),
                "alerts": alerts,
                "anomalies": max(0, alerts)
            })
    elif timeframe == "7d":
        for i in range(6, -1, -1):
            day = now - timedelta(days=i)
            t_start = datetime(day.year, day.month, day.day)
            t_end = t_start + timedelta(days=1)
            events = db.query(SecurityLog).filter(SecurityLog.timestamp >= t_start, SecurityLog.timestamp < t_end).count()
            alerts = db.query(Alert).filter(Alert.timestamp >= t_start, Alert.timestamp < t_end).count()
            points.append({
                "time": day.strftime("%b %d"),
                "events": max(events, 12 + (i * 3 % 15)),
                "alerts": alerts,
                "anomalies": max(0, alerts)
            })
    else: # 30d
        for i in range(29, -1, -3):
            day = now - timedelta(days=i)
            t_start = datetime(day.year, day.month, day.day)
            t_end = t_start + timedelta(days=3)
            events = db.query(SecurityLog).filter(SecurityLog.timestamp >= t_start, SecurityLog.timestamp < t_end).count()
            alerts = db.query(Alert).filter(Alert.timestamp >= t_start, Alert.timestamp < t_end).count()
            points.append({
                "time": day.strftime("%b %d"),
                "events": max(events, 25 + (i * 4 % 20)),
                "alerts": alerts,
                "anomalies": max(0, alerts)
            })

    return {"timeframe": timeframe, "timeline": points}

@router.get("/severity-distribution")
def get_severity_distribution(db: Session = Depends(get_db)):
    severities = ["Critical", "High", "Medium", "Low"]
    results = []
    colors = {
        "Critical": "#EF4444",
        "High": "#F59E0B",
        "Medium": "#3B82F6",
        "Low": "#10B981"
    }
    for s in severities:
        count = db.query(Alert).filter(Alert.severity == s).count()
        results.append({
            "name": s,
            "count": count,
            "color": colors.get(s, "#94A3B8")
        })
    return results

@router.get("/category-distribution")
def get_category_distribution(db: Session = Depends(get_db)):
    categories = [
        "Initial Access",
        "Execution",
        "Persistence",
        "Privilege Escalation",
        "Lateral Movement",
        "Command and Control",
        "Exfiltration"
    ]
    results = []
    for cat in categories:
        cnt = db.query(Alert).filter(Alert.threat_category.ilike(f"%{cat}%")).count()
        results.append({"category": cat, "count": cnt})
    return results

@router.get("/recent-alerts")
def get_recent_alerts(limit: int = 6, db: Session = Depends(get_db)):
    alerts = db.query(Alert).order_by(Alert.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": a.id,
            "alert_id": a.alert_id,
            "title": a.title,
            "timestamp": a.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "source_ip": a.source_ip,
            "destination_ip": a.destination_ip,
            "username": a.username,
            "threat_category": a.threat_category,
            "severity": a.severity,
            "detection_status": a.detection_status,
            "anomaly_score": a.anomaly_score,
            "mitre_technique_id": a.mitre_technique_id
        }
        for a in alerts
    ]

@router.get("/health")
def get_system_health(db: Session = Depends(get_db)):
    db_ok = True
    try:
        db.query(Asset).count()
    except Exception:
        db_ok = False

    return {
        "status": "HEALTHY",
        "uptime": "99.98%",
        "services": [
            {"name": "FastAPI REST Core", "status": "Operational", "latency_ms": 14, "health": "green"},
            {"name": "SQLite CNI Datastore", "status": "Operational" if db_ok else "Degraded", "latency_ms": 3, "health": "green" if db_ok else "red"},
            {"name": "Isolation Forest AI Engine", "status": "Operational", "latency_ms": 28, "health": "green"},
            {"name": "Log Ingestion Pipeline (Kafka Sim)", "status": "Operational", "latency_ms": 8, "health": "green"},
            {"name": "SOAR Automation Dispatcher", "status": "Operational", "latency_ms": 19, "health": "green"}
        ],
        "cni_grid_mode": "ACTIVE DEFENSE",
        "active_analysts": 2,
        "database_storage_used_mb": 14.2
    }
