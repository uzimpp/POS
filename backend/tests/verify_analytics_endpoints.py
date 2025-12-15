import requests
import sys

BASE_URL = "http://localhost:8000/api/analytics"

endpoints = [
    "/employee-stats",
    "/top-sales-employees",
    "/top-waste-employees",
    "/efficiency-matrix",
    "/tenure-distribution",
    "/employees-by-branch",
    "/employees-by-role",
    "/inventory-stats",
    "/inventory-levels",
    "/inventory-activity",
    "/inventory-flow",
    "/waste-trend"
]

failed = False

print("Verifying Analytics Endpoints...")
for ep in endpoints:
    try:
        url = f"{BASE_URL}{ep}"
        res = requests.get(url)
        if res.status_code == 200:
            print(f"[OK] {ep}")
        else:
            print(f"[FAIL] {ep} - Status: {res.status_code}")
            print(res.text)
            failed = True
    except Exception as e:
        print(f"[ERROR] {ep} - {e}")
        failed = True

if failed:
    sys.exit(1)
else:
    print("All endpoints reachable.")
