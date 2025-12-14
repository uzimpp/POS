import requests

def check_endpoint(url, name):
    try:
        response = requests.get(url)
        if response.status_code == 200:
            print(f"✅ {name}: OK (200)")
            try:
                data = response.json()
                print(f"   Data: {data}")
            except:
                print("   Data: Not JSON")
        else:
            print(f"❌ {name}: Failed ({response.status_code})")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ {name}: Exception: {e}")

if __name__ == "__main__":
    base_url = "http://localhost:8000/api"
    
    print("Checking API Endpoints...")
    print("=" * 50)
    
    check_endpoint(f"{base_url}/branches/", "Branches")
    check_endpoint(f"{base_url}/employees/", "Employees")
    check_endpoint(f"{base_url}/roles/", "Roles")
    check_endpoint(f"{base_url}/memberships/", "Memberships")
    check_endpoint(f"{base_url}/stock/", "Stock")
    check_endpoint(f"{base_url}/orders/", "Orders")
    check_endpoint(f"{base_url}/menu-items/", "Menu Items")
    
    print("=" * 50)
