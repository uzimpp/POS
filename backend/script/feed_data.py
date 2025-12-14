"""
Script to feed data from CSV files into the database.
Supports both valid and invalid data for testing database constraints.
"""
import sys
import os
import csv
from decimal import Decimal
from datetime import datetime

# Add path to import from app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, DataError, StatementError
from sqlalchemy import exists, text
from app.database import SessionLocal, engine
from app.models import (
    Branches, Roles, Employees, Tiers, Memberships,
    Menu, Stock, Recipe, Orders, OrderItems,
    Payments, StockMovements, Ingredients
)


def parse_boolean(value: str) -> bool:
    """Convert string to boolean"""
    if not value or value.strip() == '':
        return True  # Default to True
    if value.lower() in ('true', '1', 'yes', 'y', 't'):
        return True
    return False


def parse_decimal(value: str) -> Decimal:
    """Convert string to Decimal"""
    if not value or value.strip() == '':
        return Decimal('0')
    try:
        return Decimal(value.strip())
    except:
        raise ValueError(f"Invalid decimal value: {value}")


def parse_int(value) -> int:
    """Convert string or int to int"""
    if value is None:
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, str):
        if not value or value.strip() == '':
            return None
        try:
            return int(value.strip())
        except (ValueError, TypeError) as e:
            raise ValueError(f"Invalid integer value: {value}") from e
    try:
        return int(value)
    except (ValueError, TypeError) as e:
        raise ValueError(f"Invalid integer value: {value}") from e


def parse_datetime(value: str) -> datetime:
    """Convert string to datetime"""
    if not value or value.strip() == '':
        return None
    try:
        return datetime.fromisoformat(value.strip())
    except (ValueError, TypeError):
        try:
            return datetime.strptime(value.strip(), '%Y-%m-%d %H:%M:%S')
        except (ValueError, TypeError) as e:
            raise ValueError(f"Invalid datetime value: {value}") from e


def parse_string(value: str) -> str:
    """Parse string, return None if empty"""
    if not value or value.strip() == '':
        return None
    return value.strip()


def clean_phone(value: str) -> str:
    """Remove dashes and spaces from phone number"""
    if not value:
        return None
    return value.replace('-', '').replace(' ', '').strip()


def feed_branches(db: Session, data: dict) -> dict:
    """Feed branches data"""
    branches_map = {}
    if 'branches' in data:
        for row in data['branches']:
            try:
                csv_branch_id = parse_int(row.get('branch_id')) if row.get('branch_id') else None
                
                # Check if branch already exists
                if csv_branch_id:
                    existing = db.query(Branches).filter(Branches.branch_id == csv_branch_id).first()
                    if existing:
                        print(f"  Branch ID {csv_branch_id} already exists, skipping: {existing.name}")
                        branches_map[row.get('branch_id')] = existing.branch_id
                        continue
                
                branch = Branches(
                    branch_id=csv_branch_id,
                    name=row.get('name'),
                    address=row.get('address'),
                    phone=clean_phone(row.get('phone')),
                    is_deleted=not parse_boolean(row.get('is_active', 'true'))
                )
                db.add(branch)
                db.commit() # Commit each branch immediately
                branches_map[row.get('branch_id')] = branch.branch_id
                print(f"  Added branch: {branch.name} (ID: {branch.branch_id})")
            except IntegrityError as e:
                db.rollback() # Rollback only this transaction (since we committed previous ones)
                print(f"  Branch already exists (duplicate), skipping: {row.get('name')}")
                
                # Try to get existing branch
                if csv_branch_id:
                    existing = db.query(Branches).filter(Branches.branch_id == csv_branch_id).first()
                    if existing:
                        branches_map[row.get('branch_id')] = existing.branch_id
                continue
            except Exception as e:
                db.rollback()
                print(f"  Failed to add branch {row.get('name')} (skipping): {e}")
                continue  # Continue instead of raise to allow other branches to be inserted
    return branches_map


