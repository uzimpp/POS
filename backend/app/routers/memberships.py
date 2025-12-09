from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas

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


@router.post("/", response_model=schemas.Membership)
def create_membership(membership: schemas.MembershipCreate, db: Session = Depends(get_db)):
    # Check if phone already exists
    existing = db.query(models.Memberships).filter(
        models.Memberships.phone == membership.phone).first()
    if existing:
        raise HTTPException(
            status_code=400, detail="Phone number already exists")
    db_membership = models.Memberships(**membership.dict())
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
    # Check if phone is being changed and already exists
    if membership.phone != db_membership.phone:
        existing = db.query(models.Memberships).filter(
            models.Memberships.phone == membership.phone).first()
        if existing:
            raise HTTPException(
                status_code=400, detail="Phone number already exists")
    for key, value in membership.dict().items():
        setattr(db_membership, key, value)
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
