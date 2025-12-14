from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/api/stock",
    tags=["stock"],
    responses={404: {"description": "Not found"}},
)


@router.get("/", response_model=List[schemas.Stock])
def read_stock_items(
    branch_ids: Optional[List[int]] = Query(None),
    out_of_stock_only: Optional[bool] = Query(
        False, description="Filter to only out of stock items (amount_remaining = 0)"),
    include_deleted_ingredients: Optional[bool] = Query(
        False, description="Include stock items for deleted ingredients"),
    is_deleted: Optional[bool] = Query(
        None, description="Filter by deletion status. None/False = active only, True = deleted only"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(models.Stock).options(
        joinedload(models.Stock.branch),
        joinedload(models.Stock.ingredient)
    )

    if branch_ids:
        query = query.filter(models.Stock.branch_id.in_(branch_ids))

    if out_of_stock_only:
        query = query.filter(models.Stock.amount_remaining == 0)

    # By default, show only active stock items
    if is_deleted is True:
        query = query.filter(models.Stock.is_deleted == True)
    else:
        query = query.filter(models.Stock.is_deleted == False)

    # By default, exclude stock items for deleted ingredients
    if not include_deleted_ingredients:
        query = query.join(models.Ingredients).filter(
            models.Ingredients.is_deleted == False
        )

    return query.offset(skip).limit(limit).all()


@router.get("/out-of-stock", response_model=List[schemas.Stock])
def get_out_of_stock_items(
    branch_ids: Optional[List[int]] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all stock items that are out of stock (amount_remaining = 0)."""
    query = db.query(models.Stock).options(
        joinedload(models.Stock.branch),
        joinedload(models.Stock.ingredient)
    ).filter(models.Stock.amount_remaining == 0)

    if branch_ids:
        query = query.filter(models.Stock.branch_id.in_(branch_ids))

    return query.all()


@router.get("/out-of-stock/count")
def get_out_of_stock_count(
    branch_ids: Optional[List[int]] = Query(None),
    db: Session = Depends(get_db)
):
    """Get count of out of stock items."""
    from sqlalchemy import func

    query = db.query(func.count(models.Stock.stock_id)).filter(
        models.Stock.amount_remaining == 0
    )

    if branch_ids:
        query = query.filter(models.Stock.branch_id.in_(branch_ids))

    count = query.scalar() or 0
    return {"count": count, "out_of_stock_count": count}


@router.post("/", response_model=schemas.Stock, status_code=status.HTTP_201_CREATED)
def create_stock_item(stock: schemas.StockCreate, db: Session = Depends(get_db)):
    # Validate ingredient exists and is not deleted
    ingredient = db.query(models.Ingredients).filter(
        models.Ingredients.ingredient_id == stock.ingredient_id
    ).first()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    if ingredient.is_deleted:
        raise HTTPException(
            status_code=400,
            detail="Cannot create stock for a deleted ingredient"
        )

    db_stock = models.Stock(**stock.dict())
    db.add(db_stock)
    db.commit()
    db.refresh(db_stock)
    # Load relationships before returning
    db_stock = db.query(models.Stock).options(
        joinedload(models.Stock.branch),
        joinedload(models.Stock.ingredient)
    ).filter(models.Stock.stock_id == db_stock.stock_id).first()
    return db_stock


@router.put("/{stock_id}", response_model=schemas.Stock)
def update_stock_item(stock_id: int, stock_update: schemas.StockCreate, db: Session = Depends(get_db)):
    db_stock = db.query(models.Stock).options(
        joinedload(models.Stock.ingredient)
    ).filter(models.Stock.stock_id == stock_id).first()
    if db_stock is None:
        raise HTTPException(status_code=404, detail="Stock item not found")

    # Check if stock item is deleted
    if db_stock.is_deleted:
        raise HTTPException(
            status_code=400,
            detail="Cannot update a deleted stock item"
        )

    # Check if ingredient is deleted
    if db_stock.ingredient.is_deleted:
        raise HTTPException(
            status_code=400,
            detail="Cannot update stock for a deleted ingredient. Only WASTE/ADJUST operations are allowed for cleanup."
        )

    # If ingredient_id is being changed, validate the new ingredient
    if stock_update.ingredient_id != db_stock.ingredient_id:
        new_ingredient = db.query(models.Ingredients).filter(
            models.Ingredients.ingredient_id == stock_update.ingredient_id
        ).first()
        if not new_ingredient:
            raise HTTPException(status_code=404, detail="Ingredient not found")
        if new_ingredient.is_deleted:
            raise HTTPException(
                status_code=400,
                detail="Cannot change stock to a deleted ingredient"
            )

    for key, value in stock_update.dict().items():
        setattr(db_stock, key, value)

    db.commit()
    db.refresh(db_stock)
    # Load relationships before returning
    db_stock = db.query(models.Stock).options(
        joinedload(models.Stock.branch),
        joinedload(models.Stock.ingredient)
    ).filter(models.Stock.stock_id == stock_id).first()
    return db_stock


@router.delete("/{stock_id}", response_model=schemas.Stock)
def delete_stock_item(stock_id: int, db: Session = Depends(get_db)):
    try:
        db_stock = db.query(models.Stock).options(
            joinedload(models.Stock.branch),
            joinedload(models.Stock.ingredient)
        ).filter(models.Stock.stock_id == stock_id).first()
        if db_stock is None:
            raise HTTPException(status_code=404, detail="Stock item not found")

        # Check if already deleted
        if db_stock.is_deleted:
            raise HTTPException(
                status_code=400,
                detail="Stock item is already deleted"
            )

        # Soft delete
        db_stock.is_deleted = True
        db.commit()
        db.refresh(db_stock)
        return db_stock
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while deleting stock item: {str(e)}"
        )


# =========================
# Stock Movements Endpoints
# =========================

@router.get("/movements", response_model=List[schemas.StockMovement])
def get_stock_movements(
    branch_id: Optional[int] = Query(None, description="Filter by branch"),
    stock_id: Optional[int] = Query(None, description="Filter by stock item"),
    reason: Optional[str] = Query(
        None, description="Filter by reason (RESTOCK, SALE, WASTE, ADJUST)"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get stock movements with optional filters."""
    query = db.query(models.StockMovements).options(
        joinedload(models.StockMovements.stock).joinedload(
            models.Stock.ingredient),
        joinedload(models.StockMovements.stock).joinedload(
            models.Stock.branch),
        joinedload(models.StockMovements.employee),
        joinedload(models.StockMovements.order)
    )

    if branch_id:
        query = query.join(models.Stock).filter(
            models.Stock.branch_id == branch_id)

    if stock_id:
        query = query.filter(models.StockMovements.stock_id == stock_id)

    if reason:
        query = query.filter(models.StockMovements.reason == reason)

    # Order by most recent first
    movements = query.order_by(models.StockMovements.created_at.desc()).offset(
        skip).limit(limit).all()
    return movements


@router.get("/movements/{movement_id}", response_model=schemas.StockMovement)
def get_stock_movement(movement_id: int, db: Session = Depends(get_db)):
    """Get a single stock movement by ID."""
    movement = db.query(models.StockMovements).options(
        joinedload(models.StockMovements.stock).joinedload(
            models.Stock.ingredient),
        joinedload(models.StockMovements.stock).joinedload(
            models.Stock.branch),
        joinedload(models.StockMovements.employee),
        joinedload(models.StockMovements.order)
    ).filter(models.StockMovements.movement_id == movement_id).first()

    if not movement:
        raise HTTPException(status_code=404, detail="Stock movement not found")
    return movement


@router.post("/movements", response_model=schemas.StockMovement, status_code=status.HTTP_201_CREATED)
def create_stock_movement(movement: schemas.StockMovementCreate, db: Session = Depends(get_db)):
    """Create a stock movement (RESTOCK, WASTE, ADJUST). SALE movements are created automatically."""
    # Validate stock exists
    stock = db.query(models.Stock).filter(
        models.Stock.stock_id == movement.stock_id).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock item not found")

    # Validate reason
    valid_reasons = ["RESTOCK", "WASTE", "ADJUST", "SALE"]
    if movement.reason not in valid_reasons:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid reason. Must be one of: {', '.join(valid_reasons)}"
        )

    # For RESTOCK, qty_change should be positive
    # For WASTE/SALE, qty_change should be negative
    # For ADJUST, can be positive or negative

    # Update stock amount
    new_amount = stock.amount_remaining + movement.qty_change
    if new_amount < 0:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock. Available: {stock.amount_remaining}, Change: {movement.qty_change}"
        )

    stock.amount_remaining = new_amount

    # Create movement record
    db_movement = models.StockMovements(**movement.dict())
    db.add(db_movement)
    db.commit()
    db.refresh(db_movement)

    # Reload with relationships
    db_movement = db.query(models.StockMovements).options(
        joinedload(models.StockMovements.stock).joinedload(
            models.Stock.ingredient),
        joinedload(models.StockMovements.stock).joinedload(
            models.Stock.branch),
        joinedload(models.StockMovements.employee),
        joinedload(models.StockMovements.order)
    ).filter(models.StockMovements.movement_id == db_movement.movement_id).first()

    return db_movement
