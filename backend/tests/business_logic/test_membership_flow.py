"""
Business Logic Tests: Membership Flow
Tests membership creation, points earning, and points redemption
"""
import pytest
from decimal import Decimal


class TestMembershipFlow:
    """
    Test Flow 4: Membership Flow
    Registration → Attach to Order → Earn Points → Use Points
    """
    
    def test_membership_registration_flow(self, client, sample_tier):
        """
        Test: Complete membership registration
        
        Steps:
        1. Create new membership
        2. Verify initial points balance is 0
        3. Verify tier assignment
        """
        # Step 1: Register new membership
        response = client.post("/api/memberships/", json={
            "name": "นางสาว ทดสอบ ระบบ",
            "phone": "0891234567",
            "email": "test.member@example.com",
            "tier_id": sample_tier.tier_id
        })
        
        assert response.status_code == 201
        data = response.json()
        
        # Step 2: Verify initial balance
        assert data["points_balance"] == 0
        
        # Step 3: Verify tier
        assert data["tier_id"] == sample_tier.tier_id
    
    def test_points_earning_flow(self, client, test_db, full_order_setup, sample_membership):
        """
        Test: Earn points after payment (1 point per 10 baht)
        
        Steps:
        1. Check initial points balance
        2. Create order with membership
        3. Complete order and pay
        4. Verify points earned correctly
        """
        setup = full_order_setup
        
        # Step 1: Record initial points
        initial_points = sample_membership.points_balance
        
        # Step 2: Create order with membership
        order_response = client.post("/api/orders/", json={
            "branch_id": setup["branch"].branch_id,
            "employee_id": setup["employee"].employee_id,
            "membership_id": sample_membership.membership_id,
            "order_type": "DINE_IN",
            "status": "UNPAID",
            "order_items": [
                {
                    "menu_item_id": setup["menu_item"].menu_item_id,
                    "quantity": 3,  # 3 * 120 = 360 baht
                    "status": "ORDERED"
                }
            ]
        })
        order_data = order_response.json()
        order_id = order_data["order_id"]
        total_price = float(order_data["total_price"])
        item_id = order_data["order_items"][0]["order_item_id"]
        
        # Step 3: Complete order
        client.put(f"/api/order-items/{item_id}/status", json={"status": "DONE"})
        
        payment_response = client.post("/api/payments/", json={
            "order_id": order_id,
            "payment_method": "CASH",
            "points_used": 0
        })
        assert payment_response.status_code == 200
        
        # Step 4: Verify points earned (360 / 10 = 36 points)
        test_db.refresh(sample_membership)
        expected_points = initial_points + int(total_price / 10)
        assert sample_membership.points_balance == expected_points
    
    def test_points_redemption_flow(self, client, test_db, full_order_setup, sample_membership):
        """
        Test: Use points to discount order
        
        Steps:
        1. Set membership with sufficient points
        2. Create order with membership
        3. Pay using points
        4. Verify points deducted
        5. Verify paid amount reduced
        6. Verify new points earned from paid amount
        """
        setup = full_order_setup
        
        # Step 1: Give membership 500 points
        sample_membership.points_balance = 500
        test_db.commit()
        
        # Step 2: Create order (120 baht)
        order_response = client.post("/api/orders/", json={
            "branch_id": setup["branch"].branch_id,
            "employee_id": setup["employee"].employee_id,
            "membership_id": sample_membership.membership_id,
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
        order_id = order_response.json()["order_id"]
        item_id = order_response.json()["order_items"][0]["order_item_id"]
        
        # Mark as DONE
        client.put(f"/api/order-items/{item_id}/status", json={"status": "DONE"})
        
        # Step 3: Pay with 100 points
        points_to_use = 100
        payment_response = client.post("/api/payments/", json={
            "order_id": order_id,
            "payment_method": "CASH",
            "points_used": points_to_use
        })
        assert payment_response.status_code == 200
        payment_data = payment_response.json()
        
        # Step 4 & 5: Verify discount applied
        # Total: 120, Points used: 100, Paid: 20
        assert float(payment_data["paid_price"]) == 20.0
        
        # Step 6: Verify final points balance
        # Initial: 500
        # Used: -100
        # Earned: 20 / 10 = 2
        # Final: 500 - 100 + 2 = 402
        test_db.refresh(sample_membership)
        assert sample_membership.points_balance == 402
    
    def test_points_cannot_exceed_balance(self, client, test_db, full_order_setup, sample_membership):
        """
        Test: Cannot use more points than available
        
        Steps:
        1. Set membership with low points
        2. Create order
        3. Try to use excessive points
        4. Verify rejection
        """
        setup = full_order_setup
        
        # Step 1: Set low balance
        sample_membership.points_balance = 50
        test_db.commit()
        
        # Step 2: Create order
        order_response = client.post("/api/orders/", json={
            "branch_id": setup["branch"].branch_id,
            "employee_id": setup["employee"].employee_id,
            "membership_id": sample_membership.membership_id,
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
        order_id = order_response.json()["order_id"]
        item_id = order_response.json()["order_items"][0]["order_item_id"]
        
        client.put(f"/api/order-items/{item_id}/status", json={"status": "DONE"})
        
        # Step 3: Try to use 200 points (more than available 50)
        payment_response = client.post("/api/payments/", json={
            "order_id": order_id,
            "payment_method": "CASH",
            "points_used": 200
        })
        
        # Step 4: Verify rejection
        assert payment_response.status_code == 400
        assert "Insufficient points" in payment_response.json()["detail"]
    
    def test_points_cover_entire_order(self, client, test_db, full_order_setup, sample_membership):
        """
        Test: Points can cover entire order amount (paid_price = 0)
        
        Steps:
        1. Give membership many points
        2. Create small order
        3. Use points to cover 100%
        4. Verify paid_price = 0
        """
        setup = full_order_setup
        
        # Step 1: Give 1000 points
        sample_membership.points_balance = 1000
        test_db.commit()
        
        # Step 2: Create order (120 baht)
        order_response = client.post("/api/orders/", json={
            "branch_id": setup["branch"].branch_id,
            "employee_id": setup["employee"].employee_id,
            "membership_id": sample_membership.membership_id,
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
        order_id = order_response.json()["order_id"]
        item_id = order_response.json()["order_items"][0]["order_item_id"]
        
        client.put(f"/api/order-items/{item_id}/status", json={"status": "DONE"})
        
        # Step 3: Use 150 points (more than order total)
        payment_response = client.post("/api/payments/", json={
            "order_id": order_id,
            "payment_method": "CASH",
            "points_used": 150
        })
        assert payment_response.status_code == 200
        
        # Step 4: Verify paid_price = 0 (cannot be negative)
        payment_data = payment_response.json()
        assert float(payment_data["paid_price"]) == 0.0
        
        # Verify points balance: 1000 - 150 + 0 = 850 (no points earned when paid_price = 0)
        test_db.refresh(sample_membership)
        assert sample_membership.points_balance == 850
    
    def test_membership_phone_uniqueness(self, client, sample_membership):
        """
        Test: Cannot register duplicate phone number
        
        Steps:
        1. Try to create membership with existing phone
        2. Verify rejection
        """
        response = client.post("/api/memberships/", json={
            "name": "คนอื่น",
            "phone": sample_membership.phone,  # Duplicate phone
            "email": "different@example.com",
            "tier_id": sample_membership.tier_id
        })
        
        assert response.status_code == 400
        assert "phone" in response.json()["detail"].lower()
    
    def test_membership_email_uniqueness(self, client, sample_membership):
        """
        Test: Cannot register duplicate email
        
        Steps:
        1. Try to create membership with existing email
        2. Verify rejection
        """
        response = client.post("/api/memberships/", json={
            "name": "คนอื่น",
            "phone": "0899999999",
            "email": sample_membership.email,  # Duplicate email
            "tier_id": sample_membership.tier_id
        })
        
        assert response.status_code == 400
        assert "email" in response.json()["detail"].lower()
    
    def test_tier_upgrade_flow(self, client, test_db, sample_tier):
        """
        Test: Membership tier can be upgraded
        
        Steps:
        1. Create membership with Bronze tier
        2. Create Gold tier
        3. Update membership to Gold tier
        4. Verify tier changed
        """
        from app.models import Tiers, Memberships
        
        # Step 1: Create Bronze membership
        membership = Memberships(
            name="สมชาย ทดสอบ",
            phone="0887654321",
            email="upgrade@example.com",
            tier_id=sample_tier.tier_id,
            points_balance=1000
        )
        test_db.add(membership)
        test_db.commit()
        test_db.refresh(membership)
        
        # Step 2: Create Gold tier
        gold_tier = Tiers(tier_name="Gold", tier=2)
        test_db.add(gold_tier)
        test_db.commit()
        
        # Step 3: Upgrade to Gold
        response = client.put(f"/api/memberships/{membership.membership_id}", json={
            "name": membership.name,
            "phone": membership.phone,
            "email": membership.email,
            "tier_id": gold_tier.tier_id
        })
        assert response.status_code == 200
        
        # Step 4: Verify upgrade
        data = response.json()
        assert data["tier_id"] == gold_tier.tier_id


