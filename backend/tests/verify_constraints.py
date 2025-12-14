import sys
from pydantic import ValidationError
from decimal import Decimal

# Mock app.database to allow importing app.schemas if it has dependencies (it shouldn't, but safe side)
# Schemas usually import Pydantic only.
# But let's verify if we need to set PYTHONPATH too.

try:
    from app.schemas import BranchCreate, EmployeeCreate, StockCreate
except ImportError:
    # Fallback to sys.path append if PYTHONPATH env var not set correctly for direct script
    import os
    sys.path.append(os.path.abspath(
        os.path.join(os.path.dirname(__file__), '../..')))
    from app.schemas import BranchCreate, EmployeeCreate, StockCreate


def test_branch_constraints():
    print("Testing Branch Constraints...")
    # 1. Short phone
    try:
        BranchCreate(name="Test", address="Addr",
                     phone="123", is_deleted=False)
        print("FAIL: Short phone passed validation")
        raise AssertionError("Short phone should have failed")
    except ValidationError:
        print("PASS: Short phone failed validation")

    # 2. Long phone
    try:
        BranchCreate(name="Test", address="Addr",
                     phone="1"*16, is_deleted=False)
        print("FAIL: Long phone passed validation")
        raise AssertionError("Long phone should have failed")
    except ValidationError:
        print("PASS: Long phone failed validation")

    # 3. Valid phone
    try:
        BranchCreate(name="Test", address="Addr",
                     phone="0812345678", is_deleted=False)
        print("PASS: Valid phone passed validation")
    except ValidationError as e:
        print(f"FAIL: Valid phone failed validation: {e}")
        raise


def test_employee_constraints():
    print("\nTesting Employee Constraints...")
    # 1. Negative Salary
    try:
        EmployeeCreate(
            first_name="Test", last_name="User",
            role_id=1, branch_id=1,
            salary=-1000, is_deleted=False
        )
        print("FAIL: Negative salary passed validation")
        raise AssertionError("Negative salary should have failed")
    except ValidationError:
        print("PASS: Negative salary failed validation")


def test_stock_constraints():
    print("\nTesting Stock Constraints...")
    # 1. Negative Amount
    try:
        StockCreate(
            branch_id=1, stk_name="Item", unit="kg",
            amount_remaining=Decimal("-10.00")
        )
        print("FAIL: Negative amount passed validation")
        raise AssertionError("Negative amount should have failed")
    except ValidationError:
        print("PASS: Negative amount failed validation")


if __name__ == "__main__":
    try:
        test_branch_constraints()
        test_employee_constraints()
        test_stock_constraints()
        print("\nALL SCHEMA TESTS PASSED")
    except Exception as e:
        print(f"\nTEST SUITE FAILED: {e}")
        exit(1)
