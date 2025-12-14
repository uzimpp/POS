from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/recipe", tags=["recipe"])


@router.get("/", response_model=List[schemas.Recipe])
def get_recipes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    recipes = db.query(models.Recipe).offset(skip).limit(limit).all()
    return recipes


@router.get("/{recipe_id}", response_model=schemas.Recipe)
def get_recipe(recipe_id: int, db: Session = Depends(get_db)):
    recipe = db.query(models.Recipe).filter(
        models.Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(
            status_code=404, detail="Recipe not found")
    return recipe


@router.get("/menu-item/{menu_item_id}", response_model=List[schemas.Recipe])
def get_recipes_by_menu_item(menu_item_id: int, db: Session = Depends(get_db)):
    recipes = db.query(models.Recipe).filter(
        models.Recipe.menu_item_id == menu_item_id
    ).all()
    return recipes


@router.post("/", response_model=schemas.Recipe)
def create_recipe(recipe: schemas.RecipeCreate, db: Session = Depends(get_db)):
    # Validate ingredient exists and is not deleted
    ingredient = db.query(models.Ingredients).filter(
        models.Ingredients.ingredient_id == recipe.ingredient_id
    ).first()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    if ingredient.is_deleted:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot add deleted ingredient '{ingredient.name}' to recipe. Ingredient must be active."
        )

    # Check if recipe with same menu_item_id and ingredient_id already exists
    existing_recipe = db.query(models.Recipe).filter(
        models.Recipe.menu_item_id == recipe.menu_item_id,
        models.Recipe.ingredient_id == recipe.ingredient_id
    ).first()

    if existing_recipe:
        # Increment quantity instead of creating duplicate
        existing_recipe.qty_per_unit += recipe.qty_per_unit
        db.commit()
        db.refresh(existing_recipe)
        return existing_recipe
    else:
        # Create new recipe
        db_recipe = models.Recipe(**recipe.dict())
        db.add(db_recipe)
        db.commit()
        db.refresh(db_recipe)
        return db_recipe


@router.put("/{recipe_id}", response_model=schemas.Recipe)
def update_recipe(recipe_id: int, recipe: schemas.RecipeCreate, db: Session = Depends(get_db)):
    db_recipe = db.query(models.Recipe).filter(
        models.Recipe.id == recipe_id).first()
    if not db_recipe:
        raise HTTPException(
            status_code=404, detail="Recipe not found")

    # If ingredient_id is being changed, validate the new ingredient
    if recipe.ingredient_id != db_recipe.ingredient_id:
        ingredient = db.query(models.Ingredients).filter(
            models.Ingredients.ingredient_id == recipe.ingredient_id
        ).first()
        if not ingredient:
            raise HTTPException(status_code=404, detail="Ingredient not found")
        if ingredient.is_deleted:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot change recipe to deleted ingredient '{ingredient.name}'. Ingredient must be active."
            )

    for key, value in recipe.dict().items():
        setattr(db_recipe, key, value)
    db.commit()
    db.refresh(db_recipe)
    return db_recipe


@router.delete("/{recipe_id}")
def delete_recipe(recipe_id: int, db: Session = Depends(get_db)):
    db_recipe = db.query(models.Recipe).filter(
        models.Recipe.id == recipe_id).first()
    if not db_recipe:
        raise HTTPException(
            status_code=404, detail="Recipe not found")
    db.delete(db_recipe)
    db.commit()
    return {"message": "Recipe deleted successfully"}
