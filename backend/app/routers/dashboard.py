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
    split_by_category: bool = Query(False),
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
    If split_by_category is True, returns breakdown by Menu.category.
    """
    try:
        from datetime import datetime, timedelta, date, time
        from sqlalchemy import extract, func, cast, Date

        now = datetime.now()
        data = []

        # Base query depends on split method
        # If splitting by category, we must join OrderItems and Menu
        if split_by_category:
            query = db.query(
                models.Orders.created_at,
                models.OrderItems.line_total.label("amount"),
                models.Menu.category.label("category")
            ).join(
                models.OrderItems, models.Orders.order_id == models.OrderItems.order_id
            ).join(
                models.Menu, models.OrderItems.menu_item_id == models.Menu.menu_item_id
            ).filter(models.Orders.status == 'PAID')
        else:
            # Default or split_by_type uses Orders table directly
            query = db.query(
                models.Orders.created_at,
                models.Orders.total_price.label("amount"),
                models.Orders.order_type
            ).filter(models.Orders.status == 'PAID')

        if branch_ids:
            query = query.filter(models.Orders.branch_id.in_(branch_ids))

        # Helper to process results into {label: {type: value}} or {label: value}
        def aggregate_results(results, labels, label_key_func):
            agg_data = {}
            # Initialize with 0 or dict
            is_split = split_by_type or split_by_category
            
            for label in labels:
                agg_data[label] = {} if is_split else 0.0

            if split_by_category:
                for t, amount, category in results:
                    key = label_key_func(t)
                    if key in agg_data:
                        amt = float(amount)
                        current_cat_val = agg_data[key].get(category, 0.0)
                        agg_data[key][category] = current_cat_val + amt
            elif split_by_type:
                for t, amount, o_type in results:
                    key = label_key_func(t)
                    if key in agg_data:
                        amt = float(amount)
                        current_type_val = agg_data[key].get(o_type, 0.0)
                        agg_data[key][o_type] = current_type_val + amt
            else:
                for t, amount, _ in results:
                    key = label_key_func(t)
                    if key in agg_data:
                        agg_data[key] += float(amount)
            
            # Flatten for response
            final_data = []
            for label in labels:
                item = {"name": str(label)}
                val = agg_data[label]
                if is_split:
                    item.update(val)
                else:
                    item["value"] = val
                final_data.append(item)
            return final_data

        # Determine Date Range
        if period == "today":
            start_of_day = datetime.combine(now.date(), time.min)
            end_of_day = datetime.combine(now.date(), time.max)
            results = query.filter(models.Orders.created_at >= start_of_day, models.Orders.created_at <= end_of_day).all()
            labels = list(range(24))
            final = aggregate_results(results, labels, lambda t: t.hour)
            for item in final: item["name"] = f"{int(item['name']):02d}:00"
            return final

        elif period == "7days" or period == "30days":
            days = 7 if period == "7days" else 30
            start_date = (now - timedelta(days=days-1)).date()
            results = query.filter(func.date(models.Orders.created_at) >= start_date).all()
            labels = [start_date + timedelta(days=i) for i in range(days)]
            final = aggregate_results(results, labels, lambda t: t.date())
            for i, label in enumerate(labels): final[i]["name"] = label.strftime("%d/%m")
            return final

        elif period == "1year":
            months = []
            curr = now.replace(day=1)
            for i in range(12):
                m = (curr.month - 1 - i) % 12 + 1
                y = curr.year + ((curr.month - 1 - i) // 12)
                months.append(date(y, m, 1))
            months.reverse()
            min_date = months[0]
            results = query.filter(models.Orders.created_at >= min_date).all()
            final = aggregate_results(results, months, lambda t: t.date().replace(day=1))
            for i, d in enumerate(months): final[i]["name"] = d.strftime("%b %Y")
            return final

        return data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching sales chart data: {str(e)}")


@router.get("/top-branches")
def get_top_branches(
    period: str = Query("today", regex="^(today|7days|30days|1year)$"),
    split_by_category: bool = Query(False),
    db: Session = Depends(get_db)
):
    """
    Get top 5 branches by sales.
    If split_by_category is True, returns stacked data by category.
    """
    try:
        from datetime import datetime, timedelta, date, time
        from sqlalchemy import func, desc, case

        now = datetime.now()
        
        if period == "today":
            start_date = datetime.combine(now.date(), time.min)
        elif period == "7days":
            start_date = datetime.combine(now.date() - timedelta(days=6), time.min)
        elif period == "30days":
            start_date = datetime.combine(now.date() - timedelta(days=29), time.min)
        elif period == "1year":
            start_date = datetime.combine((now.replace(day=1) - timedelta(days=365)).replace(day=1), time.min)
        
        if split_by_category:
            # We need to get total sales per branch to rank them, AND sales per category
            # Strategy:
            # 1. Find Top 5 Branch IDs first
            top_branches_query = db.query(models.Branches.branch_id).join(
                models.Orders, models.Branches.branch_id == models.Orders.branch_id
            ).filter(
                models.Orders.status == 'PAID',
                models.Orders.created_at >= start_date
            ).group_by(models.Branches.branch_id).order_by(
                desc(func.sum(models.Orders.total_price))
            ).limit(5)
            
            top_branch_ids = [r[0] for r in top_branches_query.all()]
            
            if not top_branch_ids:
                return []

            # 2. Query breakdown for these branches
            # Join OrderItems -> Menu for category
            results = db.query(
                models.Branches.name,
                models.Menu.category,
                func.sum(models.OrderItems.line_total)
            ).join(
                models.Orders, models.Branches.branch_id == models.Orders.branch_id
            ).join(
                models.OrderItems, models.Orders.order_id == models.OrderItems.order_id
            ).join(
                models.Menu, models.OrderItems.menu_item_id == models.Menu.menu_item_id
            ).filter(
                models.Orders.status == 'PAID',
                models.Orders.created_at >= start_date,
                models.Branches.branch_id.in_(top_branch_ids)
            ).group_by(
                models.Branches.name, models.Menu.category
            ).all()
            
            # 3. Transform to [{name: "Branch", "Main Dish": 100, "Drink": 50}]
            data_map = {}
            for name, category, amount in results:
                if name not in data_map:
                    data_map[name] = {"name": name, "total": 0.0} # Track total for sorting if needed, or rely on frontend
                data_map[name][category] = float(amount)
                data_map[name]["total"] += float(amount)
            
            # Convert to list and sort by total descending
            data = sorted(data_map.values(), key=lambda x: x["total"], reverse=True)
            # Remove "total" key if not needed by frontend, or keep it.
            # Recharts is fine with extra keys.
            return data

        else:
            # Original logic
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


@router.get("/membership-ratio")
def get_membership_ratio(
    period: str = Query("today", regex="^(today|7days|30days|1year)$"),
    db: Session = Depends(get_db)
):
    """
    Get ratio of orders by Members vs Guests.
    """
    try:
        from datetime import datetime, timedelta, time
        now = datetime.now()
        
        # Determine start date
        if period == "today":
            start_date = datetime.combine(now.date(), time.min)
        elif period == "7days":
            start_date = datetime.combine(now.date() - timedelta(days=6), time.min)
        elif period == "30days":
            start_date = datetime.combine(now.date() - timedelta(days=29), time.min)
        elif period == "1year":
            start_date = datetime.combine((now.replace(day=1) - timedelta(days=365)).replace(day=1), time.min)
            
        # Count Member orders (membership_id IS NOT NULL)
        member_count = db.query(func.count(models.Orders.order_id)).filter(
            models.Orders.status == 'PAID',
            models.Orders.created_at >= start_date,
            models.Orders.membership_id.isnot(None)
        ).scalar() or 0
        
        # Count Guest orders (membership_id IS NULL)
        guest_count = db.query(func.count(models.Orders.order_id)).filter(
            models.Orders.status == 'PAID',
            models.Orders.created_at >= start_date,
            models.Orders.membership_id.is_(None)
        ).scalar() or 0
        
        return [
            {"name": "Member", "value": member_count},
            {"name": "Guest", "value": guest_count}
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching membership ratio: {str(e)}")
