from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..utils.validators import validate_thai_phone


router = APIRouter(
    prefix="/api/branches",
    tags=["branches"],
    responses={404: {"description": "Not found"}},
)


@router.get("/", response_model=List[schemas.Branch])
def read_branches(
    skip: int = 0,
    limit: int = 100,
    is_deleted: Optional[bool] = Query(
        None, description="Filter by deletion status. None returns all, False returns active only, True returns deleted only"),
    db: Session = Depends(get_db)
):
    query = db.query(models.Branches)

    if is_deleted is not None:
        query = query.filter(models.Branches.is_deleted == is_deleted)

    branches = query.offset(skip).limit(limit).all()
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
    # Validate phone number
    validate_thai_phone(branch.phone)

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

    # Validate phone number
    validate_thai_phone(branch_update.phone)

    for key, value in branch_update.model_dump().items():
        setattr(db_branch, key, value)

    db.commit()
    db.refresh(db_branch)
    return db_branch


@router.delete("/{branch_id}", response_model=schemas.Branch)
def delete_branch(branch_id: int, db: Session = Depends(get_db)):
    try:
        db_branch = db.query(models.Branches).filter(
            models.Branches.branch_id == branch_id).first()
        if db_branch is None:
            raise HTTPException(status_code=404, detail="Branch not found")

        # Check if branch is already deleted
        if db_branch.is_deleted:
            raise HTTPException(
                status_code=400,
                detail="Branch is already deleted"
            )

        # Soft delete - branch remains in DB, orders/stock still reference it
        db_branch.is_deleted = True

        # Soft delete all employees in this branch
        for employee in db_branch.employees:
            if not employee.is_deleted:
                employee.is_deleted = True

        # Soft delete all stock items in this branch
        for stock_item in db_branch.stock_items:
            if not stock_item.is_deleted:
                stock_item.is_deleted = True

        db.commit()
        db.refresh(db_branch)
        return db_branch
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while deleting branch: {str(e)}"
        )


@router.put("/{branch_id}/restore", response_model=schemas.Branch)
def restore_branch(branch_id: int, db: Session = Depends(get_db)):
    """Restore a soft-deleted branch."""
    try:
        db_branch = db.query(models.Branches).filter(
            models.Branches.branch_id == branch_id).first()
        if db_branch is None:
            raise HTTPException(status_code=404, detail="Branch not found")

        # Check if branch is already active
        if not db_branch.is_deleted:
            raise HTTPException(
                status_code=400,
                detail="Branch is already active"
            )

        # Restore branch
        db_branch.is_deleted = False

        db.commit()
        db.refresh(db_branch)
        return db_branch
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while restoring branch: {str(e)}"
        )
