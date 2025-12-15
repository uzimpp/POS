#!/bin/bash

# สคริปต์สำหรับรัน tests ทั้งหมดและแสดงสรุป

echo "🧪 POS System Test Suite"
echo "=========================="
echo ""

# สีสำหรับ output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# นับจำนวน test files
echo -e "${BLUE}📊 Test Files Summary:${NC}"
echo "---"

UNIT_TESTS=$(find tests/unit -name "test_*.py" -type f | wc -l | tr -d ' ')
INTEGRATION_TESTS=$(find tests/integration -name "test_*.py" -type f | wc -l | tr -d ' ')
BUSINESS_LOGIC_TESTS=$(find tests/business_logic -name "test_*.py" -type f | wc -l | tr -d ' ')

echo "  📦 Unit Tests:            ${UNIT_TESTS} files"
echo "  🔗 Integration Tests:     ${INTEGRATION_TESTS} files"
echo "  🎭 Business Logic Tests:  ${BUSINESS_LOGIC_TESTS} files"
echo ""

# แสดง test files
echo -e "${YELLOW}Unit Test Files:${NC}"
find tests/unit -name "test_*.py" -type f | sed 's|tests/unit/||' | sed 's|^|  ✓ |'
echo ""

echo -e "${YELLOW}Integration Test Files:${NC}"
find tests/integration -name "test_*.py" -type f | sed 's|tests/integration/||' | sed 's|^|  ✓ |'
echo ""

echo -e "${YELLOW}Business Logic Test Files:${NC}"
find tests/business_logic -name "test_*.py" -type f | sed 's|tests/business_logic/||' | sed 's|^|  ✓ |'
echo ""

echo "=========================="
echo -e "${GREEN}🚀 Running All Tests...${NC}"
echo "=========================="
echo ""

# รัน tests แต่ละประเภท
echo -e "${BLUE}1️⃣  Running Unit Tests${NC}"
echo "---"
pytest tests/unit/ -v --tb=short --color=yes
UNIT_EXIT=$?
echo ""

echo -e "${BLUE}2️⃣  Running Integration Tests${NC}"
echo "---"
pytest tests/integration/ -v --tb=short --color=yes
INTEGRATION_EXIT=$?
echo ""

echo -e "${BLUE}3️⃣  Running Business Logic Tests${NC}"
echo "---"
pytest tests/business_logic/ -v --tb=short --color=yes
BUSINESS_EXIT=$?
echo ""

# สรุปผลลัพธ์
echo "=========================="
echo -e "${GREEN}📈 Test Results Summary${NC}"
echo "=========================="

if [ $UNIT_EXIT -eq 0 ]; then
    echo -e "  ✅ Unit Tests: ${GREEN}PASSED${NC}"
else
    echo -e "  ❌ Unit Tests: FAILED"
fi

if [ $INTEGRATION_EXIT -eq 0 ]; then
    echo -e "  ✅ Integration Tests: ${GREEN}PASSED${NC}"
else
    echo -e "  ❌ Integration Tests: FAILED"
fi

if [ $BUSINESS_EXIT -eq 0 ]; then
    echo -e "  ✅ Business Logic Tests: ${GREEN}PASSED${NC}"
else
    echo -e "  ❌ Business Logic Tests: FAILED"
fi

echo ""

# Exit code
if [ $UNIT_EXIT -eq 0 ] && [ $INTEGRATION_EXIT -eq 0 ] && [ $BUSINESS_EXIT -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "❌ Some tests failed. Please check the output above."
    exit 1
fi
