"""
Integration tests for Menu API endpoints
"""
import pytest


class TestMenuAPI:
    """Test /api/menu endpoints"""
    
    def test_get_menu_items_empty(self, client):
        """Test: GET /api/menu returns empty list when no menu items exist"""
        response = client.get("/api/menu/")
        assert response.status_code == 200
        assert response.json() == []
    
    def test_create_menu_item(self, client):
        """Test: POST /api/menu creates menu item"""
        response = client.post("/api/menu/", json={
            "name": "ข้าวผัดกุ้ง",
            "type": "FOOD",
            "category": "อาหารจานหลัก",
            "price": 100.0,
            "is_available": True
        })
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "ข้าวผัดกุ้ง"
        assert data["category"] == "อาหารจานหลัก"
        assert float(data["price"]) == 100.0
        assert data["is_available"] == True
    
    def test_get_menu_item_by_id(self, client, sample_menu_item):
        """Test: GET /api/menu/{id} returns specific menu item"""
        response = client.get(f"/api/menu/{sample_menu_item.menu_item_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["menu_item_id"] == sample_menu_item.menu_item_id
        assert data["name"] == sample_menu_item.name
    
    def test_update_menu_item(self, client, sample_menu_item):
        """Test: PUT /api/menu/{id} updates menu item"""
        new_price = 150.0
        
        response = client.put(f"/api/menu/{sample_menu_item.menu_item_id}", json={
            "name": sample_menu_item.name,
            "type": sample_menu_item.type,
            "category": sample_menu_item.category,
            "price": new_price,
            "is_available": True
        })
        
        assert response.status_code == 200
        data = response.json()
        assert float(data["price"]) == new_price
    
    def test_filter_menu_by_category(self, client):
        """Test: GET /api/menu/?category=X filters menu items"""
        # Create items in different categories
        client.post("/api/menu/", json={
            "name": "ข้าวผัด",
            "type": "FOOD",
            "category": "อาหาร",
            "price": 50.0,
            "is_available": True
        })
        
        client.post("/api/menu/", json={
            "name": "น้ำส้ม",
            "type": "DRINK",
            "category": "เครื่องดื่ม",
            "price": 30.0,
            "is_available": True
        })
        
        # Filter by category
        response = client.get("/api/menu/?category=อาหาร")
        assert response.status_code == 200
        data = response.json()
        
        assert all(item["category"] == "อาหาร" for item in data)
    
    def test_filter_menu_by_availability(self, client, test_db, sample_menu_item):
        """Test: GET /api/menu/?available_only=true filters available items"""
        # Make sample item unavailable
        sample_menu_item.is_available = False
        test_db.commit()
        
        # Create available item
        client.post("/api/menu/", json={
            "name": "Available Item",
            "type": "FOOD",
            "category": "Test",
            "price": 100.0,
            "is_available": True
        })
        
        # Filter available only (API uses 'available_only' parameter)
        response = client.get("/api/menu/?available_only=true")
        assert response.status_code == 200
        data = response.json()
        
        assert all(item["is_available"] == True for item in data)
        assert sample_menu_item.menu_item_id not in [item["menu_item_id"] for item in data]




