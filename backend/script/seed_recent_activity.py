
import sys
import os
import random
from datetime import datetime, timedelta
from typing import List

from dotenv import load_dotenv
from pathlib import Path

# Add path to import from app
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))
env_path = root_dir / '.env'
load_dotenv(dotenv_path=env_path)

from app.database import SessionLocal
from app.models import Stock, StockMovements, Employees

def seed_recent_activity():
    db = SessionLocal()
    try:
        print("Seeding recent stock movements...")
        
        # Get all stocks to attach movements to
        stocks = db.query(Stock).all()
        if not stocks:
            print("No stocks found! Please seed stocks first.")
            return

        # Get a valid employee for the movements
        employee = db.query(Employees).first()
        employee_id = employee.employee_id if employee else 1

        movements: List[StockMovements] = []
        
        # Current time
        now = datetime.now()
        
        # Generate movements for the last 60 days
        reasons = ['USAGE', 'USAGE', 'USAGE', 'RESTOCK', 'WASTE'] # Higher weight on usage
        
        for stock in stocks:
            # Generate 5-10 movements per stock item
            num_movements = random.randint(5, 10)
            
            for _ in range(num_movements):
                days_ago = random.randint(0, 60)
                movement_date = now - timedelta(days=days_ago)
                
                reason = random.choice(reasons)
                qty = 0.0
                
                if reason == 'RESTOCK':
                    qty = random.uniform(10.0, 50.0)
                elif reason == 'USAGE':
                    qty = -random.uniform(1.0, 5.0)
                elif reason == 'WASTE':
                    qty = -random.uniform(0.1, 2.0)
                    
                movement = StockMovements(
                    stock_id=stock.stock_id,
                    employee_id=employee_id,
                    qty_change=round(qty, 2),
                    reason=reason,
                    note=f"Auto-generated {reason}",
                    created_at=movement_date
                )
                movements.append(movement)
        
        # Bulk insert
        db.bulk_save_objects(movements)
        db.commit()
        print(f"Successfully added {len(movements)} stock movements.")
        
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_recent_activity()