def feed_roles(db: Session, data: dict) -> dict:
    """Feed roles data"""
    roles_map = {}
    if 'roles' in data:
        for row in data['roles']:
            try:
                csv_role_id = parse_int(row.get('role_id')) if row.get('role_id') else None
                
                # Check if role already exists (using raw SQL to avoid model/database mismatch)
                if csv_role_id:
                    try:
                        result = db.execute(
                            text("SELECT role_id, role_name FROM roles WHERE role_id = :role_id"),
                            {"role_id": csv_role_id}
                        ).first()
                        if result:
                            print(f"  Role ID {csv_role_id} already exists, skipping: {result.role_name}")
                            roles_map[row.get('role_id')] = result.role_id
                            continue
                    except Exception:
                        pass  # Table might not exist or different schema, continue with insert
                
                # Use raw SQL insert to map CSV 'tier' to database 'seniority'
                tier_value = parse_int(row.get('tier'))
                role = Roles(
                    role_id=csv_role_id,
                    role_name=row.get('role_name'),
                    seniority=tier_value
                )
                db.add(role)
                db.commit()
                roles_map[row.get('role_id')] = role.role_id
                print(f"  Added role: {role.role_name} (ID: {role.role_id})")
            except IntegrityError as e:
                db.rollback()
                print(f"  Role already exists (duplicate), skipping: {row.get('role_name')}")
                if csv_role_id:
                    try:
                        result = db.execute(
                            text("SELECT role_id FROM roles WHERE role_id = :role_id"),
                            {"role_id": csv_role_id}
                        ).first()
                        if result:
                            roles_map[row.get('role_id')] = result.role_id
                    except Exception:
                        pass
                continue
            except Exception as e:
                db.rollback()
                print(f"  Failed to add role {row.get('role_name')} (skipping): {e}")
                continue  # Continue instead of raise to allow other roles to be inserted
    return roles_map


def feed_tiers(db: Session, data: dict) -> dict:
    """Feed tiers data"""
    tiers_map = {}
    if 'tiers' in data:
        for row in data['tiers']:
            try:
                csv_tier_id = parse_int(row.get('tier_id')) if row.get('tier_id') else None
                
                # Check if tier already exists
                if csv_tier_id:
                    existing = db.query(Tiers).filter(Tiers.tier_id == csv_tier_id).first()
                    if existing:
                        print(f"  Tier ID {csv_tier_id} already exists, skipping: {existing.tier_name}")
                        tiers_map[row.get('tier_id')] = existing.tier_id
                        continue
                
                tier = Tiers(
                    tier_id=csv_tier_id,
                    tier_name=row.get('tier_name'),
                    tier=parse_int(row.get('tier'))
                )
                db.add(tier)
                db.commit()
                tiers_map[row.get('tier_id')] = tier.tier_id
                print(f"  Added tier: {tier.tier_name} (ID: {tier.tier_id})")
            except IntegrityError as e:
                db.rollback()
                print(f"  Tier already exists (duplicate), skipping: {row.get('tier_name')}")
                if csv_tier_id:
                    existing = db.query(Tiers).filter(Tiers.tier_id == csv_tier_id).first()
                    if existing:
                        tiers_map[row.get('tier_id')] = existing.tier_id
                continue
            except Exception as e:
                db.rollback()
                print(f"  Failed to add tier {row.get('tier_name')} (skipping): {e}")
                continue  # Continue instead of raise to allow other tiers to be inserted
    return tiers_map


def feed_employees(db: Session, data: dict, branches_map: dict, roles_map: dict) -> dict:
    """Feed employees data"""
    employees_map = {}
    if 'employees' in data:
        for row in data['employees']:
            try:
                csv_employee_id = parse_int(row.get('employee_id')) if row.get('employee_id') else None
                
                # Check if employee already exists
                if csv_employee_id:
                    existing = db.query(Employees).filter(Employees.employee_id == csv_employee_id).first()
                    if existing:
                        print(f"  Employee ID {csv_employee_id} already exists, skipping: {existing.first_name} {existing.last_name}")
                        employees_map[row.get('employee_id')] = existing.employee_id
                        continue
                
                branch_id = branches_map.get(row.get('branch_id'), row.get('branch_id'))
                role_id = roles_map.get(row.get('role_id'), row.get('role_id'))
                employee = Employees(
                    employee_id=csv_employee_id,
                    branch_id=parse_int(branch_id) if branch_id else None,
                    role_id=parse_int(role_id) if role_id else None,
                    first_name=row.get('first_name'),
                    last_name=row.get('last_name'),
                    salary=parse_int(row.get('salary')),
                    is_deleted=not parse_boolean(row.get('is_active', 'true')),
                    joined_date=parse_datetime(row.get('joined_date')) if row.get('joined_date') else None
                )
                db.add(employee)
                db.commit()
                employees_map[row.get('employee_id')] = employee.employee_id
                print(f"  Added employee: {employee.first_name} {employee.last_name} (ID: {employee.employee_id})")
            except IntegrityError as e:
                db.rollback()
                print(f"  Employee already exists (duplicate), skipping: {row.get('first_name')} {row.get('last_name')}")
                if csv_employee_id:
                    existing = db.query(Employees).filter(Employees.employee_id == csv_employee_id).first()
                    if existing:
                        employees_map[row.get('employee_id')] = existing.employee_id
                continue
            except Exception as e:
                db.rollback()
                print(f"  Failed to add employee {row.get('first_name')} {row.get('last_name')} (skipping): {e}")
                continue  # Continue instead of raise to allow other employees to be inserted
    return employees_map


