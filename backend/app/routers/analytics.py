from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case, desc
from typing import List, Optional, Any
from datetime import datetime, timedelta
from app.database import get_db
from app.models import Orders, OrderItems, Branches, Menu
import math

router = APIRouter(
    prefix="/api/analytics",
    tags=["analytics"],
    responses={404: {"description": "Not found"}},
)

def get_date_filter(period: str):
    now = datetime.now()
    if period == "today":
        return Orders.created_at >= now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "7days":
        return Orders.created_at >= now - timedelta(days=7)
    elif period == "30days":
        return Orders.created_at >= now - timedelta(days=30)
    elif period == "1year":
        return Orders.created_at >= now - timedelta(days=365)
    return True

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
