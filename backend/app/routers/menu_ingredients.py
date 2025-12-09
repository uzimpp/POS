from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/menu-ingredients", tags=["menu-ingredients"])


@router.get("/", response_model=List[schemas.MenuIngredient])
def get_menu_ingredients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    menu_ingredients = db.query(
        models.MenuIngredients).offset(skip).limit(limit).all()
    return menu_ingredients


@router.get("/{ingredient_id}", response_model=schemas.MenuIngredient)
def get_menu_ingredient(ingredient_id: int, db: Session = Depends(get_db)):
    menu_ingredient = db.query(models.MenuIngredients).filter(
        models.MenuIngredients.id == ingredient_id).first()
    if not menu_ingredient:
        raise HTTPException(
            status_code=404, detail="Menu ingredient not found")
    return menu_ingredient


@router.get("/menu-item/{menu_item_id}", response_model=List[schemas.MenuIngredient])
def get_ingredients_by_menu_item(menu_item_id: int, db: Session = Depends(get_db)):
    menu_ingredients = db.query(models.MenuIngredients).filter(
        models.MenuIngredients.menu_item_id == menu_item_id
    ).all()
    return menu_ingredients


@router.post("/", response_model=schemas.MenuIngredient)
def create_menu_ingredient(menu_ingredient: schemas.MenuIngredientCreate, db: Session = Depends(get_db)):
    db_menu_ingredient = models.MenuIngredients(**menu_ingredient.dict())
    db.add(db_menu_ingredient)
    db.commit()
    db.refresh(db_menu_ingredient)
    return db_menu_ingredient


@router.put("/{ingredient_id}", response_model=schemas.MenuIngredient)
def update_menu_ingredient(ingredient_id: int, menu_ingredient: schemas.MenuIngredientCreate, db: Session = Depends(get_db)):
    db_menu_ingredient = db.query(models.MenuIngredients).filter(
        models.MenuIngredients.id == ingredient_id).first()
    if not db_menu_ingredient:
        raise HTTPException(
            status_code=404, detail="Menu ingredient not found")
    for key, value in menu_ingredient.dict().items():
        setattr(db_menu_ingredient, key, value)
    db.commit()
    db.refresh(db_menu_ingredient)
    return db_menu_ingredient


@router.delete("/{ingredient_id}")
def delete_menu_ingredient(ingredient_id: int, db: Session = Depends(get_db)):
    db_menu_ingredient = db.query(models.MenuIngredients).filter(
        models.MenuIngredients.id == ingredient_id).first()
    if not db_menu_ingredient:
        raise HTTPException(
            status_code=404, detail="Menu ingredient not found")
    db.delete(db_menu_ingredient)
    db.commit()
    return {"message": "Menu ingredient deleted successfully"}
