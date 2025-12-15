import os
import psycopg2
from sqlalchemy import create_engine, text

# Hardcoded correct credentials for local dev
DB_USER = "posuser"
DB_PASS = "pospass"
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "posdb"

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

print(f"Testing connection to: {DATABASE_URL}")

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("Connection successful!")
        print("Result:", result.fetchone())
except Exception as e:
    print("Connection failed!")
    print(e)
