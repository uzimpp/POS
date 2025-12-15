from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas
from ..utils.validators import validate_thai_phone, validate_email


router = APIRouter(prefix="/api/memberships", tags=["memberships"])


@router.get("/", response_model=List[schemas.Membership])
def get_memberships(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    memberships = db.query(models.Memberships).offset(skip).limit(limit).all()
    return memberships


@router.get("/{membership_id}", response_model=schemas.Membership)
def get_membership(membership_id: int, db: Session = Depends(get_db)):
    membership = db.query(models.Memberships).filter(
        models.Memberships.membership_id == membership_id).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Membership not found")
    return membership


@router.get("/phone/{phone}", response_model=Optional[schemas.Membership])
def get_membership_by_phone(phone: str, db: Session = Depends(get_db)):
    membership = db.query(models.Memberships).filter(
        models.Memberships.phone == phone).first()
    return membership


@router.get("/email/{email}", response_model=Optional[schemas.Membership])
def get_membership_by_email(email: str, db: Session = Depends(get_db)):
    membership = db.query(models.Memberships).filter(
        models.Memberships.email == email).first()
    return membership


@router.post("/", response_model=schemas.Membership)
def create_membership(membership: schemas.MembershipCreate, db: Session = Depends(get_db)):
    # Validate phone number format
    validate_thai_phone(membership.phone)

    # Validate email format (if provided)
    validate_email(membership.email)

    # Check if phone already exists
    existing_phone = db.query(models.Memberships).filter(
        models.Memberships.phone == membership.phone).first()
    if existing_phone:
        raise HTTPException(
            status_code=400, detail="Phone number already exists")

    # Check if email already exists (if provided)
    if membership.email:
        existing_email = db.query(models.Memberships).filter(
            models.Memberships.email == membership.email).first()
        if existing_email:
            raise HTTPException(
                status_code=400, detail="Email already exists")

    # Ensure cumulative_points meets selected tier's minimum
    payload = membership.dict()
    tier_id = payload.get("tier_id")
    cumulative = payload.get("cumulative_points")
    if tier_id is not None:
        tier = db.query(models.Tiers).filter(models.Tiers.tier_id == tier_id).first()
        if tier:
            min_req = tier.minimum_point_required or 0
            if cumulative is None or cumulative < min_req:
                payload["cumulative_points"] = int(min_req)

    db_membership = models.Memberships(**payload)
    db.add(db_membership)
    db.commit()
    db.refresh(db_membership)
    return db_membership


@router.put("/{membership_id}", response_model=schemas.Membership)
def update_membership(membership_id: int, membership: schemas.MembershipCreate, db: Session = Depends(get_db)):
    db_membership = db.query(models.Memberships).filter(
        models.Memberships.membership_id == membership_id).first()
    if not db_membership:
        raise HTTPException(status_code=404, detail="Membership not found")

    # Validate phone number format
    validate_thai_phone(membership.phone)

    # Validate email format (if provided)
    validate_email(membership.email)

    # Check if phone is being changed and already exists
    if membership.phone != db_membership.phone:
        existing_phone = db.query(models.Memberships).filter(
            models.Memberships.phone == membership.phone).first()
        if existing_phone:
            raise HTTPException(
                status_code=400, detail="Phone number already exists")

    # Check if email is being changed and already exists (if provided)
    if membership.email and membership.email != db_membership.email:
        existing_email = db.query(models.Memberships).filter(
            models.Memberships.email == membership.email).first()
        if existing_email:
            raise HTTPException(
                status_code=400, detail="Email already exists")

    for key, value in membership.dict().items():
        setattr(db_membership, key, value)
    # Auto-upgrade tier based on cumulative points vs tier minimums
    try:
        cumulative = getattr(db_membership, "cumulative_points", None)
        if cumulative is not None:
            # Fetch tiers sorted by minimum_point_required ascending, then by rank
            tiers = (
                db.query(models.Tiers)
                .order_by(models.Tiers.minimum_point_required.asc(), models.Tiers.tier.asc())
                .all()
            )
            # Pick the highest eligible tier where cumulative >= minimum_point_required
            eligible_tier_id = None
            eligible_rank = -1
            for t in tiers:
                min_req = t.minimum_point_required or 0
                if cumulative >= min_req and t.tier > eligible_rank:
                    eligible_tier_id = t.tier_id
                    eligible_rank = t.tier
            if eligible_tier_id is not None and eligible_tier_id != db_membership.tier_id:
                db_membership.tier_id = eligible_tier_id
    except Exception as e:
        # Do not fail the update if auto-upgrade logic has issues
        pass
    db.commit()
    db.refresh(db_membership)
    return db_membership


@router.delete("/{membership_id}")
def delete_membership(membership_id: int, db: Session = Depends(get_db)):
    db_membership = db.query(models.Memberships).filter(
        models.Memberships.membership_id == membership_id).first()
    if not db_membership:
        raise HTTPException(status_code=404, detail="Membership not found")
    db.delete(db_membership)
    db.commit()
    return {"message": "Membership deleted successfully"}
