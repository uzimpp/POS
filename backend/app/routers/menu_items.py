from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/menu-items", tags=["menu-items"])


@router.get("/", response_model=List[schemas.MenuItem])
def get_menu_items(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    menu_items = db.query(models.MenuItems).offset(skip).limit(limit).all()
    return menu_items


@router.get("/{menu_item_id}", response_model=schemas.MenuItem)
def get_menu_item(menu_item_id: int, db: Session = Depends(get_db)):
    menu_item = db.query(models.MenuItems).filter(
        models.MenuItems.menu_item_id == menu_item_id).first()
    if not menu_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return menu_item


@router.post("/", response_model=schemas.MenuItem)
def create_menu_item(menu_item: schemas.MenuItemCreate, db: Session = Depends(get_db)):
    db_menu_item = models.MenuItems(**menu_item.dict())
    db.add(db_menu_item)
    db.commit()
    db.refresh(db_menu_item)
    return db_menu_item


@router.put("/{menu_item_id}", response_model=schemas.MenuItem)
def update_menu_item(menu_item_id: int, menu_item: schemas.MenuItemCreate, db: Session = Depends(get_db)):
    db_menu_item = db.query(models.MenuItems).filter(
        models.MenuItems.menu_item_id == menu_item_id).first()
    if not db_menu_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    for key, value in menu_item.dict().items():
        setattr(db_menu_item, key, value)
    db.commit()
    db.refresh(db_menu_item)
    return db_menu_item


@router.delete("/{menu_item_id}")
def delete_menu_item(menu_item_id: int, db: Session = Depends(get_db)):
    db_menu_item = db.query(models.MenuItems).filter(
        models.MenuItems.menu_item_id == menu_item_id).first()
    if not db_menu_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    db.delete(db_menu_item)
    db.commit()
    return {"message": "Menu item deleted successfully"}
