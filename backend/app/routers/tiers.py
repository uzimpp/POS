from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/tiers", tags=["tiers"])


@router.get("/", response_model=List[schemas.Tier])
def get_tiers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    tiers = db.query(models.Tiers).offset(skip).limit(limit).all()
    return tiers


@router.get("/{tier_id}", response_model=schemas.Tier)
def get_tier(tier_id: int, db: Session = Depends(get_db)):
    tier = db.query(models.Tiers).filter(models.Tiers.tier_id == tier_id).first()
    if not tier:
        raise HTTPException(status_code=404, detail="Tier not found")
    return tier


@router.post("/", response_model=schemas.Tier, status_code=201)
def create_tier(tier: schemas.TierCreate, db: Session = Depends(get_db)):
    # Prevent duplicate tier names
    existing_by_name = db.query(models.Tiers).filter(
        models.Tiers.tier_name == tier.tier_name
    ).first()
    if existing_by_name:
        raise HTTPException(status_code=400, detail="Tier name already exists")

    # Prevent duplicate rank (tier number)
    existing_by_rank = db.query(models.Tiers).filter(
        models.Tiers.tier == tier.tier
    ).first()
    if existing_by_rank:
        raise HTTPException(status_code=400, detail="Tier rank already exists")

    db_tier = models.Tiers(**tier.dict())
    db.add(db_tier)
    db.commit()
    db.refresh(db_tier)
    return db_tier


@router.put("/{tier_id}", response_model=schemas.Tier)
def update_tier(tier_id: int, tier: schemas.TierCreate, db: Session = Depends(get_db)):
    db_tier = db.query(models.Tiers).filter(
        models.Tiers.tier_id == tier_id).first()
    if not db_tier:
        raise HTTPException(status_code=404, detail="Tier not found")

    # Prevent changing name to an existing tier name (other than self)
    existing_by_name = db.query(models.Tiers).filter(
        models.Tiers.tier_name == tier.tier_name,
        models.Tiers.tier_id != tier_id
    ).first()
    if existing_by_name:
        raise HTTPException(status_code=400, detail="Tier name already exists")

    # Prevent duplicate rank
    existing_by_rank = db.query(models.Tiers).filter(
        models.Tiers.tier == tier.tier,
        models.Tiers.tier_id != tier_id
    ).first()
    if existing_by_rank:
        raise HTTPException(status_code=400, detail="Tier rank already exists")

    for key, value in tier.dict().items():
        setattr(db_tier, key, value)
    db.commit()
    db.refresh(db_tier)
    return db_tier


@router.delete("/{tier_id}")
def delete_tier(tier_id: int, db: Session = Depends(get_db)):
    db_tier = db.query(models.Tiers).filter(
        models.Tiers.tier_id == tier_id).first()
    if not db_tier:
        raise HTTPException(status_code=404, detail="Tier not found")
    
    try:
        db.delete(db_tier)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete tier because it is assigned to one or more memberships."
        )
    return {"message": "Tier deleted successfully"}
