from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Boolean,
    ForeignKey,
    DECIMAL,
)
<<<<<<< HEAD
=======

>>>>>>> 095b97944a7e6eebf798849fafe9878095e764c0
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


# -------------------------------------------------
# Branches
# -------------------------------------------------
class Branches(Base):
    __tablename__ = "branches"
<<<<<<< HEAD
=======

>>>>>>> 095b97944a7e6eebf798849fafe9878095e764c0
    branch_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    address = Column(String(200), nullable=False)
    phone = Column(String(20), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
<<<<<<< HEAD
=======

>>>>>>> 095b97944a7e6eebf798849fafe9878095e764c0
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
    seniority = Column(Integer, nullable=False)     # Changed from ranking → tier -> seniority

    employees = relationship("Employees", back_populates="role")


# -------------------------------------------------
# Employees
# -------------------------------------------------
class Employees(Base):
    __tablename__ = "employees"
<<<<<<< HEAD
=======

>>>>>>> 095b97944a7e6eebf798849fafe9878095e764c0
    employee_id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey(
        "branches.branch_id"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.role_id"), nullable=False)

    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    joined_date = Column(DateTime, server_default=func.now(), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
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
<<<<<<< HEAD
=======

>>>>>>> 095b97944a7e6eebf798849fafe9878095e764c0
    tier_id = Column(Integer, primary_key=True, index=True)
    tier_name = Column(String(50), nullable=False)
    tier = Column(Integer, nullable=False)  # 0, 1, 2, 3...

    memberships = relationship("Memberships", back_populates="tier")


# -------------------------------------------------
# Memberships
# -------------------------------------------------
class Memberships(Base):
    __tablename__ = "memberships"
<<<<<<< HEAD
=======

>>>>>>> 095b97944a7e6eebf798849fafe9878095e764c0
    membership_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=True, index=True)
    joined_at = Column(DateTime, server_default=func.now(), nullable=False)
    points_balance = Column(Integer, default=0, nullable=False)

    tier_id = Column(Integer, ForeignKey("tiers.tier_id"), nullable=False)

    tier = relationship("Tiers", back_populates="memberships")
    orders = relationship("Orders", back_populates="membership")


# -------------------------------------------------
# Menu Items
# -------------------------------------------------
class MenuItems(Base):
    __tablename__ = "menu_items"
<<<<<<< HEAD
=======

>>>>>>> 095b97944a7e6eebf798849fafe9878095e764c0
    menu_item_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)
    description = Column(String(255), nullable=True)
    price = Column(DECIMAL(10, 2), nullable=False)
    category = Column(String(50), nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)

    order_items = relationship("OrderItems", back_populates="menu_item")
    menu_ingredients = relationship(
        "MenuIngredients", back_populates="menu_item")


# -------------------------------------------------
# Stock (per-branch inventory)
# -------------------------------------------------
class Stock(Base):
    __tablename__ = "stock"
<<<<<<< HEAD
=======

>>>>>>> 095b97944a7e6eebf798849fafe9878095e764c0
    stock_id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey(
        "branches.branch_id"), nullable=False)
    stk_name = Column(String(100), nullable=False)
    amount_remaining = Column(DECIMAL(10, 2), nullable=False)
    unit = Column(String(20), nullable=False)

    branch = relationship("Branches", back_populates="stock_items")
    menu_ingredients = relationship("MenuIngredients", back_populates="stock")
    stock_movements = relationship("StockMovements", back_populates="stock")


# -------------------------------------------------
# Menu Ingredients (recipe mapping)
# -------------------------------------------------
class MenuIngredients(Base):
    __tablename__ = "menu_ingredients"
<<<<<<< HEAD
=======

>>>>>>> 095b97944a7e6eebf798849fafe9878095e764c0
    id = Column(Integer, primary_key=True, index=True)
    menu_item_id = Column(Integer, ForeignKey(
        "menu_items.menu_item_id"), nullable=False)
    stock_id = Column(Integer, ForeignKey("stock.stock_id"), nullable=False)
    qty_per_unit = Column(DECIMAL(10, 2), nullable=False)
    unit = Column(String, nullable=False)

    menu_item = relationship("MenuItems", back_populates="menu_ingredients")
    stock = relationship("Stock", back_populates="menu_ingredients")


# -------------------------------------------------
# Orders
# -------------------------------------------------
class Orders(Base):
    __tablename__ = "orders"
<<<<<<< HEAD
=======

>>>>>>> 095b97944a7e6eebf798849fafe9878095e764c0
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
<<<<<<< HEAD
=======

>>>>>>> 095b97944a7e6eebf798849fafe9878095e764c0
    order_item_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey(
        "menu_items.menu_item_id"), nullable=False)
    status = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(DECIMAL(10, 2), nullable=False)
    line_total = Column(DECIMAL(10, 2), nullable=False)

    order = relationship("Orders", back_populates="order_items")
    menu_item = relationship("MenuItems", back_populates="order_items")


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
<<<<<<< HEAD
=======

>>>>>>> 095b97944a7e6eebf798849fafe9878095e764c0
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
