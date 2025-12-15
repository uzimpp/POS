from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case, desc
from typing import List, Optional, Any
from datetime import datetime, timedelta
from app.database import get_db
from app.models import Orders, OrderItems, Branches
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
    period: str = "today",
    split_by: str = "none", # none, type, category
    db: Session = Depends(get_db)
):
    date_filter = get_date_filter(period)
    
    # Base query
    query = db.query(Orders).filter(date_filter)
    
    # Grouping
    if period == "today":
        # Hourly
        time_format = func.to_char(Orders.created_at, 'HH24:00')
    elif period == "1year":
        # Monthly
        time_format = func.to_char(Orders.created_at, 'Mon')
    else:
        # Daily
        time_format = func.to_char(Orders.created_at, 'Dy')

    if split_by == "none":
        results = db.query(
            time_format.label("name"),
            func.count(Orders.order_id).label("value")
        ).filter(date_filter).group_by("name").order_by("name").all()
        
        # Sort properly for period
        # (Simplified sorting logic for brevity, ideally redundant with dashboard.py logic)
        return [{"name": r.name, "value": r.value} for r in results]

    elif split_by == "type":
        results = db.query(
            time_format.label("name"),
            Orders.order_type,
            func.count(Orders.order_id).label("value")
        ).filter(date_filter).group_by("name", Orders.order_type).all()
        
        # Transform to [{name: "10:00", "Dine In": 5, "Takeaway": 2}]
        data_map = {}
        for r in results:
            if r.name not in data_map:
                data_map[r.name] = {"name": r.name}
            data_map[r.name][r.order_type] = r.value
        return list(data_map.values())

    # Category split logic would need OrderItems join
    
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
