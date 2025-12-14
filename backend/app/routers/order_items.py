from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
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

    # Prevent adding items to paid or cancelled orders
    if order.status == "PAID":
        raise HTTPException(
            status_code=400,
            detail="Cannot add items to a paid order"
        )
    if order.status == "CANCELLED":
        raise HTTPException(
            status_code=400,
            detail="Cannot add items to a cancelled order"
        )

    # Validate menu item exists and is available
    menu_item = db.query(models.Menu).filter(
        models.Menu.menu_item_id == order_item.menu_item_id
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
    db.flush()  # Flush to ensure new item is visible in subsequent query

    # Recalculate order total (exclude cancelled items)
    order_total = db.query(func.sum(models.OrderItems.line_total)).filter(
        models.OrderItems.order_id == order_item.order_id,
        models.OrderItems.status != "CANCELLED"
    ).scalar() or Decimal("0")
    order.total_price = order_total

    db.commit()
    db.refresh(db_order_item)
    db.refresh(order)
    return db_order_item


@router.put("/{order_item_id}", response_model=schemas.OrderItem)
def update_order_item(order_item_id: int, order_item: schemas.OrderItemCreate, db: Session = Depends(get_db)):
    db_order_item = db.query(models.OrderItems).filter(
        models.OrderItems.order_item_id == order_item_id).first()
    if not db_order_item:
        raise HTTPException(status_code=404, detail="Order item not found")

    # Get the order to check its status
    order = db.query(models.Orders).filter(
        models.Orders.order_id == db_order_item.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Prevent updating items in paid or cancelled orders
    if order.status == "PAID":
        raise HTTPException(
            status_code=400,
            detail="Cannot update items in a paid order"
        )
    if order.status == "CANCELLED":
        raise HTTPException(
            status_code=400,
            detail="Cannot update items in a cancelled order"
        )

    # Validate menu item exists and is available (if menu_item_id changed)
    menu_item = None
    if order_item.menu_item_id != db_order_item.menu_item_id:
        menu_item = db.query(models.Menu).filter(
            models.Menu.menu_item_id == order_item.menu_item_id
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
    db.flush()  # Flush to ensure changes are visible in subsequent query

    # Recalculate order total (exclude cancelled items)
    order = db.query(models.Orders).filter(
        models.Orders.order_id == order_id).first()
    if order:
        order_total = db.query(func.sum(models.OrderItems.line_total)).filter(
            models.OrderItems.order_id == order_id,
            models.OrderItems.status != "CANCELLED"
        ).scalar() or Decimal("0")
        order.total_price = order_total

    db.commit()
    db.refresh(db_order_item)
    if order:
        db.refresh(order)
    return db_order_item


@router.put("/{order_item_id}/status", response_model=schemas.OrderItem)
def update_order_item_status(
    order_item_id: int,
    status_update: schemas.OrderItemStatusUpdate,
    db: Session = Depends(get_db)
):
    """Update order item status. When status changes to DONE, subtract stock. Use CANCELLED for soft delete."""
    db_order_item = db.query(models.OrderItems).filter(
        models.OrderItems.order_item_id == order_item_id
    ).first()
    if not db_order_item:
        raise HTTPException(status_code=404, detail="Order item not found")

    # Get the order to check its status
    order = db.query(models.Orders).filter(
        models.Orders.order_id == db_order_item.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Prevent updating items in paid or cancelled orders
    if order.status == "PAID":
        raise HTTPException(
            status_code=400,
            detail="Cannot update items in a paid order"
        )
    if order.status == "CANCELLED":
        raise HTTPException(
            status_code=400,
            detail="Cannot update items in a cancelled order"
        )

    old_status = db_order_item.status
    new_status = status_update.status

    # Validate status transition
    if old_status == "DONE" and new_status == "CANCELLED":
        raise HTTPException(
            status_code=400,
            detail="Cannot cancel an order item that is already DONE"
        )

    if old_status == "CANCELLED" and new_status != "CANCELLED":
        raise HTTPException(
            status_code=400,
            detail="Cannot change status of a cancelled order item"
        )

    # If changing to DONE, subtract stock
    if old_status != "DONE" and new_status == "DONE":
        # Get all recipes for this menu item
        recipes = db.query(models.Recipe).filter(
            models.Recipe.menu_item_id == db_order_item.menu_item_id
        ).all()

        if not recipes:
            # Menu item has no ingredients (e.g., service items), skip stock subtraction
            pass
        else:
            # For each ingredient in the recipe, subtract from stock
            for recipe in recipes:
                # Check if ingredient is deleted
                ingredient = db.query(models.Ingredients).filter(
                    models.Ingredients.ingredient_id == recipe.ingredient_id
                ).first()
                if ingredient and ingredient.is_deleted:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Cannot complete order item. Ingredient '{ingredient.name}' (ID: {recipe.ingredient_id}) has been deleted and is no longer available."
                    )

                # Find stock for this ingredient in the order's branch
                stock = db.query(models.Stock).filter(
                    models.Stock.branch_id == order.branch_id,
                    models.Stock.ingredient_id == recipe.ingredient_id
                ).first()

                if not stock:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Stock not found for ingredient ID {recipe.ingredient_id} in branch {order.branch_id}"
                    )

                # Calculate quantity needed: recipe.qty_per_unit * order_item.quantity
                qty_needed = recipe.qty_per_unit * db_order_item.quantity

                # Check if enough stock available
                if stock.amount_remaining < qty_needed:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Insufficient stock for ingredient '{stock.ingredient.name}'. Available: {stock.amount_remaining}, Needed: {qty_needed}"
                    )

                # Subtract from stock
                stock.amount_remaining -= qty_needed

                # Create stock movement record
                stock_movement = models.StockMovements(
                    stock_id=stock.stock_id,
                    employee_id=order.employee_id,
                    order_id=order.order_id,
                    qty_change=-qty_needed,  # Negative for subtraction
                    reason="SALE",
                    note=f"Order item {db_order_item.order_item_id} - {db_order_item.quantity}x menu item"
                )
                db.add(stock_movement)

    # Update status
    db_order_item.status = new_status

    # Flush to ensure status change is visible in subsequent queries
    db.flush()

    # Expire the order object to force fresh query
    db.expire(order)

    # Recalculate order total (exclude cancelled items)
    # Query fresh from database to ensure we see the updated status
    order_total = db.query(func.sum(models.OrderItems.line_total)).filter(
        models.OrderItems.order_id == db_order_item.order_id,
        models.OrderItems.status != "CANCELLED"
    ).scalar() or Decimal("0")
    order.total_price = order_total

    db.commit()
    # Reload order item with relationships for response
    db_order_item = db.query(models.OrderItems).options(
        joinedload(models.OrderItems.menu_item)
    ).filter(models.OrderItems.order_item_id == db_order_item.order_item_id).first()
    db.refresh(order)
    return db_order_item
