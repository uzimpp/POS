import sys
import os
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.routers.analytics import get_order_trend

db = SessionLocal()
try:
    print("Testing 'today' split='none':")
    res = get_order_trend(period="today", split_by="none", db=db)
    print(res[:1])

    print("\nTesting 'today' split='type':")
    res = get_order_trend(period="today", split_by="type", db=db)
    print(res[:1])

    print("\nTesting 'today' split='category':")
    res = get_order_trend(period="today", split_by="category", db=db)
    print(res[:1])
    
    print("\nSuccess!")
except Exception as e:
    print(f"\nFailed: {e}")
finally:
    db.close()
