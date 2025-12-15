import requests
import sys

BASE_URL = "http://localhost:8000/api"

endpoints = [
    ("/dashboard/sales-chart", "period=all"),
    ("/dashboard/top-branches", "period=all"),
    ("/dashboard/membership-ratio", "period=all"),
    ("/dashboard/top-items", "period=all"),
    ("/analytics/order-trend", "period=all"),
    ("/analytics/acquisition-growth", "period=all"),
    ("/analytics/payment-stats", "period=all"),
    ("/analytics/payment-method-share", "period=all"),
    ("/analytics/efficiency-matrix", "period=all"),
    ("/analytics/basket-size", "period=all"),
    ("/analytics/top-branches-volume", "period=all"),
    ("/analytics/ticket-size", "period=all"),
]

failed = False

print("Verifying 'period=all' on Endpoints...")
for ep, params in endpoints:
    try:
        url = f"{BASE_URL}{ep}?{params}"
        res = requests.get(url)
        if res.status_code == 200:
            # Basic content check logic could go here, e.g. checking if empty or not
            # But 200 OK confirms the 'all' param didn't crash the server (regex passed, logic ran)
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
    print("All endpoints handled 'period=all' successfully.")
