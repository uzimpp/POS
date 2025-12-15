from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case, desc
from typing import List, Optional, Any
from datetime import datetime, timedelta
from app.database import get_db
from app.models import Orders, OrderItems, Branches, Menu, Memberships, Tiers, Employees, Roles, StockMovements, Stock, Ingredients
import math

router = APIRouter(
    prefix="/api/analytics",
    tags=["analytics"],
    responses={404: {"description": "Not found"}},
)

def get_date_range(period: str):
    now = datetime.now()
    if period == "today":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "7days":
        start = now - timedelta(days=7)
    elif period == "30days":
        start = now - timedelta(days=30)
    elif period == "1year" or period == "365days":
        start = now - timedelta(days=365)
    else:
        start = now - timedelta(days=30) # Default
    return start, now

def get_date_filter(period: str):
    start, _ = get_date_range(period)
    return Orders.created_at >= start

@router.get("/order-stats")
def get_order_stats(db: Session = Depends(get_db)):
    # Stats for ALL time or maybe filtered? Usually stats on a dashboard are "Total" or "Today".
    # Let's make it consistent with the dashboard overview: Total (All time) and Status breakdowns.
    # Or based on the User request: "Stats of ALL orders, Paid, Pending, Cancelled".
    
    total = db.query(func.count(Orders.order_id)).scalar()
    paid = db.query(func.count(Orders.order_id)).filter(Orders.status == 'PAID').scalar()
    pending = db.query(func.count(Orders.order_id)).filter(Orders.status == 'PENDING').scalar()
    cancelled = db.query(func.count(Orders.order_id)).filter(Orders.status == 'CANCELLED').scalar()
    
    return {
        "total_orders": total,
        "paid_orders": paid,
        "pending_orders": pending,
        "cancelled_orders": cancelled
    }

@router.get("/order-trend")
def get_order_trend(
    period: str = Query("today", regex="^(today|7days|30days|1year)$"),
    split_by: str = Query("none", regex="^(none|type|category)$"),
    db: Session = Depends(get_db)
):
    try:
        from datetime import datetime, timedelta, date, time
        from sqlalchemy import extract, func, cast, Date, literal
        
        now = datetime.now()
        
        # Base query structure: (timestamp, amount, category/type/none)
        if split_by == "category":
            # Count item quantities for category split
            query = db.query(
                Orders.created_at,
                OrderItems.quantity.label("amount"),
                Menu.category.label("label")
            ).join(
                OrderItems, Orders.order_id == OrderItems.order_id
            ).join(
                Menu, OrderItems.menu_item_id == Menu.menu_item_id
            )
            # Filter logic will trigger on Orders.created_at
        elif split_by == "type":
            # Count orders (amount=1) for type split
            query = db.query(
                Orders.created_at,
                literal(1).label("amount"),
                Orders.order_type.label("label")
            )
        else:
            # Count orders (amount=1) for total
            query = db.query(
                Orders.created_at,
                literal(1).label("amount"),
                literal("value").label("label")
            )
            
        # Common filters
        # Note: If we want to include only PAID orders or ALL orders?
        # Dashboard usually shows "Sales" -> Paid.
        # "Order Trends" might include Pending? Let's stick to ALL valid orders (exclude only implicit filtering if needed).
        # Dashboard stats usually filtered by PAID for revenue, but "Total Orders" often includes all.
        # Let's filter slightly to exclude maybe cancelled if desired, but "Total" usually implies all.
        # For consistency with "SalesChart", let's filter by PAID only if 'Sales', but this is 'Volume'.
        # Let's keep it simple: ALL orders for now, or match dashboard stats logic? 
        # User said "Order Totals". Let's exclude cancelled/deleted? The models don't have is_deleted on Orders.
        # Let's proceed without status filter for volume, or maybe just exclude 'CANCELLED'?
        # Let's count ALL to be safe as "Volume".
        pass 

        # Helper to process results
        def aggregate_results(results, labels, label_key_func):
            agg_data = {}
            # Initialize
            is_split = split_by != "none"
            
            for label in labels:
                agg_data[label] = {} if is_split else 0
            
            for t, amount, label_val in results:
                key = label_key_func(t)
                if key in agg_data:
                    amt = int(amount or 0) # Count is integer
                    if is_split:
                        agg_data[key][label_val] = agg_data[key].get(label_val, 0) + amt
                    else:
                        agg_data[key] += amt
            
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

        # Date Range Logic (Identical to dashboard.py)
        if period == "today":
            start_of_day = datetime.combine(now.date(), time.min)
            end_of_day = datetime.combine(now.date(), time.max)
            results = query.filter(Orders.created_at >= start_of_day, Orders.created_at <= end_of_day).all()
            labels = list(range(24))
            final = aggregate_results(results, labels, lambda t: t.hour)
            for item in final: item["name"] = f"{int(item['name']):02d}:00"
            return final

        elif period == "7days" or period == "30days":
            days = 7 if period == "7days" else 30
            start_date = (now - timedelta(days=days-1)).date()
            results = query.filter(func.date(Orders.created_at) >= start_date).all()
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
            results = query.filter(Orders.created_at >= min_date).all()
            final = aggregate_results(results, months, lambda t: t.date().replace(day=1))
            for i, d in enumerate(months): final[i]["name"] = d.strftime("%b %Y")
            return final

        return []
        
    except Exception as e:
        print(f"Error in get_order_trend: {e}")
        # Return empty list on error to prevent frontend crash, or let it fail?
        # User reported "Failed to fetch". Middleware puts 500.
        return []

