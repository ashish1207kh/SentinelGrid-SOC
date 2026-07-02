import urllib.request
import urllib.parse
import json
import time

API_BASE = "http://localhost:8000/api"

def make_request(url, method="GET", data=None):
    req = urllib.request.Request(url, method=method)
    if data:
        json_data = json.dumps(data).encode('utf-8')
        req.add_header('Content-Type', 'application/json')
        req.data = json_data
    
    try:
        with urllib.request.urlopen(req) as response:
            res_data = response.read().decode('utf-8')
            return json.loads(res_data) if res_data else {}
    except Exception as e:
        print(f"Request failed for {url}: {e}")
        return None

def test_pipeline():
    print("Step 1: Running the full simulation pipeline...")
    sim_res = make_request(f"{API_BASE}/simulate/run", method="POST")
    if not sim_res or sim_res.get("status") != "success":
        print("FAIL: Simulation failed to run successfully.")
        return
    print(f"SUCCESS: Simulation result: {sim_res['message']} (Campaigns Correlated: {sim_res.get('campaign_count')})")
    
    time.sleep(2) # Allow database sync
    
    print("\nStep 2: Checking alerts feed...")
    alerts = make_request(f"{API_BASE}/alerts")
    if not alerts:
        print("FAIL: Alerts feed is empty.")
        return
    print(f"SUCCESS: Found {len(alerts)} alerts.")
    
    print("\nStep 3: Checking correlated campaigns...")
    campaigns = make_request(f"{API_BASE}/campaigns")
    if not campaigns:
        print("FAIL: Campaigns list is empty.")
        return
    
    sharma_campaign = next((c for c in campaigns if c["username"] == "dr_sharma"), None)
    if not sharma_campaign:
        print("FAIL: Dr. Sharma's attack campaign was not correlated.")
        return
    
    print(f"SUCCESS: Correlated Campaign: {sharma_campaign['campaign_id']} for User: {sharma_campaign['username']}")
    print(f"Severity: {sharma_campaign['severity']}, Status: {sharma_campaign['status']}")
    print(f"Stages detected: {len(sharma_campaign['stages'])} / 4")
    for stage in sharma_campaign['stages']:
        print(f" - Stage {stage['stage_id']}: {stage['mitre_id']} ({stage['mitre_name']})")
        
    print("\nStep 4: Fetching SOAR audit logs...")
    logs = make_request(f"{API_BASE}/audit-log")
    if not logs:
        print("FAIL: Audit logs empty.")
        return
        
    print("SUCCESS: Found following actions in the playbook logs:")
    pending_actions = []
    for log in logs:
        print(f" - ACT-{log['id']}: {log['action_name']} -> Status: {log['status']} (Target: {log['target']})")
        if log['status'] == 'Pending Approval':
            pending_actions.append(log)
            
    if not pending_actions:
        print("FAIL: No pending approval actions found in logs.")
        return
        
    action_to_approve = pending_actions[0]
    print(f"\nStep 5: Simulating human approval for ACT-{action_to_approve['id']} ({action_to_approve['action_name']})...")
    approve_res = make_request(f"{API_BASE}/actions/{action_to_approve['id']}/approve", method="POST")
    if not approve_res or approve_res.get("status") != "success":
        print(f"FAIL: Failed to approve action ACT-{action_to_approve['id']}.")
        return
    print(f"SUCCESS: Approved response: {approve_res['message']}")
    
    print("\nStep 6: Verifying audit logs updated...")
    updated_logs = make_request(f"{API_BASE}/audit-log")
    verified_action = next((l for l in updated_logs if l["id"] == action_to_approve["id"]), None)
    if not verified_action or verified_action["status"] != "Executed":
        print(f"FAIL: Action status did not transition to Executed. Current: {verified_action['status'] if verified_action else 'None'}")
        return
    print(f"SUCCESS: Verified action ACT-{verified_action['id']} is now: {verified_action['status']}")
    
    print("\nStep 7: Validating CERT-In incident report generator...")
    cert_report = make_request(f"{API_BASE}/report/cert-in")
    if not cert_report:
        print("FAIL: CERT-In report is empty.")
        return
    print(f"SUCCESS: CERT-In Incident Ref: {cert_report.get('cert_in_ref')}")
    print(f"Type: {cert_report.get('incident_type')}")
    print(f"Timeline - Initial Access: {cert_report['timeline']['initial_access']}")
    print(f"Timeline - Exfiltration: {cert_report['timeline']['exfiltration_time']}")
    print("ALL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_pipeline()
