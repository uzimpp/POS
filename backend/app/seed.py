from sqlalchemy.orm import Session
from .database import SessionLocal, engine
from .models import (
    Roles, Employees, Memberships, Menu, Stock, Recipe, Ingredients,
    Orders, OrderItems, Payments, Branches, Tiers, StockMovements
)
from decimal import Decimal
from datetime import datetime, timedelta
import random


def seed_database():
    db = SessionLocal()
    try:
        # Clear existing data (order matters for foreign keys)
        db.query(StockMovements).delete()
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

        # =====================
        # TIERS
        # =====================
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
        print("✓ Seeded Tiers")

        # =====================
        # BRANCHES (Multiple locations)
        # =====================
        branches_data = [
            {"name": "สาขาสยาม (Siam)", "address": "123 Siam Square, Pathumwan, Bangkok 10330",
             "phone": "021234567", "is_deleted": False},
            {"name": "สาขาทองหล่อ (Thonglor)", "address": "88 Sukhumvit 55, Watthana, Bangkok 10110",
             "phone": "022345678", "is_deleted": False},
            {"name": "สาขาเซ็นทรัลเวิลด์ (CentralWorld)", "address": "4th Floor, CentralWorld, Ratchadamri Rd, Bangkok 10330",
             "phone": "023456789", "is_deleted": False},
        ]
        branches = []
        for branch_data in branches_data:
            branch = Branches(**branch_data)
            db.add(branch)
            branches.append(branch)
        db.commit()
        for b in branches:
            db.refresh(b)
        print(f"✓ Seeded {len(branches)} Branches")

        # =====================
        # ROLES
        # =====================
        roles_data = [
            {"role_name": "Manager", "seniority": 4},
            {"role_name": "Assistant Manager", "seniority": 3},
            {"role_name": "Head Chef", "seniority": 3},
            {"role_name": "Chef", "seniority": 2},
            {"role_name": "Cashier", "seniority": 1},
            {"role_name": "Waiter", "seniority": 1},
        ]
        roles = []
        for role_data in roles_data:
            role = Roles(**role_data)
            db.add(role)
            roles.append(role)
        db.commit()
        for r in roles:
            db.refresh(r)
        role_dict = {r.role_name: r for r in roles}
        print(f"✓ Seeded {len(roles)} Roles")

        # =====================
        # EMPLOYEES (Multiple per branch)
        # =====================
        thai_first_names = ["สมชาย", "สมหญิง", "นิรันดร์", "พิมพ์", "อรุณ", "กมล", "วิชัย", "สุภา", "ธนา", "ปราณี",
                            "สุรชัย", "นภา", "ชาติชาย", "รัตนา", "ประสิทธิ์", "วราภรณ์", "สมศักดิ์", "จันทร์"]
        thai_last_names = ["ตันติ", "วงศ์", "สุขใจ", "ลี", "จันทร์", "พงษ์", "ศรี", "แก้ว", "ทอง", "สว่าง",
                           "เจริญ", "อุดม", "มั่งมี", "รุ่งเรือง", "สมบูรณ์"]

        employees = []
        employee_configs = [
            # Branch 1 - Siam (larger, flagship)
            (branches[0], role_dict["Manager"], 55000),
            (branches[0], role_dict["Assistant Manager"], 40000),
            (branches[0], role_dict["Head Chef"], 45000),
            (branches[0], role_dict["Chef"], 32000),
            (branches[0], role_dict["Chef"], 30000),
            (branches[0], role_dict["Cashier"], 22000),
            (branches[0], role_dict["Cashier"], 20000),
            (branches[0], role_dict["Waiter"], 18000),
            (branches[0], role_dict["Waiter"], 18000),
            (branches[0], role_dict["Waiter"], 17000),
            # Branch 2 - Thonglor (medium)
            (branches[1], role_dict["Manager"], 50000),
            (branches[1], role_dict["Head Chef"], 42000),
            (branches[1], role_dict["Chef"], 30000),
            (branches[1], role_dict["Cashier"], 20000),
            (branches[1], role_dict["Waiter"], 17000),
            (branches[1], role_dict["Waiter"], 17000),
            # Branch 3 - CentralWorld (small kiosk style)
            (branches[2], role_dict["Assistant Manager"], 38000),
            (branches[2], role_dict["Chef"], 32000),
            (branches[2], role_dict["Cashier"], 21000),
            (branches[2], role_dict["Waiter"], 18000),
        ]

        for i, (branch, role, salary) in enumerate(employee_configs):
            first_name = random.choice(thai_first_names)
            last_name = random.choice(thai_last_names)
            emp = Employees(
                branch_id=branch.branch_id,
                role_id=role.role_id,
                first_name=first_name,
                last_name=last_name,
                salary=salary,
                is_deleted=False
            )
            db.add(emp)
            employees.append(emp)
        db.commit()
        for emp in employees:
            db.refresh(emp)
        print(f"✓ Seeded {len(employees)} Employees")

        # =====================
        # INGREDIENTS (Comprehensive Thai ingredients)
        # =====================
        ingredients_data = [
            # Rice & Noodles
            {"name": "Jasmine Rice", "base_unit": "g", "is_deleted": False},
            {"name": "Sticky Rice", "base_unit": "g", "is_deleted": False},
            # Proteins
            {"name": "Chicken Breast", "base_unit": "g", "is_deleted": False},
            {"name": "Chicken Thigh", "base_unit": "g", "is_deleted": False},
            {"name": "Beef Sirloin", "base_unit": "g", "is_deleted": False},
            {"name": "Pork Belly", "base_unit": "g", "is_deleted": False},
            {"name": "Pork Loin", "base_unit": "g", "is_deleted": False},
            {"name": "Shrimp", "base_unit": "g", "is_deleted": False},
            {"name": "Squid", "base_unit": "g", "is_deleted": False},
            {"name": "Tofu", "base_unit": "g", "is_deleted": False},
            {"name": "Eggs", "base_unit": "piece", "is_deleted": False},
            # Curry & Sauces
            {"name": "Yellow Curry Paste", "base_unit": "g", "is_deleted": False},
            {"name": "Green Curry Paste", "base_unit": "g", "is_deleted": False},
            {"name": "Red Curry Paste", "base_unit": "g", "is_deleted": False},
            {"name": "Massaman Curry Paste", "base_unit": "g", "is_deleted": False},
            {"name": "Coconut Milk", "base_unit": "ml", "is_deleted": False},
            {"name": "Fish Sauce", "base_unit": "ml", "is_deleted": False},
            {"name": "Oyster Sauce", "base_unit": "ml", "is_deleted": False},
            {"name": "Soy Sauce", "base_unit": "ml", "is_deleted": False},
            # Vegetables
            {"name": "Onion", "base_unit": "piece", "is_deleted": False},
            {"name": "Potato", "base_unit": "piece", "is_deleted": False},
            {"name": "Carrot", "base_unit": "piece", "is_deleted": False},
            {"name": "Bell Pepper", "base_unit": "piece", "is_deleted": False},
            {"name": "Thai Basil", "base_unit": "g", "is_deleted": False},
            {"name": "Cilantro", "base_unit": "g", "is_deleted": False},
            {"name": "Green Onion", "base_unit": "piece", "is_deleted": False},
            {"name": "Garlic", "base_unit": "piece", "is_deleted": False},
            {"name": "Ginger", "base_unit": "g", "is_deleted": False},
            {"name": "Chili", "base_unit": "piece", "is_deleted": False},
            {"name": "Cucumber", "base_unit": "piece", "is_deleted": False},
            {"name": "Mixed Vegetables", "base_unit": "g", "is_deleted": False},
            # Toppings & Others
            {"name": "Peanuts", "base_unit": "g", "is_deleted": False},
            {"name": "Fried Shallots", "base_unit": "g", "is_deleted": False},
            {"name": "Pickled Vegetables", "base_unit": "g", "is_deleted": False},
            {"name": "Lime", "base_unit": "piece", "is_deleted": False},
            # Drinks
            {"name": "Thai Tea", "base_unit": "g", "is_deleted": False},
            {"name": "Coffee Beans", "base_unit": "g", "is_deleted": False},
            {"name": "Condensed Milk", "base_unit": "ml", "is_deleted": False},
            {"name": "Cola", "base_unit": "can", "is_deleted": False},
            {"name": "Sprite", "base_unit": "can", "is_deleted": False},
            {"name": "Water", "base_unit": "bottle", "is_deleted": False},
            {"name": "Ice", "base_unit": "g", "is_deleted": False},
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
        print(f"✓ Seeded {len(ingredients)} Ingredients")

        # =====================
        # STOCK (Per branch inventory)
        # =====================
        stocks = []
        stock_dict_by_branch = {}

        for branch in branches:
            stock_dict_by_branch[branch.branch_id] = {}
            # Different stock levels per branch (flagship has more)
            multiplier = 1.5 if branch == branches[0] else (
                1.0 if branch == branches[1] else 0.7)

            stock_levels = {
                "Jasmine Rice": 50000,
                "Sticky Rice": 10000,
                "Chicken Breast": 15000,
                "Chicken Thigh": 12000,
                "Beef Sirloin": 8000,
                "Pork Belly": 10000,
                "Pork Loin": 8000,
                "Shrimp": 5000,
                "Squid": 3000,
                "Tofu": 5000,
                "Eggs": 200,
                "Yellow Curry Paste": 5000,
                "Green Curry Paste": 4000,
                "Red Curry Paste": 4000,
                "Massaman Curry Paste": 3000,
                "Coconut Milk": 20000,
                "Fish Sauce": 5000,
                "Oyster Sauce": 3000,
                "Soy Sauce": 3000,
                "Onion": 100,
                "Potato": 80,
                "Carrot": 60,
                "Bell Pepper": 40,
                "Thai Basil": 500,
                "Cilantro": 300,
                "Green Onion": 50,
                "Garlic": 100,
                "Ginger": 500,
                "Chili": 100,
                "Cucumber": 50,
                "Mixed Vegetables": 8000,
                "Peanuts": 2000,
                "Fried Shallots": 1000,
                "Pickled Vegetables": 3000,
                "Lime": 80,
                "Thai Tea": 2000,
                "Coffee Beans": 3000,
                "Condensed Milk": 5000,
                "Cola": 100,
                "Sprite": 100,
                "Water": 150,
                "Ice": 50000,
            }

            for ing_name, base_amount in stock_levels.items():
                if ing_name in ingredient_dict:
                    amount = Decimal(str(int(base_amount * multiplier)))
                    stock = Stock(
                        branch_id=branch.branch_id,
                        ingredient_id=ingredient_dict[ing_name].ingredient_id,
                        amount_remaining=amount,
                        is_deleted=False
                    )
                    db.add(stock)
                    stocks.append(stock)

        db.commit()
        for stock in stocks:
            db.refresh(stock)
            stock_dict_by_branch[stock.branch_id][stock.ingredient_id] = stock
        print(
            f"✓ Seeded {len(stocks)} Stock items across {len(branches)} branches")

        # =====================
        # MENU ITEMS
        # =====================
        menu_items_data = [
            # Main Curry Dishes
            {"name": "Chicken Yellow Curry", "type": "dish", "description": "Classic Thai yellow curry with tender chicken, potatoes, and coconut milk",
                "price": Decimal("129.00"), "category": "Main", "is_available": True},
            {"name": "Beef Massaman Curry", "type": "dish", "description": "Rich and aromatic Massaman curry with beef and peanuts",
                "price": Decimal("169.00"), "category": "Main", "is_available": True},
            {"name": "Pork Green Curry", "type": "dish", "description": "Spicy green curry with pork and Thai basil",
                "price": Decimal("139.00"), "category": "Main", "is_available": True},
            {"name": "Shrimp Red Curry", "type": "dish", "description": "Red curry with fresh shrimp and vegetables",
                "price": Decimal("189.00"), "category": "Main", "is_available": True},
            {"name": "Vegetable Curry", "type": "dish", "description": "Mixed vegetables in yellow curry with tofu",
                "price": Decimal("99.00"), "category": "Main", "is_available": True},
            {"name": "Chicken Basil Rice", "type": "dish", "description": "Stir-fried chicken with holy basil and chili",
                "price": Decimal("109.00"), "category": "Main", "is_available": True},
            {"name": "Pork Garlic Rice", "type": "dish", "description": "Crispy garlic pork with steamed rice",
                "price": Decimal("119.00"), "category": "Main", "is_available": True},
            # Set Meals
            {"name": "Curry Combo Set", "type": "set", "description": "Any curry + rice + drink",
                "price": Decimal("169.00"), "category": "Set", "is_available": True},
            {"name": "Family Set (4 pax)", "type": "set", "description": "2 curries + rice + 4 drinks",
             "price": Decimal("549.00"), "category": "Set", "is_available": True},
            {"name": "Lunch Special", "type": "set", "description": "Mini curry + rice + soup + drink",
                "price": Decimal("139.00"), "category": "Set", "is_available": True},
            # Add-ons
            {"name": "Extra Rice", "type": "addon", "description": "Additional steamed jasmine rice",
                "price": Decimal("25.00"), "category": "Side", "is_available": True},
            {"name": "Extra Meat", "type": "addon", "description": "Additional portion of meat",
                "price": Decimal("49.00"), "category": "Side", "is_available": True},
            {"name": "Extra Curry", "type": "addon", "description": "Additional curry sauce",
                "price": Decimal("29.00"), "category": "Side", "is_available": True},
            {"name": "Fried Egg", "type": "addon", "description": "Sunny side up egg",
                "price": Decimal("19.00"), "category": "Side", "is_available": True},
            {"name": "Steamed Egg", "type": "addon", "description": "Soft steamed egg custard",
                "price": Decimal("25.00"), "category": "Side", "is_available": True},
            {"name": "Pickled Vegetables", "type": "addon", "description": "Traditional Thai pickled vegetables",
                "price": Decimal("15.00"), "category": "Side", "is_available": True},
            {"name": "Cucumber Salad", "type": "addon", "description": "Fresh cucumber with vinegar dressing",
                "price": Decimal("19.00"), "category": "Side", "is_available": True},
            # Drinks
            {"name": "Thai Iced Tea", "type": "addon", "description": "Classic Thai milk tea with ice",
                "price": Decimal("45.00"), "category": "Drink", "is_available": True},
            {"name": "Thai Iced Coffee", "type": "addon", "description": "Strong Thai coffee with condensed milk",
                "price": Decimal("45.00"), "category": "Drink", "is_available": True},
            {"name": "Cola", "type": "addon", "description": "Coca-Cola",
                "price": Decimal("35.00"), "category": "Drink", "is_available": True},
            {"name": "Sprite", "type": "addon", "description": "Sprite lemon-lime",
                "price": Decimal("35.00"), "category": "Drink", "is_available": True},
            {"name": "Water", "type": "addon", "description": "Bottled water",
                "price": Decimal("20.00"), "category": "Drink", "is_available": True},
        ]
        menu_items = []
        for item_data in menu_items_data:
            menu_item = Menu(**item_data)
            db.add(menu_item)
            menu_items.append(menu_item)
        db.commit()
        for item in menu_items:
            db.refresh(item)
        menu_dict = {m.name: m for m in menu_items}
        print(f"✓ Seeded {len(menu_items)} Menu items")

        # =====================
        # RECIPES
        # =====================
        recipes_data = [
            # Chicken Yellow Curry
            ("Chicken Yellow Curry", [("Jasmine Rice", 200), ("Yellow Curry Paste", 40), (
                "Chicken Thigh", 150), ("Coconut Milk", 100), ("Potato", 1), ("Onion", 0.5), ("Fish Sauce", 10)]),
            # Beef Massaman Curry
            ("Beef Massaman Curry", [("Jasmine Rice", 200), ("Massaman Curry Paste", 50), ("Beef Sirloin", 180), (
                "Coconut Milk", 120), ("Potato", 1), ("Onion", 0.5), ("Peanuts", 20), ("Fish Sauce", 10)]),
            # Pork Green Curry
            ("Pork Green Curry", [("Jasmine Rice", 200), ("Green Curry Paste", 40), ("Pork Loin", 150), (
                "Coconut Milk", 100), ("Thai Basil", 10), ("Bell Pepper", 0.5), ("Fish Sauce", 10)]),
            # Shrimp Red Curry
            ("Shrimp Red Curry", [("Jasmine Rice", 200), ("Red Curry Paste", 40), ("Shrimp", 150), (
                "Coconut Milk", 100), ("Thai Basil", 10), ("Bell Pepper", 0.5), ("Fish Sauce", 10)]),
            # Vegetable Curry
            ("Vegetable Curry", [("Jasmine Rice", 200), ("Yellow Curry Paste", 35), (
                "Tofu", 100), ("Mixed Vegetables", 150), ("Coconut Milk", 80), ("Fish Sauce", 8)]),
            # Chicken Basil Rice
            ("Chicken Basil Rice", [("Jasmine Rice", 200), ("Chicken Breast", 150), (
                "Thai Basil", 15), ("Garlic", 2), ("Chili", 2), ("Oyster Sauce", 15), ("Fish Sauce", 10)]),
            # Pork Garlic Rice
            ("Pork Garlic Rice", [("Jasmine Rice", 200), ("Pork Belly", 150), (
                "Garlic", 3), ("Soy Sauce", 15), ("Oyster Sauce", 10), ("Cilantro", 5)]),
            # Set Meals
            ("Curry Combo Set", [("Jasmine Rice", 200), ("Yellow Curry Paste",
             40), ("Chicken Thigh", 150), ("Coconut Milk", 100), ("Cola", 1)]),
            ("Family Set (4 pax)", [("Jasmine Rice", 800), ("Yellow Curry Paste", 100), ("Green Curry Paste", 80), (
                "Chicken Thigh", 400), ("Pork Loin", 300), ("Coconut Milk", 400), ("Cola", 4)]),
            ("Lunch Special", [("Jasmine Rice", 150), ("Yellow Curry Paste",
             30), ("Chicken Thigh", 100), ("Coconut Milk", 60), ("Cola", 1)]),
            # Add-ons
            ("Extra Rice", [("Jasmine Rice", 150)]),
            ("Extra Meat", [("Chicken Thigh", 80)]),
            ("Extra Curry", [
             ("Yellow Curry Paste", 25), ("Coconut Milk", 40)]),
            ("Fried Egg", [("Eggs", 1)]),
            ("Steamed Egg", [("Eggs", 2)]),
            ("Pickled Vegetables", [("Pickled Vegetables", 50)]),
            ("Cucumber Salad", [("Cucumber", 1),
             ("Chili", 1), ("Lime", 0.5), ("Fish Sauce", 5)]),
            # Drinks
            ("Thai Iced Tea", [("Thai Tea", 15),
             ("Condensed Milk", 30), ("Ice", 100)]),
            ("Thai Iced Coffee", [("Coffee Beans", 20),
             ("Condensed Milk", 30), ("Ice", 100)]),
            ("Cola", [("Cola", 1)]),
            ("Sprite", [("Sprite", 1)]),
            ("Water", [("Water", 1)]),
        ]

        for menu_name, ingredients_list in recipes_data:
            if menu_name in menu_dict:
                for ing_name, qty in ingredients_list:
                    if ing_name in ingredient_dict:
                        recipe = Recipe(
                            menu_item_id=menu_dict[menu_name].menu_item_id,
                            ingredient_id=ingredient_dict[ing_name].ingredient_id,
                            qty_per_unit=Decimal(str(qty))
                        )
                        db.add(recipe)
        db.commit()
        print("✓ Seeded Recipes")

        # =====================
        # MEMBERSHIPS
        # =====================
        memberships_data = [
            {"name": "Somchai Tanaka", "phone": "0812345678", "email": "somchai@email.com",
                "points_balance": 1500, "tier_id": tier_dict["Platinum"].tier_id},
            {"name": "Nisa Wongsawat", "phone": "0823456789", "email": "nisa@email.com",
                "points_balance": 850, "tier_id": tier_dict["Gold"].tier_id},
            {"name": "Prasit Jaidee", "phone": "0834567890", "email": "prasit@email.com",
                "points_balance": 420, "tier_id": tier_dict["Silver"].tier_id},
            {"name": "Waraporn Chen", "phone": "0845678901", "email": "waraporn@email.com",
                "points_balance": 2100, "tier_id": tier_dict["Platinum"].tier_id},
            {"name": "Kittisak Phongphan", "phone": "0856789012", "email": "kittisak@email.com",
                "points_balance": 180, "tier_id": tier_dict["Bronze"].tier_id},
            {"name": "Siriporn Lee", "phone": "0867890123", "email": "siriporn@email.com",
                "points_balance": 650, "tier_id": tier_dict["Gold"].tier_id},
            {"name": "Anong Sukjai", "phone": "0878901234", "email": "anong@email.com",
                "points_balance": 90, "tier_id": tier_dict["Bronze"].tier_id},
            {"name": "Chaiwat Ruengrit", "phone": "0889012345", "email": "chaiwat@email.com",
                "points_balance": 320, "tier_id": tier_dict["Silver"].tier_id},
            {"name": "Malai Thongchai", "phone": "0890123456", "email": "malai@email.com",
                "points_balance": 1100, "tier_id": tier_dict["Gold"].tier_id},
            {"name": "Pornthip Srisuwan", "phone": "0901234567", "email": "pornthip@email.com",
                "points_balance": 50, "tier_id": tier_dict["Bronze"].tier_id},
        ]
        memberships = []
        for mem_data in memberships_data:
            membership = Memberships(**mem_data)
            db.add(membership)
            memberships.append(membership)
        db.commit()
        for mem in memberships:
            db.refresh(mem)
        print(f"✓ Seeded {len(memberships)} Memberships")

        # =====================
        # STOCK MOVEMENTS (Historical restock records)
        # =====================
        now = datetime.now()
        movement_count = 0

        for branch in branches:
            branch_stocks = [
                s for s in stocks if s.branch_id == branch.branch_id]
            # Add restock movements for each stock item (simulating initial stock)
            for stock in branch_stocks:
                movement = StockMovements(
                    stock_id=stock.stock_id,
                    qty_change=stock.amount_remaining,
                    reason="RESTOCK",
                    note="Initial stock",
                    created_at=now - timedelta(days=30)
                )
                db.add(movement)
                movement_count += 1

            # Add some additional restock movements over the past month
            for _ in range(5):
                random_stock = random.choice(branch_stocks)
                restock_amount = Decimal(str(random.randint(100, 1000)))
                movement = StockMovements(
                    stock_id=random_stock.stock_id,
                    qty_change=restock_amount,
                    reason="RESTOCK",
                    note="Weekly restock",
                    created_at=now - timedelta(days=random.randint(1, 25))
                )
                db.add(movement)
                movement_count += 1

            # Add some waste movements
            for _ in range(2):
                random_stock = random.choice(branch_stocks)
                waste_amount = Decimal(str(random.randint(10, 100)))
                movement = StockMovements(
                    stock_id=random_stock.stock_id,
                    qty_change=-waste_amount,
                    reason="WASTE",
                    note="Expired items",
                    created_at=now - timedelta(days=random.randint(1, 15))
                )
                db.add(movement)
                movement_count += 1

        db.commit()
        print(f"✓ Seeded {movement_count} Stock Movements")

        # =====================
        # ORDERS & PAYMENTS (Historical data for analytics)
        # =====================
        order_types = ["DINE_IN", "TAKEAWAY", "DELIVERY"]
        payment_methods = ["CASH", "CARD", "QR", "POINTS"]
        main_dishes = ["Chicken Yellow Curry", "Beef Massaman Curry", "Pork Green Curry",
                       "Shrimp Red Curry", "Vegetable Curry", "Chicken Basil Rice", "Pork Garlic Rice"]
        addons = ["Fried Egg", "Thai Iced Tea", "Cola", "Sprite",
                  "Water", "Pickled Vegetables", "Extra Rice"]

        orders_created = 0
        payments_created = 0

        # Generate orders for the past 60 days
        for days_ago in range(60, 0, -1):
            order_date = now - timedelta(days=days_ago)

            # More orders on weekends
            is_weekend = order_date.weekday() >= 5
            orders_per_day = random.randint(
                15, 30) if is_weekend else random.randint(8, 20)

            for branch in branches:
                # Fewer orders for smaller branches
                branch_multiplier = 1.0 if branch == branches[0] else (
                    0.7 if branch == branches[1] else 0.5)
                branch_orders = int(orders_per_day * branch_multiplier)

                branch_employees = [
                    e for e in employees if e.branch_id == branch.branch_id]
                cashiers = [e for e in branch_employees if e.role_id ==
                            role_dict["Cashier"].role_id or e.role_id == role_dict["Waiter"].role_id]
                if not cashiers:
                    cashiers = branch_employees

                for _ in range(branch_orders):
                    # Random order time during business hours (10am - 10pm)
                    hour = random.randint(10, 21)
                    minute = random.randint(0, 59)
                    order_time = order_date.replace(
                        hour=hour, minute=minute, second=0, microsecond=0)

                    # Random order composition
                    num_main_dishes = random.choices(
                        [1, 2, 3], weights=[0.6, 0.3, 0.1])[0]
                    selected_dishes = random.sample(
                        main_dishes, min(num_main_dishes, len(main_dishes)))

                    # Maybe add some addons
                    num_addons = random.choices([0, 1, 2, 3], weights=[
                                                0.3, 0.4, 0.2, 0.1])[0]
                    selected_addons = random.sample(
                        addons, min(num_addons, len(addons)))

                    # Calculate total
                    total_price = Decimal("0")
                    order_items_list = []

                    for dish_name in selected_dishes:
                        if dish_name in menu_dict:
                            menu_item = menu_dict[dish_name]
                            qty = random.choices([1, 2], weights=[0.8, 0.2])[0]
                            line_total = menu_item.price * qty
                            total_price += line_total
                            order_items_list.append({
                                "menu_item_id": menu_item.menu_item_id,
                                "quantity": qty,
                                "unit_price": menu_item.price,
                                "line_total": line_total,
                                "status": "DONE"
                            })

                    for addon_name in selected_addons:
                        if addon_name in menu_dict:
                            menu_item = menu_dict[addon_name]
                            qty = 1
                            line_total = menu_item.price * qty
                            total_price += line_total
                            order_items_list.append({
                                "menu_item_id": menu_item.menu_item_id,
                                "quantity": qty,
                                "unit_price": menu_item.price,
                                "line_total": line_total,
                                "status": "DONE"
                            })

                    if not order_items_list:
                        continue

                    # Maybe assign a membership (30% chance)
                    membership_id = random.choice(
                        memberships).membership_id if random.random() < 0.3 else None

                    # Create order (95% are PAID for historical, 5% CANCELLED)
                    status = "CANCELLED" if random.random() < 0.05 else "PAID"

                    order = Orders(
                        branch_id=branch.branch_id,
                        membership_id=membership_id,
                        employee_id=random.choice(cashiers).employee_id,
                        order_type=random.choice(order_types),
                        status=status,
                        created_at=order_time,
                        total_price=total_price if status == "PAID" else Decimal(
                            "0")
                    )
                    db.add(order)
                    db.flush()

                    # Create order items
                    for item_data in order_items_list:
                        item_status = "CANCELLED" if status == "CANCELLED" else "DONE"
                        order_item = OrderItems(
                            order_id=order.order_id,
                            menu_item_id=item_data["menu_item_id"],
                            status=item_status,
                            quantity=item_data["quantity"],
                            unit_price=item_data["unit_price"],
                            line_total=item_data["line_total"] if status == "PAID" else Decimal(
                                "0")
                        )
                        db.add(order_item)

                    # Create payment for paid orders
                    if status == "PAID":
                        payment_method = random.choice(payment_methods)
                        payment = Payments(
                            order_id=order.order_id,
                            paid_price=total_price,
                            points_used=random.randint(
                                0, 50) if payment_method == "POINTS" else 0,
                            payment_method=payment_method,
                            payment_ref=f"TXN{order.order_id:06d}" if payment_method in [
                                "CARD", "QR"] else None,
                            paid_timestamp=order_time +
                            timedelta(minutes=random.randint(15, 45))
                        )
                        db.add(payment)
                        payments_created += 1

                    orders_created += 1

            # Commit every few days to avoid memory issues
            if days_ago % 10 == 0:
                db.commit()

        # Add some current day orders in various states
        for branch in branches:
            branch_employees = [
                e for e in employees if e.branch_id == branch.branch_id]
            cashiers = [e for e in branch_employees if e.role_id ==
                        role_dict["Cashier"].role_id or e.role_id == role_dict["Waiter"].role_id]
            if not cashiers:
                cashiers = branch_employees

            # Active orders (UNPAID with items in various states)
            for i in range(random.randint(2, 5)):
                order_time = now - \
                    timedelta(hours=random.randint(0, 2),
                              minutes=random.randint(0, 59))

                dish_name = random.choice(main_dishes)
                menu_item = menu_dict[dish_name]

                order = Orders(
                    branch_id=branch.branch_id,
                    membership_id=random.choice(
                        memberships).membership_id if random.random() < 0.3 else None,
                    employee_id=random.choice(cashiers).employee_id,
                    order_type=random.choice(order_types),
                    status="UNPAID",
                    created_at=order_time,
                    total_price=menu_item.price
                )
                db.add(order)
                db.flush()

                # Items can be ORDERED, PREPARING, or DONE
                item_statuses = ["ORDERED", "PREPARING", "DONE"]
                item_status = random.choice(item_statuses)

                order_item = OrderItems(
                    order_id=order.order_id,
                    menu_item_id=menu_item.menu_item_id,
                    status=item_status,
                    quantity=1,
                    unit_price=menu_item.price,
                    line_total=menu_item.price
                )
                db.add(order_item)
                orders_created += 1

        db.commit()
        print(
            f"✓ Seeded {orders_created} Orders with {payments_created} Payments")

        print("\n" + "="*50)
        print("✅ Database seeded successfully!")
        print("="*50)
        print(f"  - {len(tiers)} Tiers")
        print(f"  - {len(branches)} Branches")
        print(f"  - {len(roles)} Roles")
        print(f"  - {len(employees)} Employees")
        print(f"  - {len(ingredients)} Ingredients")
        print(f"  - {len(stocks)} Stock items")
        print(f"  - {len(menu_items)} Menu items")
        print(f"  - {len(memberships)} Memberships")
        print(f"  - {orders_created} Orders")
        print(f"  - {payments_created} Payments")
        print(f"  - {movement_count} Stock Movements")
        print("="*50)

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    from .models import Base
    Base.metadata.create_all(bind=engine)
    seed_database()
