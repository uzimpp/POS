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
    order_items = db.query(models.OrderItems).offset(skip).limit(limit).all()
    return order_items


@router.get("/{order_item_id}", response_model=schemas.OrderItem)
def get_order_item(order_item_id: int, db: Session = Depends(get_db)):
    order_item = db.query(models.OrderItems).filter(
        models.OrderItems.order_item_id == order_item_id).first()
    if not order_item:
        raise HTTPException(status_code=404, detail="Order item not found")
    return order_item


@router.get("/order/{order_id}", response_model=List[schemas.OrderItem])
def get_order_items_by_order(order_id: int, db: Session = Depends(get_db)):
    order_items = db.query(models.OrderItems).filter(
        models.OrderItems.order_id == order_id).all()
    return order_items


@router.post("/", response_model=schemas.OrderItem)
def create_order_item(order_item: schemas.OrderItemCreate, db: Session = Depends(get_db)):
    # Verify order exists
    order = db.query(models.Orders).filter(
        models.Orders.order_id == order_item.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Validate menu item exists and is available
    menu_item = db.query(models.MenuItems).filter(
        models.MenuItems.menu_item_id == order_item.menu_item_id
    ).first()
    if not menu_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    if not menu_item.is_available:
        raise HTTPException(
            status_code=400,
            detail=f"Menu item '{menu_item.name}' (ID: {order_item.menu_item_id}) is not available"
        )
    if order_item.quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than 0"
        )

    # Always copy price from menu item (snapshot at time of ordering)
    unit_price = menu_item.price
    line_total = order_item.quantity * unit_price

    db_order_item = models.OrderItems(
        order_id=order_item.order_id,
        menu_item_id=order_item.menu_item_id,
        status=order_item.status or "PREPARING",
        quantity=order_item.quantity,
        unit_price=unit_price,  # Store the price at time of ordering
        line_total=line_total
    )
    db.add(db_order_item)

    # Recalculate order total
    order_total = db.query(func.sum(models.OrderItems.line_total)).filter(
        models.OrderItems.order_id == order_item.order_id
    ).scalar() or Decimal("0")
    order.total_price = order_total

    db.commit()
    db.refresh(db_order_item)
    return db_order_item


@router.put("/{order_item_id}", response_model=schemas.OrderItem)
def update_order_item(order_item_id: int, order_item: schemas.OrderItemCreate, db: Session = Depends(get_db)):
    db_order_item = db.query(models.OrderItems).filter(
        models.OrderItems.order_item_id == order_item_id).first()
    if not db_order_item:
        raise HTTPException(status_code=404, detail="Order item not found")

    # Validate menu item exists and is available (if menu_item_id changed)
    menu_item = None
    if order_item.menu_item_id != db_order_item.menu_item_id:
        menu_item = db.query(models.MenuItems).filter(
            models.MenuItems.menu_item_id == order_item.menu_item_id
        ).first()
        if not menu_item:
            raise HTTPException(status_code=404, detail="Menu item not found")
        if not menu_item.is_available:
            raise HTTPException(
                status_code=400,
                detail=f"Menu item '{menu_item.name}' (ID: {order_item.menu_item_id}) is not available"
            )

    if order_item.quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than 0"
        )

    # Always get price from menu item (if menu_item_id changed, get new price; otherwise keep existing)
    if order_item.menu_item_id != db_order_item.menu_item_id:
        # Menu item changed - use the new menu item's current price
        unit_price = menu_item.price
    else:
        # Same menu item - keep the original price snapshot (don't update to current price)
        unit_price = db_order_item.unit_price

    # Recalculate line_total
    line_total = order_item.quantity * unit_price

    order_id = db_order_item.order_id
    db_order_item.menu_item_id = order_item.menu_item_id
    db_order_item.quantity = order_item.quantity
    db_order_item.unit_price = unit_price  # Store the price at time of update
    db_order_item.status = order_item.status or "PREPARING"
    db_order_item.line_total = line_total

    # Recalculate order total
    order = db.query(models.Orders).filter(
        models.Orders.order_id == order_id).first()
    if order:
        order_total = db.query(func.sum(models.OrderItems.line_total)).filter(
            models.OrderItems.order_id == order_id
        ).scalar() or Decimal("0")
        order.total_price = order_total

    db.commit()
    db.refresh(db_order_item)
    return db_order_item


@router.delete("/{order_item_id}")
def delete_order_item(order_item_id: int, db: Session = Depends(get_db)):
    db_order_item = db.query(models.OrderItems).filter(
        models.OrderItems.order_item_id == order_item_id).first()
    if not db_order_item:
        raise HTTPException(status_code=404, detail="Order item not found")

    order_id = db_order_item.order_id
    db.delete(db_order_item)

    # Recalculate order total
    order = db.query(models.Orders).filter(
        models.Orders.order_id == order_id).first()
    if order:
        order_total = db.query(func.sum(models.OrderItems.line_total)).filter(
            models.OrderItems.order_id == order_id
        ).scalar() or Decimal("0")
        order.total_price = order_total

    db.commit()
    return {"message": "Order item deleted successfully"}
