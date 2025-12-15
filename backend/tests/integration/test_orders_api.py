"""
Integration tests for Orders API endpoints
"""
import pytest
from decimal import Decimal


class TestOrdersAPI:
    """Test /api/orders endpoints"""
    
    def test_get_orders_empty_list(self, client):
        """Test: GET /api/orders returns empty list when no orders exist"""
        response = client.get("/api/orders/")
        assert response.status_code == 200
        assert response.json() == []
    
    def test_create_empty_order(self, client, sample_branch, sample_employee):
        """Test: POST /api/orders/empty creates an empty order"""
        response = client.post("/api/orders/empty", json={
            "branch_id": sample_branch.branch_id,
            "employee_id": sample_employee.employee_id,
            "order_type": "DINE_IN"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "UNPAID"
        assert data["order_type"] == "DINE_IN"
        assert float(data["total_price"]) == 0.0
        assert data["branch_id"] == sample_branch.branch_id
        assert data["employee_id"] == sample_employee.employee_id
    
    def test_create_empty_order_with_invalid_branch(self, client, sample_employee):
        """Test: POST /api/orders/empty fails with non-existent branch"""
        response = client.post("/api/orders/empty", json={
            "branch_id": 9999,  # Non-existent
            "employee_id": sample_employee.employee_id,
            "order_type": "DINE_IN"
        })
        
        assert response.status_code == 404
        assert "Branch not found" in response.json()["detail"]
    
    def test_create_empty_order_with_invalid_employee(self, client, sample_branch):
        """Test: POST /api/orders/empty fails with non-existent employee"""
        response = client.post("/api/orders/empty", json={
            "branch_id": sample_branch.branch_id,
            "employee_id": 9999,  # Non-existent
            "order_type": "DINE_IN"
        })
        
        assert response.status_code == 404
        assert "Employee not found" in response.json()["detail"]
    
    def test_create_order_with_items(self, client, full_order_setup):
        """Test: POST /api/orders creates order with items"""
        setup = full_order_setup
        
        response = client.post("/api/orders/", json={
            "branch_id": setup["branch"].branch_id,
            "employee_id": setup["employee"].employee_id,
            "order_type": "TAKEAWAY",
            "status": "UNPAID",
            "order_items": [
                {
                    "menu_item_id": setup["menu_item"].menu_item_id,
                    "quantity": 2,
                    "status": "ORDERED"
                }
            ]
        })
        
        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "UNPAID"
        assert data["order_type"] == "TAKEAWAY"
        assert len(data["order_items"]) == 1
        # Total = 2 * 120.00 = 240.00
        assert float(data["total_price"]) == 240.00
    
    def test_get_order_by_id(self, client, sample_order):
        """Test: GET /api/orders/{id} returns specific order"""
        response = client.get(f"/api/orders/{sample_order.order_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["order_id"] == sample_order.order_id
        assert data["status"] == sample_order.status
    
    def test_get_order_not_found(self, client):
        """Test: GET /api/orders/{id} returns 404 for non-existent order"""
        response = client.get("/api/orders/9999")
        
        assert response.status_code == 404
        assert "Order not found" in response.json()["detail"]
    
    def test_cancel_order(self, client, sample_order, sample_order_item):
        """Test: PUT /api/orders/{id}/cancel cancels an UNPAID order"""
        # Ensure order has ORDERED items (not PREPARING or DONE)
        assert sample_order.status == "UNPAID"
        assert sample_order_item.status == "ORDERED"
        
        response = client.put(f"/api/orders/{sample_order.order_id}/cancel")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "CANCELLED"
        assert float(data["total_price"]) == 0.0
    
    def test_cannot_cancel_paid_order(self, client, test_db, sample_order):
        """Test: Cannot cancel a PAID order"""
        # Mark order as PAID
        sample_order.status = "PAID"
        test_db.commit()
        
        response = client.put(f"/api/orders/{sample_order.order_id}/cancel")
        
        assert response.status_code == 400
        assert "Cannot cancel a paid order" in response.json()["detail"]
    
    def test_filter_orders_by_status(self, client, sample_order):
        """Test: GET /api/orders/?status=UNPAID filters orders"""
        response = client.get("/api/orders/?status=UNPAID")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert all(order["status"] == "UNPAID" for order in data)
    
    def test_filter_orders_by_order_type(self, client, sample_order):
        """Test: GET /api/orders/?order_type=DINE_IN filters orders"""
        response = client.get(f"/api/orders/?order_type={sample_order.order_type}")
        
        assert response.status_code == 200
        data = response.json()
        assert all(order["order_type"] == sample_order.order_type for order in data)


class TestOrdersBusinessRules:
    """Test business rules enforcement in Orders API"""
    
    def test_cannot_update_paid_order(self, client, test_db, full_order_setup, sample_order):
        """Test: Cannot update a PAID order"""
        setup = full_order_setup
        
        # Mark order as PAID
        sample_order.status = "PAID"
        test_db.commit()
        
        response = client.put(f"/api/orders/{sample_order.order_id}", json={
            "branch_id": setup["branch"].branch_id,
            "employee_id": setup["employee"].employee_id,
            "order_type": "DINE_IN",
            "status": "UNPAID",
            "order_items": []
        })
        
        assert response.status_code == 400
        assert "Cannot update a paid order" in response.json()["detail"]
    
    def test_cannot_order_unavailable_menu_item(self, client, test_db, full_order_setup):
        """Test: Cannot create order with unavailable menu item"""
        setup = full_order_setup
        
        # Mark menu item as unavailable
        setup["menu_item"].is_available = False
        test_db.commit()
        
        response = client.post("/api/orders/", json={
            "branch_id": setup["branch"].branch_id,
            "employee_id": setup["employee"].employee_id,
            "order_type": "DINE_IN",
            "status": "UNPAID",
            "order_items": [
                {
                    "menu_item_id": setup["menu_item"].menu_item_id,
                    "quantity": 1,
                    "status": "ORDERED"
                }
            ]
        })
        
        assert response.status_code == 400
        assert "is not available" in response.json()["detail"]



