from sqlalchemy import Column, Integer, String, DateTime, Decimal, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import SERIAL
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class Role(Base):
    __tablename__ = "roles"

    role_id = Column(SERIAL, primary_key=True, index=True)
    role_name = Column(String, nullable=False)
    ranking = Column(Integer, nullable=False)

    employees = relationship("Employee", back_populates="role")


class Employee(Base):
    __tablename__ = "employees"

    employee_id = Column(SERIAL, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.role_id"), nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    joined_date = Column(DateTime, server_default=func.now(), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    # Monthly salary in baht (integer)
    salary = Column(Integer, nullable=False)

    role = relationship("Role", back_populates="employees")
    orders = relationship("Order", back_populates="employee")


class Membership(Base):
    __tablename__ = "memberships"

    membership_id = Column(SERIAL, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=True, index=True)
    joined_at = Column(DateTime, server_default=func.now(), nullable=False)
    points_balance = Column(Integer, default=0, nullable=False)
    # Bronze, Silver, Gold, Platinum
    membership_tier = Column(String, default="Bronze", nullable=False)

    orders = relationship("Order", back_populates="membership")


class MenuItem(Base):
    __tablename__ = "menu_items"

    menu_item_id = Column(SERIAL, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # dish, addon, set
    description = Column(String, nullable=True)
    price = Column(Decimal(10, 2), nullable=False)
    # Main, Topping, Drink, Appetizer
    category = Column(String, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)

    order_items = relationship("OrderItem", back_populates="menu_item")
    menu_ingredients = relationship(
        "MenuIngredient", back_populates="menu_item")


class Stock(Base):
    __tablename__ = "stock"

    stock_id = Column(SERIAL, primary_key=True, index=True)
    stk_name = Column(String, nullable=False)
    amount_remaining = Column(Decimal(10, 2), nullable=False)
    unit = Column(String, nullable=False)  # g, ml, piece, etc.

    menu_ingredients = relationship("MenuIngredient", back_populates="stock")


class MenuIngredient(Base):
    __tablename__ = "menu_ingredients"

    id = Column(SERIAL, primary_key=True, index=True)
    menu_item_id = Column(Integer, ForeignKey(
        "menu_items.menu_item_id"), nullable=False)
    stock_id = Column(Integer, ForeignKey("stock.stock_id"), nullable=False)
    qty_per_unit = Column(Decimal(10, 2), nullable=False)
    unit = Column(String, nullable=False)

    menu_item = relationship("MenuItem", back_populates="menu_ingredients")
    stock = relationship("Stock", back_populates="menu_ingredients")


class Order(Base):
    __tablename__ = "orders"

    order_id = Column(SERIAL, primary_key=True, index=True)
    membership_id = Column(Integer, ForeignKey(
        "memberships.membership_id"), nullable=True)
    employee_id = Column(Integer, ForeignKey(
        "employees.employee_id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    total_price = Column(Decimal(10, 2), nullable=False)
    status = Column(String, nullable=False)  # UNPAID, PAID, CANCELLED
    order_type = Column(String, nullable=False)  # DINE_IN, TAKEAWAY, DELIVERY

    membership = relationship("Membership", back_populates="orders")
    employee = relationship("Employee", back_populates="orders")
    order_items = relationship("OrderItem", back_populates="order")
    payment = relationship("Payment", back_populates="order", uselist=False)


class OrderItem(Base):
    __tablename__ = "order_items"

    order_item_id = Column(SERIAL, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey(
        "menu_items.menu_item_id"), nullable=False)
    status = Column(String, nullable=False)  # PREPARING, DONE, CANCELLED
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Decimal(10, 2), nullable=False)
    line_total = Column(Decimal(10, 2), nullable=False)

    order = relationship("Order", back_populates="order_items")
    menu_item = relationship("MenuItem", back_populates="order_items")


class Payment(Base):
    __tablename__ = "payments"

    order_id = Column(Integer, ForeignKey("orders.order_id"), primary_key=True)
    paid_price = Column(Decimal(10, 2), nullable=False)
    points_used = Column(Integer, default=0, nullable=False)
    # CASH, QR, CARD, POINTS, etc.
    payment_method = Column(String, nullable=False)
    payment_ref = Column(String, nullable=True)
    paid_timestamp = Column(DateTime, nullable=True)

    order = relationship("Order", back_populates="payment")
