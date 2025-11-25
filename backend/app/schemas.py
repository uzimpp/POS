from pydantic import BaseModel, EmailStr
from datetime import datetime
from decimal import Decimal
from typing import Optional


# Role Schemas
class RoleBase(BaseModel):
    role_name: str
    ranking: int


class RoleCreate(RoleBase):
    pass


class Role(RoleBase):
    role_id: int

    class Config:
        from_attributes = True


# Employee Schemas
class EmployeeBase(BaseModel):
    role_id: int
    first_name: str
    last_name: str
    is_active: bool = True
    salary: int  # Monthly salary in baht (integer)


class EmployeeCreate(EmployeeBase):
    pass


class Employee(EmployeeBase):
    employee_id: int
    joined_date: datetime
    role: Optional[Role] = None

    class Config:
        from_attributes = True


# Membership Schemas
class MembershipBase(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    points_balance: int = 0
    membership_tier: str = "Bronze"  # Bronze, Silver, Gold, Platinum


class MembershipCreate(MembershipBase):
    pass


class Membership(MembershipBase):
    membership_id: int
    joined_at: datetime

    class Config:
        from_attributes = True


# Stock Schemas
class StockBase(BaseModel):
    stk_name: str
    amount_remaining: Decimal
    unit: str


class StockCreate(StockBase):
    pass


class Stock(StockBase):
    stock_id: int

    class Config:
        from_attributes = True


# Menu Item Schemas
class MenuItemBase(BaseModel):
    name: str
    type: str
    description: Optional[str] = None
    price: Decimal
    category: str
    is_available: bool = True


class MenuItemCreate(MenuItemBase):
    pass


class MenuItem(MenuItemBase):
    menu_item_id: int

    class Config:
        from_attributes = True


# Menu Ingredient Schemas
class MenuIngredientBase(BaseModel):
    menu_item_id: int
    stock_id: int
    qty_per_unit: Decimal
    unit: str


class MenuIngredientCreate(MenuIngredientBase):
    pass


class MenuIngredient(MenuIngredientBase):
    id: int
    menu_item: Optional[MenuItem] = None
    stock: Optional[Stock] = None

    class Config:
        from_attributes = True


# Order Item Schemas
class OrderItemBase(BaseModel):
    menu_item_id: int
    status: str
    quantity: int
    unit_price: Decimal
    line_total: Decimal


class OrderItemCreate(BaseModel):
    order_id: int
    menu_item_id: int
    quantity: int
    unit_price: Decimal
    status: str = "PREPARING"


class OrderItem(OrderItemBase):
    order_item_id: int
    order_id: int
    menu_item: Optional[MenuItem] = None

    class Config:
        from_attributes = True


# Order Schemas
class OrderBase(BaseModel):
    membership_id: Optional[int] = None
    employee_id: int
    order_type: str  # DINE_IN, TAKEAWAY, DELIVERY
    status: str = "UNPAID"  # UNPAID, PAID, CANCELLED


class OrderCreate(OrderBase):
    order_items: list[OrderItemCreate]


class Order(OrderBase):
    order_id: int
    created_at: datetime
    total_price: Decimal
    membership: Optional[Membership] = None
    employee: Optional[Employee] = None
    order_items: list[OrderItem] = []
    payment: Optional["Payment"] = None

    class Config:
        from_attributes = True


# Payment Schemas
class PaymentBase(BaseModel):
    paid_price: Decimal
    points_used: int = 0
    payment_method: str  # CASH, QR, CARD, POINTS, etc.
    payment_ref: Optional[str] = None
    paid_timestamp: Optional[datetime] = None


class PaymentCreate(PaymentBase):
    order_id: int


class Payment(PaymentBase):
    order_id: int
    order: Optional[Order] = None

    class Config:
        from_attributes = True
