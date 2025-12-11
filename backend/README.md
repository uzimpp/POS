# POS Backend API

FastAPI-based REST API backend for the Point of Sale system.

## Tech Stack

- **Framework**: FastAPI 0.104.1
- **ASGI Server**: Uvicorn
- **ORM**: SQLAlchemy 2.0
- **Database**: PostgreSQL
- **Validation**: Pydantic 2.5
- **Migrations**: Alembic

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── database.py          # Database connection and session management
│   ├── models.py            # SQLAlchemy ORM models
│   ├── schemas.py           # Pydantic schemas for request/response validation
│   ├── init_db.py           # Database initialization script
│   ├── seed.py              # Database seeding script
│   └── routers/             # API route handlers
│       ├── branches.py
│       ├── employees.py
│       ├── memberships.py
│       ├── menu_items.py
│       ├── menu_ingredients.py
│       ├── orders.py
│       ├── order_items.py
│       ├── payments.py
│       ├── roles.py
│       └── stock.py
├── tests/                   # Test files
├── Dockerfile
├── requirements.txt
└── README.md
```

## Setup

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- pip

### Installation

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   Create a `.env` file in the backend directory:
   ```env
   DATABASE_URL=postgresql://posuser:pospass@localhost:5432/posdb
   POSTGRES_USER=posuser
   POSTGRES_PASSWORD=pospass
   POSTGRES_DB=posdb
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   ```

4. Initialize the database:
   ```bash
   python -m app.init_db
   ```

## Running the Server

### Development Mode

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- API: http://localhost:8000
- Interactive API Docs (Swagger): http://localhost:8000/docs
- Alternative API Docs (ReDoc): http://localhost:8000/redoc

### Using Docker

```bash
docker-compose up backend
```

## API Endpoints

All endpoints are prefixed with `/api`:

### Roles
- `GET /api/roles` - Get all roles
- `GET /api/roles/{id}` - Get role by ID
- `POST /api/roles` - Create new role
- `PUT /api/roles/{id}` - Update role
- `DELETE /api/roles/{id}` - Delete role

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/{id}` - Get employee by ID
- `POST /api/employees` - Create new employee
- `PUT /api/employees/{id}` - Update employee
- `DELETE /api/employees/{id}` - Delete employee

### Branches
- `GET /api/branches` - Get all branches
- `GET /api/branches/{id}` - Get branch by ID
- `POST /api/branches` - Create new branch
- `PUT /api/branches/{id}` - Update branch
- `DELETE /api/branches/{id}` - Delete branch

### Memberships
- `GET /api/memberships` - Get all memberships
- `GET /api/memberships/{id}` - Get membership by ID
- `GET /api/memberships/phone/{phone}` - Get membership by phone
- `POST /api/memberships` - Create new membership
- `PUT /api/memberships/{id}` - Update membership
- `DELETE /api/memberships/{id}` - Delete membership

### Stock
- `GET /api/stock` - Get all stock items
- `GET /api/stock/{id}` - Get stock item by ID
- `POST /api/stock` - Create new stock item
- `PUT /api/stock/{id}` - Update stock item
- `DELETE /api/stock/{id}` - Delete stock item

### Menu Items
- `GET /api/menu-items` - Get all menu items
- `GET /api/menu-items/{id}` - Get menu item by ID
- `POST /api/menu-items` - Create new menu item
- `PUT /api/menu-items/{id}` - Update menu item
- `DELETE /api/menu-items/{id}` - Delete menu item

### Menu Ingredients
- `GET /api/menu-ingredients` - Get all menu ingredients
- `GET /api/menu-ingredients/{id}` - Get menu ingredient by ID
- `POST /api/menu-ingredients` - Create new menu ingredient
- `PUT /api/menu-ingredients/{id}` - Update menu ingredient
- `DELETE /api/menu-ingredients/{id}` - Delete menu ingredient

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/{id}` - Get order by ID
- `POST /api/orders` - Create new order
- `PUT /api/orders/{id}` - Update order
- `DELETE /api/orders/{id}` - Delete order

### Order Items
- `GET /api/order-items` - Get all order items
- `GET /api/order-items/{id}` - Get order item by ID
- `POST /api/order-items` - Create new order item
- `PUT /api/order-items/{id}` - Update order item
- `DELETE /api/order-items/{id}` - Delete order item

### Payments
- `GET /api/payments` - Get all payments
- `GET /api/payments/{order_id}` - Get payment by order ID
- `POST /api/payments` - Create new payment
- `PUT /api/payments/{order_id}` - Update payment
- `DELETE /api/payments/{order_id}` - Delete payment

## Database Models

The system includes the following main models:

- **Role**: Employee roles with ranking
- **Employee**: Staff members with roles and salary
- **Branch**: Restaurant branch locations
- **Membership**: Customer membership program
- **Stock**: Inventory items
- **MenuItem**: Menu items (products)
- **MenuIngredient**: Links menu items to stock ingredients
- **Order**: Customer orders
- **OrderItem**: Items within an order
- **Payment**: Payment records for orders

## Development

### Database Migrations

The project uses Alembic for database migrations:

```bash
# Create a new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

### Testing

Run tests from the project root:

```bash
python -m pytest tests/
```

### Code Style

Follow PEP 8 style guidelines. Consider using:
- `black` for code formatting
- `flake8` or `pylint` for linting
- `mypy` for type checking

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `POSTGRES_USER` | Database user | `posuser` |
| `POSTGRES_PASSWORD` | Database password | `pospass` |
| `POSTGRES_DB` | Database name | `posdb` |
| `POSTGRES_HOST` | Database host | `localhost` |
| `POSTGRES_PORT` | Database port | `5432` |

## License

This project is for educational/database demonstration purposes.

