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


@router.post("/", response_model=schemas.OrderItem, status_code=201)
def create_order_item(order_item: schemas.OrderItemCreate, db: Session = Depends(get_db)):
    """
    Add menu item to order. 
    - If same menu_id exists with status ORDERED, increment quantity
    - Otherwise create new order item with status ORDERED
    """
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

    # Check if same menu item exists with status ORDERED - if so, increment quantity
    existing_order_item = db.query(models.OrderItems).filter(
        models.OrderItems.order_id == order_item.order_id,
        models.OrderItems.menu_item_id == order_item.menu_item_id,
        models.OrderItems.status == "ORDERED"
    ).first()

    if existing_order_item:
        # Increment quantity of existing ORDERED item
        existing_order_item.quantity += order_item.quantity
        existing_order_item.line_total = existing_order_item.quantity * \
            existing_order_item.unit_price
        db.flush()
        db_order_item = existing_order_item
    else:
        # Create new order item with status ORDERED
        unit_price = menu_item.price
        line_total = order_item.quantity * unit_price

        db_order_item = models.OrderItems(
            order_id=order_item.order_id,
            menu_item_id=order_item.menu_item_id,
            status="ORDERED",  # Always start as ORDERED
            quantity=order_item.quantity,
            unit_price=unit_price,
            line_total=line_total
        )
        db.add(db_order_item)
        db.flush()

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
    """
    Update order item (quantity, menu_item).
    - Quantity can only be adjusted when status = ORDERED
    - Cannot update PREPARING, DONE, or CANCELLED items
    """
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

    # Only allow updates when status is ORDERED
    if db_order_item.status != "ORDERED":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot update order item. Only ORDERED items can be modified. Current status: {db_order_item.status}"
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
        unit_price = menu_item.price
    else:
        unit_price = db_order_item.unit_price

    # Recalculate line_total
    line_total = order_item.quantity * unit_price

    order_id = db_order_item.order_id
    db_order_item.menu_item_id = order_item.menu_item_id
    db_order_item.quantity = order_item.quantity
    db_order_item.unit_price = unit_price
    # Keep status as ORDERED (don't allow status change through this endpoint)
    db_order_item.line_total = line_total
    db.flush()

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
    """
    Update order item status with new flow:
    - ORDERED → PREPARING: Chef accepts, check stock & deduct ingredients
    - ORDERED → CANCELLED: Cancel before chef starts
    - PREPARING → DONE: Chef finishes (no stock change, already deducted)
    - PREPARING → CANCELLED: NOT allowed (ingredients already used)
    - DONE/CANCELLED → anything: NOT allowed (final states)
    """
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

    # === STATUS TRANSITION VALIDATION ===

    # DONE is final - cannot change
    if old_status == "DONE":
        raise HTTPException(
            status_code=400,
            detail="Cannot change status of a DONE order item. DONE items are final."
        )

    # CANCELLED is final - cannot change
    if old_status == "CANCELLED":
        raise HTTPException(
            status_code=400,
            detail="Cannot change status of a CANCELLED order item. CANCELLED items are final."
        )

    # PREPARING → CANCELLED not allowed (ingredients already used)
    if old_status == "PREPARING" and new_status == "CANCELLED":
        raise HTTPException(
            status_code=400,
            detail="Cannot cancel an order item that is already PREPARING. Ingredients are already being used."
        )

    # Prevent backward transitions
    if old_status == "PREPARING" and new_status == "ORDERED":
        raise HTTPException(
            status_code=400,
            detail="Cannot revert PREPARING to ORDERED."
        )
    if old_status == "DONE" and new_status in ["ORDERED", "PREPARING"]:
        raise HTTPException(
            status_code=400,
            detail="Cannot revert DONE to earlier status."
        )

    # === ORDERED → PREPARING: Check stock & deduct ingredients ===
    if old_status == "ORDERED" and new_status == "PREPARING":
        # Get all recipes for this menu item
        recipes = db.query(models.Recipe).filter(
            models.Recipe.menu_item_id == db_order_item.menu_item_id
        ).all()

        insufficient_ingredients = []

        if recipes:
            # First pass: Check all ingredients have sufficient stock
            for recipe in recipes:
                # Check if ingredient is deleted
                ingredient = db.query(models.Ingredients).filter(
                    models.Ingredients.ingredient_id == recipe.ingredient_id
                ).first()
                if ingredient and ingredient.is_deleted:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Cannot prepare order item. Ingredient '{ingredient.name}' has been deleted."
                    )

                # Find stock for this ingredient in the order's branch
                stock = db.query(models.Stock).filter(
                    models.Stock.branch_id == order.branch_id,
                    models.Stock.ingredient_id == recipe.ingredient_id,
                    models.Stock.is_deleted == False
                ).first()

                if not stock:
                    insufficient_ingredients.append({
                        "ingredient_id": recipe.ingredient_id,
                        "ingredient_name": ingredient.name if ingredient else "Unknown",
                        "available": 0,
                        "needed": float(recipe.qty_per_unit * db_order_item.quantity)
                    })
                    continue

                qty_needed = recipe.qty_per_unit * db_order_item.quantity

                if stock.amount_remaining < qty_needed:
                    insufficient_ingredients.append({
                        "ingredient_id": recipe.ingredient_id,
                        "ingredient_name": stock.ingredient.name,
                        "available": float(stock.amount_remaining),
                        "needed": float(qty_needed)
                    })

            # If any ingredients are insufficient, return error with details
            if insufficient_ingredients:
                raise HTTPException(
                    status_code=400,
                    detail={
                        "message": "Insufficient stock to prepare this order item",
                        "insufficient_ingredients": insufficient_ingredients,
                        "suggestion": "Decrease quantity, cancel the item, or restock ingredients"
                    }
                )

            # Second pass: Deduct stock and create movements
            for recipe in recipes:
                stock = db.query(models.Stock).filter(
                    models.Stock.branch_id == order.branch_id,
                    models.Stock.ingredient_id == recipe.ingredient_id,
                    models.Stock.is_deleted == False
                ).first()

                qty_needed = recipe.qty_per_unit * db_order_item.quantity
                stock.amount_remaining -= qty_needed

                # Create stock movement record
                stock_movement = models.StockMovements(
                    stock_id=stock.stock_id,
                    employee_id=order.employee_id,
                    order_id=order.order_id,
                    qty_change=-qty_needed,
                    reason="SALE",
                    note=f"Order item {db_order_item.order_item_id} - {db_order_item.quantity}x {db_order_item.menu_item.name if db_order_item.menu_item else 'menu item'}"
                )
                db.add(stock_movement)

    # Update status
    db_order_item.status = new_status

    # Flush to ensure status change is visible in subsequent queries
    db.flush()

    # Expire the order object to force fresh query
    db.expire(order)

    # Recalculate order total (exclude cancelled items)
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