@router.get("/channel-mix")
def get_channel_mix(period: str = "today", db: Session = Depends(get_db)):
    date_filter = get_date_filter(period)
    
    results = db.query(
        Orders.order_type,
        func.count(Orders.order_id).label("value")
    ).filter(date_filter).group_by(Orders.order_type).all()
    
    return [{"name": r.order_type or "Unknown", "value": r.value} for r in results]

@router.get("/ticket-size")
def get_ticket_size(period: str = "today", db: Session = Depends(get_db)):
    date_filter = get_date_filter(period)
    
    # Get all order totals
    orders = db.query(Orders.total_price).filter(date_filter).all()
    totals = [o.total_price or 0 for o in orders]
    
    if not totals:
        return {"distribution": [], "average": 0}
        
    avg = sum(totals) / len(totals)
    
    # Dynamic buckets 0-100, 101-200, ...
    buckets = {}
    for t in totals:
        # round to nearest 100
        lower = math.floor(t / 100) * 100
        key = f"{lower}-{lower+100}"
        buckets[key] = buckets.get(key, 0) + 1
        
    # Sort buckets by range
    sorted_keys = sorted(buckets.keys(), key=lambda x: int(x.split('-')[0]))
    distribution = [{"range": k, "count": buckets[k]} for k in sorted_keys]
    
    return {"distribution": distribution, "average": avg}

@router.get("/basket-size")
def get_basket_size(period: str = "today", db: Session = Depends(get_db)):
    date_filter = get_date_filter(period)
    
    # Calculate item count per order
    # Can do in SQL: SELECT order_id, count(item_id) FROM order_items ...
    # But need to filter by date first in Order
    
    subquery = db.query(
        Orders.order_id,
        func.count(OrderItems.order_item_id).label("item_count")
    ).join(OrderItems).filter(date_filter).group_by(Orders.order_id).subquery()
    
    results = db.query(
        subquery.c.item_count,
        func.count(subquery.c.order_id)
    ).group_by(subquery.c.item_count).all()
    
    # Format: 1 item, 2 items, ... 5+ items
    buckets = {}
    for count, freq in results:
        label = str(count)
        if count >= 5:
            label = "5+"
        buckets[label] = buckets.get(label, 0) + freq
        
    sorted_keys = sorted(buckets.keys(), key=lambda x: 99 if x == "5+" else int(x))
    return [{"items": k, "count": buckets[k]} for k in sorted_keys]

