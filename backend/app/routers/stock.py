from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/stock", tags=["stock"])


@router.get("/", response_model=List[schemas.Stock])
def get_stock(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    stock_items = db.query(models.Stock).offset(skip).limit(limit).all()
    return stock_items


@router.get("/{stock_id}", response_model=schemas.Stock)
def get_stock_item(stock_id: int, db: Session = Depends(get_db)):
    stock_item = db.query(models.Stock).filter(
        models.Stock.stock_id == stock_id).first()
    if not stock_item:
        raise HTTPException(status_code=404, detail="Stock item not found")
    return stock_item


@router.post("/", response_model=schemas.Stock)
def create_stock_item(stock: schemas.StockCreate, db: Session = Depends(get_db)):
    db_stock = models.Stock(**stock.dict())
    db.add(db_stock)
    db.commit()
    db.refresh(db_stock)
    return db_stock


@router.put("/{stock_id}", response_model=schemas.Stock)
def update_stock_item(stock_id: int, stock: schemas.StockCreate, db: Session = Depends(get_db)):
    db_stock = db.query(models.Stock).filter(
        models.Stock.stock_id == stock_id).first()
    if not db_stock:
        raise HTTPException(status_code=404, detail="Stock item not found")
    for key, value in stock.dict().items():
        setattr(db_stock, key, value)
    db.commit()
    db.refresh(db_stock)
    return db_stock


@router.delete("/{stock_id}")
def delete_stock_item(stock_id: int, db: Session = Depends(get_db)):
    db_stock = db.query(models.Stock).filter(
        models.Stock.stock_id == stock_id).first()
    if not db_stock:
        raise HTTPException(status_code=404, detail="Stock item not found")
    db.delete(db_stock)
    db.commit()
    return {"message": "Stock item deleted successfully"}
