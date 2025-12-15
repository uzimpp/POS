"""
Business Logic Tests: Branch Management Flow
Tests multi-branch operations, employee assignment, and isolation
"""
import pytest
from decimal import Decimal


class TestBranchManagementFlow:
    """
    Test Flow 5: Branch Management Flow
    Branch Creation → Employee Assignment → Stock Isolation → Order Isolation
    """
    
    def test_branch_creation_flow(self, client):
        """
        Test: Create new branch
        
        Steps:
        1. Create branch with details
        2. Verify branch is active
        3. Verify branch can be retrieved
        """
        # Step 1: Create branch
        response = client.post("/api/branches/", json={
            "name": "สาขาเซ็นทรัลเวิลด์",
            "address": "999/9 ถนนพระราม 1 เขตปทุมวัน กรุงเทพฯ 10330",
            "phone": "021234567"
        })
        
        assert response.status_code == 201
        data = response.json()
        branch_id = data["branch_id"]
        
        # Step 2: Verify active
        assert data["is_deleted"] == False
        
        # Step 3: Retrieve branch
        get_response = client.get(f"/api/branches/{branch_id}")
        assert get_response.status_code == 200
        assert get_response.json()["name"] == "สาขาเซ็นทรัลเวิลด์"
    
    def test_employee_branch_assignment(self, client, sample_branch, sample_role):
        """
        Test: Assign employee to branch
        
        Steps:
        1. Create employee for branch
        2. Verify employee belongs to branch
        3. Try to create order with employee at different branch (should fail)
        """
        # Step 1: Create employee
        employee_response = client.post("/api/employees/", json={
            "branch_id": sample_branch.branch_id,
            "role_id": sample_role.role_id,
            "first_name": "สมศรี",
            "last_name": "ทดสอบ",
            "salary": 18000
        })
        assert employee_response.status_code == 201
        employee_data = employee_response.json()
        
        # Step 2: Verify branch assignment
        assert employee_data["branch_id"] == sample_branch.branch_id
        
        # Step 3: Create another branch
        branch2_response = client.post("/api/branches/", json={
            "name": "สาขาสยาม",
            "address": "123 ถนนพระราม 1",
            "phone": "021111111"
        })
        branch2_id = branch2_response.json()["branch_id"]
        
        # Try to create order with employee at wrong branch
        order_response = client.post("/api/orders/empty", json={
            "branch_id": branch2_id,  # Different branch
            "employee_id": employee_data["employee_id"],
            "order_type": "DINE_IN"
        })
        
        assert order_response.status_code == 400
        assert "does not belong to" in order_response.json()["detail"]
    
    def test_stock_isolation_per_branch(self, client, test_db, sample_ingredient):
        """
        Test: Each branch has separate stock inventory
        
        Steps:
        1. Create 2 branches
        2. Create stock for same ingredient at both branches
        3. Deplete stock at branch 1
        4. Verify branch 2 stock unchanged
        """
        # Step 1: Create 2 branches
        branch1_response = client.post("/api/branches/", json={
            "name": "สาขา 1",
            "address": "111 ถนนสุขุมวิท",
            "phone": "021111111"
        })
        branch1_id = branch1_response.json()["branch_id"]
        
        branch2_response = client.post("/api/branches/", json={
            "name": "สาขา 2",
            "address": "222 ถนนพระราม 4",
            "phone": "022222222"
        })
        branch2_id = branch2_response.json()["branch_id"]
        
        # Step 2: Create stock at both branches
        stock1_response = client.post("/api/stock/", json={
            "branch_id": branch1_id,
            "ingredient_id": sample_ingredient.ingredient_id,
            "amount_remaining": 100.0
        })
        stock1_id = stock1_response.json()["stock_id"]
        
        stock2_response = client.post("/api/stock/", json={
            "branch_id": branch2_id,
            "ingredient_id": sample_ingredient.ingredient_id,
            "amount_remaining": 100.0
        })
        stock2_id = stock2_response.json()["stock_id"]
        
        # Step 3: Deplete stock at branch 1
        client.put(f"/api/stock/{stock1_id}", json={
            "branch_id": branch1_id,
            "ingredient_id": sample_ingredient.ingredient_id,
            "amount_remaining": 0.0
        })
        
        # Step 4: Verify branch 2 unchanged
        stock2_check = client.get(f"/api/stock/?branch_ids={branch2_id}")
        stock2_data = stock2_check.json()
        
        branch2_stock = next(
            (s for s in stock2_data if s["stock_id"] == stock2_id), 
            None
        )
        assert branch2_stock is not None
        assert float(branch2_stock["amount_remaining"]) == 100.0
    
    def test_order_filtering_by_branch(self, client, test_db):
        """
        Test: Orders can be filtered by branch
        
        Steps:
        1. Create 2 branches with employees
        2. Create orders at each branch
        3. Query orders by branch_id
        4. Verify only that branch's orders returned
        """
        from app.models import Branches, Roles, Employees
        
        # Step 1: Create branches and employees
        branch1 = Branches(name="สาขา A", address="111", phone="021111111")
        branch2 = Branches(name="สาขา B", address="222", phone="022222222")
        test_db.add(branch1)
        test_db.add(branch2)
        test_db.commit()
        
        role = Roles(role_name="Cashier", seniority=1)
        test_db.add(role)
        test_db.commit()
        
        emp1 = Employees(
            branch_id=branch1.branch_id, 
            role_id=role.role_id,
            first_name="พนักงาน", 
            last_name="A",
            salary=18000
        )
        emp2 = Employees(
            branch_id=branch2.branch_id,
            role_id=role.role_id,
            first_name="พนักงาน",
            last_name="B",
            salary=18000
        )
        test_db.add(emp1)
        test_db.add(emp2)
        test_db.commit()
        
        # Step 2: Create orders
        order1 = client.post("/api/orders/empty", json={
            "branch_id": branch1.branch_id,
            "employee_id": emp1.employee_id,
            "order_type": "DINE_IN"
        })
        order1_id = order1.json()["order_id"]
        
        order2 = client.post("/api/orders/empty", json={
            "branch_id": branch2.branch_id,
            "employee_id": emp2.employee_id,
            "order_type": "DINE_IN"
        })
        order2_id = order2.json()["order_id"]
        
        # Step 3 & 4: Query by branch (would need branch filter in API)
        all_orders = client.get("/api/orders/")
        orders_data = all_orders.json()
        
        branch1_orders = [o for o in orders_data if o["branch_id"] == branch1.branch_id]
        branch2_orders = [o for o in orders_data if o["branch_id"] == branch2.branch_id]
        
        assert any(o["order_id"] == order1_id for o in branch1_orders)
        assert any(o["order_id"] == order2_id for o in branch2_orders)
    
    def test_branch_soft_delete_flow(self, client, test_db, sample_branch, sample_employee):
        """
        Test: Soft delete branch deactivates employees
        
        Steps:
        1. Create branch with employee
        2. Soft delete branch
        3. Verify branch is_deleted = True
        4. Verify employee is_deleted = True
        5. Verify cannot create new orders at deleted branch
        """
        # Step 1: Branch and employee already exist
        assert sample_branch.is_deleted == False
        assert sample_employee.is_deleted == False
        
        # Step 2: Soft delete branch
        delete_response = client.delete(f"/api/branches/{sample_branch.branch_id}")
        assert delete_response.status_code == 200
        
        # Step 3: Verify branch deleted
        test_db.refresh(sample_branch)
        assert sample_branch.is_deleted == True
        
        # Step 4: Verify employee deactivated
        test_db.refresh(sample_employee)
        assert sample_employee.is_deleted == True
        
        # Step 5: Try to create order (should fail)
        order_response = client.post("/api/orders/empty", json={
            "branch_id": sample_branch.branch_id,
            "employee_id": sample_employee.employee_id,
            "order_type": "DINE_IN"
        })
        assert order_response.status_code == 400
        assert "not active" in order_response.json()["detail"].lower()
    
    def test_branch_restore_flow(self, client, test_db, sample_branch):
        """
        Test: Restore deleted branch
        
        Steps:
        1. Soft delete branch
        2. Restore branch
        3. Verify branch active again
        """
        # Step 1: Delete branch
        sample_branch.is_deleted = True
        test_db.commit()
        
        # Step 2: Restore branch
        restore_response = client.put(f"/api/branches/{sample_branch.branch_id}/restore")
        assert restore_response.status_code == 200
        
        # Step 3: Verify restored
        test_db.refresh(sample_branch)
        assert sample_branch.is_deleted == False
    
    def test_branch_update_details(self, client, sample_branch):
        """
        Test: Update branch information
        
        Steps:
        1. Update branch name, address, phone
        2. Verify changes persisted
        """
        # Step 1: Update
        new_name = "สาขาใหม่"
        new_address = "ที่อยู่ใหม่ 123"
        new_phone = "0299999999"
        
        update_response = client.put(f"/api/branches/{sample_branch.branch_id}", json={
            "name": new_name,
            "address": new_address,
            "phone": new_phone
        })
        assert update_response.status_code == 200
        
        # Step 2: Verify changes
        data = update_response.json()
        assert data["name"] == new_name
        assert data["address"] == new_address
        assert data["phone"] == new_phone
    
    def test_multiple_branches_dashboard(self, client, test_db):
        """
        Test: Dashboard can aggregate data across branches
        
        Steps:
        1. Create 2 branches
        2. Create orders at each branch
        3. Query dashboard for all branches
        4. Verify totals include both branches
        """
        from app.models import Branches, Roles, Employees
        
        # Step 1: Create branches
        branch1 = Branches(name="สาขา 1", address="111", phone="021111111")
        branch2 = Branches(name="สาขา 2", address="222", phone="022222222")
        test_db.add(branch1)
        test_db.add(branch2)
        test_db.commit()
        
        role = Roles(role_name="Cashier", seniority=1)
        test_db.add(role)
        test_db.commit()
        
        emp1 = Employees(
            branch_id=branch1.branch_id,
            role_id=role.role_id,
            first_name="A",
            last_name="A",
            salary=18000
        )
        emp2 = Employees(
            branch_id=branch2.branch_id,
            role_id=role.role_id,
            first_name="B",
            last_name="B",
            salary=18000
        )
        test_db.add(emp1)
        test_db.add(emp2)
        test_db.commit()
        
        # Step 2: Create orders
        client.post("/api/orders/empty", json={
            "branch_id": branch1.branch_id,
            "employee_id": emp1.employee_id,
            "order_type": "DINE_IN"
        })
        
        client.post("/api/orders/empty", json={
            "branch_id": branch2.branch_id,
            "employee_id": emp2.employee_id,
            "order_type": "TAKEAWAY"
        })
        
        # Step 3: Query dashboard
        dashboard_response = client.get("/api/dashboard/summary")
        assert dashboard_response.status_code == 200
        
        # Step 4: Verify counts
        data = dashboard_response.json()
        assert data["total_orders"] >= 2




