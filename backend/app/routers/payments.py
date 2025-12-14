from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, extract
from typing import List, Optional
from datetime import datetime
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.get("/", response_model=List[schemas.Payment])
def get_payments(
    skip: int = 0,
    limit: int = 100,
    payment_method: Optional[str] = Query(
        None, description="Filter by payment method (e.g., CASH, CARD, QR, TRANSFER)"),
    year: Optional[int] = Query(
        None, description="Filter by year (e.g., 2024)"),
    month: Optional[int] = Query(
        None, description="Filter by month (1-12)"),
    quarter: Optional[int] = Query(
        None, description="Filter by quarter (1-4)"),
    search: Optional[str] = Query(
        None, description="Search by order_id or payment_ref"),
    db: Session = Depends(get_db)
):
    query = db.query(models.Payments)

    if payment_method:
        query = query.filter(models.Payments.payment_method == payment_method)

    # Date filtering - year, month, quarter can be combined independently
    if year:
        query = query.filter(
            extract('year', models.Payments.paid_timestamp) == year
        )

    if month:
        query = query.filter(
            extract('month', models.Payments.paid_timestamp) == month
        )

    if quarter:
        # Quarter 1: Jan-Mar (months 1-3)
        # Quarter 2: Apr-Jun (months 4-6)
        # Quarter 3: Jul-Sep (months 7-9)
        # Quarter 4: Oct-Dec (months 10-12)
        quarter_months = {
            1: [1, 2, 3],
            2: [4, 5, 6],
            3: [7, 8, 9],
            4: [10, 11, 12]
        }
        if quarter in quarter_months:
            query = query.filter(
                extract('month', models.Payments.paid_timestamp).in_(
                    quarter_months[quarter])
            )

    # Search functionality
    if search:
        try:
            # Try to parse as order_id (integer)
            order_id = int(search)
            query = query.filter(models.Payments.order_id == order_id)
        except ValueError:
            # If not a number, search in payment_ref
            query = query.filter(
                models.Payments.payment_ref.ilike(f"%{search}%")
            )

    payments = query.order_by(models.Payments.paid_timestamp.desc()).offset(
        skip).limit(limit).all()
    return payments


