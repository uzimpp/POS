from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/employees", tags=["employees"])


@router.get("/", response_model=List[schemas.Employee])
def get_employees(
    branch_ids: Optional[List[int]] = Query(None),
    is_deleted: Optional[bool] = Query(
        None, description="Filter by deletion status. None returns all, False returns active only, True returns deleted only"),
    role_ids: Optional[List[int]] = Query(
        None, description="Filter by role ids"),
    salary_min: Optional[int] = Query(
        None, description="Filter by minimum salary"),
    salary_max: Optional[int] = Query(
        None, description="Filter by maximum salary"),
    joined_from: Optional[str] = Query(
        None, description="Filter joined_date on/after (ISO datetime)"),
    joined_to: Optional[str] = Query(
        None, description="Filter joined_date on/before (ISO datetime)"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(models.Employees).options(
        joinedload(models.Employees.branch))

    if branch_ids:
        query = query.filter(models.Employees.branch_id.in_(branch_ids))

    if is_deleted is not None:
        query = query.filter(models.Employees.is_deleted == is_deleted)

    if role_ids:
        query = query.filter(models.Employees.role_id.in_(role_ids))

    if salary_min is not None:
        query = query.filter(models.Employees.salary >= salary_min)

    if salary_max is not None:
        query = query.filter(models.Employees.salary <= salary_max)

    if joined_from:
        query = query.filter(models.Employees.joined_date >= joined_from)

    if joined_to:
        query = query.filter(models.Employees.joined_date <= joined_to)

    return query.offset(skip).limit(limit).all()


@router.get("/{employee_id}", response_model=schemas.Employee)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    employee = db.query(models.Employees).filter(
        models.Employees.employee_id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee


@router.post("/", response_model=schemas.Employee)
def create_employee(employee: schemas.EmployeeCreate, db: Session = Depends(get_db)):
    # Check if branch exists and is active
    branch = db.query(models.Branches).filter(
        models.Branches.branch_id == employee.branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    if branch.is_deleted:
        raise HTTPException(
            status_code=400, detail="Cannot add employee to an inactive branch")

    db_employee = models.Employees(**employee.dict())
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee


@router.put("/{employee_id}", response_model=schemas.Employee)
def update_employee(employee_id: int, employee: schemas.EmployeeCreate, db: Session = Depends(get_db)):
    db_employee = db.query(models.Employees).filter(
        models.Employees.employee_id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    for key, value in employee.dict().items():
        setattr(db_employee, key, value)
    db.commit()
    db.refresh(db_employee)
    return db_employee


@router.delete("/{employee_id}", response_model=schemas.Employee)
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    db_employee = db.query(models.Employees).filter(
        models.Employees.employee_id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Soft delete implementation
    db_employee.is_deleted = True
    db.commit()
    db.refresh(db_employee)
    return db_employee
