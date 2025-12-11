from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.get("/", response_model=List[schemas.Payment])
def get_payments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    payments = db.query(models.Payments).offset(skip).limit(limit).all()
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

    # Create payment
    db_payment = models.Payments(
        order_id=payment.order_id,
        paid_price=payment.paid_price,
        points_used=payment.points_used,
        payment_method=payment.payment_method,
        payment_ref=payment.payment_ref,
        paid_timestamp=payment.paid_timestamp or datetime.now()
    )
    db.add(db_payment)

    # Update order status to PAID
    order.status = "PAID"

    # If points were used, deduct from membership
    if payment.points_used > 0 and order.membership_id:
        membership = db.query(models.Memberships).filter(
            models.Memberships.membership_id == order.membership_id
        ).first()
        if membership:
            membership.points_balance = max(
                0, membership.points_balance - payment.points_used)

    # Award points to membership (if applicable)
    if order.membership_id:
        membership = db.query(models.Memberships).filter(
            models.Memberships.membership_id == order.membership_id
        ).first()
        if membership:
            # Award points based on paid_price (e.g., 1 point per 10 baht)
            points_earned = int(payment.paid_price / 10)
            membership.points_balance += points_earned

    db.commit()
    db.refresh(db_payment)
    return db_payment


@router.put("/{order_id}", response_model=schemas.Payment)
def update_payment(order_id: int, payment: schemas.PaymentBase, db: Session = Depends(get_db)):
    db_payment = db.query(models.Payments).filter(
        models.Payments.order_id == order_id).first()
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    for key, value in payment.dict().items():
        setattr(db_payment, key, value)

    db.commit()
    db.refresh(db_payment)
    return db_payment


@router.delete("/{order_id}")
def delete_payment(order_id: int, db: Session = Depends(get_db)):
    db_payment = db.query(models.Payments).filter(
        models.Payments.order_id == order_id).first()
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    # Update order status back to UNPAID
    order = db.query(models.Orders).filter(
        models.Orders.order_id == order_id).first()
    if order:
        order.status = "UNPAID"

    db.delete(db_payment)
    db.commit()
    return {"message": "Payment deleted successfully"}