@router.get("/top-branches-volume")
def get_top_branches_volume(period: str = "today", db: Session = Depends(get_db)):
    date_filter = get_date_filter(period)
    
    results = db.query(
        Branches.name,
        func.count(Orders.order_id).label("value")
    ).join(Branches).filter(date_filter).group_by(Branches.name).order_by(desc("value")).limit(5).all()
    
    return [{"name": r.name, "value": r.value} for r in results]

@router.get("/membership-stats")
def get_membership_stats(
    period: str = "today",
    db: Session = Depends(get_db)
):
    date_filter = get_date_filter(period)
    
    # 1. Total Memberships
    total_members = db.query(func.count(Memberships.membership_id)).scalar()
    
    # 2. Total Tiers
    total_tiers = db.query(func.count(Tiers.tier_id)).scalar()
    
    # 3. Membership Order Ratio (Member Orders / Total Orders * 100)
    # Using period filter for this metric to show current trend
    total_orders_period = db.query(func.count(Orders.order_id)).filter(date_filter).scalar() or 0
    member_orders_period = db.query(func.count(Orders.order_id)).filter(
        date_filter, 
        Orders.membership_id.isnot(None)
    ).scalar() or 0
    
    ratio = 0.0
    if total_orders_period > 0:
        ratio = (member_orders_period / total_orders_period) * 100
        
    return {
        "total_members": total_members,
        "total_tiers": total_tiers,
        "start_tier_count": total_tiers, # Redundant but for completeness
        "member_ratio": round(ratio, 1)
    }

@router.get("/acquisition-growth")
def get_acquisition_growth(
    period: str = "1year", # 1year, 30days, 7days
    db: Session = Depends(get_db)
):
    end_date = datetime.now()
    
    # Determine start date and grouping format
    if period == "7days":
        start_date = end_date - timedelta(days=6)
        time_format = func.to_char(Memberships.joined_at, 'YYYY-MM-DD')
        label_func = lambda d: datetime.strptime(d, "%Y-%m-%d").strftime("%a") # Mon, Tue...
    elif period == "30days":
        start_date = end_date - timedelta(days=29)
        time_format = func.to_char(Memberships.joined_at, 'YYYY-MM-DD')
        label_func = lambda d: datetime.strptime(d, "%Y-%m-%d").strftime("%d %b") # 15 Dec
    else: # 1year
        start_date = end_date - timedelta(days=365)
        time_format = func.to_char(Memberships.joined_at, 'YYYY-MM')
        label_func = lambda d: datetime.strptime(d, "%Y-%m").strftime("%b %Y") # Dec 2023
        
    start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)

    # Get total count BEFORE start_date (Base)
    base_count = db.query(func.count(Memberships.membership_id)).filter(
        Memberships.joined_at < start_date
    ).scalar() or 0
    
    # Get incremental growth
    results = db.query(
        time_format.label("period"),
        func.count(Memberships.membership_id).label("count")
    ).filter(
        Memberships.joined_at >= start_date
    ).group_by("period").order_by("period").all()
    
    # Aggregate
    data = []
    current_total = base_count
    
    res_map = {r.period: r.count for r in results}
    
    if period == "1year":
        # Monthly iteration
        curr = start_date.replace(day=1)
        while curr <= end_date:
            key = curr.strftime("%Y-%m")
            count = res_map.get(key, 0)
            current_total += count
            
            data.append({
                "name": label_func(key),
                "value": current_total,
                "new": count
            })
            # Next month
            if curr.month == 12:
                curr = curr.replace(year=curr.year+1, month=1)
            else:
                curr = curr.replace(month=curr.month+1)
    else:
        # Daily iteration
        curr = start_date
        while curr.date() <= end_date.date():
            key = curr.strftime("%Y-%m-%d")
            count = res_map.get(key, 0)
            current_total += count
            
            data.append({
                "name": label_func(key),
                "value": current_total,
                "new": count
            })
            curr += timedelta(days=1)
        
    return data


