from sqlalchemy.orm import Session
from .database import SessionLocal, engine
from .models import (
    Roles, Employees, Memberships, Menu, Stock, Recipe, Ingredients, Orders, OrderItems, Payments, Branches, Tiers
)
from decimal import Decimal
from datetime import datetime, timedelta
import random


def seed_database():
    db = SessionLocal()
    try:
        # Clear existing data
        db.query(Payments).delete()
        db.query(OrderItems).delete()
        db.query(Orders).delete()
        db.query(Recipe).delete()
        db.query(Menu).delete()
        db.query(Stock).delete()
        db.query(Ingredients).delete()
        db.query(Memberships).delete()
        db.query(Employees).delete()
        db.query(Roles).delete()
        db.query(Tiers).delete()
        db.query(Branches).delete()
        db.commit()

        # Seed Tiers
        tiers_data = [
            {"tier_name": "Bronze", "tier": 0},
            {"tier_name": "Silver", "tier": 1},
            {"tier_name": "Gold", "tier": 2},
            {"tier_name": "Platinum", "tier": 3},
        ]
        tiers = []
        for tier_data in tiers_data:
            tier = Tiers(**tier_data)
            db.add(tier)
            tiers.append(tier)
        db.commit()
        for t in tiers:
            db.refresh(t)
        tier_dict = {t.tier_name: t for t in tiers}

        # Seed Branches
        branches_data = [
            {"name": "Main Branch", "address": "123 Main St",
                "phone": "021234567", "is_deleted": False},
        ]
        branches = []
        for branch_data in branches_data:
            branch = Branches(**branch_data)
            db.add(branch)
            branches.append(branch)
        db.commit()
        for b in branches:
            db.refresh(b)
        main_branch = branches[0]

        # Seed Roles
        roles_data = [
            {"role_name": "Manager", "seniority": 3},
            {"role_name": "Chef", "seniority": 2},
            {"role_name": "Cashier", "seniority": 1},
        ]
        roles = []
        for role_data in roles_data:
            role = Roles(**role_data)
            db.add(role)
            roles.append(role)
        db.commit()
        for r in roles:
            db.refresh(r)

        # Seed Employees
        employees_data = [
            {"branch_id": main_branch.branch_id, "role_id": roles[0].role_id, "first_name": "Somsak",
                "last_name": "Tan", "is_deleted": False, "salary": 50000},
            {"branch_id": main_branch.branch_id, "role_id": roles[1].role_id, "first_name": "Niran",
                "last_name": "Wong", "is_deleted": False, "salary": 35000},
            {"branch_id": main_branch.branch_id, "role_id": roles[1].role_id, "first_name": "Pim",
                "last_name": "Suk", "is_deleted": False, "salary": 35000},
            {"branch_id": main_branch.branch_id, "role_id": roles[2].role_id, "first_name": "Aom",
                "last_name": "Lee", "is_deleted": False, "salary": 25000},
        ]
        employees = []
        for emp_data in employees_data:
            employee = Employees(**emp_data)
            db.add(employee)
            employees.append(employee)
        db.commit()
        for emp in employees:
            db.refresh(emp)

        # Seed Ingredients (master table)
        ingredients_data = [
            {"name": "Rice", "base_unit": "g", "is_deleted": False},
            {"name": "Curry Paste", "base_unit": "ml", "is_deleted": False},
            {"name": "Chicken", "base_unit": "g", "is_deleted": False},
            {"name": "Beef", "base_unit": "g", "is_deleted": False},
            {"name": "Pork", "base_unit": "g", "is_deleted": False},
            {"name": "Mixed Vegetables", "base_unit": "g", "is_deleted": False},
            {"name": "Coconut Milk", "base_unit": "ml", "is_deleted": False},
            {"name": "Onions", "base_unit": "piece", "is_deleted": False},
            {"name": "Potatoes", "base_unit": "piece", "is_deleted": False},
            {"name": "Eggs", "base_unit": "piece", "is_deleted": False},
            {"name": "Pickled Vegetables", "base_unit": "g", "is_deleted": False},
            {"name": "Soft Drink", "base_unit": "piece", "is_deleted": False},
        ]
        ingredients = []
        for ing_data in ingredients_data:
            ingredient = Ingredients(**ing_data)
            db.add(ingredient)
            ingredients.append(ingredient)
        db.commit()
        for ing in ingredients:
            db.refresh(ing)
        ingredient_dict = {ing.name: ing for ing in ingredients}

        # Seed Stock (per-branch inventory)
        stock_data = [
            {"branch_id": main_branch.branch_id,
                "ingredient_id": ingredient_dict["Rice"].ingredient_id, "amount_remaining": Decimal("50000")},
            {"branch_id": main_branch.branch_id,
                "ingredient_id": ingredient_dict["Curry Paste"].ingredient_id, "amount_remaining": Decimal("10000")},
            {"branch_id": main_branch.branch_id,
                "ingredient_id": ingredient_dict["Chicken"].ingredient_id, "amount_remaining": Decimal("20000")},
            {"branch_id": main_branch.branch_id,
                "ingredient_id": ingredient_dict["Beef"].ingredient_id, "amount_remaining": Decimal("15000")},
            {"branch_id": main_branch.branch_id,
                "ingredient_id": ingredient_dict["Pork"].ingredient_id, "amount_remaining": Decimal("18000")},
            {"branch_id": main_branch.branch_id,
                "ingredient_id": ingredient_dict["Mixed Vegetables"].ingredient_id, "amount_remaining": Decimal("12000")},
            {"branch_id": main_branch.branch_id,
                "ingredient_id": ingredient_dict["Coconut Milk"].ingredient_id, "amount_remaining": Decimal("8000")},
            {"branch_id": main_branch.branch_id,
                "ingredient_id": ingredient_dict["Onions"].ingredient_id, "amount_remaining": Decimal("100")},
            {"branch_id": main_branch.branch_id,
                "ingredient_id": ingredient_dict["Potatoes"].ingredient_id, "amount_remaining": Decimal("80")},
            {"branch_id": main_branch.branch_id,
                "ingredient_id": ingredient_dict["Eggs"].ingredient_id, "amount_remaining": Decimal("200")},
            {"branch_id": main_branch.branch_id,
                "ingredient_id": ingredient_dict["Pickled Vegetables"].ingredient_id, "amount_remaining": Decimal("5000")},
            {"branch_id": main_branch.branch_id,
                "ingredient_id": ingredient_dict["Soft Drink"].ingredient_id, "amount_remaining": Decimal("100")},
        ]
        stocks = []
        for stock_item in stock_data:
            stock = Stock(**stock_item)
            db.add(stock)
            stocks.append(stock)
        db.commit()
        for stock in stocks:
            db.refresh(stock)

        # Create stock lookup dictionary (by ingredient name)
        stock_dict = {s.ingredient.name: s for s in stocks}

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
            menu_item = Menu(**item_data)
            db.add(menu_item)
            menu_items.append(menu_item)
        db.commit()
        for item in menu_items:
            db.refresh(item)

        # Create menu item lookup dictionary
        menu_dict = {m.name: m for m in menu_items}

        # Seed Recipes (menu ingredients)
        recipes_data = [
            # Chicken Curry Rice ingredients
            {"menu_item_id": menu_dict["Chicken Curry Rice"].menu_item_id,
                "ingredient_id": ingredient_dict["Rice"].ingredient_id, "qty_per_unit": Decimal("200")},
            {"menu_item_id": menu_dict["Chicken Curry Rice"].menu_item_id,
                "ingredient_id": ingredient_dict["Curry Paste"].ingredient_id, "qty_per_unit": Decimal("50")},
            {"menu_item_id": menu_dict["Chicken Curry Rice"].menu_item_id,
                "ingredient_id": ingredient_dict["Chicken"].ingredient_id, "qty_per_unit": Decimal("150")},
            {"menu_item_id": menu_dict["Chicken Curry Rice"].menu_item_id,
                "ingredient_id": ingredient_dict["Onions"].ingredient_id, "qty_per_unit": Decimal("0.5")},
            {"menu_item_id": menu_dict["Chicken Curry Rice"].menu_item_id,
                "ingredient_id": ingredient_dict["Potatoes"].ingredient_id, "qty_per_unit": Decimal("1")},
            # Beef Curry Rice ingredients
            {"menu_item_id": menu_dict["Beef Curry Rice"].menu_item_id,
                "ingredient_id": ingredient_dict["Rice"].ingredient_id, "qty_per_unit": Decimal("200")},
            {"menu_item_id": menu_dict["Beef Curry Rice"].menu_item_id,
                "ingredient_id": ingredient_dict["Curry Paste"].ingredient_id, "qty_per_unit": Decimal("50")},
            {"menu_item_id": menu_dict["Beef Curry Rice"].menu_item_id,
                "ingredient_id": ingredient_dict["Beef"].ingredient_id, "qty_per_unit": Decimal("150")},
            {"menu_item_id": menu_dict["Beef Curry Rice"].menu_item_id,
                "ingredient_id": ingredient_dict["Mixed Vegetables"].ingredient_id, "qty_per_unit": Decimal("100")},
            # Pork Curry Rice ingredients
            {"menu_item_id": menu_dict["Pork Curry Rice"].menu_item_id,
                "ingredient_id": ingredient_dict["Rice"].ingredient_id, "qty_per_unit": Decimal("200")},
            {"menu_item_id": menu_dict["Pork Curry Rice"].menu_item_id,
                "ingredient_id": ingredient_dict["Curry Paste"].ingredient_id, "qty_per_unit": Decimal("50")},
            {"menu_item_id": menu_dict["Pork Curry Rice"].menu_item_id,
                "ingredient_id": ingredient_dict["Pork"].ingredient_id, "qty_per_unit": Decimal("150")},
            {"menu_item_id": menu_dict["Pork Curry Rice"].menu_item_id,
                "ingredient_id": ingredient_dict["Onions"].ingredient_id, "qty_per_unit": Decimal("0.5")},
            # Vegetable Curry Rice ingredients
            {"menu_item_id": menu_dict["Vegetable Curry Rice"].menu_item_id,
                "ingredient_id": ingredient_dict["Rice"].ingredient_id, "qty_per_unit": Decimal("200")},
            {"menu_item_id": menu_dict["Vegetable Curry Rice"].menu_item_id,
                "ingredient_id": ingredient_dict["Curry Paste"].ingredient_id, "qty_per_unit": Decimal("40")},
            {"menu_item_id": menu_dict["Vegetable Curry Rice"].menu_item_id,
                "ingredient_id": ingredient_dict["Mixed Vegetables"].ingredient_id, "qty_per_unit": Decimal("200")},
            # Curry Rice Combo ingredients
            {"menu_item_id": menu_dict["Curry Rice Combo"].menu_item_id,
                "ingredient_id": ingredient_dict["Rice"].ingredient_id, "qty_per_unit": Decimal("200")},
            {"menu_item_id": menu_dict["Curry Rice Combo"].menu_item_id,
                "ingredient_id": ingredient_dict["Curry Paste"].ingredient_id, "qty_per_unit": Decimal("50")},
            {"menu_item_id": menu_dict["Curry Rice Combo"].menu_item_id,
                "ingredient_id": ingredient_dict["Chicken"].ingredient_id, "qty_per_unit": Decimal("150")},
            {"menu_item_id": menu_dict["Curry Rice Combo"].menu_item_id,
                "ingredient_id": ingredient_dict["Soft Drink"].ingredient_id, "qty_per_unit": Decimal("1")},
            # Extra Meat addon
            {"menu_item_id": menu_dict["Extra Meat"].menu_item_id,
                "ingredient_id": ingredient_dict["Chicken"].ingredient_id, "qty_per_unit": Decimal("100")},
            # Extra Curry addon
            {"menu_item_id": menu_dict["Extra Curry"].menu_item_id,
                "ingredient_id": ingredient_dict["Curry Paste"].ingredient_id, "qty_per_unit": Decimal("30")},
            # Fried Egg addon
            {"menu_item_id": menu_dict["Fried Egg"].menu_item_id,
                "ingredient_id": ingredient_dict["Eggs"].ingredient_id, "qty_per_unit": Decimal("1")},
            # Pickled Vegetables addon
            {"menu_item_id": menu_dict["Pickled Vegetables"].menu_item_id,
                "ingredient_id": ingredient_dict["Pickled Vegetables"].ingredient_id, "qty_per_unit": Decimal("50")},
        ]
        for recipe_data in recipes_data:
            recipe = Recipe(**recipe_data)
            db.add(recipe)
        db.commit()

        # Seed Memberships
        memberships_data = [
            {"name": "John Smith", "phone": "0812345678",
                "email": "john@example.com", "points_balance": 150, "tier_id": tier_dict["Gold"].tier_id},
            {"name": "Jane Doe", "phone": "0823456789", "email": "jane@example.com",
                "points_balance": 80, "tier_id": tier_dict["Silver"].tier_id},
            {"name": "Bob Johnson", "phone": "0834567890", "email": "bob@example.com",
                "points_balance": 30, "tier_id": tier_dict["Bronze"].tier_id},
            {"name": "Alice Brown", "phone": "0845678901",
                "email": "alice@example.com", "points_balance": 200, "tier_id": tier_dict["Platinum"].tier_id},
            {"name": "Charlie Wilson", "phone": "0856789012",
                "email": "charlie@example.com", "points_balance": 50, "tier_id": tier_dict["Silver"].tier_id},
            {"name": "Diana Lee", "phone": "0867890123", "email": "diana@example.com",
                "points_balance": 10, "tier_id": tier_dict["Bronze"].tier_id},
            {"name": "Edward Chen", "phone": "0878901234",
                "email": "edward@example.com", "points_balance": 120, "tier_id": tier_dict["Gold"].tier_id},
        ]
        memberships = []
        for mem_data in memberships_data:
            membership = Memberships(**mem_data)
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

            order = Orders(
                branch_id=main_branch.branch_id,
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
                order_item = OrderItems(
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
                payment = Payments(
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
