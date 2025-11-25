from sqlalchemy.orm import Session
from .database import SessionLocal, engine
from .models import (
    Role, Employee, Membership, MenuItem, Stock, MenuIngredient, Order, OrderItem, Payment
)
from decimal import Decimal
from datetime import datetime, timedelta
import random


def seed_database():
    db = SessionLocal()
    try:
        # Clear existing data
        db.query(Payment).delete()
        db.query(OrderItem).delete()
        db.query(Order).delete()
        db.query(MenuIngredient).delete()
        db.query(MenuItem).delete()
        db.query(Stock).delete()
        db.query(Membership).delete()
        db.query(Employee).delete()
        db.query(Role).delete()
        db.commit()

        # Seed Roles
        roles_data = [
            {"role_name": "Manager", "ranking": 3},
            {"role_name": "Chef", "ranking": 2},
            {"role_name": "Cashier", "ranking": 1},
        ]
        roles = []
        for role_data in roles_data:
            role = Role(**role_data)
            db.add(role)
            roles.append(role)
        db.commit()
        db.refresh(roles[0])
        db.refresh(roles[1])
        db.refresh(roles[2])

        # Seed Employees
        employees_data = [
            {"role_id": roles[0].role_id, "first_name": "Somsak",
                "last_name": "Tan", "is_active": True, "salary": 50000},
            {"role_id": roles[1].role_id, "first_name": "Niran",
                "last_name": "Wong", "is_active": True, "salary": 35000},
            {"role_id": roles[1].role_id, "first_name": "Pim",
                "last_name": "Suk", "is_active": True, "salary": 35000},
            {"role_id": roles[2].role_id, "first_name": "Aom",
                "last_name": "Lee", "is_active": True, "salary": 25000},
        ]
        employees = []
        for emp_data in employees_data:
            employee = Employee(**emp_data)
            db.add(employee)
            employees.append(employee)
        db.commit()
        for emp in employees:
            db.refresh(emp)

        # Seed Stock (Ingredients)
        stock_data = [
            {"stk_name": "Rice", "amount_remaining": Decimal(
                "50000"), "unit": "g"},
            {"stk_name": "Curry Paste", "amount_remaining": Decimal(
                "10000"), "unit": "ml"},
            {"stk_name": "Chicken", "amount_remaining": Decimal(
                "20000"), "unit": "g"},
            {"stk_name": "Beef", "amount_remaining": Decimal(
                "15000"), "unit": "g"},
            {"stk_name": "Pork", "amount_remaining": Decimal(
                "18000"), "unit": "g"},
            {"stk_name": "Mixed Vegetables",
                "amount_remaining": Decimal("12000"), "unit": "g"},
            {"stk_name": "Coconut Milk",
                "amount_remaining": Decimal("8000"), "unit": "ml"},
            {"stk_name": "Onions", "amount_remaining": Decimal(
                "100"), "unit": "piece"},
            {"stk_name": "Potatoes", "amount_remaining": Decimal(
                "80"), "unit": "piece"},
            {"stk_name": "Eggs", "amount_remaining": Decimal(
                "200"), "unit": "piece"},
            {"stk_name": "Pickled Vegetables",
                "amount_remaining": Decimal("5000"), "unit": "g"},
            {"stk_name": "Soft Drink", "amount_remaining": Decimal(
                "100"), "unit": "piece"},
        ]
        stocks = []
        for stock_item in stock_data:
            stock = Stock(**stock_item)
            db.add(stock)
            stocks.append(stock)
        db.commit()
        for stock in stocks:
            db.refresh(stock)

        # Create stock lookup dictionary
        stock_dict = {s.stk_name: s for s in stocks}

        # Seed Menu Items
        menu_items_data = [
            # Dishes
            {"name": "Chicken Curry Rice", "type": "dish", "description": "Tender chicken with aromatic curry sauce",
                "price": Decimal("120.00"), "category": "Main", "is_available": True},
            {"name": "Beef Curry Rice", "type": "dish", "description": "Rich beef curry with vegetables",
                "price": Decimal("150.00"), "category": "Main", "is_available": True},
            {"name": "Pork Curry Rice", "type": "dish", "description": "Savory pork curry",
                "price": Decimal("130.00"), "category": "Main", "is_available": True},
            {"name": "Vegetable Curry Rice", "type": "dish", "description": "Fresh vegetables in curry sauce",
                "price": Decimal("100.00"), "category": "Main", "is_available": True},
            # Sets
            {"name": "Curry Rice Combo", "type": "set", "description": "Curry rice with soft drink",
                "price": Decimal("150.00"), "category": "Main", "is_available": True},
            {"name": "Family Set", "type": "set", "description": "2 curry rice dishes + 2 drinks",
                "price": Decimal("280.00"), "category": "Main", "is_available": True},
            # Addons
            {"name": "Extra Meat", "type": "addon", "description": "Additional portion of meat",
                "price": Decimal("40.00"), "category": "Topping", "is_available": True},
            {"name": "Extra Curry", "type": "addon", "description": "Extra curry sauce",
                "price": Decimal("20.00"), "category": "Topping", "is_available": True},
            {"name": "Fried Egg", "type": "addon", "description": "Sunny side up egg",
                "price": Decimal("15.00"), "category": "Topping", "is_available": True},
            {"name": "Pickled Vegetables", "type": "addon", "description": "Traditional pickled vegetables",
                "price": Decimal("10.00"), "category": "Appetizer", "is_available": True},
            # Drinks
            {"name": "Soft Drink", "type": "addon", "description": "Carbonated soft drink",
                "price": Decimal("30.00"), "category": "Drink", "is_available": True},
        ]
        menu_items = []
        for item_data in menu_items_data:
            menu_item = MenuItem(**item_data)
            db.add(menu_item)
            menu_items.append(menu_item)
        db.commit()
        for item in menu_items:
            db.refresh(item)

        # Create menu item lookup dictionary
        menu_dict = {m.name: m for m in menu_items}

        # Seed Menu Ingredients
        menu_ingredients_data = [
            # Chicken Curry Rice ingredients
            {"menu_item_id": menu_dict["Chicken Curry Rice"].menu_item_id,
                "stock_id": stock_dict["Rice"].stock_id, "qty_per_unit": Decimal("200"), "unit": "g"},
            {"menu_item_id": menu_dict["Chicken Curry Rice"].menu_item_id,
                "stock_id": stock_dict["Curry Paste"].stock_id, "qty_per_unit": Decimal("50"), "unit": "ml"},
            {"menu_item_id": menu_dict["Chicken Curry Rice"].menu_item_id,
                "stock_id": stock_dict["Chicken"].stock_id, "qty_per_unit": Decimal("150"), "unit": "g"},
            {"menu_item_id": menu_dict["Chicken Curry Rice"].menu_item_id,
                "stock_id": stock_dict["Onions"].stock_id, "qty_per_unit": Decimal("0.5"), "unit": "piece"},
            {"menu_item_id": menu_dict["Chicken Curry Rice"].menu_item_id,
                "stock_id": stock_dict["Potatoes"].stock_id, "qty_per_unit": Decimal("1"), "unit": "piece"},
            # Beef Curry Rice ingredients
            {"menu_item_id": menu_dict["Beef Curry Rice"].menu_item_id,
                "stock_id": stock_dict["Rice"].stock_id, "qty_per_unit": Decimal("200"), "unit": "g"},
            {"menu_item_id": menu_dict["Beef Curry Rice"].menu_item_id,
                "stock_id": stock_dict["Curry Paste"].stock_id, "qty_per_unit": Decimal("50"), "unit": "ml"},
            {"menu_item_id": menu_dict["Beef Curry Rice"].menu_item_id,
                "stock_id": stock_dict["Beef"].stock_id, "qty_per_unit": Decimal("150"), "unit": "g"},
            {"menu_item_id": menu_dict["Beef Curry Rice"].menu_item_id,
                "stock_id": stock_dict["Mixed Vegetables"].stock_id, "qty_per_unit": Decimal("100"), "unit": "g"},
            # Pork Curry Rice ingredients
            {"menu_item_id": menu_dict["Pork Curry Rice"].menu_item_id,
                "stock_id": stock_dict["Rice"].stock_id, "qty_per_unit": Decimal("200"), "unit": "g"},
            {"menu_item_id": menu_dict["Pork Curry Rice"].menu_item_id,
                "stock_id": stock_dict["Curry Paste"].stock_id, "qty_per_unit": Decimal("50"), "unit": "ml"},
            {"menu_item_id": menu_dict["Pork Curry Rice"].menu_item_id,
                "stock_id": stock_dict["Pork"].stock_id, "qty_per_unit": Decimal("150"), "unit": "g"},
            {"menu_item_id": menu_dict["Pork Curry Rice"].menu_item_id,
                "stock_id": stock_dict["Onions"].stock_id, "qty_per_unit": Decimal("0.5"), "unit": "piece"},
            # Vegetable Curry Rice ingredients
            {"menu_item_id": menu_dict["Vegetable Curry Rice"].menu_item_id,
                "stock_id": stock_dict["Rice"].stock_id, "qty_per_unit": Decimal("200"), "unit": "g"},
            {"menu_item_id": menu_dict["Vegetable Curry Rice"].menu_item_id,
                "stock_id": stock_dict["Curry Paste"].stock_id, "qty_per_unit": Decimal("40"), "unit": "ml"},
            {"menu_item_id": menu_dict["Vegetable Curry Rice"].menu_item_id,
                "stock_id": stock_dict["Mixed Vegetables"].stock_id, "qty_per_unit": Decimal("200"), "unit": "g"},
            # Curry Rice Combo ingredients
            {"menu_item_id": menu_dict["Curry Rice Combo"].menu_item_id,
                "stock_id": stock_dict["Rice"].stock_id, "qty_per_unit": Decimal("200"), "unit": "g"},
            {"menu_item_id": menu_dict["Curry Rice Combo"].menu_item_id,
                "stock_id": stock_dict["Curry Paste"].stock_id, "qty_per_unit": Decimal("50"), "unit": "ml"},
            {"menu_item_id": menu_dict["Curry Rice Combo"].menu_item_id,
                "stock_id": stock_dict["Chicken"].stock_id, "qty_per_unit": Decimal("150"), "unit": "g"},
            {"menu_item_id": menu_dict["Curry Rice Combo"].menu_item_id,
                "stock_id": stock_dict["Soft Drink"].stock_id, "qty_per_unit": Decimal("1"), "unit": "piece"},
            # Extra Meat addon
            {"menu_item_id": menu_dict["Extra Meat"].menu_item_id,
                "stock_id": stock_dict["Chicken"].stock_id, "qty_per_unit": Decimal("100"), "unit": "g"},
            # Extra Curry addon
            {"menu_item_id": menu_dict["Extra Curry"].menu_item_id,
                "stock_id": stock_dict["Curry Paste"].stock_id, "qty_per_unit": Decimal("30"), "unit": "ml"},
            # Fried Egg addon
            {"menu_item_id": menu_dict["Fried Egg"].menu_item_id,
                "stock_id": stock_dict["Eggs"].stock_id, "qty_per_unit": Decimal("1"), "unit": "piece"},
            # Pickled Vegetables addon
            {"menu_item_id": menu_dict["Pickled Vegetables"].menu_item_id,
                "stock_id": stock_dict["Pickled Vegetables"].stock_id, "qty_per_unit": Decimal("50"), "unit": "g"},
        ]
        for ing_data in menu_ingredients_data:
            menu_ingredient = MenuIngredient(**ing_data)
            db.add(menu_ingredient)
        db.commit()

        # Seed Memberships
        memberships_data = [
            {"name": "John Smith", "phone": "0812345678",
                "email": "john@example.com", "points_balance": 150, "membership_tier": "Gold"},
            {"name": "Jane Doe", "phone": "0823456789", "email": "jane@example.com",
                "points_balance": 80, "membership_tier": "Silver"},
            {"name": "Bob Johnson", "phone": "0834567890", "email": "bob@example.com",
                "points_balance": 30, "membership_tier": "Bronze"},
            {"name": "Alice Brown", "phone": "0845678901",
                "email": "alice@example.com", "points_balance": 200, "membership_tier": "Platinum"},
            {"name": "Charlie Wilson", "phone": "0856789012",
                "email": "charlie@example.com", "points_balance": 50, "membership_tier": "Silver"},
            {"name": "Diana Lee", "phone": "0867890123", "email": "diana@example.com",
                "points_balance": 10, "membership_tier": "Bronze"},
            {"name": "Edward Chen", "phone": "0878901234",
                "email": "edward@example.com", "points_balance": 120, "membership_tier": "Gold"},
        ]
        memberships = []
        for mem_data in memberships_data:
            membership = Membership(**mem_data)
            db.add(membership)
            memberships.append(membership)
        db.commit()
        for mem in memberships:
            db.refresh(mem)

        # Seed Orders with Order Items
        now = datetime.now()
        orders_data = [
            {
                "membership_id": memberships[0].membership_id,
                "employee_id": employees[3].employee_id,  # Cashier
                "order_type": "DINE_IN",
                "status": "PAID",
                "created_at": now - timedelta(days=5),
                "items": [
                    {"menu_item": "Chicken Curry Rice",
                        "quantity": 2, "status": "DONE"},
                    {"menu_item": "Soft Drink", "quantity": 2, "status": "DONE"},
                ],
                "payment": {"paid_price": Decimal("321.00"), "points_used": 0, "payment_method": "CASH", "paid_timestamp": now - timedelta(days=5, hours=1)}
            },
            {
                "membership_id": None,
                "employee_id": employees[3].employee_id,
                "order_type": "TAKEAWAY",
                "status": "PAID",
                "created_at": now - timedelta(days=4),
                "items": [
                    {"menu_item": "Beef Curry Rice",
                        "quantity": 1, "status": "DONE"},
                    {"menu_item": "Extra Meat", "quantity": 1, "status": "DONE"},
                ],
                "payment": {"paid_price": Decimal("203.00"), "points_used": 0, "payment_method": "QR", "paid_timestamp": now - timedelta(days=4, hours=1)}
            },
            {
                "membership_id": memberships[1].membership_id,
                "employee_id": employees[0].employee_id,  # Manager
                "order_type": "DELIVERY",
                "status": "PAID",
                "created_at": now - timedelta(days=3),
                "items": [
                    {"menu_item": "Pork Curry Rice",
                        "quantity": 3, "status": "DONE"},
                    {"menu_item": "Fried Egg", "quantity": 3, "status": "DONE"},
                ],
                "payment": {"paid_price": Decimal("465.00"), "points_used": 20, "payment_method": "POINTS", "paid_timestamp": now - timedelta(days=3, hours=1)}
            },
            {
                "membership_id": memberships[2].membership_id,
                "employee_id": employees[3].employee_id,
                "order_type": "DINE_IN",
                "status": "UNPAID",
                "created_at": now - timedelta(hours=2),
                "items": [
                    {"menu_item": "Vegetable Curry Rice",
                        "quantity": 1, "status": "PREPARING"},
                    {"menu_item": "Pickled Vegetables",
                        "quantity": 1, "status": "PREPARING"},
                ],
                "payment": None
            },
            {
                "membership_id": None,
                "employee_id": employees[3].employee_id,
                "order_type": "TAKEAWAY",
                "status": "UNPAID",
                "created_at": now - timedelta(hours=1),
                "items": [
                    {"menu_item": "Curry Rice Combo",
                        "quantity": 2, "status": "PREPARING"},
                ],
                "payment": None
            },
            {
                "membership_id": memberships[3].membership_id,
                "employee_id": employees[3].employee_id,
                "order_type": "DINE_IN",
                "status": "CANCELLED",
                "created_at": now - timedelta(days=2),
                "items": [
                    {"menu_item": "Chicken Curry Rice",
                        "quantity": 1, "status": "CANCELLED"},
                ],
                "payment": None
            },
            {
                "membership_id": memberships[4].membership_id,
                "employee_id": employees[3].employee_id,
                "order_type": "DELIVERY",
                "status": "PAID",
                "created_at": now - timedelta(days=1),
                "items": [
                    {"menu_item": "Family Set", "quantity": 1, "status": "DONE"},
                ],
                "payment": {"paid_price": Decimal("299.60"), "points_used": 0, "payment_method": "CARD", "payment_ref": "TXN123456", "paid_timestamp": now - timedelta(days=1, hours=1)}
            },
        ]

        for order_data in orders_data:
            # Calculate order total from items
            total_price = Decimal("0")
            order_items_list = []

            for item_data in order_data["items"]:
                menu_item = menu_dict[item_data["menu_item"]]
                quantity = item_data["quantity"]
                unit_price = menu_item.price
                line_total = unit_price * quantity
                total_price += line_total

                order_items_list.append({
                    "menu_item_id": menu_item.menu_item_id,
                    "quantity": quantity,
                    "unit_price": unit_price,
                    "line_total": line_total,
                    "status": item_data["status"]
                })

            order = Order(
                membership_id=order_data["membership_id"],
                employee_id=order_data["employee_id"],
                order_type=order_data["order_type"],
                status=order_data["status"],
                created_at=order_data["created_at"],
                total_price=total_price
            )
            db.add(order)
            db.flush()
            db.refresh(order)

            # Create order items
            for item_data in order_items_list:
                order_item = OrderItem(
                    order_id=order.order_id,
                    menu_item_id=item_data["menu_item_id"],
                    status=item_data["status"],
                    quantity=item_data["quantity"],
                    unit_price=item_data["unit_price"],
                    line_total=item_data["line_total"]
                )
                db.add(order_item)

            # Create payment if order is paid
            if order_data["payment"]:
                payment_data = order_data["payment"]
                payment = Payment(
                    order_id=order.order_id,
                    paid_price=payment_data["paid_price"],
                    points_used=payment_data.get("points_used", 0),
                    payment_method=payment_data["payment_method"],
                    payment_ref=payment_data.get("payment_ref"),
                    paid_timestamp=payment_data.get("paid_timestamp")
                )
                db.add(payment)

        db.commit()
        print("Database seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    from .models import Base
    Base.metadata.create_all(bind=engine)
    seed_database()
