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
    db_stock = db.query(models.Stock).filter(
        models.Stock.stock_id == stock_id).first()
    if db_stock is None:
        raise HTTPException(status_code=404, detail="Stock item not found")

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


@router.delete("/{stock_id}")
def delete_stock_item(stock_id: int, db: Session = Depends(get_db)):
    db_stock = db.query(models.Stock).filter(
        models.Stock.stock_id == stock_id).first()
    if db_stock is None:
        raise HTTPException(status_code=404, detail="Stock item not found")

    db.delete(db_stock)
    db.commit()
    return {"message": "Stock item deleted successfully", "id": stock_id}
