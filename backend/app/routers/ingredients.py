from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/ingredients", tags=["ingredients"])


@router.get("/", response_model=List[schemas.Ingredient])
def get_ingredients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    ingredients = db.query(models.Ingredients).offset(skip).limit(limit).all()
    return ingredients


@router.get("/{ingredient_id}", response_model=schemas.Ingredient)
def get_ingredient(ingredient_id: int, db: Session = Depends(get_db)):
    ingredient = db.query(models.Ingredients).filter(
        models.Ingredients.ingredient_id == ingredient_id).first()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    return ingredient


@router.post("/", response_model=schemas.Ingredient)
def create_ingredient(ingredient: schemas.IngredientCreate, db: Session = Depends(get_db)):
    db_ingredient = models.Ingredients(**ingredient.dict())
    db.add(db_ingredient)
    db.commit()
    db.refresh(db_ingredient)
    return db_ingredient


@router.put("/{ingredient_id}", response_model=schemas.Ingredient)
def update_ingredient(ingredient_id: int, ingredient: schemas.IngredientCreate, db: Session = Depends(get_db)):
    db_ingredient = db.query(models.Ingredients).filter(
        models.Ingredients.ingredient_id == ingredient_id).first()
    if not db_ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    for key, value in ingredient.dict().items():
        setattr(db_ingredient, key, value)
    db.commit()
    db.refresh(db_ingredient)
    return db_ingredient


@router.delete("/{ingredient_id}")
def delete_ingredient(ingredient_id: int, db: Session = Depends(get_db)):
    db_ingredient = db.query(models.Ingredients).filter(
        models.Ingredients.ingredient_id == ingredient_id).first()
    if not db_ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    # Soft delete
    db_ingredient.is_active = False
    db.commit()
    return {"message": "Ingredient deleted successfully"}
