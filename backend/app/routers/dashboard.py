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
    period: str = Query(..., regex="^(today|7days|30days|1year)$"),
    split_by_type: bool = Query(False),
    branch_ids: Optional[List[int]] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get sales data for line chart.
    Periods:
    - today: Hourly data (00-23) for current day
    - 7days: Daily data for last 7 days
    - 30days: Daily data for last 30 days
    - 1year: Monthly data for last 12 months
    
    If split_by_type is True, returns breakdown by order_type.
    """
    try:
        from datetime import datetime, timedelta, date, time
        from sqlalchemy import extract, func, cast, Date

        now = datetime.now()
        data = []

        # Base query
        query = db.query(
            models.Orders.created_at,
            models.Orders.total_price,
            models.Orders.order_type
        ).filter(models.Orders.status == 'PAID')

        if branch_ids:
            query = query.filter(models.Orders.branch_id.in_(branch_ids))

        # Helper to process results into {label: {type: value}} or {label: value}
        def aggregate_results(results, labels, label_key_func):
            # params:
            # results: list of (created_at, price, order_type)
            # labels: list of label keys (e.g. hours, dates)
            # label_key_func: function to get label key from result item
            
            # Initialize structure
            agg_data = {}
            for label in labels:
                agg_data[label] = {} if split_by_type else 0.0

            for t, amount, o_type in results:
                key = label_key_func(t)
                if key in agg_data:
                    amt = float(amount)
                    if split_by_type:
                        # Ensure type key exists
                        current_type_val = agg_data[key].get(o_type, 0.0)
                        agg_data[key][o_type] = current_type_val + amt
                    else:
                        agg_data[key] += amt
            
            # Flatten for response
            final_data = []
            for label in labels:
                item = {"name": str(label)} # customize name formatting later if needed
                val = agg_data[label]
                if split_by_type:
                    # Merge dict: {name: "...", DINE_IN: 100, TAKEAWAY: 50}
                    item.update(val)
                else:
                    item["value"] = val
                final_data.append(item)
            return final_data

        if period == "today":
            start_of_day = datetime.combine(now.date(), time.min)
            end_of_day = datetime.combine(now.date(), time.max)
            
            results = query.filter(
                models.Orders.created_at >= start_of_day,
                models.Orders.created_at <= end_of_day
            ).all()

            # Labels: 0-23 integers
            labels = list(range(24))
            
            def get_hour(t): return t.hour

            final = aggregate_results(results, labels, get_hour)
            # Format name
            for item in final:
                h = int(item["name"])
                item["name"] = f"{h:02d}:00"
            return final

        elif period == "7days" or period == "30days":
            days = 7 if period == "7days" else 30
            start_date = (now - timedelta(days=days-1)).date()
            
            results = query.filter(
                func.date(models.Orders.created_at) >= start_date
            ).all()

            # Labels: list of dates
            labels = [start_date + timedelta(days=i) for i in range(days)]
            
            def get_date(t): return t.date()

            final = aggregate_results(results, labels, get_date)
            # Format name
            for item in final:
                # item["name"] is actually a date object string "YYYY-MM-DD" from str(label)
                # Let's reformat from the label object if possible, but we casted to str.
                # Re-parse or just rely on consistent ordering.
                # Easy way: zip with formatted labels.
                pass
            
            # Post-process names
            for i, label in enumerate(labels):
                final[i]["name"] = label.strftime("%d/%m")
            
            return final

        elif period == "1year":
            # Last 12 months including current month
            # Logic: Get 1st day of current month last year? Or just last 12 months rolling?
            # Usually "This Year" means Jan-Dec, "1 Year" means rolling.
            # Let's do rolling 12 months (e.g. Dec 2024 back to Jan 2024)
            start_date = (now.replace(day=1) - timedelta(days=365)).replace(day=1) # Approx 1 year ago start of month
            
            # Actually better to just take 1st day of month 11 months ago.
            # e.g. Now is Dec. 11 months ago is Jan.
            
            months = []
            # Generate expected month keys (YYYY-MM)
            curr = now.replace(day=1)
            for i in range(12):
                # Go back i months
                # Simple logic:
                m = (curr.month - 1 - i) % 12 + 1
                y = curr.year + ((curr.month - 1 - i) // 12)
                months.append(date(y, m, 1)) # Use 1st of month as key
            months.reverse() # Oldest first

            min_date = months[0]
            
            results = query.filter(
                models.Orders.created_at >= min_date
            ).all()

            def get_month_start(t):
                return t.date().replace(day=1)

            final = aggregate_results(results, months, get_month_start)
            
            # Format name
            for i, d in enumerate(months):
                final[i]["name"] = d.strftime("%b %Y") # Jan 2025
            
            return final

        return data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching sales chart data: {str(e)}")


@router.get("/top-branches")
def get_top_branches(
    period: str = Query("today", regex="^(today|7days|30days|1year)$"),
    db: Session = Depends(get_db)
):
    """
    Get top 5 branches by sales for the specified period.
    """
    try:
        from datetime import datetime, timedelta, date, time
        from sqlalchemy import func, desc

        now = datetime.now()
        
        # Determine start date based on period
        if period == "today":
            start_date = datetime.combine(now.date(), time.min)
        elif period == "7days":
            start_date = datetime.combine(now.date() - timedelta(days=6), time.min)
        elif period == "30days":
            start_date = datetime.combine(now.date() - timedelta(days=29), time.min)
        elif period == "1year":
            # Last 12 months (start of month 11 months ago)
            start_date = datetime.combine((now.replace(day=1) - timedelta(days=365)).replace(day=1), time.min)
        
        # Query: Sum total_price of PAID orders group by branch
        # Join Orders -> Branches to get name
        results = db.query(
            models.Branches.name,
            func.sum(models.Orders.total_price).label("total_sales")
        ).join(
            models.Orders, models.Branches.branch_id == models.Orders.branch_id
        ).filter(
            models.Orders.status == 'PAID',
            models.Orders.created_at >= start_date
        ).group_by(
            models.Branches.branch_id, models.Branches.name
        ).order_by(
            desc("total_sales")
        ).limit(5).all()

        data = []
        for name, total in results:
            data.append({
                "name": name,
                "value": float(total) if total else 0.0
            })
            
        return data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching top branches: {str(e)}")