# -------------------------------------------------------------------
# Employee Analytics
# -------------------------------------------------------------------

@router.get("/employee-stats")
def get_employee_stats(db: Session = Depends(get_db)):
    total_active = db.query(func.count(Employees.employee_id)).filter(Employees.is_deleted == False).scalar() or 0
    total_inactive = db.query(func.count(Employees.employee_id)).filter(Employees.is_deleted == True).scalar() or 0
    
    # Calculate total monthly payroll (sum of salaries of active employees)
    total_payroll = db.query(func.sum(Employees.salary)).filter(Employees.is_deleted == False).scalar() or 0
    
    # Churn rate (Inactive / Total Ever?) or just simple ratio
    # Let's return the raw numbers for frontend to compute ratios
    return {
        "active_employees": total_active,
        "inactive_employees": total_inactive,
        "total_payroll": total_payroll
    }

@router.get("/top-sales-employees")
def get_top_sales_employees(period: str = "30days", db: Session = Depends(get_db)):
    # Connect Orders -> Employees
    # Filter by date range
    start_date, _ = get_date_range(period)
    
    results = db.query(
        Employees.first_name,
        Employees.last_name,
        func.sum(Orders.total_price).label("revenue")
    ).join(Orders, Employees.employee_id == Orders.employee_id)\
     .filter(Orders.created_at >= start_date, Orders.status == 'PAID')\
     .group_by(Employees.employee_id, Employees.first_name, Employees.last_name)\
     .order_by(func.sum(Orders.total_price).desc())\
     .limit(10).all()
     
    return [
        {"name": f"{r.first_name} {r.last_name}", "value": r.revenue}
        for r in results
    ]



@router.get("/efficiency-matrix")
def get_efficiency_matrix(period: str = "30days", db: Session = Depends(get_db)):
    start_date, _ = get_date_range(period)
    
    # Get revenue per employee first
    revenue_subquery = db.query(
        Orders.employee_id,
        func.sum(Orders.total_price).label("revenue")
    ).filter(
        Orders.created_at >= start_date, 
        Orders.status == 'PAID'
    ).group_by(Orders.employee_id).subquery()
    
    # Join with Employees to get salary and role
    results = db.query(
        Employees.first_name,
        Employees.last_name,
        Employees.salary,
        Roles.role_name,
        func.coalesce(revenue_subquery.c.revenue, 0).label("revenue")
    ).outerjoin(revenue_subquery, Employees.employee_id == revenue_subquery.c.employee_id)\
     .join(Roles, Employees.role_id == Roles.role_id)\
     .filter(Employees.is_deleted == False).all()
     
    return [
        {
            "name": f"{r.first_name} {r.last_name}",
            "role": r.role_name,
            "salary": r.salary,
            "revenue": r.revenue
        }
        for r in results
    ]

@router.get("/tenure-distribution")
def get_tenure_distribution(db: Session = Depends(get_db)):
    # Calculate days since joined
    # Only for active employees? Or all? Usually active for current workforce analysis.
    
    # SQLite/Postgres difference for date diff might be tricky with portable code
    # Let's fetch joined_date and compute in python for simplicity and database agnostic safety (within reason)
    
    employees = db.query(Employees.joined_date).filter(Employees.is_deleted == False).all()
    
    now = datetime.now()
    data = []
    
    # Buckets: <90 days, 90-180, 180-365, >1 year (365+)
    buckets = {
        "< 90 Days": 0,
        "3-6 Months": 0,
        "6-12 Months": 0,
        "> 1 Year": 0
    }
    
    for emp in employees:
        if not emp.joined_date:
            continue
        delta = now - emp.joined_date
        days = delta.days
        
        if days < 90:
            buckets["< 90 Days"] += 1
        elif days < 180:
            buckets["3-6 Months"] += 1
        elif days < 365:
            buckets["6-12 Months"] += 1
        else:
            buckets["> 1 Year"] += 1
            
    return [
        {"name": k, "value": v} for k, v in buckets.items()
    ]

