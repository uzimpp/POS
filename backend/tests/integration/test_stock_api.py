"""
Integration tests for Stock API endpoints
"""
import pytest


class TestStockAPI:
    """Test /api/stock endpoints"""
    
    def test_get_stock_items_empty(self, client):
        """Test: GET /api/stock returns empty list when no stock exists"""
        response = client.get("/api/stock/")
        assert response.status_code == 200
        assert response.json() == []
    
    def test_create_stock_item(self, client, sample_branch, sample_ingredient):
        """Test: POST /api/stock creates stock entry"""
        response = client.post("/api/stock/", json={
            "branch_id": sample_branch.branch_id,
            "ingredient_id": sample_ingredient.ingredient_id,
            "amount_remaining": 50.0
        })
        
        assert response.status_code == 201
        data = response.json()
        assert data["branch_id"] == sample_branch.branch_id
        assert data["ingredient_id"] == sample_ingredient.ingredient_id
        assert float(data["amount_remaining"]) == 50.0
    
    def test_get_stock_items(self, client, sample_stock):
        """Test: GET /api/stock returns list of stock items"""
        response = client.get("/api/stock/")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert any(item["stock_id"] == sample_stock.stock_id for item in data)
    
    def test_filter_stock_by_branch(self, client, sample_stock):
        """Test: GET /api/stock/?branch_ids=[id] filters by branch"""
        response = client.get(f"/api/stock/?branch_ids={sample_stock.branch_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert all(item["branch_id"] == sample_stock.branch_id for item in data)
    
    def test_get_out_of_stock_items(self, client, test_db, sample_stock):
        """Test: GET /api/stock/out-of-stock returns items with 0 stock"""
        # Set stock to 0
        sample_stock.amount_remaining = 0.0
        test_db.commit()
        
        response = client.get("/api/stock/out-of-stock")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert all(float(item["amount_remaining"]) == 0.0 for item in data)
    
    def test_get_out_of_stock_count(self, client, test_db, sample_stock):
        """Test: GET /api/stock/out-of-stock/count returns correct count"""
        # Set stock to 0
        sample_stock.amount_remaining = 0.0
        test_db.commit()
        
        response = client.get("/api/stock/out-of-stock/count")
        
        assert response.status_code == 200
        data = response.json()
        assert data["count"] >= 1
        assert data["out_of_stock_count"] >= 1
    
    def test_update_stock_item(self, client, sample_stock):
        """Test: PUT /api/stock/{id} updates stock"""
        new_amount = 75.0
        
        response = client.put(f"/api/stock/{sample_stock.stock_id}", json={
            "branch_id": sample_stock.branch_id,
            "ingredient_id": sample_stock.ingredient_id,
            "amount_remaining": new_amount
        })
        
        assert response.status_code == 200
        data = response.json()
        assert float(data["amount_remaining"]) == new_amount
    
    def test_cannot_create_stock_for_deleted_ingredient(self, client, test_db, 
                                                         sample_branch, sample_ingredient):
        """Test: Cannot create stock for deleted ingredient"""
        sample_ingredient.is_deleted = True
        test_db.commit()
        
        response = client.post("/api/stock/", json={
            "branch_id": sample_branch.branch_id,
            "ingredient_id": sample_ingredient.ingredient_id,
            "amount_remaining": 10.0
        })
        
        assert response.status_code == 400
        assert "Cannot create stock for a deleted ingredient" in response.json()["detail"]
    
    def test_soft_delete_stock(self, client, test_db, sample_stock):
        """Test: DELETE /api/stock/{id} soft deletes stock"""
        response = client.delete(f"/api/stock/{sample_stock.stock_id}")
        
        assert response.status_code == 200
        
        # Verify soft delete
        test_db.refresh(sample_stock)
        assert sample_stock.is_deleted == True
    
    def test_deleted_stock_not_in_default_list(self, client, test_db, sample_stock):
        """Test: Deleted stock items don't appear in default GET request"""
        # Soft delete the stock
        sample_stock.is_deleted = True
        test_db.commit()
        
        response = client.get("/api/stock/")
        
        assert response.status_code == 200
        data = response.json()
        # Should not include deleted stock
        assert not any(item["stock_id"] == sample_stock.stock_id for item in data)


class TestStockMovements:
    """Test stock movements tracking"""
    
    def test_get_stock_movements_empty(self, client):
        """Test: GET /api/stock/movements returns empty list"""
        response = client.get("/api/stock/movements")
        assert response.status_code == 200
        assert response.json() == []
    
    def test_create_stock_movement(self, client, sample_stock, sample_employee):
        """Test: POST /api/stock/movements creates movement record"""
        response = client.post("/api/stock/movements", json={
            "stock_id": sample_stock.stock_id,
            "employee_id": sample_employee.employee_id,
            "reason": "RESTOCK",
            "qty_change": 20.0,
            "note": "รับของเข้าใหม่"
        })
        
        assert response.status_code == 201
        data = response.json()
        assert data["reason"] == "RESTOCK"
        assert float(data["qty_change"]) == 20.0
        assert data["note"] == "รับของเข้าใหม่"
    
    def test_filter_movements_by_type(self, client, sample_stock, sample_employee):
        """Test: GET /api/stock/movements?reason=RESTOCK filters movements"""
        # Create a RESTOCK movement
        client.post("/api/stock/movements", json={
            "stock_id": sample_stock.stock_id,
            "employee_id": sample_employee.employee_id,
            "reason": "RESTOCK",
            "qty_change": 10.0
        })
        
        response = client.get("/api/stock/movements?reason=RESTOCK")
        
        assert response.status_code == 200
        data = response.json()
        assert all(item["reason"] == "RESTOCK" for item in data)



