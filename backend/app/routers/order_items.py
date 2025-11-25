from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from decimal import Decimal
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/order-items", tags=["order-items"])


@router.get("/", response_model=List[schemas.OrderItem])
def get_order_items(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    order_items = db.query(models.OrderItem).offset(skip).limit(limit).all()
    return order_items


@router.get("/{order_item_id}", response_model=schemas.OrderItem)
def get_order_item(order_item_id: int, db: Session = Depends(get_db)):
    order_item = db.query(models.OrderItem).filter(
        models.OrderItem.order_item_id == order_item_id).first()
    if not order_item:
        raise HTTPException(status_code=404, detail="Order item not found")
    return order_item


@router.get("/order/{order_id}", response_model=List[schemas.OrderItem])
def get_order_items_by_order(order_id: int, db: Session = Depends(get_db)):
    order_items = db.query(models.OrderItem).filter(
        models.OrderItem.order_id == order_id).all()
    return order_items


@router.post("/", response_model=schemas.OrderItem)
def create_order_item(order_item: schemas.OrderItemCreate, db: Session = Depends(get_db)):
    # Verify order exists
    order = db.query(models.Order).filter(
        models.Order.order_id == order_item.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Calculate line_total
    line_total = order_item.quantity * order_item.unit_price

    db_order_item = models.OrderItem(
        order_id=order_item.order_id,
        menu_item_id=order_item.menu_item_id,
        status=order_item.status or "PREPARING",
        quantity=order_item.quantity,
        unit_price=order_item.unit_price,
        line_total=line_total
    )
    db.add(db_order_item)

    # Recalculate order total
    order_total = db.query(func.sum(models.OrderItem.line_total)).filter(
        models.OrderItem.order_id == order_item.order_id
    ).scalar() or Decimal("0")
    order.total_price = order_total

    db.commit()
    db.refresh(db_order_item)
    return db_order_item


@router.put("/{order_item_id}", response_model=schemas.OrderItem)
def update_order_item(order_item_id: int, order_item: schemas.OrderItemCreate, db: Session = Depends(get_db)):
    db_order_item = db.query(models.OrderItem).filter(
        models.OrderItem.order_item_id == order_item_id).first()
    if not db_order_item:
        raise HTTPException(status_code=404, detail="Order item not found")

    # Recalculate line_total if quantity or unit_price changed
    line_total = order_item.quantity * order_item.unit_price

    order_id = db_order_item.order_id
    db_order_item.menu_item_id = order_item.menu_item_id
    db_order_item.quantity = order_item.quantity
    db_order_item.unit_price = order_item.unit_price
    db_order_item.status = order_item.status or "PREPARING"
    db_order_item.line_total = line_total

    # Recalculate order total
    order = db.query(models.Order).filter(
        models.Order.order_id == order_id).first()
    if order:
        order_total = db.query(func.sum(models.OrderItem.line_total)).filter(
            models.OrderItem.order_id == order_id
        ).scalar() or Decimal("0")
        order.total_price = order_total

    db.commit()
    db.refresh(db_order_item)
    return db_order_item


@router.delete("/{order_item_id}")
def delete_order_item(order_item_id: int, db: Session = Depends(get_db)):
    db_order_item = db.query(models.OrderItem).filter(
        models.OrderItem.order_item_id == order_item_id).first()
    if not db_order_item:
        raise HTTPException(status_code=404, detail="Order item not found")

    order_id = db_order_item.order_id
    db.delete(db_order_item)

    # Recalculate order total
    order = db.query(models.Order).filter(
        models.Order.order_id == order_id).first()
    if order:
        order_total = db.query(func.sum(models.OrderItem.line_total)).filter(
            models.OrderItem.order_id == order_id
        ).scalar() or Decimal("0")
        order.total_price = order_total

    db.commit()
    return {"message": "Order item deleted successfully"}
