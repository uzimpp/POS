# Business Logic Issues: Frontend vs Backend

This document lists all places where business logic is currently in the frontend but should be in the backend for data integrity and security.

## Critical Issues (Must Fix)

### 1. Payment Final Price Calculation
**Location:** `frontend/src/app/orders/[id]/page.tsx:97`
```typescript
const finalPrice = Math.max(0, totalPrice - pointsUsed);
```
**Issue:** Frontend calculates the final price after points deduction. This should be calculated and validated on the backend.
**Risk:** User could manipulate points or final price before sending to backend.
**Fix:** Backend should calculate `paid_price` based on `order.total_price` and `points_used`, ensuring points don't exceed available balance and final price is correct.

### 2. Dashboard Statistics Aggregation
**Location:** `frontend/src/app/page.tsx:36-47`
```typescript
const totalOrders = orders?.length || 0;
const paidOrders = orders?.filter((o) => o.status === "PAID").length || 0;
const pendingOrders = orders?.filter((o) => o.status === "PENDING").length || 0;
const totalRevenue = payments?.reduce((sum, p) => sum + parseFloat(p.paid_price || "0"), 0) || 0;
const totalMenus = menus?.length || 0;
const availableMenus = menus?.filter((m) => m.is_available).length || 0;
const totalEmployees = employees?.filter((e) => !e.is_deleted).length || 0;
const lowStockItems = stock?.filter((s) => s.amount_remaining < 10).length || 0;
```
**Issue:** All statistics are calculated client-side. This is inefficient and could be inaccurate if data changes.
**Risk:** Performance issues with large datasets, potential inconsistencies.
**Fix:** Create backend endpoint `/api/dashboard/stats` that returns pre-calculated statistics.

### 3. Revenue Calculation
**Location:** `frontend/src/app/payment/page.tsx:41-42`
```typescript
const totalRevenue = payments?.reduce((sum, p) => sum + parseFloat(p.paid_price || "0"), 0) || 0;
```
**Issue:** Revenue is calculated client-side by summing all payments.
**Risk:** Inefficient, could be inaccurate with large datasets.
**Fix:** Backend should provide aggregated revenue endpoint or include in dashboard stats.

### 4. Out of Stock Detection ✅ FIXED
**Location:** `frontend/src/app/page.tsx:47`, `frontend/src/app/stock/page.tsx:86,90` (old)
**Previous Issue:** Low stock threshold was hardcoded as `< 10` in multiple places.
**Fix Applied:** 
- Created backend endpoints `/api/stock/out-of-stock` and `/api/stock/out-of-stock/count`
- Backend now detects out of stock items (amount_remaining = 0)
- Frontend uses `useGetOutOfStockCountQuery()` hook
- Updated stock page to show "Out of Stock" instead of "Low Stock"
- Added `out_of_stock_only` query parameter to stock endpoint

## Medium Priority Issues

### 5. Filtering by `is_deleted` Status
**Location:** Multiple files
- `frontend/src/app/branches/page.tsx:98`
- `frontend/src/app/employees/page.tsx:94-95`
- `frontend/src/app/ingredients/page.tsx:265-266`
- `frontend/src/app/orders/page.tsx:58`
- `frontend/src/app/stock/page.tsx:281`
**Issue:** Frontend filters out deleted items client-side. Should be backend query parameter.
**Risk:** Performance issues, unnecessary data transfer.
**Fix:** Add `?is_deleted=false` query parameter to backend endpoints, filter on server.

### 6. Order Status Filtering
**Location:** `frontend/src/app/orders/page.tsx:66`
```typescript
orders?.filter((order) => order.status === filterStatus);
```
**Issue:** Orders filtered by status on frontend.
**Risk:** Performance with large datasets.
**Fix:** Add `?status=PAID` query parameter to orders endpoint.

### 7. Payment Method Filtering
**Location:** `frontend/src/app/payment/page.tsx:28`
```typescript
payments?.filter((payment) => payment.payment_method === filterMethod);
```
**Issue:** Payments filtered by method on frontend.
**Risk:** Performance with large datasets.
**Fix:** Add `?payment_method=CASH` query parameter to payments endpoint.

### 8. Menu Category Filtering
**Location:** `frontend/src/app/menu/page.tsx:83`, `frontend/src/app/orders/[id]/page.tsx:122`
```typescript
menus?.filter((item) => item.category === selectedCategory);
```
**Issue:** Menu items filtered by category on frontend.
**Risk:** Performance with large menu catalogs.
**Fix:** Add `?category=Main` query parameter to menu endpoint.

### 9. Payment Processing Validation (UX Only)
**Location:** `frontend/src/app/orders/[id]/page.tsx:124-129`
```typescript
const canProcessPayment = orderItems && orderItems.length > 0 && 
  orderItems.every((item) => item.status === "DONE" || item.status === "CANCELLED");
```
**Issue:** Frontend checks if payment can be processed, but backend also validates.
**Status:** ✅ **OK** - This is acceptable for UX (disable button), backend is source of truth.

## Already Handled Correctly (Backend)

### ✅ Order Total Calculation
- Backend recalculates `order.total_price` when order items are added/updated/deleted
- Location: `backend/app/routers/order_items.py:74-77, 133-136, 264-267, 288-291`

### ✅ Recipe Duplicate Prevention
- Backend now handles duplicate ingredients by incrementing quantity
- Location: `backend/app/routers/recipe.py:34-50` (just fixed)

### ✅ Payment Validation
- Backend validates all order items are DONE/CANCELLED before payment
- Location: `backend/app/routers/payments.py:42-60`

### ✅ Stock Subtraction
- Backend handles stock subtraction when order item status changes to DONE
- Location: `backend/app/routers/order_items.py:179-226`

### ✅ Points Deduction
- Backend deducts points from membership balance
- Location: `backend/app/routers/payments.py:77-83`

### ✅ Out of Stock Detection
- Backend provides endpoints to detect out of stock items (amount_remaining = 0)
- Location: `backend/app/routers/stock.py:33-58` (just fixed)

## Summary

**Critical (Must Fix):**
1. ~~Payment final price calculation~~ ✅ **FIXED** - Backend now calculates `paid_price` from `order.total_price` and `points_used`
2. ~~Dashboard statistics aggregation~~ ✅ **FIXED** - Created `/api/dashboard/stats` endpoint with all aggregated statistics
3. ~~Revenue calculation~~ ✅ **FIXED** - Included in dashboard stats endpoint
4. ~~Low stock threshold configuration~~ ✅ **FIXED** - Now using out of stock detection (amount_remaining = 0)

**Medium Priority (Should Fix):**
5. ~~Filtering by `is_deleted`~~ ✅ **FIXED** - Added `is_deleted` query parameter to branches, employees, ingredients endpoints
6. ~~Order status filtering~~ ✅ **FIXED** - Added `status` query parameter to orders endpoint
7. ~~Payment method filtering~~ ✅ **FIXED** - Added `payment_method` query parameter to payments endpoint
8. ~~Menu category filtering~~ ✅ **FIXED** - Added `category` query parameter to menu endpoint

**Acceptable (UX Only):**
9. Payment processing validation (frontend check is OK, backend validates)
