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


@router.get("/sales-chart")
def get_sales_chart_data(
    period: str = Query(..., regex="^(today|7days|30days)$"),
    branch_ids: Optional[List[int]] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get sales data for line chart.
    Periods:
    - today: Hourly data (00-23) for current day
    - 7days: Daily data for last 7 days
    - 30days: Daily data for last 30 days
    """
    try:
        from datetime import datetime, timedelta, date, time
        from sqlalchemy import extract, cast, Date

        now = datetime.now()
        data = []

        # Base query: join Orders -> Payments to get paid_price
        # We only care about PAID orders for sales chart? Or all orders? 
        # Usually sales chart implies "Revenue", so use Payments or Orders with status PAID.
        # Let's use Orders with total_price for simplicity but check status=PAID if needed.
        # Better strictly use aggregated payments for "Sales".
        # But for simplicity let's use Orders.created_at and total_price where status='PAID'
        
        query = db.query(
            models.Orders.created_at,
            models.Orders.total_price
        ).filter(models.Orders.status == 'PAID')

        if branch_ids:
            query = query.filter(models.Orders.branch_id.in_(branch_ids))

        if period == "today":
            # Filter for today
            start_of_day = datetime.combine(now.date(), time.min)
            end_of_day = datetime.combine(now.date(), time.max)
            
            # Helper to generate all hours 0-23
            sales_by_hour = {h: 0.0 for h in range(24)}
            
            # Fetch data for today
            results = query.filter(
                models.Orders.created_at >= start_of_day,
                models.Orders.created_at <= end_of_day
            ).all()

            for t, amount in results:
                # amount is Decimal, convert to float
                sales_by_hour[t.hour] += float(amount)

            # Format for frontend
            for h in range(24):
                data.append({
                    "name": f"{h:02d}:00",
                    "value": sales_by_hour[h]
                })

        elif period == "7days" or period == "30days":
            days = 7 if period == "7days" else 30
            start_date = (now - timedelta(days=days-1)).date() # Include today, so go back N-1 days
            
            # Generate all dates
            sales_by_date = {}
            for i in range(days):
                d = start_date + timedelta(days=i)
                sales_by_date[d] = 0.0
            
            # Query
            results = query.filter(
                func.date(models.Orders.created_at) >= start_date
            ).all()

            for t, amount in results:
                d = t.date()
                if d in sales_by_date:
                    sales_by_date[d] += float(amount)
            
            # Format
            for d in sorted(sales_by_date.keys()):
                data.append({
                    "name": d.strftime("%d/%m"), # DD/MM format
                    "value": sales_by_date[d]
                })

        return data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching sales chart data: {str(e)}")
