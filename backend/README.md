# SentinelGrid SOC Backend

This backend scaffold includes a FastAPI endpoint, data generation, anomaly detection, MITRE mapping, event correlation, and orchestration.

## Structure
- `backend/api/main.py`: FastAPI application entry point
- `backend/data_gen/generate_logs.py`: Fake log generation
- `backend/detection/anomaly_engine.py`: Simple anomaly detection engine
- `backend/intelligence/attck_mapper.py`: MITRE ATT&CK mapping example
- `backend/intelligence/correlation.py`: Basic event correlation logic
- `backend/response/orchestrator.py`: Response/playbook orchestrator

## Setup
1. Create and activate a virtual environment
2. Install dependencies: `pip install fastapi uvicorn`
3. Run the API: `uvicorn backend.api.main:app --reload`
