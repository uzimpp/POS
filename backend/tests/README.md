# 🧪 POS System Test Suite

คู่มือการทดสอบระบบ POS ครอบคลุม Unit Tests, Integration Tests และ Business Logic Tests

---

## 📁 โครงสร้าง Test Suite

```
tests/
├── conftest.py                    # Fixtures ส่วนกลาง (database, test data)
│
├── unit/                          # Unit Tests - ทดสอบฟังก์ชันย่อยๆ
│   ├── test_validators.py        # ทดสอบการ validate (phone, email)
│   └── test_calculations.py      # ทดสอบการคำนวณ (points, prices, stock)
│
├── integration/                   # Integration Tests - ทดสอบ API endpoints
│   ├── test_orders_api.py        # Orders endpoints
│   ├── test_payments_api.py      # Payments endpoints
│   ├── test_stock_api.py         # Stock & movements endpoints
│   └── ...
│
└── business_logic/                # Business Logic Tests - ทดสอบ complete flows
    ├── test_ordering_flow.py         # Flow 1: Order lifecycle
    ├── test_stock_management_flow.py # Flow 2: Stock management
    ├── test_menu_recipe_flow.py      # Flow 3: Menu/Recipe/Ingredient
    ├── test_membership_flow.py       # Flow 4: Membership & points
    └── test_branch_management_flow.py # Flow 5: Multi-branch operations
```

---

## 🚀 การติดตั้งและเตรียมพร้อม

### 1. ติดตั้ง Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Dependencies ที่เพิ่ม:
- `pytest` - Testing framework
- `pytest-asyncio` - Async support
- `httpx` - HTTP client สำหรับ FastAPI testing
- `faker` - Generate test data
- `pytest-cov` - Code coverage
- `pytest-xdist` - Parallel testing

### 2. ตรวจสอบ Installation

```bash
pytest --version
```

---

## 🎯 วิธีการรัน Tests

### รัน Tests ทั้งหมด

```bash
pytest
```

### รัน Tests แบบแสดง Output ละเอียด

```bash
pytest -v
```

### รัน Tests เฉพาะประเภท

```bash
# Unit Tests เท่านั้น
pytest tests/unit/

# Integration Tests เท่านั้น
pytest tests/integration/

# Business Logic Tests เท่านั้น
pytest tests/business_logic/
```

### รัน Tests เฉพาะไฟล์

```bash
# ทดสอบเฉพาะ ordering flow
pytest tests/business_logic/test_ordering_flow.py

# ทดสอบเฉพาะ validators
pytest tests/unit/test_validators.py
```

### รัน Tests เฉพาะ Test Function

```bash
# รันเฉพาะ test function เดียว
pytest tests/business_logic/test_ordering_flow.py::TestOrderingFlow::test_complete_ordering_flow_cash

# ใช้ keyword matching
pytest -k "ordering"  # รัน tests ทั้งหมดที่มี "ordering" ในชื่อ
pytest -k "payment"   # รัน tests ทั้งหมดที่มี "payment" ในชื่อ
```

### รัน Tests แบบ Parallel (เร็วขึ้น)

```bash
# รัน 4 processes พร้อมกัน
pytest -n 4

# รัน auto (ตามจำนวน CPU cores)
pytest -n auto
```

### รัน Tests พร้อม Code Coverage

```bash
# แสดง coverage report
pytest --cov=app --cov-report=term-missing

# สร้าง HTML coverage report
pytest --cov=app --cov-report=html

# เปิด HTML report ใน browser
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
```

### รัน Tests พร้อมดู Output แบบละเอียด

```bash
# แสดง print statements
pytest -v -s

# หยุดที่ test แรกที่ fail
pytest -x

# หยุดหลัง 3 tests ที่ fail
pytest --maxfail=3
```

---

## 📊 ตัวอย่าง Output

### ✅ Success

```bash
$ pytest tests/unit/test_calculations.py -v

tests/unit/test_calculations.py::TestPointsCalculation::test_points_earned_calculation PASSED
tests/unit/test_calculations.py::TestPointsCalculation::test_points_earned_with_decimal PASSED
tests/unit/test_calculations.py::TestPriceCalculation::test_line_total_calculation PASSED

========================= 3 passed in 0.12s =========================
```

### ❌ Failure

```bash
$ pytest tests/integration/test_orders_api.py::TestOrdersAPI::test_create_empty_order -v

FAILED tests/integration/test_orders_api.py::TestOrdersAPI::test_create_empty_order
AssertionError: assert 400 == 200

========================= 1 failed in 0.45s =========================
```

---

## 🧩 การเขียน Tests ใหม่

### 1. Unit Test Template

```python
"""Unit tests for [module name]"""
import pytest

class Test[FeatureName]:
    """Test [feature description]"""
    
    def test_[scenario_name](self):
        """Test: [what is being tested]"""
        # Arrange (เตรียมข้อมูล)
        input_value = 100
        
        # Act (ทำการทดสอบ)
        result = calculate_points(input_value)
        
        # Assert (ตรวจสอบผลลัพธ์)
        assert result == 10
```

### 2. Integration Test Template

