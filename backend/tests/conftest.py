"""
Test configuration and shared fixtures
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from decimal import Decimal
from datetime import datetime

from app.database import Base, get_db
from app.main import app
from app import models


# ==========================================
# DATABASE FIXTURES
# ==========================================

@pytest.fixture(scope="function")
def test_db():
    """
    Create an in-memory SQLite database for testing
    Each test gets a fresh database
    """
    # Use in-memory SQLite for fast testing
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Create session
    TestingSessionLocal = sessionmaker(
        autocommit=False, autoflush=False, bind=engine
    )
    
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(test_db):
    """
    Create a test client with overridden database dependency
    """
    def override_get_db():
        try:
            yield test_db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


# ==========================================
# DATA FIXTURES (Test Data Factories)
# ==========================================

@pytest.fixture
def sample_branch(test_db):
    """Create a sample branch"""
    branch = models.Branches(
        name="สาขาสยามสแควร์",
        address="991 ถนนพระราม 1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ 10330",
        phone="0212345678",
        is_deleted=False
    )
    test_db.add(branch)
    test_db.commit()
    test_db.refresh(branch)
    return branch


@pytest.fixture
def sample_role(test_db):
    """Create a sample role"""
    role = models.Roles(
        role_name="Cashier",
        seniority=1
    )
    test_db.add(role)
    test_db.commit()
    test_db.refresh(role)
    return role


@pytest.fixture
def sample_employee(test_db, sample_branch, sample_role):
    """Create a sample employee"""
    employee = models.Employees(
        branch_id=sample_branch.branch_id,
        role_id=sample_role.role_id,
        first_name="สมชาย",
        last_name="ใจดี",
        salary=18000,
        is_deleted=False
    )
    test_db.add(employee)
    test_db.commit()
    test_db.refresh(employee)
    return employee


@pytest.fixture
def sample_tier(test_db):
    """Create a sample membership tier"""
    tier = models.Tiers(
        tier_name="Bronze",
        tier=0
    )
    test_db.add(tier)
    test_db.commit()
    test_db.refresh(tier)
    return tier


@pytest.fixture
def sample_membership(test_db, sample_tier):
    """Create a sample membership"""
    membership = models.Memberships(
        name="สมหญิง ใจงาม",
        phone="0812345678",
        email="somying@example.com",
        tier_id=sample_tier.tier_id,
        points_balance=100
    )
    test_db.add(membership)
    test_db.commit()
    test_db.refresh(membership)
    return membership


@pytest.fixture
def sample_ingredient(test_db):
    """Create a sample ingredient"""
    ingredient = models.Ingredients(
        name="กุ้งสด",
        base_unit="kg",
        is_deleted=False
    )
    test_db.add(ingredient)
    test_db.commit()
    test_db.refresh(ingredient)
    return ingredient


@pytest.fixture
def sample_stock(test_db, sample_branch, sample_ingredient):
    """Create a sample stock entry"""
    stock = models.Stock(
        branch_id=sample_branch.branch_id,
        ingredient_id=sample_ingredient.ingredient_id,
        amount_remaining=10.0
    )
    test_db.add(stock)
    test_db.commit()
    test_db.refresh(stock)
    return stock


@pytest.fixture
def sample_menu_item(test_db):
    """Create a sample menu item"""
    menu = models.Menu(
        name="ผัดไทยกุ้งสด",
        type="FOOD",
        category="อาหารจานหลัก",
        price=Decimal("120.00"),
        is_available=True
    )
    test_db.add(menu)
    test_db.commit()
    test_db.refresh(menu)
    return menu


@pytest.fixture
def sample_recipe(test_db, sample_menu_item, sample_ingredient):
    """Create a sample recipe linking menu item to ingredient"""
    recipe = models.Recipe(
        menu_item_id=sample_menu_item.menu_item_id,
        ingredient_id=sample_ingredient.ingredient_id,
        qty_per_unit=0.2  # 200g of shrimp per dish
    )
    test_db.add(recipe)
    test_db.commit()
    test_db.refresh(recipe)
    return recipe


@pytest.fixture
def sample_order(test_db, sample_branch, sample_employee):
    """Create a sample unpaid order"""
    order = models.Orders(
        branch_id=sample_branch.branch_id,
        employee_id=sample_employee.employee_id,
        order_type="DINE_IN",
        status="UNPAID",
        total_price=Decimal("0.00")
    )
    test_db.add(order)
    test_db.commit()
    test_db.refresh(order)
    return order


@pytest.fixture
def sample_order_item(test_db, sample_order, sample_menu_item):
    """Create a sample order item"""
    order_item = models.OrderItems(
        order_id=sample_order.order_id,
        menu_item_id=sample_menu_item.menu_item_id,
        status="ORDERED",
        quantity=2,
        unit_price=sample_menu_item.price,
        line_total=sample_menu_item.price * 2
    )
    test_db.add(order_item)
    test_db.commit()
    test_db.refresh(order_item)
    
    # Update order total price
    sample_order.total_price = order_item.line_total
    test_db.commit()
    test_db.refresh(sample_order)
    
    return order_item


# ==========================================
# HELPER FIXTURES
# ==========================================

@pytest.fixture
def full_order_setup(test_db, sample_branch, sample_employee, sample_menu_item, 
                     sample_ingredient, sample_recipe, sample_stock):
    """
    Create a complete order setup with all dependencies:
    - Branch + Employee
    - Menu Item + Ingredient + Recipe
    - Stock
    """
    return {
        "branch": sample_branch,
        "employee": sample_employee,
        "menu_item": sample_menu_item,
        "ingredient": sample_ingredient,
        "recipe": sample_recipe,
        "stock": sample_stock
    }