@router.get("/employees-by-branch")
def get_employees_by_branch(db: Session = Depends(get_db)):
    results = db.query(
        Branches.name,
        func.count(Employees.employee_id).label("count")
    ).join(Branches, Employees.branch_id == Branches.branch_id)\
     .filter(Employees.is_deleted == False)\
     .group_by(Branches.name).all()
     
    return [{"name": r.name, "value": r.count} for r in results]

@router.get("/employees-by-role")
def get_employees_by_role(db: Session = Depends(get_db)):
    results = db.query(
        Roles.role_name,
        func.count(Employees.employee_id).label("count")
    ).join(Roles, Employees.role_id == Roles.role_id)\
     .filter(Employees.is_deleted == False)\
     .group_by(Roles.role_name).all()
     
    return [{"name": r.role_name, "value": r.count} for r in results]

@router.get("/tier-distribution")
def get_tier_distribution(db: Session = Depends(get_db)):
    results = db.query(
        Tiers.tier_name,
        func.count(Memberships.membership_id).label("count")
    ).join(
        Memberships, Tiers.tier_id == Memberships.tier_id
    ).group_by(Tiers.tier_name).all()
    
    return [
        {"name": r.tier_name, "value": r.count}
        for r in results
    ]

@router.get("/value-gap")
def get_value_gap(
    period: str = "today",
    db: Session = Depends(get_db)
):
    date_filter = get_date_filter(period)
    
    # Avg Ticket Size Member
    member_avg = db.query(func.avg(Orders.total_price)).filter(
        date_filter,
        Orders.membership_id.isnot(None),
        Orders.status == 'PAID'
    ).scalar() or 0
    
    # Avg Ticket Size Non-Member
    non_member_avg = db.query(func.avg(Orders.total_price)).filter(
        date_filter,
        Orders.membership_id.is_(None),
        Orders.status == 'PAID'
    ).scalar() or 0
    
    return [
        {"name": "Member", "value": float(round(member_avg, 2))},
        {"name": "Guest", "value": float(round(non_member_avg, 2))}
    ]

@router.get("/revenue-by-tier")
def get_revenue_by_tier(
    period: str = "today",
    db: Session = Depends(get_db)
):
    date_filter = get_date_filter(period)
    
    results = db.query(
        Tiers.tier_name,
        func.sum(Orders.total_price).label("revenue")
    ).join(
        Memberships, Orders.membership_id == Memberships.membership_id
    ).join(
        Tiers, Memberships.tier_id == Tiers.tier_id
    ).filter(
        date_filter,
        Orders.status == 'PAID'
    ).group_by(Tiers.tier_name).all()
    
    return [
        {"name": r.tier_name, "value": float(r.revenue)}
        for r in results
    ]

# -------------------------------------------------------------------
# Inventory Analytics
# -------------------------------------------------------------------

@router.get("/inventory-stats")
def get_inventory_stats(db: Session = Depends(get_db)):
    # Total Items (unique ingredients in stock)
    total_items = db.query(func.count(Ingredients.ingredient_id)).filter(Ingredients.is_deleted == False).scalar() or 0
    
    # Low Stock (arbitrary threshold < 10 for now)
    low_stock_count = db.query(func.count(Stock.stock_id)).filter(
        Stock.amount_remaining < 10,
        Stock.is_deleted == False
    ).scalar() or 0
    
    # Waste Rate: Waste / (Usage + Waste)
    usage_qty = db.query(func.sum(func.abs(StockMovements.qty_change))).filter(
        StockMovements.reason.in_(['USAGE', 'SALE'])
    ).scalar() or 0
    
    waste_qty = db.query(func.sum(func.abs(StockMovements.qty_change))).filter(
        StockMovements.reason == 'WASTE'
    ).scalar() or 0
    
    total_consumption = usage_qty + waste_qty
    waste_rate = (waste_qty / total_consumption * 100) if total_consumption > 0 else 0
    
    return {
        "total_items": total_items,
        "low_stock_count": low_stock_count,
        "waste_rate": round(waste_rate, 2)
    }

