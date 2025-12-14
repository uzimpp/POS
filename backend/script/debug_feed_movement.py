
import sys
import os
from decimal import Decimal
from datetime import datetime

# Add path to import from app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import SessionLocal
from app.models import Stock, StockMovements

def debug_movement():
    db = SessionLocal()
    try:
        print("Checking Stock ID 1...")
        stock = db.query(Stock).filter(Stock.stock_id == 1).first()
        if not stock:
            print("Stock ID 1 NOT FOUND!")
            return
        
        print(f"Stock 1 found. Amount: {stock.amount_remaining}")
        
        print("Attempting to insert movement for Stock 1...")
        qty = Decimal("100.00")
        movement = StockMovements(
            stock_id=1,
            employee_id=1, # Manager
            qty_change=qty,
            reason="DEBUG_TEST",
            note="Debug insertion",
            created_at=datetime.now()
        )
        db.add(movement)
        
        # Update stock
        stock.amount_remaining += qty
        db.add(stock)
        
        db.commit()
        print("Commit successful!")
        
        # Verify
        db.refresh(stock)
        print(f"New Stock Amount: {stock.amount_remaining}")
        
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_movement()