def feed_memberships(db: Session, data: dict, tiers_map: dict) -> dict:
    """Feed memberships data"""
    memberships_map = {}
    if 'memberships' in data:
        for row in data['memberships']:
            try:
                csv_membership_id = parse_int(row.get('membership_id')) if row.get('membership_id') else None
                
                # Check if membership already exists
                if csv_membership_id:
                    existing = db.query(Memberships).filter(Memberships.membership_id == csv_membership_id).first()
                    if existing:
                        print(f"  Membership ID {csv_membership_id} already exists, skipping: {existing.name}")
                        memberships_map[row.get('membership_id')] = existing.membership_id
                        continue
                
                tier_id = tiers_map.get(row.get('tier_id'), row.get('tier_id'))
                membership = Memberships(
                    membership_id=csv_membership_id,
                    name=row.get('name'),
                    phone=clean_phone(row.get('phone')),
                    email=parse_string(row.get('email')),  # Handle nullable email
                    points_balance=parse_int(row.get('points_balance', '0')),
                    tier_id=parse_int(tier_id) if tier_id else None,
                    joined_at=parse_datetime(row.get('joined_at')) if row.get('joined_at') else None
                )
                db.add(membership)
                db.commit()
                memberships_map[row.get('membership_id')] = membership.membership_id
                print(f"  Added membership: {membership.name} (ID: {membership.membership_id})")
            except IntegrityError as e:
                db.rollback()
                print(f"  Membership already exists (duplicate phone/email), skipping: {row.get('name')}")
                if csv_membership_id:
                    existing = db.query(Memberships).filter(Memberships.membership_id == csv_membership_id).first()
                    if existing:
                        memberships_map[row.get('membership_id')] = existing.membership_id
                continue
            except Exception as e:
                db.rollback()
                print(f"  Failed to add membership {row.get('name')} (skipping): {e}")
                continue  # Continue instead of raise to allow other memberships to be inserted
    return memberships_map


def feed_ingredients(db: Session, data: dict) -> dict:
    """Feed ingredients data"""
    ingredients_map = {}
    if 'ingredients' in data:
        for row in data['ingredients']:
            try:
                csv_ing_id = parse_int(row.get('ingredient_id')) if row.get('ingredient_id') else None
                
                if csv_ing_id:
                    existing = db.query(Ingredients).filter(Ingredients.ingredient_id == csv_ing_id).first()
                    if existing:
                        print(f"  Ingredient ID {csv_ing_id} already exists, skipping: {existing.name}")
                        ingredients_map[row.get('ingredient_id')] = existing.ingredient_id
                        continue

                ingredient = Ingredients(
                    ingredient_id=csv_ing_id,
                    name=row.get('name'),
                    base_unit=row.get('base_unit'),
                    is_deleted=not parse_boolean(row.get('is_deleted', 'false'))
                )
                db.add(ingredient)
                db.commit()
                ingredients_map[row.get('ingredient_id')] = ingredient.ingredient_id
                print(f"  Added ingredient: {ingredient.name} (ID: {ingredient.ingredient_id})")
            except IntegrityError as e:
                db.rollback()
                print(f"  Ingredient already exists (duplicate), skipping: {row.get('name')}")
                if csv_ing_id:
                    existing = db.query(Ingredients).filter(Ingredients.ingredient_id == csv_ing_id).first()
                    if existing:
                        ingredients_map[row.get('ingredient_id')] = existing.ingredient_id
                continue
            except Exception as e:
                db.rollback()
                print(f"  Failed to add ingredient {row.get('name')} (skipping): {e}")
                continue
    return ingredients_map


