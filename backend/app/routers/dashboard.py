from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal
from typing import Optional, List
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_dashboard_stats(
    branch_ids: Optional[List[int]] = Query(None),
    db: Session = Depends(get_db)
):
    """Get aggregated dashboard statistics."""
    try:
        # 1. Orders statistics
        orders_query = db.query(models.Orders)
        if branch_ids:
            orders_query = orders_query.filter(
                models.Orders.branch_id.in_(branch_ids))

        total_orders = orders_query.count()
        paid_orders = orders_query.filter(
            models.Orders.status == "PAID").count()
        pending_orders = orders_query.filter(
            models.Orders.status == "PENDING").count()

        # 2. Revenue calculation (sum of all paid_price from payments)
        payments_query = db.query(func.sum(models.Payments.paid_price))
        if branch_ids:
            # Join with orders to filter by branch
            payments_query = payments_query.join(
                models.Orders, models.Payments.order_id == models.Orders.order_id
            ).filter(models.Orders.branch_id.in_(branch_ids))

        total_revenue_result = payments_query.scalar()
        total_revenue = float(
            total_revenue_result) if total_revenue_result else 0.0

        # 3. Menu statistics
        menus_query = db.query(models.Menu)
        total_menus = menus_query.count()
        available_menus = menus_query.filter(
            models.Menu.is_available == True).count()

        # 4. Employee statistics (only non-deleted)
        employees_query = db.query(models.Employees).filter(
            models.Employees.is_deleted == False)
        if branch_ids:
            employees_query = employees_query.filter(
                models.Employees.branch_id.in_(branch_ids))
        total_employees = employees_query.count()

        # 5. Membership statistics
        total_memberships = db.query(models.Memberships).count()

        # 6. Out of stock count
        stock_query = db.query(func.count(models.Stock.stock_id)).filter(
            models.Stock.amount_remaining == 0
        )
        if branch_ids:
            stock_query = stock_query.filter(
                models.Stock.branch_id.in_(branch_ids))
        out_of_stock_count = stock_query.scalar() or 0

        return {
            "total_orders": total_orders,
            "paid_orders": paid_orders,
            "pending_orders": pending_orders,
            "total_revenue": total_revenue,
            "total_menus": total_menus,
            "available_menus": available_menus,
            "total_employees": total_employees,
            "total_memberships": total_memberships,
            "out_of_stock_count": out_of_stock_count,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error calculating dashboard stats: {str(e)}")
