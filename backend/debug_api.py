import requests
import json

BASE_URL = "http://localhost:8000/api/analytics"

endpoints = [
    "/order-stats",
    "/order-trend?period=today&split_by=none",
    "/channel-mix?period=today",
    "/ticket-size?period=today",
    "/basket-size?period=today",
    "/top-branches-volume?period=today"
]

def probe():
    print("Probing API endpoints...")
    for ep in endpoints:
        url = BASE_URL + ep
        try:
            print(f"GET {url}")
            res = requests.get(url)
            print(f"Status: {res.status_code}")
            if res.status_code != 200:
                print(f"Error: {res.text}")
            else:
                print("OK")
        except Exception as e:
            print(f"Request failed: {e}")
        print("-" * 20)

if __name__ == "__main__":
    probe()
