"""
Integration tests for Memberships API endpoints
"""
import pytest


class TestMembershipsAPI:
    """Test /api/memberships endpoints"""
    
    def test_create_membership(self, client, sample_tier):
        """Test: POST /api/memberships creates new membership"""
        response = client.post("/api/memberships/", json={
            "name": "นาย ทดสอบ ระบบ",
            "phone": "0812345678",
            "email": "test@example.com",
            "tier_id": sample_tier.tier_id
        })
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "นาย ทดสอบ ระบบ"
        assert data["phone"] == "0812345678"
        assert data["email"] == "test@example.com"
        assert data["points_balance"] == 0
    
    def test_get_membership_by_id(self, client, sample_membership):
        """Test: GET /api/memberships/{id} returns membership"""
        response = client.get(f"/api/memberships/{sample_membership.membership_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["membership_id"] == sample_membership.membership_id
        assert data["name"] == sample_membership.name
    
    def test_search_membership_by_phone(self, client, sample_membership):
        """Test: GET /api/memberships/?phone=X searches by phone"""
        response = client.get(f"/api/memberships/?phone={sample_membership.phone}")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert any(m["phone"] == sample_membership.phone for m in data)
    
    def test_search_membership_by_email(self, client, sample_membership):
        """Test: GET /api/memberships/?email=X searches by email"""
        response = client.get(f"/api/memberships/?email={sample_membership.email}")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert any(m["email"] == sample_membership.email for m in data)
    
    def test_update_membership(self, client, sample_membership):
        """Test: PUT /api/memberships/{id} updates membership"""
        new_name = "นาย อัพเดท แล้ว"
        
        response = client.put(f"/api/memberships/{sample_membership.membership_id}", json={
            "name": new_name,
            "phone": sample_membership.phone,
            "email": sample_membership.email,
            "tier_id": sample_membership.tier_id
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == new_name
    
    def test_cannot_create_duplicate_phone(self, client, sample_membership):
        """Test: Cannot create membership with duplicate phone"""
        response = client.post("/api/memberships/", json={
            "name": "คนอื่น",
            "phone": sample_membership.phone,  # Duplicate
            "email": "other@example.com",
            "tier_id": sample_membership.tier_id
        })
        
        assert response.status_code == 400
    
    def test_cannot_create_duplicate_email(self, client, sample_membership):
        """Test: Cannot create membership with duplicate email"""
        response = client.post("/api/memberships/", json={
            "name": "คนอื่น",
            "phone": "0899999999",
            "email": sample_membership.email,  # Duplicate
            "tier_id": sample_membership.tier_id
        })
        
        assert response.status_code == 400
    
    def test_invalid_phone_format(self, client, sample_tier):
        """Test: Reject invalid phone format"""
        response = client.post("/api/memberships/", json={
            "name": "Test User",
            "phone": "123",  # Too short
            "email": "test@example.com",
            "tier_id": sample_tier.tier_id
        })
        
        # FastAPI validation returns 422 for schema validation errors
        assert response.status_code in [400, 422]
    
    def test_invalid_email_format(self, client, sample_tier):
        """Test: Reject invalid email format"""
        response = client.post("/api/memberships/", json={
            "name": "Test User",
            "phone": "0812345678",
            "email": "invalid-email",  # Invalid format
            "tier_id": sample_tier.tier_id
        })
        
        # FastAPI validation returns 422 for schema validation errors
        assert response.status_code in [400, 422]