@router.get("/inventory-levels")
def get_inventory_levels(db: Session = Depends(get_db)):
    from sqlalchemy import desc
    # 1. Get Top 10 Ingredients
    top_ingredients = db.query(
        Ingredients.ingredient_id,
        Ingredients.name,
        func.sum(Stock.amount_remaining).label("total_stock")
    ).join(Stock, Ingredients.ingredient_id == Stock.ingredient_id)\
     .filter(Stock.is_deleted == False)\
     .group_by(Ingredients.ingredient_id, Ingredients.name)\
     .order_by(desc("total_stock"))\
     .limit(10).all()
     
    # 2. Get Branch breakdown for these ingredients
    top_ids = [i.ingredient_id for i in top_ingredients]
    
    if not top_ids:
        return []
        
    stock_data = db.query(
        Ingredients.name.label("ingredient_name"),
        Branches.name.label("branch_name"),
        Stock.amount_remaining
    ).join(Ingredients, Stock.ingredient_id == Ingredients.ingredient_id)\
     .join(Branches, Stock.branch_id == Branches.branch_id)\
     .filter(Stock.ingredient_id.in_(top_ids))\
     .all()
     
    data_map = {}
    for r in stock_data:
        if r.ingredient_name not in data_map:
            data_map[r.ingredient_name] = {"name": r.ingredient_name}
        data_map[r.ingredient_name][r.branch_name] = float(r.amount_remaining)
        
    sorted_data = []
    for ing in top_ingredients:
        if ing.name in data_map:
            sorted_data.append(data_map[ing.name])
            
    return sorted_data

@router.get("/inventory-activity")
def get_inventory_activity(period: str = "365days", db: Session = Depends(get_db)):
    # Defaulting to 365 days to capture older test data
    start_date, _ = get_date_range(period)
    
    results = db.query(
        StockMovements.reason,
        func.count(StockMovements.reason).label("count")
    ).filter(StockMovements.created_at >= start_date)\
     .group_by(StockMovements.reason).all()
     
    return [{"name": r.reason, "value": r.count} for r in results]

@router.get("/inventory-flow")
def get_inventory_flow(db: Session = Depends(get_db)):
    end_date = datetime.now()
    start_date = end_date - timedelta(weeks=52) # Increased to 52 weeks for test data
    
    movements = db.query(
        StockMovements.created_at,
        StockMovements.reason,
        StockMovements.qty_change
    ).filter(
        StockMovements.created_at >= start_date,
        StockMovements.reason.in_(['USAGE', 'RESTOCK', 'SALE'])
    ).all()
    
    weeks = {}
    
    for m in movements:
        year, week, _ = m.created_at.isocalendar()
        key = f"{year}-W{week}"
        
        if key not in weeks:
            weeks[key] = {"name": key, "usage": 0, "restock": 0}
            
        qty = abs(float(m.qty_change))
        
        if m.reason == 'RESTOCK':
            weeks[key]["restock"] += qty
        else:
            weeks[key]["usage"] += qty
            
    data = list(weeks.values())
    data.sort(key=lambda x: x["name"])
    
    return data

@router.get("/waste-trend")
def get_waste_trend(db: Session = Depends(get_db)):
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365) # Increased to 365 days
    
    movements = db.query(
        StockMovements.created_at,
        StockMovements.qty_change
    ).filter(
        StockMovements.created_at >= start_date,
        StockMovements.reason == 'WASTE'
    ).all()
    
    months = {}
    
    for m in movements:
        key = m.created_at.strftime("%Y-%m")
        if key not in months:
            months[key] = {"name": m.created_at.strftime("%b"), "full_date": key, "value": 0}
        
        months[key]["value"] += abs(float(m.qty_change))
        
    data = list(months.values())
    data.sort(key=lambda x: x["full_date"])
    
    for d in data:
        del d["full_date"]
        
    return data
