from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional, List

from pydantic import BaseModel


# =========================
# Branch Schemas
# =========================
class BranchBase(BaseModel):
    name: str
    address: str
    phone: str
    is_active: bool = True


class BranchCreate(BranchBase):
    pass


class Branch(BranchBase):
    branch_id: int

    class Config:
        from_attributes = True


# =========================
# Role Schemas
# =========================
class RoleBase(BaseModel):
    role_name: str
    tier: int  # Higher = more senior


class RoleCreate(RoleBase):
    pass


class Role(RoleBase):
    role_id: int

    class Config:
        from_attributes = True


# =========================
# Tier Schemas (Membership Tiers)
# =========================
class TierBase(BaseModel):
    tier_name: str           # Bronze, Silver, Gold, etc.
    tier: int                # 0, 1, 2, 3 ...


class TierCreate(TierBase):
    pass


class Tier(TierBase):
    tier_id: int

    class Config:
        from_attributes = True


# =========================
# Employee Schemas
# =========================
class EmployeeBase(BaseModel):
    branch_id: int
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
    branch: Optional[Branch] = None

    class Config:
        from_attributes = True


# =========================
# Membership Schemas
# =========================
class MembershipBase(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    points_balance: int = 0
    tier_id: int  # FK → tiers.tier_id


class MembershipCreate(MembershipBase):
    pass


class Membership(MembershipBase):
    membership_id: int
    joined_at: datetime
    tier: Optional[Tier] = None

    class Config:
        from_attributes = True


# =========================
# Stock Schemas
# =========================
class StockBase(BaseModel):
    branch_id: int
    stk_name: str
    amount_remaining: Decimal
    unit: str


class StockCreate(StockBase):
    pass


class Stock(StockBase):
    stock_id: int
    branch: Optional[Branch] = None

    class Config:
        from_attributes = True


# =========================
# Menu Item Schemas
# =========================
class MenuItemBase(BaseModel):
    name: str
    type: str                       # dish, addon, set
    description: Optional[str] = None
    price: Decimal
    category: str                   # Main, Topping, Drink, Appetizer
    is_available: bool = True


class MenuItemCreate(MenuItemBase):
    pass


class MenuItem(MenuItemBase):
    menu_item_id: int

    class Config:
        from_attributes = True


# =========================
# Menu Ingredient Schemas
# =========================
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


# =========================
# Order Item Schemas
# =========================
class OrderItemBase(BaseModel):
    menu_item_id: int
    status: str                     # PREPARING, DONE, CANCELLED
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


# =========================
# Order Schemas
# =========================
class OrderBase(BaseModel):
    branch_id: int
    membership_id: Optional[int] = None
    employee_id: int
    order_type: str                 # DINE_IN, TAKEAWAY, DELIVERY
    status: str = "UNPAID"          # UNPAID, PAID, CANCELLED


class OrderCreate(OrderBase):
    order_items: List[OrderItemCreate]


class Order(OrderBase):
    order_id: int
    created_at: datetime
    total_price: Decimal

    membership: Optional[Membership] = None
    employee: Optional[Employee] = None
    branch: Optional[Branch] = None

    order_items: List[OrderItem] = []
    payment: Optional["Payment"] = None
    stock_movements: List["StockMovement"] = []

    class Config:
        from_attributes = True


# =========================
# Payment Schemas (1:1 with Orders)
# =========================
class PaymentBase(BaseModel):
    paid_price: Decimal
    points_used: int = 0
    payment_method: str             # CASH, QR, CARD, POINTS, etc.
    payment_ref: Optional[str] = None
    paid_timestamp: Optional[datetime] = None


class PaymentCreate(PaymentBase):
    order_id: int


class Payment(PaymentBase):
    order_id: int
    order: Optional[Order] = None

    class Config:
        from_attributes = True


# =========================
# Stock Movement Schemas
# =========================
class StockMovementBase(BaseModel):
    stock_id: int
    qty_change: Decimal             # + = in, - = out
    reason: str                     # RESTOCK, SALE, WASTE, ADJUST
    employee_id: Optional[int] = None
    order_id: Optional[int] = None
    note: Optional[str] = None


class StockMovementCreate(StockMovementBase):
    pass


class StockMovement(StockMovementBase):
    movement_id: int
    created_at: datetime
    stock: Optional[Stock] = None
    employee: Optional[Employee] = None
    order: Optional[Order] = None

    class Config:
        from_attributes = True


# For Pydantic v2 circular references
Order.model_rebuild()
Payment.model_rebuild()
StockMovement.model_rebuild()
