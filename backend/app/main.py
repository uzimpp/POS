from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, get_db
from .models import Base
from .routers import (
    roles, employees, memberships, stock, menu_items,
    menu_ingredients, orders, order_items, payments
)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="POS System API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001","http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(roles.router)
app.include_router(employees.router)
app.include_router(memberships.router)
app.include_router(stock.router)
app.include_router(menu_items.router)
app.include_router(menu_ingredients.router)
app.include_router(orders.router)
app.include_router(order_items.router)
app.include_router(payments.router)


@app.get("/")
def root():
    return {"message": "POS System API", "docs": "/docs"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
