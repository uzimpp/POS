"""
Integration tests for Payments API endpoints
"""
import pytest
from decimal import Decimal
from app import models


class TestPaymentsAPI:
    """Test /api/payments endpoints"""
    
    def test_create_payment_cash(self, client, test_db, sample_order, sample_order_item):
        """Test: POST /api/payments creates cash payment"""
        # Mark order items as DONE (ready for payment)
        sample_order_item.status = "DONE"
        test_db.commit()
        
        response = client.post("/api/payments/", json={
            "order_id": sample_order.order_id,
            "payment_method": "CASH",
            "points_used": 0
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["order_id"] == sample_order.order_id
        assert data["payment_method"] == "CASH"
        assert float(data["paid_price"]) == float(sample_order.total_price)
        
        # Verify order status changed to PAID
        test_db.refresh(sample_order)
        assert sample_order.status == "PAID"
    
    def test_create_payment_with_points(self, client, test_db, sample_order, 
                                        sample_order_item, sample_membership):
        """Test: POST /api/payments with membership points discount"""
        # Attach membership to order
        sample_order.membership_id = sample_membership.membership_id
        sample_order.total_price = Decimal("150.00")
        sample_order_item.status = "DONE"
        test_db.commit()
        
        initial_points = sample_membership.points_balance
        points_to_use = 50
        
        response = client.post("/api/payments/", json={
            "order_id": sample_order.order_id,
            "payment_method": "CASH",
            "points_used": points_to_use
        })
        
        assert response.status_code == 200
        data = response.json()
        # paid_price = 150 - 50 = 100
        assert float(data["paid_price"]) == 100.00
        assert data["points_used"] == points_to_use
        
        # Verify points: deducted + earned
        # Used: -50, Earned: 100/10 = 10, Net: -40
        # Final = initial - 50 + 10 = initial - 40
        test_db.refresh(sample_membership)
        points_earned = int(100 / 10)  # paid_price / 10
        assert sample_membership.points_balance == initial_points - points_to_use + points_earned
    
    def test_payment_awards_points(self, client, test_db, sample_order, 
                                   sample_order_item, sample_membership):
        """Test: Payment awards points to membership (1 point per 10 baht)"""
        # Attach membership to order
        sample_order.membership_id = sample_membership.membership_id
        sample_order.total_price = Decimal("100.00")
        sample_order_item.status = "DONE"
        test_db.commit()
        
        initial_points = sample_membership.points_balance
        
        response = client.post("/api/payments/", json={
            "order_id": sample_order.order_id,
            "payment_method": "CASH",
            "points_used": 0
        })
        
        assert response.status_code == 200
        
        # Verify points earned (100 baht / 10 = 10 points)
        test_db.refresh(sample_membership)
        expected_points = initial_points + 10
        assert sample_membership.points_balance == expected_points
    
    def test_cannot_pay_without_done_items(self, client, sample_order, sample_order_item):
        """Test: Cannot process payment when items are still ORDERED"""
        # Order item is still ORDERED (default status)
        assert sample_order_item.status == "ORDERED"
        
        response = client.post("/api/payments/", json={
            "order_id": sample_order.order_id,
            "payment_method": "CASH",
            "points_used": 0
        })
        
        assert response.status_code == 400
        assert "still ORDERED" in response.json()["detail"]
    
    def test_cannot_pay_with_preparing_items(self, client, test_db, sample_order, sample_order_item):
        """Test: Cannot process payment when items are PREPARING"""
        sample_order_item.status = "PREPARING"
        test_db.commit()
        
        response = client.post("/api/payments/", json={
            "order_id": sample_order.order_id,
            "payment_method": "CASH",
            "points_used": 0
        })
        
        assert response.status_code == 400
        assert "still PREPARING" in response.json()["detail"]
    
    def test_cannot_use_more_points_than_balance(self, client, test_db, sample_order, 
                                                  sample_order_item, sample_membership):
        """Test: Cannot use more points than membership balance"""
        sample_order.membership_id = sample_membership.membership_id
        sample_order_item.status = "DONE"
        test_db.commit()
        
        # Try to use more points than available
        excessive_points = sample_membership.points_balance + 100
        
        response = client.post("/api/payments/", json={
            "order_id": sample_order.order_id,
            "payment_method": "CASH",
            "points_used": excessive_points
        })
        
        assert response.status_code == 400
        assert "Insufficient points" in response.json()["detail"]
    
    def test_cannot_use_points_without_membership(self, client, test_db, sample_order, sample_order_item):
        """Test: Cannot use points if order has no membership"""
        sample_order_item.status = "DONE"
        test_db.commit()
        
        response = client.post("/api/payments/", json={
            "order_id": sample_order.order_id,
            "payment_method": "CASH",
            "points_used": 50
        })
        
        assert response.status_code == 400
        assert "Cannot use points without a membership" in response.json()["detail"]
    
    def test_card_payment_requires_payment_ref(self, client, test_db, sample_order, sample_order_item):
        """Test: CARD payment requires payment_ref"""
        sample_order_item.status = "DONE"
        test_db.commit()
        
        response = client.post("/api/payments/", json={
            "order_id": sample_order.order_id,
            "payment_method": "CARD",
            "points_used": 0
            # Missing payment_ref
        })
        
        assert response.status_code == 400
        assert "Payment reference" in response.json()["detail"]
        assert "required" in response.json()["detail"]
    
    def test_qr_payment_requires_payment_ref(self, client, test_db, sample_order, sample_order_item):
        """Test: QR payment requires payment_ref"""
        sample_order_item.status = "DONE"
        test_db.commit()
        
        response = client.post("/api/payments/", json={
            "order_id": sample_order.order_id,
            "payment_method": "QR",
            "points_used": 0
            # Missing payment_ref
        })
        
        assert response.status_code == 400
        assert "Payment reference" in response.json()["detail"]
    
    def test_cannot_pay_twice(self, client, test_db, sample_order, sample_order_item):
        """Test: Cannot create duplicate payment for same order"""
        sample_order_item.status = "DONE"
        test_db.commit()
        
        # First payment
        response1 = client.post("/api/payments/", json={
            "order_id": sample_order.order_id,
            "payment_method": "CASH",
            "points_used": 0
        })
        assert response1.status_code == 200
        
        # Try second payment (should fail)
        response2 = client.post("/api/payments/", json={
            "order_id": sample_order.order_id,
            "payment_method": "CASH",
            "points_used": 0
        })
        assert response2.status_code == 400
        assert "Payment already exists" in response2.json()["detail"]
    
    def test_get_payment_by_order_id(self, client, test_db, sample_order, sample_order_item):
        """Test: GET /api/payments/{order_id} returns payment"""
        # Create payment first
        sample_order_item.status = "DONE"
        test_db.commit()
        
        client.post("/api/payments/", json={
            "order_id": sample_order.order_id,
            "payment_method": "CASH",
            "points_used": 0
        })
        
        # Get payment
        response = client.get(f"/api/payments/{sample_order.order_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["order_id"] == sample_order.order_id
    
    def test_filter_payments_by_method(self, client, test_db, sample_order, sample_order_item):
        """Test: GET /api/payments/?payment_method=CASH filters payments"""
        sample_order_item.status = "DONE"
        test_db.commit()
        
        client.post("/api/payments/", json={
            "order_id": sample_order.order_id,
            "payment_method": "CASH",
            "points_used": 0
        })
        
        response = client.get("/api/payments/?payment_method=CASH")
        
        assert response.status_code == 200
        data = response.json()
        assert all(payment["payment_method"] == "CASH" for payment in data)