def feed_stock(db: Session, data: dict, branches_map: dict) -> dict:
    """Feed stock data"""
    stock_map = {}
    if 'stock' in data:
        for row in data['stock']:
            try:
                csv_stock_id = parse_int(row.get('stock_id')) if row.get('stock_id') else None
                
                if csv_stock_id:
                    existing = db.query(Stock).filter(Stock.stock_id == csv_stock_id).first()
                    if existing:
                        print(f"  Stock ID {csv_stock_id} already exists, skipping")
                        stock_map[row.get('stock_id')] = existing.stock_id
                        continue
                
                branch_id = branches_map.get(row.get('branch_id'), row.get('branch_id'))
                ingredient_id = parse_int(row.get('ingredient_id'))

                stock = Stock(
                    stock_id=csv_stock_id,
                    branch_id=parse_int(branch_id) if branch_id else None,
                    ingredient_id=ingredient_id,
                    amount_remaining=parse_decimal(row.get('amount_remaining')),
                    is_deleted=False
                )
                db.add(stock)
                db.commit()
                stock_map[row.get('stock_id')] = stock.stock_id
                print(f"  Added stock: ID={stock.stock_id} for Ingredient={ingredient_id}")
            except IntegrityError as e:
                db.rollback()
                print(f"  Stock already exists (duplicate), skipping")
                if csv_stock_id:
                    existing = db.query(Stock).filter(Stock.stock_id == csv_stock_id).first()
                    if existing:
                        stock_map[row.get('stock_id')] = existing.stock_id
                continue
            except Exception as e:
                db.rollback()
                print(f"  Failed to add stock (skipping): {e}")
                continue
    return stock_map


def feed_menu_items(db: Session, data: dict) -> dict:
    """Feed menu items data"""
    menu_items_map = {}
    if 'menu_items' in data:
        for row in data['menu_items']:
            try:
                csv_menu_item_id = parse_int(row.get('menu_item_id')) if row.get('menu_item_id') else None
                
                # Check if menu item already exists
                if csv_menu_item_id:
                    existing = db.query(Menu).filter(Menu.menu_item_id == csv_menu_item_id).first()
                    if existing:
                        print(f"  Menu item ID {csv_menu_item_id} already exists, skipping: {existing.name}")
                        menu_items_map[row.get('menu_item_id')] = existing.menu_item_id
                        continue
                
                menu_item = Menu(
                    menu_item_id=csv_menu_item_id,
                    name=row.get('name'),
                    type=row.get('type'),
                    description=parse_string(row.get('description')),  # Handle nullable description
                    price=parse_decimal(row.get('price')),
                    category=row.get('category'),
                    is_available=parse_boolean(row.get('is_available', 'true'))
                )
                db.add(menu_item)
                db.commit()
                menu_items_map[row.get('menu_item_id')] = menu_item.menu_item_id
                print(f"  Added menu item: {menu_item.name} (ID: {menu_item.menu_item_id})")
            except IntegrityError as e:
                db.rollback()
                print(f"  Menu item already exists (duplicate), skipping: {row.get('name')}")
                if csv_menu_item_id:
                    existing = db.query(Menu).filter(Menu.menu_item_id == csv_menu_item_id).first()
                    if existing:
                        menu_items_map[row.get('menu_item_id')] = existing.menu_item_id
                continue
            except Exception as e:
                db.rollback()
                print(f"  Failed to add menu item {row.get('name')} (skipping): {e}")
                continue  # Continue instead of raise to allow other menu items to be inserted
    return menu_items_map


