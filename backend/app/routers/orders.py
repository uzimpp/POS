from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from decimal import Decimal
from datetime import datetime
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.get("/", response_model=List[schemas.Order])
def get_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    orders = db.query(models.Orders).offset(skip).limit(limit).all()
    return orders


@router.get("/{order_id}", response_model=schemas.Order)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Orders).filter(
        models.Orders.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("/", response_model=schemas.Order)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    # Calculate total_price from order items
    total_price = Decimal("0")
    for item in order.order_items:
        line_total = item.quantity * item.unit_price
        total_price += line_total

    # Create order
    db_order = models.Orders(
        membership_id=order.membership_id,
        employee_id=order.employee_id,
        order_type=order.order_type,
        status=order.status,
        total_price=total_price
    )
    db.add(db_order)
    db.flush()
    db.refresh(db_order)

    # Create order items
    for item in order.order_items:
        line_total = item.quantity * item.unit_price
        db_order_item = models.OrderItems(
            order_id=db_order.order_id,
            menu_item_id=item.menu_item_id,
            status=item.status or "PREPARING",
            quantity=item.quantity,
            unit_price=item.unit_price,
            line_total=line_total
        )
        db.add(db_order_item)

    db.commit()
    db.refresh(db_order)
    return db_order


@router.put("/{order_id}", response_model=schemas.Order)
def update_order(order_id: int, order: schemas.OrderCreate, db: Session = Depends(get_db)):
    db_order = db.query(models.Orders).filter(
        models.Orders.order_id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Recalculate total_price if order items changed
    total_price = Decimal("0")
    for item in order.order_items:
        line_total = item.quantity * item.unit_price
        total_price += line_total

    # Update order fields
    db_order.membership_id = order.membership_id
    db_order.employee_id = order.employee_id
    db_order.order_type = order.order_type
    db_order.status = order.status
    db_order.total_price = total_price

    # Delete existing order items and create new ones
    db.query(models.OrderItems).filter(
        models.OrderItems.order_id == order_id).delete()

    for item in order.order_items:
        line_total = item.quantity * item.unit_price
        db_order_item = models.OrderItems(
            order_id=db_order.order_id,
            menu_item_id=item.menu_item_id,
            status=item.status or "PREPARING",
            quantity=item.quantity,
            unit_price=item.unit_price,
            line_total=line_total
        )
        db.add(db_order_item)

    db.commit()
    db.refresh(db_order)
    return db_order


@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    db_order = db.query(models.Orders).filter(
        models.Orders.order_id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    db.delete(db_order)
    db.commit()
    return {"message": "Order deleted successfully"}
