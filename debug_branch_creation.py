import os
import sys

# Set env vars for DB connection (matching docker-compose defaults)
os.environ["POSTGRES_USER"] = "posuser"
os.environ["POSTGRES_PASSWORD"] = "pospass"
os.environ["POSTGRES_DB"] = "posdb"
os.environ["POSTGRES_HOST"] = "localhost"
os.environ["POSTGRES_PORT"] = "5432"

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    print("Importing app modules...")
    from app import models, schemas, database
    from app.database import SessionLocal, engine
    
    print("Creating tables if not exist...")
    models.Base.metadata.create_all(bind=engine)
    
    print("Testing Branch Schema Dump...")
    branch_data = schemas.BranchCreate(name="Debug Branch", address="123 Debug St", phone="555-0199")
    print(f"Dumped data: {branch_data.model_dump()}")
    
    print("Connecting to DB...")
    db = SessionLocal()
    
    print("Adding Branch to DB...")
    db_branch = models.Branches(**branch_data.model_dump())
    db.add(db_branch)
    db.commit()
    db.refresh(db_branch)
    
    print(f"Success! Created Branch ID: {db_branch.branch_id}")
    
    # Clean up (optional, but good for idempotency)
    # db.delete(db_branch)
    # db.commit()
    
    db.close()

except Exception as e:
    print(f"FAILED: {e}")
    import traceback
    traceback.print_exc()
