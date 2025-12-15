# POS System Test Suite

## Structure

```
tests/
├── conftest.py                         # Shared fixtures
├── unit/                               # Unit tests
│   ├── test_validators.py              # Phone, email validation
│   └── test_calculations.py            # Points, prices, stock calc
├── integration/                        # API endpoint tests
│   ├── test_orders_api.py
│   ├── test_payments_api.py
│   ├── test_stock_api.py
│   ├── test_menu_api.py
│   └── test_memberships_api.py
├── business_logic/                     # Complete workflow tests
│   ├── test_ordering_flow.py           # Order lifecycle
│   ├── test_stock_management_flow.py   # Stock operations
│   ├── test_menu_recipe_flow.py        # Menu/Recipe/Ingredient
│   ├── test_membership_flow.py         # Membership & points
│   └── test_branch_management_flow.py  # Multi-branch ops
├── verify_changes.py
└── verify_constraints.py
```

## Quick Start

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific category
pytest tests/unit/
pytest tests/integration/
pytest tests/business_logic/

# Run single test
pytest tests/unit/test_validators.py::TestPhoneValidation::test_valid_phone
```

## Test Summary (37 tests)

| Category | Tests | Passed | Failed |
|----------|-------|--------|--------|
| Branch Management | 8 | 7 | 1 |
| Order Management | 5 | 5 | 0 |
| Membership & Points | 8 | 8 | 0 |
| Menu & Recipe | 9 | 6 | 3 |
| Stock Management | 7 | 7 | 0 |
| **Total** | **37** | **33** | **4** |

## Failed Tests (Pending API)

| ID | Test | Missing API |
|----|------|-------------|
| #8 | `test_multiple_branches_dashboard` | `GET /api/dashboard/summary` |
| #22 | `test_complete_menu_creation_flow` | `Menu.recipes` field in response |
| #24 | `test_restore_ingredient_restores_menu_availability` | `PUT /api/ingredients/{id}/restore` |
| #25 | `test_menu_with_multiple_ingredients` | `PUT /api/ingredients/{id}/restore` |

## Available Fixtures

```python
# Database
test_db          # Fresh SQLite database per test
client           # FastAPI TestClient

# Sample Data
sample_branch    # Branch instance
sample_employee  # Employee instance
sample_menu_item # Menu item (120 THB)
sample_stock     # Stock entry (10.0 units)
sample_order     # Unpaid order
full_order_setup # Complete setup for order tests
```

## Usage Example

```python
def test_create_order(client, sample_branch, sample_employee):
    response = client.post("/api/orders/empty", json={
        "branch_id": sample_branch.branch_id,
        "employee_id": sample_employee.employee_id,
        "order_type": "DINE_IN"
    })
    assert response.status_code == 200
```

## Commands

```bash
# Coverage report
pytest --cov=app --cov-report=term-missing

# Stop on first failure
pytest -x

# Parallel execution
pytest -n auto

# Show print statements
pytest -v -s
```

## Docker

```bash
docker compose run --rm test
```
