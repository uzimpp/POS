"""
Script to generate CSV data files (valid and invalid) for testing database constraints.
Generates data that conforms to the schema defined in app/models.py
"""
import csv
import random
import os
from datetime import datetime, timedelta
from decimal import Decimal
from pathlib import Path

# Get the script directory to ensure files are created in the correct location
SCRIPT_DIR = Path(__file__).parent.absolute()


# Valid data generators
VALID_BRANCH_NAMES = ["Main Branch", "Chiang Mai Branch", "Pattaya Branch", "Phuket Branch"]
VALID_ADDRESSES = [
    "123 Sukhumvit Road, Bangkok",
    "456 Nimmanhemin Road, Chiang Mai",
    "789 Pattaya Road, Chonburi",
    "321 Patong Road, Phuket"
]
VALID_PHONES = ["02-123-4567", "053-123-456", "038-123-456", "076-123-456"]
VALID_ROLE_NAMES = ["Manager", "Chef", "Cashier", "Waiter", "Supervisor"]
VALID_TIER_NAMES = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"]
VALID_FIRST_NAMES = ["John", "Jane", "David", "Sarah", "Mike", "Emma", "Tom", "Lisa"]
VALID_LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller"]
VALID_STOCK_NAMES = ["Rice", "Curry Paste", "Chicken", "Beef", "Pork", "Mixed Vegetables", "Coconut Milk", "Onion", "Potato", "Egg"]
VALID_UNITS = ["g", "kg", "ml", "l", "piece", "pack"]
VALID_MENU_NAMES = [
    "Pad Krapow Chicken", "Pad Krapow Beef", "Pad Krapow Pork",
    "Pad Krapow Vegetable", "Pad Krapow Set", "Extra Meat", "Fried Egg", "Soft Drink"
]
VALID_MENU_TYPES = ["dish", "addon", "set"]
VALID_CATEGORIES = ["Main", "Topping", "Drink", "Appetizer"]
VALID_ORDER_TYPES = ["DINE_IN", "TAKEAWAY", "DELIVERY"]
VALID_ORDER_STATUSES = ["PAID", "UNPAID", "CANCELLED"]
VALID_ORDER_ITEM_STATUSES = ["PREPARING", "DONE", "CANCELLED"]
VALID_PAYMENT_METHODS = ["CASH", "QR", "CARD", "POINTS"]
VALID_STOCK_REASONS = ["RESTOCK", "SALE", "WASTE", "ADJUST"]

# Additional name lists for random generation
ADDITIONAL_FIRST_NAMES = ["James", "Mary", "Robert", "Patricia", "Michael", "Jennifer", "William", "Linda", "Richard", "Barbara", "Joseph", "Elizabeth", "Thomas", "Susan", "Christopher", "Jessica", "Charles", "Sarah", "Daniel", "Karen", "Matthew", "Nancy", "Anthony", "Lisa", "Mark", "Betty", "Donald", "Margaret", "Steven", "Sandra"]
ADDITIONAL_LAST_NAMES = ["Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia", "Martinez", "Robinson", "Clark", "Rodriguez", "Lewis", "Lee", "Walker", "Hall", "Allen", "Young", "Hernandez", "King", "Wright", "Lopez", "Hill", "Scott", "Green", "Adams", "Baker", "Gonzalez", "Nelson", "Carter"]
ADDITIONAL_CITIES = ["Bangkok", "Chiang Mai", "Pattaya", "Phuket", "Ayutthaya", "Chonburi", "Rayong", "Hua Hin", "Kanchanaburi", "Sukhothai"]
STREET_NAMES = ["Sukhumvit", "Silom", "Ratchadamri", "Thonglor", "Asoke", "Ploenchit", "Wireless", "Sathorn", "Nimmanhemin", "Charoenkrung"]


def random_datetime_in_range(start_date, end_date):
    """
    Generate a random datetime between two datetime objects.
    """
    # Calculate the total difference in seconds
    delta = end_date - start_date
    total_seconds = delta.days * 86400 + delta.seconds  # 86400 seconds in a day
    
    # Generate a random number of seconds within the range
    random_second = random.randrange(total_seconds)
    
    # Add the random seconds to the start date
    return start_date + timedelta(seconds=random_second)


def random_phone():
    """Generate a random phone number"""
    area_codes = ["02", "053", "038", "076", "032", "044", "077", "081", "082", "083"]
    area = random.choice(area_codes)
    number = random.randint(1000000, 9999999)
    return f"{area}-{number}"


