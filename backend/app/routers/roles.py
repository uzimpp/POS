from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/roles", tags=["roles"])


@router.get("/", response_model=List[schemas.Role])
def get_roles(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    roles = db.query(models.Roles).offset(skip).limit(limit).all()
    return roles


@router.get("/{role_id}", response_model=schemas.Role)
def get_role(role_id: int, db: Session = Depends(get_db)):
    role = db.query(models.Roles).filter(models.Roles.role_id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role


@router.post("/", response_model=schemas.Role)
def create_role(role: schemas.RoleCreate, db: Session = Depends(get_db)):
    db_role = models.Roles(**role.dict())
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role


@router.put("/{role_id}", response_model=schemas.Role)
def update_role(role_id: int, role: schemas.RoleCreate, db: Session = Depends(get_db)):
    db_role = db.query(models.Roles).filter(
        models.Roles.role_id == role_id).first()
    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")
    for key, value in role.dict().items():
        setattr(db_role, key, value)
    db.commit()
    db.refresh(db_role)
    return db_role


@router.delete("/{role_id}")
def delete_role(role_id: int, db: Session = Depends(get_db)):
    db_role = db.query(models.Roles).filter(
        models.Roles.role_id == role_id).first()
    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")
    db.delete(db_role)
    db.commit()
    return {"message": "Role deleted successfully"}
