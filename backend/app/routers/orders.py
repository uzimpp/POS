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
    # Validate branch exists
    branch = db.query(models.Branches).filter(
        models.Branches.branch_id == order.branch_id
    ).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    # Validate employee exists
    employee = db.query(models.Employees).filter(
        models.Employees.employee_id == order.employee_id
    ).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Validate and fetch menu items, copy prices
    menu_item_ids = [item.menu_item_id for item in order.order_items]
    menu_items = db.query(models.Menu).filter(
        models.Menu.menu_item_id.in_(menu_item_ids)
    ).all()

    menu_items_dict = {mi.menu_item_id: mi for mi in menu_items}

    # Validate all menu items exist and are available
    for item in order.order_items:
        if item.menu_item_id not in menu_items_dict:
            raise HTTPException(
                status_code=404,
                detail=f"Menu item {item.menu_item_id} not found"
            )
        menu_item = menu_items_dict[item.menu_item_id]
        if not menu_item.is_available:
            raise HTTPException(
                status_code=400,
                detail=f"Menu item '{menu_item.name}' (ID: {item.menu_item_id}) is not available"
            )
        if item.quantity <= 0:
            raise HTTPException(
                status_code=400,
                detail=f"Quantity must be greater than 0 for menu item {item.menu_item_id}"
            )

    # Calculate total_price from order items (always using menu item prices)
    total_price = Decimal("0")
    for item in order.order_items:
        menu_item = menu_items_dict[item.menu_item_id]
        # Always use menu item price (snapshot at time of ordering)
        unit_price = menu_item.price
        line_total = item.quantity * unit_price
        total_price += line_total

    # Create order
    db_order = models.Orders(
        branch_id=order.branch_id,
        membership_id=order.membership_id,
        employee_id=order.employee_id,
        order_type=order.order_type,
        status=order.status,
        total_price=total_price
    )
    db.add(db_order)
    db.flush()
    db.refresh(db_order)

    # Create order items with prices copied from menu items
    for item in order.order_items:
        menu_item = menu_items_dict[item.menu_item_id]
        # Always copy price from menu item (snapshot at time of ordering)
        unit_price = menu_item.price
        line_total = item.quantity * unit_price

        db_order_item = models.OrderItems(
            order_id=db_order.order_id,
            menu_item_id=item.menu_item_id,
            status=item.status or "PREPARING",
            quantity=item.quantity,
            unit_price=unit_price,  # Store the price at time of ordering
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

    # Validate branch exists
    branch = db.query(models.Branches).filter(
        models.Branches.branch_id == order.branch_id
    ).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    # Validate employee exists
    employee = db.query(models.Employees).filter(
        models.Employees.employee_id == order.employee_id
    ).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Validate membership if provided
    if order.membership_id:
        membership = db.query(models.Memberships).filter(
            models.Memberships.membership_id == order.membership_id
        ).first()
        if not membership:
            raise HTTPException(status_code=404, detail="Membership not found")

    # Validate and fetch menu items, copy prices
    menu_item_ids = [item.menu_item_id for item in order.order_items]
    menu_items = db.query(models.Menu).filter(
        models.Menu.menu_item_id.in_(menu_item_ids)
    ).all()

    menu_items_dict = {mi.menu_item_id: mi for mi in menu_items}

    # Validate all menu items exist and are available
    for item in order.order_items:
        if item.menu_item_id not in menu_items_dict:
            raise HTTPException(
                status_code=404,
                detail=f"Menu item {item.menu_item_id} not found"
            )
        menu_item = menu_items_dict[item.menu_item_id]
        if not menu_item.is_available:
            raise HTTPException(
                status_code=400,
                detail=f"Menu item '{menu_item.name}' (ID: {item.menu_item_id}) is not available"
            )
        if item.quantity <= 0:
            raise HTTPException(
                status_code=400,
                detail=f"Quantity must be greater than 0 for menu item {item.menu_item_id}"
            )

    # Recalculate total_price using menu item prices
    total_price = Decimal("0")
    for item in order.order_items:
        menu_item = menu_items_dict[item.menu_item_id]
        # Always use menu item price (snapshot at time of ordering)
        unit_price = menu_item.price
        line_total = item.quantity * unit_price
        total_price += line_total

    # Update order fields
    db_order.branch_id = order.branch_id
    db_order.membership_id = order.membership_id
    db_order.employee_id = order.employee_id
    db_order.order_type = order.order_type
    db_order.status = order.status
    db_order.total_price = total_price

    # Delete existing order items and create new ones
    db.query(models.OrderItems).filter(
        models.OrderItems.order_id == order_id).delete()

    for item in order.order_items:
        menu_item = menu_items_dict[item.menu_item_id]
        # Always copy price from menu item (snapshot at time of ordering)
        unit_price = menu_item.price
        line_total = item.quantity * unit_price

        db_order_item = models.OrderItems(
            order_id=db_order.order_id,
            menu_item_id=item.menu_item_id,
            status=item.status or "PREPARING",
            quantity=item.quantity,
            unit_price=unit_price,  # Store the price at time of ordering
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
