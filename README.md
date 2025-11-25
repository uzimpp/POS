# POS System - Point of Sale for Curry Rice Restaurant

A full-stack Point of Sale system built with Next.js, FastAPI, and PostgreSQL, designed for managing a curry rice restaurant.

## Features

- **Order Management**: Create, view, and manage orders (Dine-in, Takeaway, Delivery)
- **Menu Management**: Manage menu items (dishes, addons, sets)
- **Inventory Management**: Track stock and ingredients
- **Membership System**: Manage customer memberships
- **Employee Management**: Manage employees and roles
- **Order Processing**: Calculate totals, apply VAT, process payments

## Tech Stack

- **Frontend**: Next.js 16, React 19, Redux Toolkit, RTK Query, Tailwind CSS
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL
- **Containerization**: Docker, Docker Compose

## Database Schema

The system includes 8 main tables:
- Roles
- Employees
- Memberships
- Menu Items
- Stock
- Menu Ingredients
- Orders
- Order Items

See the ER diagram in the plan for detailed relationships.

## Getting Started

### Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ (for local development)

### Running with Docker

1. Clone the repository and navigate to the project directory

2. Create a `.env` file (optional, defaults are provided):
   ```env
   POSTGRES_USER=posuser
   POSTGRES_PASSWORD=pospass
   POSTGRES_DB=posdb
   POSTGRES_HOST=postgres
   POSTGRES_PORT=5432
   BACKEND_PORT=8000
   FRONTEND_PORT=3000
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. Start all services:
   ```bash
   docker-compose up --build
   ```

4. Initialize and seed the database:
   ```bash
   docker-compose exec backend python -m app.init_db
   ```

5. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Seed Data

The seed script includes:
- 3 Roles (Manager, Chef, Cashier)
- 4 Employees
- 12 Stock items (ingredients)
- 11 Menu items (curry rice dishes, sets, addons)
- Menu ingredients linking dishes to stock
- 7 Memberships
- 7 Sample orders with order items

### Development

#### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
POS/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py
│       ├── database.py
│       ├── models.py
│       ├── schemas.py
│       ├── seed.py
│       ├── init_db.py
│       └── routers/
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── app/
│       ├── store/
│       └── components/
```

## API Endpoints

All API endpoints are prefixed with `/api`:

- `/api/roles` - Role management
- `/api/employees` - Employee management
- `/api/memberships` - Membership management
- `/api/stock` - Stock/inventory management
- `/api/menu-items` - Menu item management
- `/api/menu-ingredients` - Menu ingredient management
- `/api/orders` - Order management
- `/api/order-items` - Order item management

See `/docs` for interactive API documentation.

## Business Logic

- **Order Total**: Sum of all order items' line_total
- **Line Total**: quantity × unit_price
- **Paid Price**: total_price × 1.07 (7% VAT)
- **Order Status**: Un-Paid, Paid, Cancelled
- **Order Types**: Dine-in, Takeaway, Delivery

## License

This project is for educational/database demonstration purposes.