def feed_menu_ingredients(db: Session, data: dict, menu_items_map: dict, stock_map: dict):
    """Feed menu ingredients (Recipe) data"""
    # Note: CSV table is '#menu_ingredients', mapping to 'Recipe' model
    if 'menu_ingredients' in data:
        for row in data['menu_ingredients']:
            try:
                # No primary key in CSV for recipe, usually composite or auto-inc on DB
                # Recipe model has 'id' PK.
                
                menu_item_id = menu_items_map.get(row.get('menu_item_id'), row.get('menu_item_id'))
                ingredient_id = parse_int(row.get('ingredient_id'))
                
                if not menu_item_id or not ingredient_id:
                    print("  Skipping recipe item: missing menu_item_id or ingredient_id")
                    continue

                recipe = Recipe(
                    menu_item_id=parse_int(menu_item_id),
                    ingredient_id=ingredient_id,
                    qty_per_unit=parse_decimal(row.get('qty_per_unit'))
                )
                db.add(recipe)
                db.commit()
                print(f"  Added recipe: MenuItem={menu_item_id}, Ingredient={ingredient_id}")
            except IntegrityError as e:
                db.rollback()
                print(f"  Recipe item already exists (duplicate), skipping")
                continue
            except Exception as e:
                db.rollback()
                print(f"  Failed to add recipe (skipping): {e}")
                continue


def feed_orders(db: Session, data: dict, branches_map: dict, employees_map: dict, memberships_map: dict, menu_items_map: dict) -> dict:
    """Feed orders data"""
    orders_map = {}
    if 'orders' in data:
        for row in data['orders']:
            try:
                csv_order_id = parse_int(row.get('order_id')) if row.get('order_id') else None
                
                # Check if order already exists
                if csv_order_id:
                    existing = db.query(Orders).filter(Orders.order_id == csv_order_id).first()
                    if existing:
                        print(f"  Order ID {csv_order_id} already exists, skipping")
                        orders_map[row.get('order_id')] = existing.order_id
                        continue
                
                branch_id = branches_map.get(row.get('branch_id'), row.get('branch_id'))
                employee_id = employees_map.get(row.get('employee_id'), row.get('employee_id'))
                
                # Handle nullable membership_id - skip if provided but doesn't exist
                membership_id = None
                if row.get('membership_id') and row.get('membership_id').strip():
                    membership_id = memberships_map.get(row.get('membership_id'))
                    if membership_id is None:
                        # Membership ID provided but not found - skip this order
                        print(f"  Skipping order {csv_order_id}: membership_id={row.get('membership_id')} not found")
                        continue
                
                order = Orders(
                    order_id=csv_order_id,
                    branch_id=parse_int(branch_id) if branch_id else None,
                    employee_id=parse_int(employee_id) if employee_id else None,
                    membership_id=membership_id,  # Can be None (nullable)
                    order_type=row.get('order_type'),
                    status=row.get('status'),
                    total_price=parse_decimal(row.get('total_price')),
                    created_at=parse_datetime(row.get('created_at')) if row.get('created_at') else None
                )
                db.add(order)
                db.commit()
                orders_map[row.get('order_id')] = order.order_id
                print(f"  Added order: ID={order.order_id}, total={order.total_price}")
            except IntegrityError as e:
                db.rollback()
                print(f"  Order insertion failed (IntegrityError): {e}")
                if csv_order_id:
                    existing = db.query(Orders).filter(Orders.order_id == csv_order_id).first()
                    if existing:
                        orders_map[row.get('order_id')] = existing.order_id
                        print(f"  (Order {csv_order_id} actually exists)")
                continue
            except Exception as e:
                db.rollback()
                print(f"  Failed to add order {csv_order_id} (skipping): {e}")
                continue  # Continue instead of raise to allow other orders to be inserted
    return orders_map


def feed_order_items(db: Session, data: dict, orders_map: dict, menu_items_map: dict):
    """Feed order items data"""
    if 'order_items' in data:
        for row in data['order_items']:
            try:
                csv_order_id = row.get('order_id')
                order_id = orders_map.get(csv_order_id)
                
                # Skip if order_id doesn't exist in orders_map (order was not inserted)
                if order_id is None:
                    print(f"  Skipping order item: order_id={csv_order_id} not found in orders")
                    continue
                
                menu_item_id = menu_items_map.get(row.get('menu_item_id'), row.get('menu_item_id'))
                
                # Skip if menu_item_id doesn't exist
                if menu_item_id is None:
                    print(f"  Skipping order item: menu_item_id={row.get('menu_item_id')} not found")
                    continue
                
                order_item = OrderItems(
                    order_id=parse_int(order_id) if order_id else None,
                    menu_item_id=parse_int(menu_item_id) if menu_item_id else None,
                    quantity=parse_int(row.get('quantity')),
                    unit_price=parse_decimal(row.get('unit_price')),
                    line_total=parse_decimal(row.get('line_total')),
                    status=row.get('status')
                )
                db.add(order_item)
                db.commit()  # Commit to catch errors early
                print(f"  Added order item: order_id={order_id}, menu_item_id={menu_item_id}")
            except IntegrityError as e:
                db.rollback()
                print(f"  Order item already exists (duplicate), skipping: order_id={order_id}, menu_item_id={menu_item_id}")
                continue
            except Exception as e:
                db.rollback()
                print(f"  Failed to add order item (skipping): order_id={order_id}, menu_item_id={menu_item_id}, error: {e}")
                continue  # Continue instead of raise to allow other items to be inserted