def random_email(first_name, last_name):
    """Generate a random email"""
    domains = ["email.com", "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "ku.ac.th"]
    return f"{first_name.lower()}.{last_name.lower()}@{random.choice(domains)}"


def generate_valid_csv(filename="data_valid.csv", num_branches=5, num_roles=4, num_tiers=4, 
                      num_employees=43, num_memberships=500, num_stock_per_branch=12,
                      num_menu_items=20, num_orders=3000, random_mode=False):
    """Generate valid CSV data that conforms to all schema constraints"""
    # Ensure filename is in the script directory
    if not os.path.isabs(filename):
        filename = SCRIPT_DIR / filename
    
    data_sections = []
    
    # Date ranges for random generation
    start_date = datetime(2020, 1, 1)
    end_date = datetime(2025, 12, 31)
    
    # Branches
    branch_rows = ["branch_id,name,address,phone,is_active"]
    for i in range(1, num_branches + 1):
        if i == 1:
            branch_name = "Main Branch"
            address = "123 Sukhumvit Road Bangkok"
            phone = "02-123-4567"
            is_active = True
        elif i == 2:
            branch_name = "Chiang Mai Branch"
            address = "456 Nimmanhemin Road Chiang Mai"
            phone = "053-123-456"
            is_active = True
        elif i == 3:
            branch_name = "Pattaya Branch"
            address = "789 Pattaya Road Chonburi"
            phone = "038-123-456"
            is_active = True
        else:
            city = random.choice(ADDITIONAL_CITIES)
            street_num = random.randint(1, 999)
            street = random.choice(STREET_NAMES)
            branch_name = f"{city} Branch"
            address = f"{street_num} {street} Road, {city}"
            phone = random_phone()
            if random_mode:
                is_active = random.choice([True, True, True, True, True, False])
            else:
                is_active = random.choice([True, True, True, True, False])
        
        is_active_str = 'true' if is_active else 'false'
        branch_rows.append(f"{i},{branch_name},{address},{phone},{is_active_str}")
    data_sections.append(("#branches", branch_rows))
    
    # Roles
    role_rows = ["role_id,role_name,tier"]
    for i in range(1, num_roles + 1):
        if random_mode and i > len(VALID_ROLE_NAMES):
            role_name = random.choice(VALID_ROLE_NAMES) + f" {i}"
            tier = random.randint(0, 5)
        else:
            if i <= len(VALID_ROLE_NAMES):
                role_name = VALID_ROLE_NAMES[i-1]
                tier = max(0, 4 - i)
            else:
                role_name = f"Role {i}"
                tier = random.randint(0, 3)
        role_rows.append(f"{i},{role_name},{tier}")
    data_sections.append(("#roles", role_rows))
    
    # Tiers
    tier_rows = ["tier_id,tier_name,tier"]
    for i in range(1, num_tiers + 1):
        if i <= len(VALID_TIER_NAMES):
            tier_name = VALID_TIER_NAMES[i-1]
            tier_value = i - 1
        else:
            tier_name = f"Tier {i}"
            tier_value = i - 1
        tier_rows.append(f"{i},{tier_name},{tier_value}")
    data_sections.append(("#tiers", tier_rows))
    
    # Employees
    employee_rows = ["employee_id,branch_id,role_id,first_name,last_name,salary,is_active,joined_date"]
    all_first_names = VALID_FIRST_NAMES + ADDITIONAL_FIRST_NAMES
    all_last_names = VALID_LAST_NAMES + ADDITIONAL_LAST_NAMES
    salary_ranges = {1: (45000, 60000), 2: (30000, 40000), 3: (20000, 30000), 4: (15000, 25000)}  # role_id -> (min, max)
    
    for i in range(1, num_employees + 1):
        branch_id = random.randint(1, num_branches)
        role_id = random.randint(1, num_roles)
        first_name = random.choice(all_first_names)
        last_name = random.choice(all_last_names)
        
        # Salary based on role
        if role_id in salary_ranges:
            min_sal, max_sal = salary_ranges[role_id]
        else:
            min_sal, max_sal = (20000, 40000)
        salary = random.randint(min_sal, max_sal)
        
        if random_mode:
            joined_date = random_datetime_in_range(start_date, end_date).strftime("%Y-%m-%d %H:%M:%S")
        else:
            # First few use fixed dates
            if i <= 6:
                dates = ["2024-01-15 09:00:00", "2024-02-01 09:00:00", "2024-01-20 09:00:00",
                        "2024-01-10 09:00:00", "2024-02-15 09:00:00", "2024-01-25 09:00:00"]
                joined_date = dates[i-1] if i <= len(dates) else random_datetime_in_range(start_date, end_date).strftime("%Y-%m-%d %H:%M:%S")
            else:
                joined_date = random_datetime_in_range(start_date, end_date).strftime("%Y-%m-%d %H:%M:%S")
        
        employee_rows.append(f"{i},{branch_id},{role_id},{first_name},{last_name},{salary},true,{joined_date}")
    data_sections.append(("#employees", employee_rows))
    
    # Memberships (with some nullable emails)
    membership_rows = ["membership_id,name,phone,email,points_balance,tier_id,joined_at"]
    used_phones = set()
    used_emails = set()
    
    for i in range(1, num_memberships + 1):
        first_name = random.choice(all_first_names)
        last_name = random.choice(all_last_names)
        name = f"{first_name} {last_name}"
        
        # Generate unique phone with 9-10 digits (constraint requirement)
        area_code = random.choice(["02", "053", "038", "076", "032", "044", "077", "081", "082", "083"])
        phone_number = random.randint(1000000, 9999999)
        phone = f"{area_code}{phone_number}"
        counter = 0
        while phone in used_phones:
            if counter > 100:
                phone = f"{random.randint(20, 99)}{i:07d}"
            else:
                area_code = random.choice(["02", "053", "038", "076", "032", "044", "077", "081", "082", "083"])
                phone_number = random.randint(1000000, 9999999)
                phone = f"{area_code}{phone_number}"
            counter += 1
        used_phones.add(phone)
        
        # Email can be nullable (30% chance), but must be unique if provided
        if random.random() < 0.3:
            email = ""
        else:
            email = f"{first_name.lower()}.{last_name.lower()}{i}@example.com"
            counter = 0
            while email in used_emails:
                counter += 1
                email = f"{first_name.lower()}.{last_name.lower()}{i}_{counter}@example.com"
            used_emails.add(email)
        
        # Points based on tier
        tier_id = random.randint(1, num_tiers)
        points_multiplier = tier_id * 25
        points_balance = random.randint(points_multiplier, points_multiplier + 150)
        
        if random_mode:
            joined_at = random_datetime_in_range(start_date, end_date).strftime("%Y-%m-%d %H:%M:%S")
        else:
            if i <= 5:
                dates = ["2024-01-01 10:00:00", "2024-01-05 10:00:00", "2024-01-10 10:00:00",
                        "2024-01-15 10:00:00", "2024-02-01 10:00:00"]
                joined_at = dates[i-1] if i <= len(dates) else random_datetime_in_range(start_date, end_date).strftime("%Y-%m-%d %H:%M:%S")
            else:
                joined_at = random_datetime_in_range(start_date, end_date).strftime("%Y-%m-%d %H:%M:%S")
        
        membership_rows.append(f"{i},{name},{phone},{email},{points_balance},{tier_id},{joined_at}")
    data_sections.append(("#memberships", membership_rows))
    
    # Stock
    stock_rows = ["stock_id,branch_id,stk_name,amount_remaining,unit"]
    stock_combinations = [
        ("Rice", "g", 30000, 60000),
        ("Curry Paste", "ml", 5000, 15000),
        ("Chicken", "g", 10000, 25000),
        ("Beef", "g", 8000, 20000),
        ("Pork", "g", 10000, 20000),
        ("Mixed Vegetables", "g", 5000, 15000),
        ("Coconut Milk", "ml", 3000, 10000),
        ("Onion", "piece", 50, 150),
        ("Potato", "piece", 40, 120),
        ("Egg", "piece", 100, 300),
    ]
    stock_id = 1
    
    for branch_id in range(1, num_branches + 1):
        stocks_for_branch = min(num_stock_per_branch, len(stock_combinations))
        for _ in range(stocks_for_branch):
            if stock_id <= len(stock_combinations) * num_branches:
                stk_name, unit, min_amount, max_amount = random.choice(stock_combinations)
                amount_remaining = random.randint(min_amount, max_amount)
            else:
                # Additional random stock items
                stk_name = random.choice(VALID_STOCK_NAMES)
                unit = random.choice(VALID_UNITS)
                if unit in ["g", "kg"]:
                    amount_remaining = random.randint(1000, 50000)
                elif unit in ["ml", "l"]:
                    amount_remaining = random.randint(500, 20000)
                else:
                    amount_remaining = random.randint(10, 500)
            
            stock_rows.append(f"{stock_id},{branch_id},{stk_name},{amount_remaining},{unit}")
            stock_id += 1
    
    data_sections.append(("#stock", stock_rows))
    total_stock = stock_id - 1  # Total number of stock items created
    
    # Menu Items
    menu_item_rows = ["menu_item_id,name,type,description,price,category,is_available"]
    menu_templates = [
        ("Pad Krapow Chicken", "dish", "Pad Krapow Chicken with Fried Egg", 120.00, "Main"),
        ("Pad Krapow Beef", "dish", "Pad Krapow Beef", 150.00, "Main"),
        ("Pad Krapow Pork", "dish", "Pad Krapow Pork", 130.00, "Main"),
        ("Pad Krapow Vegetable", "dish", "Pad Krapow Vegetable", 100.00, "Main"),
        ("Pad Krapow Set", "set", "Pad Krapow Chicken with drink", 150.00, "Main"),
        ("Extra Meat", "addon", "Extra Meat", 40.00, "Topping"),
        ("Fried Egg", "addon", "Fried Egg", 15.00, "Topping"),
        ("Soft Drink", "addon", "Cold Drink", 30.00, "Drink"),
    ]
    
    for i in range(1, num_menu_items + 1):
        if i <= len(menu_templates):
            name, mtype, description, price, category = menu_templates[i-1]
        else:
            # Generate additional menu items
            dish_types = ["Pad Thai", "Tom Yum", "Green Curry", "Massaman", "Som Tam", "Papaya Salad"]
            name = random.choice(dish_types) + " " + random.choice(["Chicken", "Beef", "Pork", "Shrimp", "Vegetable"])
            mtype = random.choice(VALID_MENU_TYPES)
            description = f"{name} description"
            price = round(random.uniform(50.00, 200.00), 2)
            category = random.choice(VALID_CATEGORIES)
        
        menu_item_rows.append(f"{i},{name},{mtype},{description},{price:.2f},{category},true")
    data_sections.append(("#menu_items", menu_item_rows))
    
    # Menu Ingredients
    menu_ingredient_rows = ["menu_item_id,stock_id,qty_per_unit,unit"]
    # Create mapping: menu_item_id -> list of (stock_id, qty_per_unit, unit)
    ingredient_map = {}
    
    # Ensure total_stock is at least 1 for ingredient assignment
    max_stock_id = max(1, total_stock)
    
    # Assign ingredients to menu items
    for menu_item_id in range(1, num_menu_items + 1):
        if menu_item_id <= len(menu_templates):
            # Use predefined ingredients for template items (using stock IDs 1-10 which should exist)
            if menu_item_id == 1:
                ingredient_map[menu_item_id] = [(min(1, max_stock_id), 200, "g"), (min(3, max_stock_id), 150, "g"), (min(2, max_stock_id), 50, "ml")]
            elif menu_item_id == 2:
                ingredient_map[menu_item_id] = [(min(1, max_stock_id), 200, "g"), (min(4, max_stock_id), 150, "g"), (min(2, max_stock_id), 50, "ml")]
            elif menu_item_id == 3:
                ingredient_map[menu_item_id] = [(min(1, max_stock_id), 200, "g"), (min(5, max_stock_id), 150, "g"), (min(2, max_stock_id), 50, "ml")]
            elif menu_item_id == 4:
                ingredient_map[menu_item_id] = [(min(1, max_stock_id), 200, "g"), (min(6, max_stock_id), 200, "g"), (min(2, max_stock_id), 40, "ml")]
            elif menu_item_id == 5:
                ingredient_map[menu_item_id] = [(min(1, max_stock_id), 200, "g"), (min(3, max_stock_id), 150, "g"), (min(2, max_stock_id), 50, "ml"), (min(8, max_stock_id), 1, "piece")]
            elif menu_item_id == 6:
                ingredient_map[menu_item_id] = [(min(3, max_stock_id), 100, "g")]
            elif menu_item_id == 7:
                ingredient_map[menu_item_id] = [(min(10, max_stock_id), 1, "piece")]
            elif menu_item_id == 8:
                ingredient_map[menu_item_id] = [(min(8, max_stock_id), 1, "piece")]
            else:
                # Generate random ingredients
                num_ingredients = random.randint(1, 4)
                ingredient_map[menu_item_id] = [
                    (random.randint(1, max_stock_id), random.randint(50, 500), random.choice(VALID_UNITS))
                    for _ in range(num_ingredients)
                ]
        else:
            # Generate random ingredients for additional menu items
            num_ingredients = random.randint(1, 4)
            ingredient_map[menu_item_id] = [
                (random.randint(1, max_stock_id), random.randint(50, 500), random.choice(VALID_UNITS))
                for _ in range(num_ingredients)
            ]
    
    # Write menu ingredients
    for menu_item_id, ingredients in ingredient_map.items():
        for stock_id, qty, unit in ingredients:
            menu_ingredient_rows.append(f"{menu_item_id},{stock_id},{qty},{unit}")
    
    data_sections.append(("#menu_ingredients", menu_ingredient_rows))
    
    # Orders (with some nullable membership_id)
    order_rows = ["order_id,branch_id,membership_id,employee_id,order_type,status,total_price,created_at"]
    order_date_start = datetime(2024, 3, 1)
    order_date_end = datetime(2025, 12, 31)
    
    # Track menu item prices for order generation
    menu_prices = {}
    for i in range(1, num_menu_items + 1):
        if i <= len(menu_templates):
            menu_prices[i] = menu_templates[i-1][3]
        else:
            menu_prices[i] = random.uniform(50.00, 200.00)
    
    for i in range(1, num_orders + 1):
        branch_id = random.randint(1, num_branches)
        
        # 40% chance of no membership (walk-in customers)
        if random.random() < 0.4:
            membership_id = ""
        else:
            membership_id = random.randint(1, num_memberships)
        
        employee_id = random.randint(1, num_employees)
        order_type = random.choice(VALID_ORDER_TYPES)
        status = random.choice(VALID_ORDER_STATUSES)
        
        # Generate total price (will be calculated more accurately with order items, but estimate here)
        num_items = random.randint(1, 5)
        total_price = sum(random.choice(list(menu_prices.values())) * random.randint(1, 3) for _ in range(num_items))
        total_price = round(total_price, 2)
        
        if random_mode:
            created_at = random_datetime_in_range(order_date_start, order_date_end).strftime("%Y-%m-%d %H:%M:%S")
        else:
            if i <= 5:
                times = ["12:00:00", "13:00:00", "14:00:00", "15:00:00", "16:00:00"]
                created_at = f"2024-03-01 {times[i-1]}" if i <= len(times) else random_datetime_in_range(order_date_start, order_date_end).strftime("%Y-%m-%d %H:%M:%S")
            else:
                created_at = random_datetime_in_range(order_date_start, order_date_end).strftime("%Y-%m-%d %H:%M:%S")
        
        membership_str = str(membership_id) if membership_id else ""
        order_rows.append(f"{i},{branch_id},{membership_str},{employee_id},{order_type},{status},{total_price:.2f},{created_at}")
    data_sections.append(("#orders", order_rows))
    
    # Order Items
    order_item_rows = ["order_id,menu_item_id,quantity,unit_price,line_total,status"]
    order_items_map = {}  # Track items per order to calculate accurate totals
    
    for order_id in range(1, num_orders + 1):
        num_items = random.randint(1, 5)
        items_for_order = []
        
        for _ in range(num_items):
            menu_item_id = random.randint(1, num_menu_items)
            quantity = random.randint(1, 3)
            unit_price = menu_prices.get(menu_item_id, random.uniform(50.00, 200.00))
            line_total = round(unit_price * quantity, 2)
            status = random.choice(VALID_ORDER_ITEM_STATUSES)
            
            items_for_order.append((menu_item_id, quantity, unit_price, line_total, status))
            order_item_rows.append(f"{order_id},{menu_item_id},{quantity},{unit_price:.2f},{line_total:.2f},{status}")
        
        order_items_map[order_id] = items_for_order
    
    data_sections.append(("#order_items", order_item_rows))
    
    # Update order totals based on actual order items
    updated_order_rows = [order_rows[0]]  # Header
    for i, row in enumerate(order_rows[1:], 1):
        parts = row.split(',')
        if i in order_items_map:
            total = sum(item[3] for item in order_items_map[i])  # Sum of line_totals
            parts[6] = f"{total:.2f}"  # Update total_price
        updated_order_rows.append(','.join(parts))
    
    # Update the orders section in data_sections
    for idx, (header, rows) in enumerate(data_sections):
        if header == "#orders":
            data_sections[idx] = (header, updated_order_rows)
            break
    
    # Payments (only for PAID orders)
    payment_rows = ["order_id,paid_price,points_used,payment_method,payment_ref,paid_timestamp"]
    
    # Find updated order rows for payments
    order_rows_for_payments = updated_order_rows
    
    for order_id in range(1, num_orders + 1):
        # Parse order status from order rows (skip header at index 0)
        if order_id < len(order_rows_for_payments):
            order_row = order_rows_for_payments[order_id]
            order_parts = order_row.split(',')
            order_status = order_parts[5] if len(order_parts) > 5 else "PAID"
        else:
            order_status = "PAID"  # Default to PAID if not found
        
        # Only create payment for PAID orders
        if order_status == "PAID":
            # Get total price
            total_price = float(order_parts[6]) if len(order_parts) > 6 else 0.0
            
            # 20% chance to use points
            if random.random() < 0.2 and total_price > 0:
                points_used = min(random.randint(10, 50), int(total_price))
                paid_price = round(total_price - points_used, 2)
                payment_method = "POINTS"
            else:
                points_used = 0
                paid_price = total_price
                payment_method = random.choice(["CASH", "QR", "CARD"])
            
            # 30% chance to have payment_ref
            payment_ref = ""
            if payment_method == "CARD" and random.random() < 0.7:
                payment_ref = f"TXN{random.randint(100000, 999999)}"
            elif payment_method == "QR" and random.random() < 0.5:
                payment_ref = f"QR{random.randint(100000, 999999)}"
            
            # Parse order created_at and add 5-10 minutes for payment
            if random_mode:
                # Use order date + random minutes
                paid_timestamp = (order_date_start + timedelta(minutes=random.randint(5, 30))).strftime("%Y-%m-%d %H:%M:%S")
            else:
                if order_id <= 5:
                    times = ["12:05:00", "13:05:00", "14:05:00", "15:05:00", "16:05:00"]
                    paid_timestamp = f"2024-03-01 {times[order_id-1]}" if order_id <= len(times) else ""
                else:
                    paid_timestamp = ""
            
            payment_rows.append(f"{order_id},{paid_price:.2f},{points_used},{payment_method},{payment_ref},{paid_timestamp}")
    
    data_sections.append(("#payments", payment_rows))
    
    # Stock Movements (with nullable employee_id and order_id)
    stock_movement_rows = ["stock_id,employee_id,order_id,qty_change,reason,note,created_at"]
    # Generate stock movements: some from orders (SALE), some restocks
    movement_id = 1
    num_movements = min(num_orders * 2, 100)  # Generate movements for orders + restocks
    
    for i in range(num_movements):
        # 60% chance for SALE (linked to order), 40% for RESTOCK
        if random.random() < 0.6 and num_orders > 0:
            reason = "SALE"
            order_id = random.randint(1, num_orders) if num_orders > 0 else 1
            employee_id = random.randint(1, num_employees) if num_employees > 0 else 1
            stock_id = random.randint(1, total_stock) if total_stock > 0 else 1
            qty_change = -random.randint(50, 500)  # Negative for sales
            note = f"Order #{order_id}"
            # Get order date and add 10 minutes
            if random_mode:
                created_at = (order_date_start + timedelta(minutes=random.randint(10, 60))).strftime("%Y-%m-%d %H:%M:%S")
            else:
                created_at = f"2024-03-01 12:10:00"
            stock_movement_rows.append(f"{stock_id},{employee_id},{order_id},{qty_change},{reason},{note},{created_at}")
        else:
            # RESTOCK
            reason = "RESTOCK"
            employee_id = random.randint(1, num_employees) if num_employees > 0 else 1
            order_id = ""  # Nullable
            stock_id = random.randint(1, total_stock) if total_stock > 0 else 1
            qty_change = random.randint(1000, 10000)  # Positive for restock
            note = "Restock order"
            if random_mode:
                created_at = random_datetime_in_range(order_date_start, order_date_end).strftime("%Y-%m-%d %H:%M:%S")
            else:
                created_at = "2024-03-02 09:00:00"
            stock_movement_rows.append(f"{stock_id},{employee_id},{order_id},{qty_change},{reason},{note},{created_at}")
    
    data_sections.append(("#stock_movements", stock_movement_rows))
    
    # Write to file
    with open(filename, 'w', encoding='utf-8', newline='') as f:
        for section_header, rows in data_sections:
            f.write(section_header + '\n')
            for row in rows:
                f.write(row + '\n')
            f.write('\n')
    
    print(f"Generated valid CSV file: {filename}")


def generate_invalid_csv(filename="data_invalid.csv", num_branches=5, num_roles=4, num_tiers=3, 
                        num_employees=8, num_memberships=9, num_stock=6, num_menu_items=5,
                        num_orders=8, num_order_items=6, num_payments=4, num_stock_movements=6):
    """Generate invalid CSV data with realistic names but violating database constraints"""
    from datetime import datetime as dt
    
    # Ensure filename is in the script directory
    if not os.path.isabs(filename):
        filename = SCRIPT_DIR / filename
    
    data_sections = []
    
    # Add header comment with generation timestamp
    timestamp = dt.now().strftime("%Y-%m-%d %H:%M:%S")
    data_sections.append(("# Generated invalid test data", [f"# Generated at: {timestamp}"]))
    
    # Use realistic names from the lists
    all_first_names = VALID_FIRST_NAMES + ADDITIONAL_FIRST_NAMES
    all_last_names = VALID_LAST_NAMES + ADDITIONAL_LAST_NAMES
    
    # Branches - invalid cases with realistic names
    branch_rows = ["branch_id,name,address,phone,is_active"]
    branch_names_base = ["Central", "Paradise", "Royal", "Grand", "Premium", "Elite", "Platinum", "Diamond"]
    
    for i in range(1, num_branches + 1):
        branch_id = 100 + i - 1
        
        # Initialize defaults (valid data)
        name = f"{random.choice(branch_names_base)} {random.choice(ADDITIONAL_CITIES)} Branch"
        address = f"{random.randint(1, 999)} {random.choice(STREET_NAMES)} Road, {random.choice(ADDITIONAL_CITIES)}"
        phone = random_phone()
        is_active = "true"
        
        # Only make first 4 invalid, rest are valid
        if i == 1:
            # Very long branch name
            name = "This is a very long branch name that exceeds the maximum length of 50 characters"
        elif i == 2:
            # Very long address
            address = "This is a very long address that exceeds the maximum length of 200 characters allowed for addresses. This address is way too long and should cause an error when trying to insert into the database because it violates the length constraint completely"
        elif i == 3:
            # Very long phone
            phone = "123456789012345678901234567890"
        elif i == 4:
            # Invalid boolean
            is_active = "invalid_bool"
        # else: keep valid defaults
        
        branch_rows.append(f"{branch_id},{name},{address},{phone},{is_active}")
    
    data_sections.append(("#branches", branch_rows))
    
    # Roles - invalid cases with realistic names
    role_rows = ["role_id,role_name,tier"]
    role_base_names = ["Senior", "Junior", "Assistant", "Lead", "Head", "Supervisor"]
    
    for i in range(1, num_roles + 1):
        role_id = 100 + i - 1
        
        # Initialize defaults (valid data)
        role_name = f"{random.choice(VALID_ROLE_NAMES)}"
        tier = random.randint(0, 5)
        
        # Only make first 3 invalid, rest are valid
        if i == 1:
            # Very long role name
            role_name = "This is a very long role name that exceeds 50 characters allowed in the database schema"
        elif i == 2:
            role_name = f"{random.choice(role_base_names)} {random.choice(VALID_ROLE_NAMES)}"
            tier = -random.randint(1, 10)  # Negative tier
        elif i == 3:
            role_name = f"{random.choice(VALID_ROLE_NAMES)} Specialist"
            tier = "not_a_number"
        # else: keep valid defaults
        
        role_rows.append(f"{role_id},{role_name},{tier}")
    
    data_sections.append(("#roles", role_rows))
    
    # Tiers - invalid cases with realistic names
    tier_rows = ["tier_id,tier_name,tier"]
    
    for i in range(1, num_tiers + 1):
        tier_id = 100 + i - 1
        
        # Initialize defaults (valid data)
        tier_name = random.choice(VALID_TIER_NAMES)
        tier_value = i - 1
        
        # Only make first 2 invalid, rest are valid
        if i == 1:
            # Very long tier name
            tier_name = "This is a very long tier name that exceeds 50 characters in the database schema"
        elif i == 2:
            tier_name = f"{random.choice(VALID_TIER_NAMES)} Plus"
            tier_value = "invalid_tier"
        # else: keep valid defaults
        
        tier_rows.append(f"{tier_id},{tier_name},{tier_value}")
    
    data_sections.append(("#tiers", tier_rows))
    
    # Employees - invalid cases with realistic names
    employee_rows = ["employee_id,branch_id,role_id,first_name,last_name,salary,is_active,joined_date"]
    start_date = datetime(2020, 1, 1)
    end_date = datetime(2025, 12, 31)
    
    for i in range(1, num_employees + 1):
        employee_id = 100 + i - 1
        
        # Initialize defaults (valid data)
        first_name = random.choice(all_first_names)
        last_name = random.choice(all_last_names)
        joined_date = random_datetime_in_range(start_date, end_date).strftime("%Y-%m-%d %H:%M:%S")
        branch_id = random.randint(1, num_branches)
        role_id = random.randint(1, num_roles)
        salary = random.randint(20000, 50000)
        
        # Only make first 7 invalid, rest are valid
        if i == 1:
            # Invalid foreign key - branch_id doesn't exist
            branch_id = 99999
        elif i == 2:
            # Invalid foreign key - role_id doesn't exist
            role_id = 99999
        elif i == 3:
            # Very long first name
            first_name = "A" * 60
        elif i == 4:
            # Very long last name
            last_name = "B" * 60
        elif i == 5:
            # Negative salary
            salary = -random.randint(1000, 10000)
        elif i == 6:
            # Invalid salary type
            salary = "not_a_number"
        elif i == 7:
            # NULL branch_id (required field)
            branch_id = ""
        # else: keep valid defaults
        
        employee_rows.append(f"{employee_id},{branch_id},{role_id},{first_name},{last_name},{salary},true,{joined_date}")
    
    data_sections.append(("#employees", employee_rows))
    
    # Memberships - invalid cases with realistic names
    membership_rows = ["membership_id,name,phone,email,points_balance,tier_id,joined_at"]
    used_phones = set()
    used_emails = set()
    
    for i in range(1, num_memberships + 1):
        membership_id = 100 + i - 1
        first_name = random.choice(all_first_names)
        last_name = random.choice(all_last_names)
        name = f"{first_name} {last_name}"
        joined_at = random_datetime_in_range(start_date, end_date).strftime("%Y-%m-%d %H:%M:%S")
        
        if i == 1:
            # Normal member (valid)
            phone = random_phone()
            while phone in used_phones:
                phone = random_phone()
            used_phones.add(phone)
            email = random_email(first_name, last_name)
            points_balance = random.randint(0, 500)
            tier_id = random.randint(1, num_tiers)
        elif i == 2:
            # Very long name
            name = "A" * 110
            phone = random_phone()
            while phone in used_phones:
                phone = random_phone()
            used_phones.add(phone)
            email = random_email(first_name, last_name)
            points_balance = random.randint(0, 500)
            tier_id = random.randint(1, num_tiers)
        elif i == 3:
            # Phone too short
            name = f"{first_name} {last_name}"
            phone = "08"  # Too short
            email = random_email(first_name, last_name)
            points_balance = random.randint(0, 500)
            tier_id = random.randint(1, num_tiers)
        elif i == 4:
            # Phone too long
            name = f"{first_name} {last_name}"
            phone = "1" * 25
            email = random_email(first_name, last_name)
            points_balance = random.randint(0, 500)
            tier_id = random.randint(1, num_tiers)
        elif i == 5:
            # Email too long
            name = f"{first_name} {last_name}"
            phone = random_phone()
            while phone in used_phones:
                phone = random_phone()
            used_phones.add(phone)
            email = "a" * 90 + "@" + "b" * 20 + ".com"  # 110+ characters
            points_balance = random.randint(0, 500)
            tier_id = random.randint(1, num_tiers)
        elif i == 6:
            # Negative points
            name = f"{first_name} {last_name}"
            phone = random_phone()
            while phone in used_phones:
                phone = random_phone()
            used_phones.add(phone)
            email = random_email(first_name, last_name)
            points_balance = -random.randint(10, 100)
            tier_id = random.randint(1, num_tiers)
        elif i == 7:
            # Invalid tier_id
            name = f"{first_name} {last_name}"
            phone = random_phone()
            while phone in used_phones:
                phone = random_phone()
            used_phones.add(phone)
            email = random_email(first_name, last_name)
            points_balance = random.randint(0, 500)
            tier_id = 99999
        elif i == 8:
            # Duplicate phone (will be duplicate of i==9)
            name = f"{first_name} {last_name}"
            phone = "0812345678"  # Will duplicate with next one
            email = random_email(first_name, last_name)
            points_balance = random.randint(0, 500)
            tier_id = random.randint(1, num_tiers)
        else:
            # Duplicate phone (duplicates i==8)
            name = f"{first_name} {last_name}"
            phone = "0812345678"  # Duplicate
            email = random_email(first_name, last_name)
            points_balance = random.randint(0, 500)
            tier_id = random.randint(1, num_tiers)
        
        membership_rows.append(f"{membership_id},{name},{phone},{email},{points_balance},{tier_id},{joined_at}")
    
    data_sections.append(("#memberships", membership_rows))
    
    # Stock - invalid cases with realistic names
    stock_rows = ["stock_id,branch_id,stk_name,amount_remaining,unit"]
    
    for i in range(1, num_stock + 1):
        stock_id = 100 + i - 1
        
        # Initialize defaults (valid data)
        stk_name = random.choice(VALID_STOCK_NAMES)
        branch_id = random.randint(1, num_branches)
        amount_remaining = random.randint(1000, 10000)
        unit = random.choice(VALID_UNITS)
        
        # Only make first 6 invalid, rest are valid
        if i == 1:
            # Invalid branch_id
            branch_id = 99999
        elif i == 2:
            # Very long stock name
            stk_name = "A" * 110
        elif i == 3:
            # Negative amount
            amount_remaining = -random.randint(100, 1000)
        elif i == 4:
            # Invalid amount type
            amount_remaining = "invalid_amount"
        elif i == 5:
            # Very long unit
            unit = "B" * 25
        elif i == 6:
            # NULL branch_id
            branch_id = ""
        # else: keep valid defaults
        
        stock_rows.append(f"{stock_id},{branch_id},{stk_name},{amount_remaining},{unit}")
    
    data_sections.append(("#stock", stock_rows))
    
    # Menu Items - invalid cases with realistic names
    menu_item_rows = ["menu_item_id,name,type,description,price,category,is_available"]
    dish_names = ["Pad Thai", "Tom Yum", "Green Curry", "Massaman", "Som Tam", "Papaya Salad", "Pad Krapow", "Fried Rice"]
    
    for i in range(1, num_menu_items + 1):
        menu_item_id = 100 + i - 1
        name = random.choice(dish_names) + " " + random.choice(["Chicken", "Beef", "Pork", "Shrimp", "Vegetable"])
        mtype = random.choice(VALID_MENU_TYPES)
        description = f"Delicious {name.lower()} with fresh ingredients"
        price = round(random.uniform(80.00, 200.00), 2)
        category = random.choice(VALID_CATEGORIES)
        
        if i == 1:
            # Normal menu item (valid)
            pass
        elif i == 2:
            # Very long name
            name = "A" * 110
        elif i == 3:
            # Very long description
            description = "B" * 300
        elif i == 4:
            # Negative price
            price = -round(random.uniform(10.00, 100.00), 2)
        else:
            # Invalid price type
            price = "invalid_price"
        
        menu_item_rows.append(f"{menu_item_id},{name},{mtype},{description},{price},{category},true")
    
    data_sections.append(("#menu_items", menu_item_rows))
    
    # Menu Ingredients - invalid cases
    menu_ingredient_rows = ["menu_item_id,stock_id,qty_per_unit,unit"]
    
    for i in range(1, min(num_menu_items + 1, 5)):
        menu_item_id = 100 + i - 1
        if i == 1:
            # Invalid stock_id
            stock_id = 99999
            qty_per_unit = random.randint(50, 500)
            unit = random.choice(VALID_UNITS)
        elif i == 2:
            # Invalid menu_item_id reference
            menu_item_id = 99999
            stock_id = random.randint(1, num_stock)
            qty_per_unit = random.randint(50, 500)
            unit = random.choice(VALID_UNITS)
        elif i == 3:
            # Invalid stock_id
            stock_id = 99999
            qty_per_unit = random.randint(50, 500)
            unit = random.choice(VALID_UNITS)
        else:
            # Invalid qty_per_unit type
            stock_id = random.randint(1, num_stock)
            qty_per_unit = "invalid_qty"
            unit = random.choice(VALID_UNITS)
        
        menu_ingredient_rows.append(f"{menu_item_id},{stock_id},{qty_per_unit},{unit}")
    
    data_sections.append(("#menu_ingredients", menu_ingredient_rows))
    
    # Orders - invalid cases
    order_rows = ["order_id,branch_id,membership_id,employee_id,order_type,status,total_price,created_at"]
    order_date_start = datetime(2024, 3, 1)
    order_date_end = datetime(2025, 12, 31)
    
    for i in range(1, num_orders + 1):
        order_id = 100 + i - 1
        order_type = random.choice(VALID_ORDER_TYPES)
        status = random.choice(VALID_ORDER_STATUSES)
        total_price = round(random.uniform(100.00, 500.00), 2)
        created_at = random_datetime_in_range(order_date_start, order_date_end).strftime("%Y-%m-%d %H:%M:%S")
        
        if i == 1:
            # Invalid branch_id
            branch_id = 99999
            membership_id = random.randint(1, num_memberships) if num_memberships > 0 else ""
            employee_id = random.randint(1, num_employees)
        elif i == 2:
            # Invalid membership_id
            branch_id = random.randint(1, num_branches)
            membership_id = 99999
            employee_id = random.randint(1, num_employees)
        elif i == 3:
            # Invalid employee_id
            branch_id = random.randint(1, num_branches)
            membership_id = random.randint(1, num_memberships) if random.random() < 0.5 and num_memberships > 0 else ""
            employee_id = 99999
        elif i == 4:
            # Invalid order_type
            branch_id = random.randint(1, num_branches)
            membership_id = random.randint(1, num_memberships) if random.random() < 0.5 and num_memberships > 0 else ""
            employee_id = random.randint(1, num_employees)
            order_type = "INVALID_TYPE"
        elif i == 5:
            # Invalid status
            branch_id = random.randint(1, num_branches)
            membership_id = random.randint(1, num_memberships) if random.random() < 0.5 and num_memberships > 0 else ""
            employee_id = random.randint(1, num_employees)
            status = "INVALID_STATUS"
        elif i == 6:
            # Negative total_price
            branch_id = random.randint(1, num_branches)
            membership_id = random.randint(1, num_memberships) if random.random() < 0.5 and num_memberships > 0 else ""
            employee_id = random.randint(1, num_employees)
            total_price = -round(random.uniform(10.00, 200.00), 2)
        elif i == 7:
            # NULL branch_id
            branch_id = ""
            membership_id = random.randint(1, num_memberships) if random.random() < 0.5 and num_memberships > 0 else ""
            employee_id = random.randint(1, num_employees)
        else:
            # NULL employee_id
            branch_id = random.randint(1, num_branches)
            membership_id = random.randint(1, num_memberships) if random.random() < 0.5 and num_memberships > 0 else ""
            employee_id = ""
        
        membership_str = str(membership_id) if membership_id else ""
        order_rows.append(f"{order_id},{branch_id},{membership_str},{employee_id},{order_type},{status},{total_price:.2f},{created_at}")
    
    data_sections.append(("#orders", order_rows))
    
    # Order Items - invalid cases
    order_item_rows = ["order_id,menu_item_id,quantity,unit_price,line_total,status"]
    
    for i in range(1, num_order_items + 1):
        order_item_id = 100 + i - 1
        quantity = random.randint(1, 3)
        unit_price = round(random.uniform(50.00, 200.00), 2)
        line_total = round(unit_price * quantity, 2)
        status = random.choice(VALID_ORDER_ITEM_STATUSES)
        
        if i == 1:
            # Invalid menu_item_id
            order_id = random.randint(100, 100 + num_orders - 1)
            menu_item_id = 99999
        elif i == 2:
            # Invalid order_id
            order_id = 99999
            menu_item_id = random.randint(100, 100 + num_menu_items - 1)
        elif i == 3:
            # Invalid menu_item_id
            order_id = random.randint(100, 100 + num_orders - 1)
            menu_item_id = 99999
        elif i == 4:
            # Negative unit_price
            order_id = random.randint(100, 100 + num_orders - 1)
            menu_item_id = random.randint(100, 100 + num_menu_items - 1)
            unit_price = -round(random.uniform(10.00, 100.00), 2)
            line_total = round(unit_price * quantity, 2)
        elif i == 5:
            # Negative line_total
            order_id = random.randint(100, 100 + num_orders - 1)
            menu_item_id = random.randint(100, 100 + num_menu_items - 1)
            line_total = -round(random.uniform(10.00, 200.00), 2)
        else:
            # Invalid quantity type
            order_id = random.randint(100, 100 + num_orders - 1)
            menu_item_id = random.randint(100, 100 + num_menu_items - 1)
            quantity = "invalid_qty"
        
        order_item_rows.append(f"{order_id},{menu_item_id},{quantity},{unit_price:.2f},{line_total:.2f},{status}")
    
    data_sections.append(("#order_items", order_item_rows))
    
    # Payments - invalid cases (only for some orders)
    payment_rows = ["order_id,paid_price,points_used,payment_method,payment_ref,paid_timestamp"]
    payment_methods = ["CASH", "QR", "CARD", "POINTS"]
    
    for i in range(1, num_payments + 1):
        order_id = 100 + i - 1
        paid_price = round(random.uniform(100.00, 500.00), 2)
        payment_method = random.choice(payment_methods)
        payment_ref = f"TXN{random.randint(100000, 999999)}" if random.random() < 0.5 else ""
        paid_timestamp = random_datetime_in_range(order_date_start, order_date_end).strftime("%Y-%m-%d %H:%M:%S")
        
        if i == 1:
            # Normal payment (valid)
            points_used = 0
        elif i == 2:
            # Negative points_used
            points_used = -random.randint(10, 50)
        elif i == 3:
            # Invalid payment_method
            points_used = 0
            payment_method = "INVALID_METHOD"
        else:
            # Invalid datetime
            points_used = 0
            paid_timestamp = "invalid_datetime"
        
        payment_rows.append(f"{order_id},{paid_price:.2f},{points_used},{payment_method},{payment_ref},{paid_timestamp}")
    
    data_sections.append(("#payments", payment_rows))
    
    # Stock Movements - invalid cases
    stock_movement_rows = ["stock_id,employee_id,order_id,qty_change,reason,note,created_at"]
    
    for i in range(1, num_stock_movements + 1):
        movement_id = 100 + i - 1
        reason = random.choice(VALID_STOCK_REASONS)
        note = f"Movement {i}"
        created_at = random_datetime_in_range(order_date_start, order_date_end).strftime("%Y-%m-%d %H:%M:%S")
        qty_change = random.randint(100, 1000)
        
        if i == 1:
            # Invalid employee_id
            stock_id = random.randint(100, 100 + num_stock - 1)
            employee_id = 99999
            order_id = random.randint(100, 100 + num_orders - 1) if random.random() < 0.5 and num_orders > 0 else ""
        elif i == 2:
            # Invalid order_id
            stock_id = random.randint(100, 100 + num_stock - 1)
            employee_id = random.randint(1, num_employees) if num_employees > 0 else ""
            order_id = 99999
        elif i == 3:
            # Invalid employee_id (no order_id)
            stock_id = random.randint(100, 100 + num_stock - 1)
            employee_id = 99999
            order_id = ""
        elif i == 4:
            # Invalid qty_change type
            stock_id = random.randint(100, 100 + num_stock - 1)
            employee_id = random.randint(1, num_employees) if num_employees > 0 else ""
            order_id = random.randint(100, 100 + num_orders - 1) if random.random() < 0.5 and num_orders > 0 else ""
            qty_change = "invalid_qty"
        elif i == 5:
            # Invalid reason
            stock_id = random.randint(100, 100 + num_stock - 1)
            employee_id = random.randint(1, num_employees) if num_employees > 0 else ""
            order_id = random.randint(100, 100 + num_orders - 1) if random.random() < 0.5 and num_orders > 0 else ""
            reason = "INVALID_REASON"
        else:
            # NULL stock_id (required field)
            stock_id = ""
            employee_id = random.randint(1, num_employees) if num_employees > 0 else ""
            order_id = random.randint(100, 100 + num_orders - 1) if random.random() < 0.5 and num_orders > 0 else ""
        
        order_str = str(order_id) if order_id else ""
        stock_movement_rows.append(f"{stock_id},{employee_id},{order_str},{qty_change},{reason},{note},{created_at}")
    
    data_sections.append(("#stock_movements", stock_movement_rows))
    
    # Write to file (always overwrite)
    with open(filename, 'w', encoding='utf-8', newline='') as f:
        for section_header, rows in data_sections:
            # Check if this is a comment section
            if section_header.startswith("# Generated"):
                f.write(section_header + '\n')
                for row in rows:
                    f.write(row + '\n')
                f.write('\n')
            else:
                f.write(section_header + '\n')
                for row in rows:
                    f.write(row + '\n')
                f.write('\n')
    
    num_sections = len([s for s in data_sections if not s[0].startswith('# Generated')])
    print(f"Generated invalid CSV file: {filename} (with {num_sections} data sections)")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate CSV data files for database testing')
    parser.add_argument('--type', choices=['valid', 'invalid', 'both'], default='both',
                       help='Type of data to generate: valid, invalid, or both (default: both)')
    parser.add_argument('--output-valid', default='data_valid.csv',
                       help='Output filename for valid data (default: data_valid.csv)')
    parser.add_argument('--output-invalid', default='data_invalid.csv',
                       help='Output filename for invalid data (default: data_invalid.csv)')
    
    # Random generation parameters
    parser.add_argument('--random', action='store_true',
                       help='Enable random data generation mode')
    parser.add_argument('--num-branches', type=int, default=5,
                       help='Number of branches to generate (default: 5)')
    parser.add_argument('--num-roles', type=int, default=4,
                       help='Number of roles to generate (default: 4)')
    parser.add_argument('--num-tiers', type=int, default=4,
                       help='Number of tiers to generate (default: 4)')
    parser.add_argument('--num-employees', type=int, default=43,
                       help='Number of employees to generate (default: 43)')
    parser.add_argument('--num-memberships', type=int, default=500,
                       help='Number of memberships to generate (default: 500)')
    parser.add_argument('--num-stock-per-branch', type=int, default=12,
                       help='Number of stock items per branch (default: 12)')
    parser.add_argument('--num-menu-items', type=int, default=20,
                       help='Number of menu items to generate (default: 20)')
    parser.add_argument('--num-orders', type=int, default=3000,
                       help='Number of orders to generate (default: 3000)')
    
    args = parser.parse_args()
    
    if args.type in ['valid', 'both']:
        generate_valid_csv(
            args.output_valid,
            num_branches=args.num_branches,
            num_roles=args.num_roles,
            num_tiers=args.num_tiers,
            num_employees=args.num_employees,
            num_memberships=args.num_memberships,
            num_stock_per_branch=args.num_stock_per_branch,
            num_menu_items=args.num_menu_items,
            num_orders=args.num_orders,
            random_mode=args.random
        )
    
    if args.type in ['invalid', 'both']:
        generate_invalid_csv(
            args.output_invalid,
            num_branches=args.num_branches,
            num_roles=args.num_roles,
            num_tiers=args.num_tiers,
            num_employees=args.num_employees,
            num_memberships=args.num_memberships,
            num_stock=args.num_stock_per_branch * args.num_branches,
            num_menu_items=args.num_menu_items,
            num_orders=args.num_orders,
            num_order_items=6,
            num_payments=4,
            num_stock_movements=6
        )
    
    print("\nData generation complete!")