```python
"""Integration tests for [API endpoint]"""
import pytest

class Test[EndpointName]API:
    """Test /api/[endpoint] endpoints"""
    
    def test_[operation]_[endpoint](self, client, [fixtures]):
        """Test: [HTTP method] /api/[endpoint] does [what]"""
        response = client.get("/api/endpoint/")
        
        assert response.status_code == 200
        data = response.json()
        assert data["key"] == expected_value
```

### 3. Business Logic Test Template

```python
"""Business Logic Tests: [Flow Name]"""
import pytest

class Test[FlowName]Flow:
    """Test Flow X: [flow description]"""
    
    def test_complete_[flow_name]_flow(self, client, [fixtures]):
        """
        Test: Complete [flow name] workflow
        
        Steps:
        1. [Step 1]
        2. [Step 2]
        3. [Step 3]
        """
        # Step 1: [description]
        response1 = client.post(...)
        assert response1.status_code == 200
        
        # Step 2: [description]
        response2 = client.put(...)
        assert response2.status_code == 200
        
        # Step 3: [description]
        # Verify final state
```

---

## 🔧 Fixtures ที่มีให้ใช้งาน

### Database Fixtures

- `test_db` - In-memory SQLite database (fresh per test)
- `client` - FastAPI TestClient with database override

### Data Fixtures (สร้าง test data พร้อมใช้)

- `sample_branch` - Branch ตัวอย่าง
- `sample_role` - Role ตัวอย่าง
- `sample_employee` - Employee ตัวอย่าง
- `sample_tier` - Membership tier
- `sample_membership` - Membership with 100 points
- `sample_ingredient` - Ingredient
- `sample_stock` - Stock entry (10.0 units)
- `sample_menu_item` - Menu item (ผัดไทยกุ้งสด - 120 บาท)
- `sample_recipe` - Recipe linking menu to ingredient
- `sample_order` - Unpaid order
- `sample_order_item` - Order item

### Helper Fixtures

- `full_order_setup` - Complete setup with branch, employee, menu, ingredient, recipe, stock

### ตัวอย่างการใช้ Fixtures

```python
def test_example(client, sample_branch, sample_employee):
    """Fixtures จะถูก inject โดย pytest"""
    response = client.post("/api/orders/empty", json={
        "branch_id": sample_branch.branch_id,
        "employee_id": sample_employee.employee_id,
        "order_type": "DINE_IN"
    })
    assert response.status_code == 200
```

---

## 🎭 Test Coverage Goals

| Type | Target Coverage | Current Status |
|------|----------------|----------------|
| Unit Tests | 90%+ | 🟢 Implemented |
| Integration Tests | 80%+ | 🟢 Implemented |
| Business Logic Tests | 100% of flows | 🟢 5/7 flows |
| Overall | 85%+ | ⏳ Run `pytest --cov` to check |

---

## 🐛 Debugging Tests

### 1. แสดง Print Statements

```bash
pytest -v -s
```

### 2. Drop into Python Debugger

เพิ่ม `import pdb; pdb.set_trace()` ในโค้ด:

```python
def test_something(client):
    response = client.get("/api/orders/")
    import pdb; pdb.set_trace()  # Debugger จะหยุดตรงนี้
    assert response.status_code == 200
```

### 3. แสดง Warnings

```bash
pytest --disable-warnings=False
```

---

## ✅ Best Practices

### 1. Test Naming Convention

- ✅ `test_[feature]_[scenario]_[expected_result]`
- ✅ `test_cannot_pay_without_done_items`
- ❌ `test_1`, `test_payment`, `test_bug_fix`

### 2. Test Organization

- **Unit Tests**: ทดสอบฟังก์ชันเดียว, ไม่ใช้ database
- **Integration Tests**: ทดสอบ API endpoint, ใช้ test database
- **Business Logic Tests**: ทดสอบ flow สมบูรณ์, หลาย steps

### 3. Arrange-Act-Assert Pattern

```python
def test_example():
    # Arrange: เตรียมข้อมูล
    order = create_order()
    
    # Act: ทำการทดสอบ
    result = process_payment(order)
    
    # Assert: ตรวจสอบผลลัพธ์
    assert result.status == "PAID"
```

### 4. Test Independence

- แต่ละ test ต้อง**อิสระจากกัน**
- ไม่พึ่งพา order ของการรัน tests
- ใช้ fixtures สร้าง test data ใหม่ทุกครั้ง

### 5. Meaningful Assertions

```python
# ❌ แย่
assert response.status_code == 200

# ✅ ดี
assert response.status_code == 200, f"Expected 200 but got {response.status_code}"
assert data["status"] == "PAID", "Order should be marked as PAID after payment"
```

---

## 📚 Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [SQLAlchemy Testing](https://docs.sqlalchemy.org/en/14/orm/session_transaction.html#joining-a-session-into-an-external-transaction-such-as-for-test-suites)

---

## 🎉 ยินดีด้วย!

คุณพร้อมใช้งาน Test Suite แล้ว! เริ่มทดสอบโค้ดของคุณได้เลย:

```bash
cd backend
pytest -v
```

Happy Testing! 🚀