def feed_payments(db: Session, data: dict, orders_map: dict):
    """Feed payments data"""
    if 'payments' in data:
        for row in data['payments']:
            try:
                csv_order_id = row.get('order_id')
                order_id = orders_map.get(csv_order_id)
                
                # Skip if order_id doesn't exist in orders_map (order was not inserted)
                if order_id is None:
                    print(f"  Skipping payment: order_id={csv_order_id} not found in orders")
                    continue
                
                # Check if payment already exists (order_id is primary key)
                existing = db.query(Payments).filter(Payments.order_id == parse_int(order_id)).first()
                if existing:
                    print(f"  Payment for order_id {order_id} already exists, skipping")
                    continue
                
                payment = Payments(
                    order_id=parse_int(order_id) if order_id else None,
                    paid_price=parse_decimal(row.get('paid_price')),
                    points_used=parse_int(row.get('points_used', '0')),
                    payment_method=row.get('payment_method'),
                    payment_ref=parse_string(row.get('payment_ref')),  # Handle nullable payment_ref
                    paid_timestamp=parse_datetime(row.get('paid_timestamp')) if row.get('paid_timestamp') else None  # Handle nullable timestamp
                )
                db.add(payment)
                db.commit()  # commit to catch errors early
                print(f"  Added payment: order_id={order_id}")
            except IntegrityError as e:
                db.rollback()
                print(f"  Payment already exists (duplicate), skipping: order_id={order_id}")
                continue
            except Exception as e:
                db.rollback()
                print(f"  Failed to add payment (skipping): order_id={order_id}, error: {e}")
                continue  # Continue instead of raise to allow other payments to be inserted


def feed_stock_movements(db: Session, data: dict, stock_map: dict, employees_map: dict, orders_map: dict):
    """Feed stock movements data"""
    if 'stock_movements' in data:
        for row in data['stock_movements']:
            try:
                # No PK in CSV usually or auto-inc
                
                stock_id = stock_map.get(row.get('stock_id'), row.get('stock_id'))
                employee_id = employees_map.get(row.get('employee_id'), row.get('employee_id'))
                order_id = orders_map.get(row.get('order_id'), row.get('order_id'))
                
                if not stock_id:
                    print(f"  Skipping movement: stock_id={row.get('stock_id')} not found")
                    continue

                movement = StockMovements(
                    stock_id=parse_int(stock_id),
                    employee_id=parse_int(employee_id) if employee_id else None,
                    order_id=parse_int(order_id) if order_id else None,
                    qty_change=parse_decimal(row.get('qty_change')),
                    reason=row.get('reason'),
                    note=parse_string(row.get('note')),
                    created_at=parse_datetime(row.get('created_at'))
                )
                db.add(movement)
                db.commit()
                print(f"  Added stock movement: Stock={stock_id}, Qty={movement.qty_change}")
            except IntegrityError as e:
                db.rollback()
                print(f"  Stock movement error (integrity), skipping: {e}")
                continue
            except Exception as e:
                db.rollback()
                print(f"  Failed to add stock movement (skipping): {e}")
                continue


def read_csv_data(file_path: str) -> dict:
    """Read data from CSV file"""
    data = {}
    current_table = None
    headers = None
    
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        for row in reader:
            # Skip empty rows
            if not row or all(not cell.strip() for cell in row):
                continue
            
            # Check if this is a table header (starts with #)
            if row[0].startswith('#'):
                # Skip comment lines that are not table headers
                # Table headers are single words after # (e.g., #branches, #roles)
                # Comment lines have spaces or other characters (e.g., # Generated at: ...)
                potential_table_name = row[0][1:].strip()
                
                # If it contains spaces, colons, or is not a simple identifier, it's a comment
                if ' ' in potential_table_name or ':' in potential_table_name or not potential_table_name:
                    continue  # Skip comment lines
                
                table_name = potential_table_name.lower()
                current_table = table_name
                data[current_table] = []
                headers = None  # Reset headers when changing table
                continue
            
            # If no headers yet and we have a current_table, this row contains headers
            if current_table and headers is None:
                headers = [h.strip() for h in row]
                continue
            
            # If we have headers and current_table, create dict from row
            if headers and current_table:
                row_dict = {}
                for i, header in enumerate(headers):
                    if i < len(row):
                        row_dict[header] = row[i].strip()
                    else:
                        row_dict[header] = ''  # Empty string for missing values (will be handled as nullable)
                data[current_table].append(row_dict)
    
    return data


