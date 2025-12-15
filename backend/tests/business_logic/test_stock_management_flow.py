"""
Business Logic Tests: Stock Management Flow
Tests complete stock lifecycle including automatic deductions
"""
import pytest
from decimal import Decimal


class TestStockManagementFlow:
    """
    Test Flow 2: Stock Management Flow
    Stock Creation → Order Item DONE → Stock Deduction → Out-of-Stock Tracking
    """
    
    def test_stock_deduction_on_order_completion(self, client, test_db, full_order_setup):
        """
        Test: Stock automatically deducts when order item marked DONE
        
        Steps:
        1. Check initial stock amount
        2. Create order with item
        3. Mark item as DONE
        4. Verify stock reduced by (quantity * qty_per_unit)
        5. Verify stock movement created
        """
        setup = full_order_setup
        
        # Step 1: Check initial stock
        initial_stock = float(setup["stock"].amount_remaining)
        qty_per_unit = float(setup["recipe"].qty_per_unit)
        
        # Step 2: Create order with 5 items
        quantity = 5
        order_response = client.post("/api/orders/", json={
            "branch_id": setup["branch"].branch_id,
            "employee_id": setup["employee"].employee_id,
            "order_type": "DINE_IN",
            "status": "UNPAID",
            "order_items": [
                {
                    "menu_item_id": setup["menu_item"].menu_item_id,
                    "quantity": quantity,
                    "status": "ORDERED"
                }
            ]
        })
        order_data = order_response.json()
        item_id = order_data["order_items"][0]["order_item_id"]
        
        # Step 3: Mark as PREPARING first (triggers stock deduction), then DONE
        preparing_response = client.put(f"/api/order-items/{item_id}/status", json={
            "status": "PREPARING"
        })
        assert preparing_response.status_code == 200
        
        done_response = client.put(f"/api/order-items/{item_id}/status", json={
            "status": "DONE"
        })
        assert done_response.status_code == 200
        
        # Step 4: Verify stock reduced
        expected_deduction = qty_per_unit * quantity  # 0.2 * 5 = 1.0 kg
        expected_remaining = initial_stock - expected_deduction
        
        test_db.refresh(setup["stock"])
        actual_remaining = float(setup["stock"].amount_remaining)
        assert abs(actual_remaining - expected_remaining) < 0.001  # Float comparison
        
        # Step 5: Verify stock movement created
        movements_response = client.get("/api/stock/movements")
        movements = movements_response.json()
        
        # Find the SALE movement for this item
        sale_movement = next(
            (m for m in movements if m["reason"] == "SALE" 
             and m["stock_id"] == setup["stock"].stock_id),
            None
        )
        assert sale_movement is not None
        assert abs(float(sale_movement["qty_change"]) + expected_deduction) < 0.001
    
    def test_stock_restock_flow(self, client, test_db, sample_stock, sample_employee):
        """
        Test: Manual stock restock via stock movements
        
        Steps:
        1. Record initial stock
        2. Create RESTOCK movement
        3. Verify stock increased
        """
        initial_stock = float(sample_stock.amount_remaining)
        restock_amount = 25.0
        
        # Step 2: Create RESTOCK movement
        response = client.post("/api/stock/movements", json={
            "stock_id": sample_stock.stock_id,
            "employee_id": sample_employee.employee_id,
            "reason": "RESTOCK",
            "qty_change": restock_amount,
            "note": "รับของเข้าจากคลัง"
        })
        assert response.status_code == 201
        
        # Step 3: Verify stock increased
        test_db.refresh(sample_stock)
        expected_stock = initial_stock + restock_amount
        assert abs(float(sample_stock.amount_remaining) - expected_stock) < 0.001
    
    def test_stock_waste_tracking(self, client, test_db, sample_stock, sample_employee):
        """
        Test: Track stock waste (expired, damaged items)
        
        Steps:
        1. Record initial stock
        2. Create WASTE movement
        3. Verify stock decreased
        """
        initial_stock = float(sample_stock.amount_remaining)
        waste_amount = 2.0
        
        # Step 2: Record waste
        response = client.post("/api/stock/movements", json={
            "stock_id": sample_stock.stock_id,
            "employee_id": sample_employee.employee_id,
            "reason": "WASTE",
            "qty_change": -waste_amount,
            "note": "วัตถุดิบหมดอายุ"
        })
        assert response.status_code == 201
        
        # Step 3: Verify stock decreased
        test_db.refresh(sample_stock)
        expected_stock = initial_stock - waste_amount
        assert abs(float(sample_stock.amount_remaining) - expected_stock) < 0.001
    
    def test_out_of_stock_detection(self, client, test_db, full_order_setup):
        """
        Test: System detects out-of-stock items
        
        Steps:
        1. Set stock to low amount
        2. Create order that depletes stock
        3. Mark as DONE (stock becomes 0)
        4. Verify item appears in out-of-stock list
        """
        setup = full_order_setup
        
        # Step 1: Set stock to exactly match order requirement
        qty_per_unit = float(setup["recipe"].qty_per_unit)
        order_quantity = 10
        exact_stock = qty_per_unit * order_quantity  # e.g., 0.2 * 10 = 2.0 kg
        
        setup["stock"].amount_remaining = exact_stock
        test_db.commit()
        
        # Step 2: Create order
        order_response = client.post("/api/orders/", json={
            "branch_id": setup["branch"].branch_id,
            "employee_id": setup["employee"].employee_id,
            "order_type": "DINE_IN",
            "status": "UNPAID",
            "order_items": [
                {
                    "menu_item_id": setup["menu_item"].menu_item_id,
                    "quantity": order_quantity,
                    "status": "ORDERED"
                }
            ]
        })
        item_id = order_response.json()["order_items"][0]["order_item_id"]
        
        # Step 3: Mark as PREPARING (depletes stock to 0), then DONE
        client.put(f"/api/order-items/{item_id}/status", json={"status": "PREPARING"})
        client.put(f"/api/order-items/{item_id}/status", json={"status": "DONE"})
        
        # Step 4: Verify appears in out-of-stock list
        oos_response = client.get("/api/stock/out-of-stock")
        assert oos_response.status_code == 200
        oos_items = oos_response.json()
        
        assert any(
            item["stock_id"] == setup["stock"].stock_id 
            for item in oos_items
        )
        
        # Check out-of-stock count
        count_response = client.get("/api/stock/out-of-stock/count")
        assert count_response.json()["count"] >= 1
    
    def test_insufficient_stock_handling(self, client, test_db, full_order_setup):
        """
        Test: System handles insufficient stock gracefully
        
        Steps:
        1. Set stock to low amount
        2. Create order exceeding stock
        3. Try to mark as DONE
        4. Verify appropriate error/warning
        """
        setup = full_order_setup
        
        # Step 1: Set stock to insufficient amount
        setup["stock"].amount_remaining = 0.5  # Only 0.5 kg available
        test_db.commit()
        
        # Step 2: Create order requiring 2.0 kg (10 items * 0.2 kg)
        order_response = client.post("/api/orders/", json={
            "branch_id": setup["branch"].branch_id,
            "employee_id": setup["employee"].employee_id,
            "order_type": "DINE_IN",
            "status": "UNPAID",
            "order_items": [
                {
                    "menu_item_id": setup["menu_item"].menu_item_id,
                    "quantity": 10,
                    "status": "ORDERED"
                }
            ]
        })
        item_id = order_response.json()["order_items"][0]["order_item_id"]
        
        # Step 3: Try to mark as PREPARING (this triggers stock check)
        preparing_response = client.put(f"/api/order-items/{item_id}/status", json={
            "status": "PREPARING"
        })
        
        # System should reject due to insufficient stock
        assert preparing_response.status_code == 400
        error_detail = preparing_response.json()["detail"]
        
        # Verify error message indicates insufficient stock
        if isinstance(error_detail, dict):
            assert "insufficient" in error_detail.get("message", "").lower()
            assert "insufficient_ingredients" in error_detail
        else:
            assert "insufficient" in error_detail.lower()
    
    def test_stock_adjustment_flow(self, client, test_db, sample_stock, sample_employee):
        """
        Test: Manual stock adjustment (inventory count correction)
        
        Steps:
        1. Record initial stock
        2. Perform stock count (found discrepancy)
        3. Create ADJUST movement
        4. Verify stock corrected
        """
        # Step 1: Initial stock
        sample_stock.amount_remaining = 10.0
        test_db.commit()
        
        # Step 2: Physical count shows only 8.5 kg (difference: -1.5)
        actual_count = 8.5
        adjustment = actual_count - 10.0  # -1.5
        
        # Step 3: Create adjustment
        response = client.post("/api/stock/movements", json={
            "stock_id": sample_stock.stock_id,
            "employee_id": sample_employee.employee_id,
            "reason": "ADJUST",
            "qty_change": adjustment,
            "note": "ตรวจนับสต็อกพบส่วนต่าง"
        })
        assert response.status_code == 201
        
        # Step 4: Verify corrected
        test_db.refresh(sample_stock)
        assert abs(float(sample_stock.amount_remaining) - actual_count) < 0.001
    
    def test_stock_movements_history_tracking(self, client, sample_stock, sample_employee):
        """
        Test: All stock movements are tracked in history
        
        Steps:
        1. Create multiple movements
        2. Query movement history
        3. Verify all movements recorded with correct details
        """
        # Step 1: Create various movements
        movements_data = [
            {"reason": "RESTOCK", "qty_change": 50.0, "note": "รับของเข้า"},
            {"reason": "WASTE", "qty_change": -2.0, "note": "วัตถุดิบเสีย"},
            {"reason": "ADJUST", "qty_change": -1.0, "note": "ปรับยอด"}
        ]
        
        for movement in movements_data:
            client.post("/api/stock/movements", json={
                "stock_id": sample_stock.stock_id,
                "employee_id": sample_employee.employee_id,
                "reason": movement["reason"],
                "qty_change": movement["qty_change"],
                "note": movement["note"]
            })
        
        # Step 2: Query history
        history_response = client.get(f"/api/stock/movements?stock_id={sample_stock.stock_id}")
        assert history_response.status_code == 200
        history = history_response.json()
        
        # Step 3: Verify all movements present
        assert len(history) >= len(movements_data)
        
        # Verify each movement type is recorded
        recorded_types = {m["reason"] for m in history}
        for movement in movements_data:
            assert movement["reason"] in recorded_types



