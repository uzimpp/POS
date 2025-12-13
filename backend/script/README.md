# Data Feed Scripts for POS System

Generate CSV test data and feed into database using Docker.

## Quick Start

### 1. Generate Data

```bash
# Generate valid data (default: 5 branches, 43 employees, 500 memberships, 3000 orders)
docker compose exec backend python3 script/generate_data.py --type valid --random

# Generate invalid data (for testing constraints)
docker compose exec backend python3 script/generate_data.py --type invalid

# Generate both
docker compose exec backend python3 script/generate_data.py --type both --random
```

### 2. Feed Data to Database

```bash
# Feed valid data
docker compose exec backend python3 script/feed_data.py script/data_valid.csv

# Feed invalid data (for constraint testing)
docker compose exec backend python3 script/feed_data.py script/data_invalid.csv
```

### 3. Check Data in Database

```bash
# Check all table counts
docker compose exec postgres psql -U posuser -d posdb -c "
  SELECT 'branches' as table_name, COUNT(*) FROM branches
  UNION ALL SELECT 'roles', COUNT(*) FROM roles
  UNION ALL SELECT 'employees', COUNT(*) FROM employees
  UNION ALL SELECT 'memberships', COUNT(*) FROM memberships
  UNION ALL SELECT 'orders', COUNT(*) FROM orders
  UNION ALL SELECT 'order_items', COUNT(*) FROM order_items
  UNION ALL SELECT 'payments', COUNT(*) FROM payments
  UNION ALL SELECT 'stock', COUNT(*) FROM stock
  ORDER BY table_name;"

# Check specific table
docker compose exec postgres psql -U posuser -d posdb -c "SELECT * FROM roles;"
docker compose exec postgres psql -U posuser -d posdb -c "SELECT * FROM branches LIMIT 5;"

# Check order with details
docker compose exec postgres psql -U posuser -d posdb -c "
  SELECT o.order_id, o.total_price, o.status, 
         b.name as branch, m.name as member
  FROM orders o
  LEFT JOIN branches b ON o.branch_id = b.branch_id
  LEFT JOIN memberships m ON o.membership_id = m.membership_id
  LIMIT 10;"
```

## Generate Options

### Custom Dataset Size

```bash
# Small dataset
docker compose exec backend python3 script/generate_data.py --type valid --random \
  --num-branches 3 \
  --num-employees 10 \
  --num-memberships 50 \
  --num-orders 100

# Large dataset
docker compose exec backend python3 script/generate_data.py --type valid --random \
  --num-branches 10 \
  --num-employees 100 \
  --num-memberships 1000 \
  --num-orders 5000
```

### Available Arguments

| Argument | Default | Description |
|----------|---------|-------------|
| `--type` | `both` | `valid`, `invalid`, or `both` |
| `--random` | `false` | Enable random data generation |
| `--num-branches` | `5` | Number of branches |
| `--num-employees` | `43` | Number of employees |
| `--num-memberships` | `500` | Number of memberships |
| `--num-orders` | `3000` | Number of orders |
| `--num-menu-items` | `20` | Number of menu items |
| `--num-stock-per-branch` | `12` | Stock items per branch |

## Clear Database

```bash
# Clear all data
docker compose exec postgres psql -U posuser -d posdb -c "
  TRUNCATE TABLE branches, roles, employees, tiers, memberships, 
                 menu_items, stock, menu_ingredients, orders, 
                 order_items, payments, stock_movements CASCADE;"
```

## CSV Format

CSV files use `#table_name` headers:

```csv
#roles
role_id,role_name,tier
1,Manager,3
2,Chef,2

#branches
branch_id,name,address,phone,is_active
1,Main Branch,123 Sukhumvit Road,02-123-4567,true
```

**Note:** CSV uses `tier` column which maps to database `seniority` column automatically.

## Data Characteristics

**Valid Data:**
- Satisfies all database constraints
- Unique phone/email for memberships
- Valid foreign key references
- Realistic random data

**Invalid Data:**
- Tests constraint violations:
  - String length exceeded (>50 chars)
  - Negative values
  - Invalid data types
  - Duplicate unique fields
  - Invalid foreign keys