def feed_data_from_csv(csv_file: str, validate: bool = True):
    """
    Feed data from CSV file into database
    
    Args:
        csv_file: path to CSV file
        validate: if True, will validate constraints (for invalid data testing)
    """
    db = SessionLocal()
    separator = '=' * 60
    
    try:
        print(f"\n{separator}")
        print(f"Reading data from: {csv_file}")
        print(f"{separator}\n")
        
        data = read_csv_data(csv_file)
        
        if not data:
            print("No data found in CSV file")
            return
        
        print(f"Found tables: {', '.join(data.keys())}\n")
        
        # Feed data in dependency order
        print(separator)
        print("Feeding Branches...")
        print(separator)
        branches_map = feed_branches(db, data)
        db.commit()
        
        print(f"\n{separator}")
        print("Feeding Roles...")
        print(separator)
        roles_map = feed_roles(db, data)
        db.commit()
        
        print(f"\n{separator}")
        print("Feeding Tiers...")
        print(separator)
        tiers_map = feed_tiers(db, data)
        db.commit()
        
        print(f"\n{separator}")
        print("Feeding Employees...")
        print(separator)
        employees_map = feed_employees(db, data, branches_map, roles_map)
        db.commit()
        
        print(f"\n{separator}")
        print("Feeding Memberships...")
        print(separator)
        memberships_map = feed_memberships(db, data, tiers_map)
        db.commit()
        
        print(f"\n{separator}")
        print("Feeding Ingredients...")
        print(separator)
        ingredients_map = feed_ingredients(db, data)
        db.commit()

        print(f"\n{separator}")
        print("Feeding Stock...")
        print(separator)
        stock_map = feed_stock(db, data, branches_map)
        db.commit()
        
        print(f"\n{separator}")
        print("Feeding Menu Items...")
        print(separator)
        menu_items_map = feed_menu_items(db, data)
        db.commit()
        
        print(f"\n{separator}")
        print("Feeding Menu Ingredients...")
        print(separator)
        feed_menu_ingredients(db, data, menu_items_map, stock_map)
        db.commit()
        
        print(f"\n{separator}")
        print("Feeding Orders...")
        print(separator)
        orders_map = feed_orders(db, data, branches_map, employees_map, memberships_map, menu_items_map)
        db.commit()
        
        print(f"\n{separator}")
        print("Feeding Order Items...")
        print(separator)
        feed_order_items(db, data, orders_map, menu_items_map)
        db.commit()
        
        print(f"\n{separator}")
        print("Feeding Payments...")
        print(separator)
        feed_payments(db, data, orders_map)
        db.commit()
        
        print(f"\n{separator}")
        print("Feeding Stock Movements...")
        print(separator)
        feed_stock_movements(db, data, stock_map, employees_map, orders_map)
        db.commit()
        
        print(f"\n{separator}")
        print("Data feed completed successfully!")
        print(separator + "\n")
        
    except IntegrityError as e:
        db.rollback()
        if validate:
            print(f"\nIntegrity Error (expected for invalid data): {e}")
        else:
            print(f"\nIntegrity Error: {e}")
            raise
    except Exception as e:
        db.rollback()
        print(f"\nError: {e}")
        print("\n⚠️  This is invalid data - errors are expected")
        # Don't raise, just print the error and continue
    finally:
        db.close()


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Feed data from CSV file into database')
    parser.add_argument('csv_file', help='Path to CSV file')
    parser.add_argument('--no-validate', action='store_true', 
                       help='Do not validate constraints (use for invalid data testing)')
    
    args = parser.parse_args()
    
    feed_data_from_csv(args.csv_file, validate=not args.no_validate)