@router.get("/{order_id}", response_model=schemas.Payment)
def get_payment(order_id: int, db: Session = Depends(get_db)):
    payment = db.query(models.Payments).filter(
        models.Payments.order_id == order_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


@router.post("/", response_model=schemas.Payment)
def create_payment(payment: schemas.PaymentCreate, db: Session = Depends(get_db)):
    from decimal import Decimal

    # Verify order exists
    order = db.query(models.Orders).filter(
        models.Orders.order_id == payment.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Check if payment already exists
    existing_payment = db.query(models.Payments).filter(
        models.Payments.order_id == payment.order_id
    ).first()
    if existing_payment:
        raise HTTPException(
            status_code=400, detail="Payment already exists for this order")

    # Validate that all order items are either DONE or CANCELLED
    order_items = db.query(models.OrderItems).filter(
        models.OrderItems.order_id == payment.order_id
    ).all()

    if not order_items:
        raise HTTPException(
            status_code=400,
            detail="Cannot process payment for an order with no items"
        )

    # Check if any items are still ORDERED or PREPARING
    ordered_items = [item for item in order_items if item.status == "ORDERED"]
    preparing_items = [
        item for item in order_items if item.status == "PREPARING"]

    if ordered_items:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot process payment. {len(ordered_items)} order item(s) are still ORDERED (waiting for chef). All items must be DONE or CANCELLED before payment."
        )

    if preparing_items:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot process payment. {len(preparing_items)} order item(s) are still PREPARING. All items must be DONE or CANCELLED before payment."
        )

    # Check if there are any non-cancelled items (at least one item must be DONE)
    done_items = [item for item in order_items if item.status == "DONE"]
    if not done_items:
        raise HTTPException(
            status_code=400,
            detail="Cannot process payment. No DONE items found. At least one item must be DONE."
        )

    # Validate payment_ref is required for CARD and QR payment methods
    if payment.payment_method in ["CARD", "QR"]:
        if not payment.payment_ref or not payment.payment_ref.strip():
            raise HTTPException(
                status_code=400,
                detail=f"Payment reference (payment_ref) is required for {payment.payment_method} payments"
            )

    # Calculate final price from order.total_price and points_used
    # Backend calculates this to prevent manipulation
    total_price = Decimal(str(order.total_price))
    points_used = payment.points_used or 0

    # Validate points don't exceed membership balance
    if points_used > 0:
        if not order.membership_id:
            raise HTTPException(
                status_code=400,
                detail="Cannot use points without a membership"
            )
        membership = db.query(models.Memberships).filter(
            models.Memberships.membership_id == order.membership_id
        ).first()
        if not membership:
            raise HTTPException(
                status_code=404,
                detail="Membership not found"
            )
        if points_used > membership.points_balance:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient points. Available: {membership.points_balance}, Requested: {points_used}"
            )

    # Calculate final paid price (cannot be negative)
    paid_price = max(Decimal("0"), total_price - Decimal(str(points_used)))

    # If paid_price was provided, validate it matches our calculation
    if payment.paid_price:
        provided_paid_price = Decimal(str(payment.paid_price))
        # Allow small floating point differences
        if abs(provided_paid_price - paid_price) > Decimal("0.01"):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid paid_price. Expected: {paid_price}, Provided: {provided_paid_price}"
            )

    # Create payment with calculated paid_price
    db_payment = models.Payments(
        order_id=payment.order_id,
        paid_price=paid_price,  # Pass Decimal directly, SQLAlchemy handles it
        points_used=points_used,
        payment_method=payment.payment_method,
        payment_ref=payment.payment_ref,
        paid_timestamp=payment.paid_timestamp or datetime.now()
    )
    db.add(db_payment)

    # Update order status to PAID
    order.status = "PAID"

    # If points were used, deduct from membership
    if points_used > 0 and order.membership_id:
        membership = db.query(models.Memberships).filter(
            models.Memberships.membership_id == order.membership_id
        ).first()
        if membership:
            membership.points_balance = max(
                0, membership.points_balance - points_used)

    # Award points to membership (if applicable) based on calculated paid_price
    if order.membership_id:
        membership = db.query(models.Memberships).filter(
            models.Memberships.membership_id == order.membership_id
        ).first()
        if membership:
            # Award points based on paid_price (e.g., 1 point per 10 baht)
            points_earned = int(float(paid_price) / 10)
            membership.points_balance += points_earned

    db.commit()
    db.refresh(db_payment)
    # Load order relationship before returning (if needed by schema)
    # Payment schema includes order relationship, so we should load it
    db_payment = db.query(models.Payments).options(
        joinedload(models.Payments.order)
    ).filter(models.Payments.order_id == db_payment.order_id).first()
    return db_payment


@router.put("/{order_id}", response_model=schemas.Payment)
def update_payment(order_id: int, payment: schemas.PaymentBase, db: Session = Depends(get_db)):
    db_payment = db.query(models.Payments).filter(
        models.Payments.order_id == order_id).first()
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    # Validate payment_ref is required for CARD and QR payment methods
    # Use the new payment_method from request, or fall back to existing one
    payment_method = payment.payment_method
    # Use the new payment_ref from request, or fall back to existing one
    payment_ref = payment.payment_ref if payment.payment_ref is not None else db_payment.payment_ref

    if payment_method in ["CARD", "QR"]:
        if not payment_ref or not payment_ref.strip():
            raise HTTPException(
                status_code=400,
                detail=f"Payment reference (payment_ref) is required for {payment_method} payments"
            )

    for key, value in payment.dict().items():
        setattr(db_payment, key, value)

    db.commit()
    db.refresh(db_payment)
    return db_payment
