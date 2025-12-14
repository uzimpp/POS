from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional, List

from pydantic import BaseModel, Field


# =========================
# Branch Schemas
# =========================
class BranchBase(BaseModel):
    name: str = Field(..., max_length=50)
    address: str = Field(..., max_length=200)
    phone: str = Field(..., min_length=9, max_length=10,
                       pattern=r"^[0-9]+$", description="Thai phone number: 9 digits (company) or 10 digits (mobile)")
    is_deleted: bool = False


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
    role_name: str = Field(..., max_length=50)
    seniority: int = Field(..., ge=0)  # Higher = more senior


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
    is_deleted: bool = False
    salary: int = Field(..., ge=0)  # Monthly salary in baht (integer)


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
    name: str = Field(..., max_length=100)
    phone: str = Field(..., min_length=9, max_length=10,
                       pattern=r"^[0-9]+$", description="Thai phone number: 9 digits (company) or 10 digits (mobile)")
    email: Optional[str] = Field(
        None, max_length=100, pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    points_balance: int = Field(0, ge=0)
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
    ingredient_id: int
    amount_remaining: Decimal = Field(..., ge=0)
    is_deleted: bool = False


class StockCreate(StockBase):
    pass


class Stock(StockBase):
    stock_id: int
    branch: Optional[Branch] = None
    ingredient: Optional[Ingredient] = None

    class Config:
        from_attributes = True


# =========================
# Ingredient Schemas
# =========================
class IngredientBase(BaseModel):
    name: str = Field(..., max_length=100)
    base_unit: str = Field(..., max_length=20)  # "g", "ml", "piece"
    is_deleted: bool = False


class IngredientCreate(IngredientBase):
    pass


class Ingredient(IngredientBase):
    ingredient_id: int

    class Config:
        from_attributes = True


# =========================
# Menu Schemas (renamed from MenuItem)
# =========================
class MenuBase(BaseModel):
    name: str = Field(..., max_length=100)
    # dish, addon, set
    type: str = Field(..., max_length=50)
    description: Optional[str] = Field(None, max_length=255)
    price: Decimal = Field(..., ge=0)
    category: str                   # Main, Topping, Drink, Appetizer
    is_available: bool = True


class MenuCreate(MenuBase):
    pass


class Menu(MenuBase):
    menu_item_id: int

    class Config:
        from_attributes = True


# =========================
# Recipe Schemas (renamed from MenuIngredient)
# =========================
class RecipeBase(BaseModel):
    menu_item_id: int
    ingredient_id: int
    qty_per_unit: Decimal


class RecipeCreate(RecipeBase):
    pass


class Recipe(RecipeBase):
    id: int
    menu_item: Optional[Menu] = None
    ingredient: Optional[Ingredient] = None

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
    status: str = "PREPARING"
    # unit_price is NOT included - it will always be copied from menu_item.price


class OrderItemStatusUpdate(BaseModel):
    status: str  # PREPARING, DONE, CANCELLED


class OrderItem(OrderItemBase):
    order_item_id: int
    order_id: int
    menu_item: Optional[Menu] = None

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


class OrderCreateEmpty(BaseModel):
    branch_id: int
    employee_id: int
    order_type: str = "DINE_IN"  # DINE_IN, TAKEAWAY, DELIVERY


class Order(OrderBase):
    order_id: int
    created_at: datetime
    total_price: Decimal

    membership: Optional[Membership] = None
    employee: Optional[Employee] = None
    branch: Optional[Branch] = None

    order_items: List[OrderItem] = []
    payment: Optional["PaymentInOrder"] = None
    stock_movements: List["StockMovementInOrder"] = []

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


class PaymentCreate(BaseModel):
    order_id: int
    # Optional - backend will calculate from order.total_price and points_used
    paid_price: Optional[Decimal] = None
    points_used: int = 0
    payment_method: str             # CASH, QR, CARD, POINTS, etc.
    payment_ref: Optional[str] = None
    paid_timestamp: Optional[datetime] = None


class Payment(PaymentBase):
    order_id: int
    order: Optional[Order] = None

    class Config:
        from_attributes = True


# Payment schema for nested use in Order (excludes circular order reference)
class PaymentInOrder(PaymentBase):
    order_id: int

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


# StockMovement schema for nested use in Order (excludes circular order reference)
class StockMovementInOrder(StockMovementBase):
    movement_id: int
    created_at: datetime
    stock: Optional[Stock] = None
    employee: Optional[Employee] = None

    class Config:
        from_attributes = True


# For Pydantic v2 circular references
Order.model_rebuild()
Payment.model_rebuild()
PaymentInOrder.model_rebuild()
StockMovement.model_rebuild()
StockMovementInOrder.model_rebuild()
Recipe.model_rebuild()
Stock.model_rebuild()
