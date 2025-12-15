from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Boolean,
    ForeignKey,
    DECIMAL,
    CheckConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


# -------------------------------------------------
# Branches
# -------------------------------------------------
class Branches(Base):
    __tablename__ = "branches"
    branch_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    address = Column(String(200), nullable=False)
    # Thai phone number: 9-10 digits, may include dashes (e.g., 02-123-4567)
    phone = Column(String(15), nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)

    employees = relationship("Employees", back_populates="branch")
    orders = relationship("Orders", back_populates="branch")
    stock_items = relationship("Stock", back_populates="branch")
    # StockMovements reachable indirectly via Stock → StockMovements


# -------------------------------------------------
# Roles (using `tier` instead of ranking)
# -------------------------------------------------
class Roles(Base):
    __tablename__ = "roles"

    role_id = Column(Integer, primary_key=True, index=True)
    role_name = Column(String(50), nullable=False)
    # Changed from ranking → tier -> seniority
    seniority = Column(Integer, nullable=False)

    employees = relationship("Employees", back_populates="role")


# -------------------------------------------------
# Employees
# -------------------------------------------------
class Employees(Base):
    __tablename__ = "employees"
    employee_id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey(
        "branches.branch_id"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.role_id"), nullable=False)

    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    joined_date = Column(DateTime, server_default=func.now(), nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    salary = Column(Integer, nullable=False)

    branch = relationship("Branches", back_populates="employees")
    role = relationship("Roles", back_populates="employees")
    orders = relationship("Orders", back_populates="employee")
    stock_movements = relationship("StockMovements", back_populates="employee")


# -------------------------------------------------
# Membership Tiers (Loyalty Program)
# -------------------------------------------------
class Tiers(Base):
    __tablename__ = "tiers"
    tier_id = Column(Integer, primary_key=True, index=True)
    tier_name = Column(String(50), nullable=False)
    tier = Column(Integer, nullable=False)  # 0, 1, 2, 3...

    memberships = relationship("Memberships", back_populates="tier")


# -------------------------------------------------
# Memberships
# -------------------------------------------------
class Memberships(Base):
    __tablename__ = "memberships"
    __table_args__ = (
        CheckConstraint('LENGTH(phone) >= 9 AND LENGTH(phone) <= 10', name='phone_length_check'),
    )

    membership_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    # Thai phone number: 9 digits (company) or 10 digits (mobile)
    phone = Column(String(10), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=True, index=True)
    joined_at = Column(DateTime, server_default=func.now(), nullable=False)
    points_balance = Column(Integer, default=0, nullable=False)

    tier_id = Column(Integer, ForeignKey("tiers.tier_id"), nullable=False)

    tier = relationship("Tiers", back_populates="memberships")
    orders = relationship("Orders", back_populates="membership")


# -------------------------------------------------
# Ingredients (master table for ingredient definitions)
# -------------------------------------------------
class Ingredients(Base):
    __tablename__ = "ingredients"

    ingredient_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # "Chicken", "Rice", "Oil"
    base_unit = Column(String(20), nullable=False)  # "g", "ml", "piece"
    is_deleted = Column(Boolean, default=False, nullable=False)

    recipes = relationship("Recipe", back_populates="ingredient")
    stock_items = relationship("Stock", back_populates="ingredient")


# -------------------------------------------------
# Menu (renamed from MenuItems)
# -------------------------------------------------
class Menu(Base):
    __tablename__ = "menu"

    menu_item_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)
    description = Column(String(255), nullable=True)
    price = Column(DECIMAL(10, 2), nullable=False)
    category = Column(String(50), nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)

    order_items = relationship("OrderItems", back_populates="menu_item")
    recipes = relationship("Recipe", back_populates="menu_item")


# -------------------------------------------------
# Stock (per-branch inventory)
# -------------------------------------------------
class Stock(Base):
    __tablename__ = "stock"
    stock_id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey(
        "branches.branch_id"), nullable=False)
    ingredient_id = Column(Integer, ForeignKey(
        "ingredients.ingredient_id"), nullable=False)
    amount_remaining = Column(DECIMAL(10, 2), nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)

    branch = relationship("Branches", back_populates="stock_items")
    ingredient = relationship("Ingredients", back_populates="stock_items")
    stock_movements = relationship("StockMovements", back_populates="stock")


# -------------------------------------------------
# Recipe (renamed from MenuIngredients, recipe mapping)
# -------------------------------------------------
class Recipe(Base):
    __tablename__ = "recipe"

    id = Column(Integer, primary_key=True, index=True)
    menu_item_id = Column(Integer, ForeignKey(
        "menu.menu_item_id"), nullable=False)
    ingredient_id = Column(Integer, ForeignKey(
        "ingredients.ingredient_id"), nullable=False)
    qty_per_unit = Column(DECIMAL(10, 2), nullable=False)

    menu_item = relationship("Menu", back_populates="recipes")
    ingredient = relationship("Ingredients", back_populates="recipes")


# -------------------------------------------------
# Orders
# -------------------------------------------------
class Orders(Base):
    __tablename__ = "orders"
    order_id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey(
        "branches.branch_id"), nullable=False)
    membership_id = Column(Integer, ForeignKey(
        "memberships.membership_id"), nullable=True)
    employee_id = Column(Integer, ForeignKey(
        "employees.employee_id"), nullable=False)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    total_price = Column(DECIMAL(10, 2), nullable=False)
    status = Column(String, nullable=False)
    order_type = Column(String, nullable=False)

    branch = relationship("Branches", back_populates="orders")
    membership = relationship("Memberships", back_populates="orders")
    employee = relationship("Employees", back_populates="orders")
    order_items = relationship("OrderItems", back_populates="order")
    payment = relationship("Payments", back_populates="order", uselist=False)
    stock_movements = relationship("StockMovements", back_populates="order")


# -------------------------------------------------
# Order Items
# -------------------------------------------------
class OrderItems(Base):
    __tablename__ = "order_items"
    order_item_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey(
        "menu.menu_item_id"), nullable=False)
    status = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(DECIMAL(10, 2), nullable=False)
    line_total = Column(DECIMAL(10, 2), nullable=False)

    order = relationship("Orders", back_populates="order_items")
    menu_item = relationship("Menu", back_populates="order_items")


# -------------------------------------------------
# Payments (1:1 with Orders)
# -------------------------------------------------
class Payments(Base):
    __tablename__ = "payments"

    order_id = Column(Integer, ForeignKey("orders.order_id"), primary_key=True)
    paid_price = Column(DECIMAL(10, 2), nullable=False)
    points_used = Column(Integer, default=0, nullable=False)
    payment_method = Column(String, nullable=False)
    payment_ref = Column(String, nullable=True)
    paid_timestamp = Column(DateTime, nullable=True)

    order = relationship("Orders", back_populates="payment")


# -------------------------------------------------
# Stock Movements (inventory ledger)
# -------------------------------------------------
class StockMovements(Base):
    __tablename__ = "stock_movements"
    movement_id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stock.stock_id"), nullable=False)
    employee_id = Column(Integer, ForeignKey(
        "employees.employee_id"), nullable=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"), nullable=True)

    qty_change = Column(DECIMAL(10, 2), nullable=False)
    reason = Column(String, nullable=False)  # RESTOCK, SALE, WASTE, ADJUST
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    note = Column(String, nullable=True)

    stock = relationship("Stock", back_populates="stock_movements")
    employee = relationship("Employees", back_populates="stock_movements")
    order = relationship("Orders", back_populates="stock_movements")
