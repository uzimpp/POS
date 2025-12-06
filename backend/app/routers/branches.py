from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/api/branches",
    tags=["branches"],
    responses={404: {"description": "Not found"}},
)


@router.get("/", response_model=List[schemas.Branch])
def read_branches(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    branches = db.query(models.Branches).offset(skip).limit(limit).all()
    return branches


@router.get("/{branch_id}", response_model=schemas.Branch)
def read_branch(branch_id: int, db: Session = Depends(get_db)):
    branch = db.query(models.Branches).filter(
        models.Branches.branch_id == branch_id).first()
    if branch is None:
        raise HTTPException(status_code=404, detail="Branch not found")
    return branch


@router.post("/", response_model=schemas.Branch, status_code=status.HTTP_201_CREATED)
def create_branch(branch: schemas.BranchCreate, db: Session = Depends(get_db)):
    db_branch = models.Branches(**branch.model_dump())
    db.add(db_branch)
    db.commit()
    db.refresh(db_branch)
    return db_branch
    # return schemas.Branch(branch_id=999, name=branch.name, address=branch.address, phone=branch.phone)


@router.put("/{branch_id}", response_model=schemas.Branch)
def update_branch(branch_id: int, branch_update: schemas.BranchCreate, db: Session = Depends(get_db)):
    db_branch = db.query(models.Branches).filter(
        models.Branches.branch_id == branch_id).first()
    if db_branch is None:
        raise HTTPException(status_code=404, detail="Branch not found")

    for key, value in branch_update.model_dump().items():
        setattr(db_branch, key, value)

    db.commit()
    db.refresh(db_branch)
    return db_branch


@router.delete("/{branch_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_branch(branch_id: int, db: Session = Depends(get_db)):
    db_branch = db.query(models.Branches).filter(
        models.Branches.branch_id == branch_id).first()
    if db_branch is None:
        raise HTTPException(status_code=404, detail="Branch not found")

    # Soft delete implementation
    db_branch.is_active = False
    # db.delete(db_branch)
    db.commit()
    return None
