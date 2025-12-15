import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_analytics_endpoints():
    endpoints = [
        "/api/analytics/order-stats",
        "/api/analytics/order-trend?period=today",
        "/api/analytics/channel-mix?period=today",
        "/api/analytics/ticket-size?period=today",
        "/api/analytics/basket-size?period=today",
        "/api/analytics/top-branches-volume?period=today"
    ]

    for endpoint in endpoints:
        print(f"Testing {endpoint}...")
        response = client.get(endpoint)
        if response.status_code != 200:
            print(f"FAILED {endpoint}: {response.status_code}")
            print(response.json())
        else:
            print(f"PASSED {endpoint}")
            # print(response.json())

if __name__ == "__main__":
    test_analytics_endpoints()
