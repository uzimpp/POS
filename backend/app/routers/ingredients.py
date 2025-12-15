from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/ingredients", tags=["ingredients"])


@router.get("/", response_model=List[schemas.Ingredient])
def get_ingredients(
    skip: int = 0,
    limit: int = 100,
    is_deleted: Optional[bool] = Query(
        None, description="Filter by deletion status. None returns all, False returns active only, True returns deleted only"),
    db: Session = Depends(get_db)
):
    query = db.query(models.Ingredients)

    if is_deleted is not None:
        query = query.filter(models.Ingredients.is_deleted == is_deleted)

    ingredients = query.offset(skip).limit(limit).all()
    return ingredients


@router.get("/{ingredient_id}", response_model=schemas.Ingredient)
def get_ingredient(ingredient_id: int, db: Session = Depends(get_db)):
    ingredient = db.query(models.Ingredients).filter(
        models.Ingredients.ingredient_id == ingredient_id).first()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    return ingredient


@router.post("/", response_model=schemas.Ingredient, status_code=201)
def create_ingredient(ingredient: schemas.IngredientCreate, db: Session = Depends(get_db)):
    db_ingredient = models.Ingredients(**ingredient.dict())
    db.add(db_ingredient)
    db.commit()
    db.refresh(db_ingredient)
    return db_ingredient


@router.put("/{ingredient_id}", response_model=schemas.Ingredient)
def update_ingredient(ingredient_id: int, ingredient: schemas.IngredientCreate, db: Session = Depends(get_db)):
    try:
        db_ingredient = db.query(models.Ingredients).filter(
            models.Ingredients.ingredient_id == ingredient_id).first()
        if not db_ingredient:
            raise HTTPException(status_code=404, detail="Ingredient not found")

        old_is_deleted = db_ingredient.is_deleted
        new_is_deleted = ingredient.is_deleted

        # Update ingredient fields
        for key, value in ingredient.dict().items():
            setattr(db_ingredient, key, value)

        # If ingredient is being soft-deleted (is_deleted = True)
        if not old_is_deleted and new_is_deleted:
            # Find all recipes that use this ingredient
            recipes = db.query(models.Recipe).filter(
                models.Recipe.ingredient_id == ingredient_id
            ).all()

            # Get all unique menu_item_ids that use this ingredient
            menu_item_ids = list(
                set([recipe.menu_item_id for recipe in recipes]))

            # Set all menu items using this ingredient to unavailable
            if menu_item_ids:
                db.query(models.Menu).filter(
                    models.Menu.menu_item_id.in_(menu_item_ids)
                ).update({models.Menu.is_available: False}, synchronize_session=False)

        db.commit()
        db.refresh(db_ingredient)
        return db_ingredient
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while updating ingredient: {str(e)}"
        )


@router.put("/{ingredient_id}/restore", response_model=schemas.Ingredient)
def restore_ingredient(ingredient_id: int, db: Session = Depends(get_db)):
    """
    Restore a soft-deleted ingredient.
    Note: Menu items using this ingredient will NOT be automatically restored.
    They must be manually set to available.
    """
    db_ingredient = db.query(models.Ingredients).filter(
        models.Ingredients.ingredient_id == ingredient_id
    ).first()
    if not db_ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    
    if not db_ingredient.is_deleted:
        return db_ingredient  # Already active, just return it
    
    db_ingredient.is_deleted = False
    db.commit()
    db.refresh(db_ingredient)
    return db_ingredient


@router.delete("/{ingredient_id}")
def delete_ingredient(ingredient_id: int, db: Session = Depends(get_db)):
    try:
        db_ingredient = db.query(models.Ingredients).filter(
            models.Ingredients.ingredient_id == ingredient_id).first()
        if not db_ingredient:
            raise HTTPException(status_code=404, detail="Ingredient not found")

        # If already deleted, return success
        if db_ingredient.is_deleted:
            return {"message": "Ingredient already deleted"}

        # Soft delete
        db_ingredient.is_deleted = True

        # Find all recipes that use this ingredient
        recipes = db.query(models.Recipe).filter(
            models.Recipe.ingredient_id == ingredient_id
        ).all()

        # Get all unique menu_item_ids that use this ingredient
        menu_item_ids = list(set([recipe.menu_item_id for recipe in recipes]))

        # Set all menu items using this ingredient to unavailable
        if menu_item_ids:
            db.query(models.Menu).filter(
                models.Menu.menu_item_id.in_(menu_item_ids)
            ).update({models.Menu.is_available: False}, synchronize_session=False)

        db.commit()
        return {"message": "Ingredient deleted successfully"}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while deleting ingredient: {str(e)}"
        )
