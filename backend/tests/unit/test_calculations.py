"""
Unit tests for calculation logic (points, prices, discounts)
"""
import pytest
from decimal import Decimal


class TestPointsCalculation:
    """Test points calculation logic"""
    
    def test_points_earned_calculation(self):
        """Test: 1 point per 10 baht spent"""
        # Arrange
        paid_price = Decimal("100.00")
        
        # Act
        points_earned = int(float(paid_price) / 10)
        
        # Assert
        assert points_earned == 10
    
    def test_points_earned_with_decimal(self):
        """Test: Points are rounded down (e.g., 95 baht = 9 points)"""
        paid_price = Decimal("95.00")
        points_earned = int(float(paid_price) / 10)
        assert points_earned == 9
    
    def test_points_earned_with_large_amount(self):
        """Test: Large transaction points calculation"""
        paid_price = Decimal("1234.56")
        points_earned = int(float(paid_price) / 10)
        assert points_earned == 123


class TestPriceCalculation:
    """Test price calculation logic"""
    
    def test_line_total_calculation(self):
        """Test: line_total = quantity * unit_price"""
        quantity = 3
        unit_price = Decimal("45.50")
        
        line_total = quantity * unit_price
        
        assert line_total == Decimal("136.50")
    
    def test_order_total_with_multiple_items(self):
        """Test: order total = sum of all line_totals"""
        items = [
            {"quantity": 2, "unit_price": Decimal("100.00")},  # 200
            {"quantity": 1, "unit_price": Decimal("50.00")},   # 50
            {"quantity": 3, "unit_price": Decimal("30.00")},   # 90
        ]
        
        total = sum(item["quantity"] * item["unit_price"] for item in items)
        
        assert total == Decimal("340.00")
    
    def test_paid_price_with_points_discount(self):
        """Test: paid_price = total_price - points_used"""
        total_price = Decimal("500.00")
        points_used = 100
        
        paid_price = max(Decimal("0"), total_price - Decimal(str(points_used)))
        
        assert paid_price == Decimal("400.00")
    
    def test_paid_price_cannot_be_negative(self):
        """Test: paid_price cannot go below 0"""
        total_price = Decimal("50.00")
        points_used = 100  # More points than total
        
        paid_price = max(Decimal("0"), total_price - Decimal(str(points_used)))
        
        assert paid_price == Decimal("0.00")


class TestStockCalculation:
    """Test stock calculation logic"""
    
    def test_stock_subtraction(self):
        """Test: stock amount decreases after order"""
        initial_stock = 10.0
        qty_per_unit = 0.2
        quantity_ordered = 5
        
        stock_used = qty_per_unit * quantity_ordered
        remaining_stock = initial_stock - stock_used
        
        assert remaining_stock == 9.0
    
    def test_stock_out_of_stock(self):
        """Test: identify out-of-stock items (amount <= 0)"""
        stock_amounts = [0.0, -1.0, 0.5, 10.0]
        
        out_of_stock = [amount for amount in stock_amounts if amount <= 0]
        
        assert len(out_of_stock) == 2
        assert 0.0 in out_of_stock
        assert -1.0 in out_of_stock


