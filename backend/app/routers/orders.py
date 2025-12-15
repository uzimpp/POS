from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import func
from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.get("/", response_model=List[schemas.Order])
def get_orders(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = Query(
        None, description="Filter by order status (e.g., PAID, PENDING, UNPAID, CANCELLED)"),
    order_type: Optional[str] = Query(
        None, description="Filter by order type (e.g., DINE_IN, TAKEAWAY, DELIVERY)"),
    db: Session = Depends(get_db)
):
    query = db.query(models.Orders).options(
        joinedload(models.Orders.employee),
        joinedload(models.Orders.membership),
        joinedload(models.Orders.branch),
        selectinload(models.Orders.order_items).joinedload(
            models.OrderItems.menu_item),
        joinedload(models.Orders.payment),
        selectinload(models.Orders.stock_movements)
    )

    if status:
        query = query.filter(models.Orders.status == status)

    if order_type:
        query = query.filter(models.Orders.order_type == order_type)

    # Sort by created_at descending (most recent first) by default
    orders = query.order_by(models.Orders.created_at.desc()).offset(
        skip).limit(limit).all()
    return orders


@router.get("/{order_id}", response_model=schemas.Order)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Orders).options(
        joinedload(models.Orders.employee),
        joinedload(models.Orders.membership),
        joinedload(models.Orders.branch),
        selectinload(models.Orders.order_items).joinedload(
            models.OrderItems.menu_item),
        joinedload(models.Orders.payment),
        selectinload(models.Orders.stock_movements)
    ).filter(
        models.Orders.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("/empty", response_model=schemas.Order)
def create_empty_order(order: schemas.OrderCreateEmpty, db: Session = Depends(get_db)):
    """Create an empty order (no items) for order-taking flow."""
    # Validate branch exists and is active
    branch = db.query(models.Branches).filter(
        models.Branches.branch_id == order.branch_id
    ).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    if branch.is_deleted:
        raise HTTPException(status_code=400, detail="Branch is not active")

    # Validate employee exists and is active
    employee = db.query(models.Employees).filter(
        models.Employees.employee_id == order.employee_id
    ).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    if employee.is_deleted:
        raise HTTPException(status_code=400, detail="Employee is not active")

    # Validate employee belongs to the branch
    if employee.branch_id != order.branch_id:
        raise HTTPException(
            status_code=400,
            detail="Employee does not belong to the selected branch"
        )

    # Create empty order
    db_order = models.Orders(
        branch_id=order.branch_id,
        membership_id=None,
        employee_id=order.employee_id,
        order_type=order.order_type,
        status="UNPAID",
        total_price=Decimal("0")
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    # Load relationships before returning
    db_order = db.query(models.Orders).options(
        joinedload(models.Orders.employee),
        joinedload(models.Orders.membership),
        joinedload(models.Orders.branch),
        selectinload(models.Orders.order_items).joinedload(
            models.OrderItems.menu_item),
        joinedload(models.Orders.payment),
        selectinload(models.Orders.stock_movements)
    ).filter(models.Orders.order_id == db_order.order_id).first()
    return db_order


@router.post("/", response_model=schemas.Order)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    # Validate branch exists
    branch = db.query(models.Branches).filter(
        models.Branches.branch_id == order.branch_id
    ).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    # Validate employee exists and is active
    employee = db.query(models.Employees).filter(
        models.Employees.employee_id == order.employee_id
    ).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    if employee.is_deleted:
        raise HTTPException(status_code=400, detail="Employee is not active")

    # Validate employee belongs to the branch
    if employee.branch_id != order.branch_id:
        raise HTTPException(
            status_code=400,
            detail="Employee does not belong to the selected branch"
        )

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
    # Exclude cancelled items from total
    total_price = Decimal("0")
    for item in order.order_items:
        # Skip cancelled items in total calculation
        if item.status == "CANCELLED":
            continue
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
            status="ORDERED",  # Always start as ORDERED
            quantity=item.quantity,
            unit_price=unit_price,
            line_total=line_total
        )
        db.add(db_order_item)

    db.commit()
    db.refresh(db_order)
    # Load relationships before returning
    db_order = db.query(models.Orders).options(
        joinedload(models.Orders.employee),
        joinedload(models.Orders.membership),
        joinedload(models.Orders.branch),
        selectinload(models.Orders.order_items).joinedload(
            models.OrderItems.menu_item),
        joinedload(models.Orders.payment),
        selectinload(models.Orders.stock_movements)
    ).filter(models.Orders.order_id == db_order.order_id).first()
    return db_order


@router.put("/{order_id}", response_model=schemas.Order)
def update_order(order_id: int, order: schemas.OrderCreate, db: Session = Depends(get_db)):
    db_order = db.query(models.Orders).filter(
        models.Orders.order_id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Prevent updating paid or cancelled orders - these are final states
    if db_order.status == "PAID":
        raise HTTPException(
            status_code=400,
            detail="Cannot update a paid order. PAID orders are final and cannot be modified or reverted."
        )
    if db_order.status == "CANCELLED":
        raise HTTPException(
            status_code=400,
            detail="Cannot update a cancelled order. CANCELLED orders are final and cannot be modified or reverted."
        )

    # Validate branch exists and is active
    branch = db.query(models.Branches).filter(
        models.Branches.branch_id == order.branch_id
    ).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    if branch.is_deleted:
        raise HTTPException(status_code=400, detail="Branch is not active")

    # Validate employee exists and is active
    employee = db.query(models.Employees).filter(
        models.Employees.employee_id == order.employee_id
    ).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    if employee.is_deleted:
        raise HTTPException(status_code=400, detail="Employee is not active")

    # Validate employee belongs to the branch
    if employee.branch_id != order.branch_id:
        raise HTTPException(
            status_code=400,
            detail="Employee does not belong to the selected branch"
        )

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
    # Exclude cancelled items from total
    total_price = Decimal("0")
    for item in order.order_items:
        # Skip cancelled items in total calculation
        if item.status == "CANCELLED":
            continue
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
    # Don't allow changing status to PAID or CANCELLED through update_order
    # Status changes should go through specific endpoints (cancel_order, payment processing)
    if order.status not in ["UNPAID", "PENDING"]:
        raise HTTPException(
            status_code=400,
            detail="Cannot set order status to PAID or CANCELLED through update. Use cancel endpoint or payment processing."
        )
    db_order.status = order.status
    db_order.total_price = total_price

    # Delete existing order items and create new ones
    db.query(models.OrderItems).filter(
        models.OrderItems.order_id == order_id).delete()

    for item in order.order_items:
        menu_item = menu_items_dict[item.menu_item_id]
        unit_price = menu_item.price
        line_total = item.quantity * unit_price

        db_order_item = models.OrderItems(
            order_id=db_order.order_id,
            menu_item_id=item.menu_item_id,
            status="ORDERED",  # Always start as ORDERED
            quantity=item.quantity,
            unit_price=unit_price,
            line_total=line_total
        )
        db.add(db_order_item)

    db.commit()
    db.refresh(db_order)
    # Load relationships before returning
    db_order = db.query(models.Orders).options(
        joinedload(models.Orders.employee),
        joinedload(models.Orders.membership),
        joinedload(models.Orders.branch),
        selectinload(models.Orders.order_items).joinedload(
            models.OrderItems.menu_item),
        joinedload(models.Orders.payment),
        selectinload(models.Orders.stock_movements)
    ).filter(models.Orders.order_id == db_order.order_id).first()
    return db_order


@router.put("/{order_id}/cancel", response_model=schemas.Order)
def cancel_order(order_id: int, db: Session = Depends(get_db)):
    """
    Cancel an order. Only UNPAID orders can be cancelled.
    Cannot cancel if any item is PREPARING or DONE (chef already started/finished).
    All ORDERED items will be set to CANCELLED.
    """
    db_order = db.query(models.Orders).filter(
        models.Orders.order_id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")

    if db_order.status == "PAID":
        raise HTTPException(
            status_code=400,
            detail="Cannot cancel a paid order. PAID orders are final and cannot be reverted or cancelled."
        )

    if db_order.status == "CANCELLED":
        raise HTTPException(
            status_code=400,
            detail="Order is already cancelled. CANCELLED orders are final and cannot be modified."
        )

    # Check if any items are PREPARING or DONE - block cancellation
    order_items = db.query(models.OrderItems).filter(
        models.OrderItems.order_id == order_id
    ).all()

    preparing_count = sum(
        1 for item in order_items if item.status == "PREPARING")
    done_count = sum(1 for item in order_items if item.status == "DONE")

    if preparing_count > 0 or done_count > 0:
        details = []
        if preparing_count > 0:
            details.append(f"{preparing_count} item(s) PREPARING")
        if done_count > 0:
            details.append(f"{done_count} item(s) DONE")
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel order: {', '.join(details)}. Chef has already started cooking."
        )

    # Cancel all ORDERED items
    for item in order_items:
        if item.status == "ORDERED":
            item.status = "CANCELLED"

    db_order.status = "CANCELLED"
    db_order.total_price = Decimal("0")  # All items cancelled = 0 total

    db.commit()
    db.refresh(db_order)
    # Load relationships before returning
    db_order = db.query(models.Orders).options(
        joinedload(models.Orders.employee),
        joinedload(models.Orders.membership),
        joinedload(models.Orders.branch),
        selectinload(models.Orders.order_items).joinedload(
            models.OrderItems.menu_item),
        joinedload(models.Orders.payment),
        selectinload(models.Orders.stock_movements)
    ).filter(models.Orders.order_id == db_order.order_id).first()
    return db_order


@router.put("/{order_id}/membership", response_model=schemas.Order)
def update_order_membership(order_id: int, payload: schemas.OrderMembershipUpdate, db: Session = Depends(get_db)):
    """
    Assign or clear a membership for an order without modifying items.
    Only allowed for UNPAID or PENDING orders.
    """
    db_order = db.query(models.Orders).filter(models.Orders.order_id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")

    if db_order.status == "PAID":
        raise HTTPException(status_code=400, detail="Cannot update membership on a paid order")
    if db_order.status == "CANCELLED":
        raise HTTPException(status_code=400, detail="Cannot update membership on a cancelled order")

    # Validate membership if provided
    if payload.membership_id is not None:
        membership = db.query(models.Memberships).filter(models.Memberships.membership_id == payload.membership_id).first()
        if not membership:
            raise HTTPException(status_code=404, detail="Membership not found")
        db_order.membership_id = payload.membership_id
    else:
        db_order.membership_id = None

    db.commit()
    db.refresh(db_order)

    # Reload relationships for response
    db_order = db.query(models.Orders).options(
        joinedload(models.Orders.employee),
        joinedload(models.Orders.membership),
        joinedload(models.Orders.branch),
        selectinload(models.Orders.order_items).joinedload(models.OrderItems.menu_item),
        joinedload(models.Orders.payment),
        selectinload(models.Orders.stock_movements)
    ).filter(models.Orders.order_id == order_id).first()
    return db_order
