from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/menu", tags=["menu"])


@router.get("/", response_model=List[schemas.Menu])
def get_menu_items(
    available_only: bool = False,
    category: Optional[str] = Query(
        None, description="Filter by menu category (e.g., Main, Side, Drink)"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(models.Menu)
    if available_only:
        query = query.filter(models.Menu.is_available == True)
    if category:
        query = query.filter(models.Menu.category == category)
    menu_items = query.offset(skip).limit(limit).all()
    return menu_items


@router.get("/{menu_item_id}", response_model=schemas.Menu)
def get_menu_item(menu_item_id: int, db: Session = Depends(get_db)):
    menu_item = db.query(models.Menu).filter(
        models.Menu.menu_item_id == menu_item_id).first()
    if not menu_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return menu_item


@router.post("/", response_model=schemas.Menu)
def create_menu_item(menu_item: schemas.MenuCreate, db: Session = Depends(get_db)):
    db_menu_item = models.Menu(**menu_item.dict())
    db.add(db_menu_item)
    db.commit()
    db.refresh(db_menu_item)
    return db_menu_item


@router.put("/{menu_item_id}", response_model=schemas.Menu)
def update_menu_item(menu_item_id: int, menu_item: schemas.MenuCreate, db: Session = Depends(get_db)):
    db_menu_item = db.query(models.Menu).filter(
        models.Menu.menu_item_id == menu_item_id).first()
    if not db_menu_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    for key, value in menu_item.dict().items():
        setattr(db_menu_item, key, value)
    db.commit()
    db.refresh(db_menu_item)
    return db_menu_item


@router.delete("/{menu_item_id}")
def delete_menu_item(menu_item_id: int, db: Session = Depends(get_db)):
    db_menu_item = db.query(models.Menu).filter(
        models.Menu.menu_item_id == menu_item_id).first()
    if not db_menu_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    db.delete(db_menu_item)
    db.commit()
    return {"message": "Menu item deleted successfully"}
