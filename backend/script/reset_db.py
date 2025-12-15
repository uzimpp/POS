import sys
import os

# Add path to import from app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import engine, Base
from sqlalchemy import text

def reset_database():
    print("Resetting database...")
    with engine.connect() as connection:
        # Disable triggers to avoid FK constraints issues during truncation
        # or properly CASCADE.
        # Postgres supports TRUNCATE ... CASCADE
        print("Truncating all tables...")
        trans = connection.begin()
        try:
            # List of tables to truncate in order (reverse dependency)
            # Or just truncate all with cascading
            
            # Since we have many tables, dynamic approach or explicit list
            # We will use explicit list to be safe, or just TRUNCATE all known tables
            
            tables = [
                "payments",
                "order_items",
                "orders",
                "recipe",
                "stock_movements",
                "stock",
                "menu",
                "ingredients",
                "memberships",
                "employees",
                "roles",
                "branches",
                "tiers"
            ]
            
            for table in tables:
                try:
                    connection.execute(text(f"TRUNCATE TABLE {table} CASCADE;"))
                    print(f"Truncated {table}")
                except Exception as e:
                    print(f"Error truncating {table}: {e}")
            
            trans.commit()
            print("Database reset successful.")
        except Exception as e:
            trans.rollback()
            print(f"Error resetting database: {e}")

if __name__ == "__main__":
    reset_database()
