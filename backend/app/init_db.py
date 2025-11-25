"""
Initialize database and seed data
"""
from .database import engine, Base
from .seed import seed_database

if __name__ == "__main__":
    # Create all tables
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")

    # Seed database
    print("Seeding database...")
    seed_database()
    print("Database initialization complete!")
