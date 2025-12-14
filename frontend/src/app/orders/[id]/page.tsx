"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Layout } from "@/components/layout";
import {
  useGetOrderQuery,
  useCancelOrderMutation,
} from "@/store/api/ordersApi";
import {
  useGetOrderItemsByOrderQuery,
  useCreateOrderItemMutation,
  useUpdateOrderItemMutation,
  useUpdateOrderItemStatusMutation,
} from "@/store/api/orderItemsApi";
import { useGetMenusQuery } from "@/store/api/menuApi";
import { useCreatePaymentMutation } from "@/store/api/paymentsApi";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params.id);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showBill, setShowBill] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [paymentRef, setPaymentRef] = useState<string>("");
  const [pointsUsed, setPointsUsed] = useState<number>(0);

  const { data: order, isLoading: orderLoading } = useGetOrderQuery(orderId);
  const { data: orderItems, isLoading: itemsLoading } =
    useGetOrderItemsByOrderQuery(orderId);
  const { data: menus, isLoading: menuLoading } = useGetMenusQuery(
    selectedCategory === "all"
      ? { available_only: true }
      : { available_only: true, category: selectedCategory }
  );
  const [createOrderItem] = useCreateOrderItemMutation();
  const [updateOrderItem] = useUpdateOrderItemMutation();
  const [updateOrderItemStatus] = useUpdateOrderItemStatusMutation();
  const [cancelOrder] = useCancelOrderMutation();
  const [createPayment] = useCreatePaymentMutation();

  const handleAddItem = async (menuItemId: number) => {
    try {
      // Backend handles incrementing quantity if same menu item with ORDERED status exists
      await createOrderItem({
        order_id: orderId,
        menu_item_id: menuItemId,
        quantity: 1,
      }).unwrap();
    } catch (err: any) {
      alert(err?.data?.detail || "Failed to add item");
    }
  };

  const handleQuantityChange = async (
    itemId: number,
    item: any,
    delta: number
  ) => {
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      // Cancel the item instead of setting to 0
      handleCancelItem(itemId);
      return;
    }
    try {
      await updateOrderItem({
        id: itemId,
        data: {
          order_id: orderId,
          menu_item_id: item.menu_item_id,
          quantity: newQty,
        },
      }).unwrap();
    } catch (err: any) {
      alert(err?.data?.detail || "Failed to update quantity");
    }
  };

  const handleStatusChange = async (itemId: number, newStatus: string) => {
    try {
      await updateOrderItemStatus({
        id: itemId,
        status: newStatus,
      }).unwrap();
    } catch (err: any) {
      // Handle insufficient stock error with detailed message
      const detail = err?.data?.detail;
      if (typeof detail === "object" && detail?.insufficient_ingredients) {
        const ingredients = detail.insufficient_ingredients
          .map(
            (ing: any) =>
              `${ing.ingredient_name}: need ${ing.needed}, have ${ing.available}`
          )
          .join("\n");
        alert(`${detail.message}\n\n${ingredients}\n\n${detail.suggestion}`);
      } else {
        alert(detail || "Failed to update status");
      }
    }
  };

  const handleCancelItem = async (itemId: number) => {
    if (!confirm("Cancel this order item?")) return;
    try {
      await updateOrderItemStatus({
        id: itemId,
        status: "CANCELLED",
      }).unwrap();
    } catch (err: any) {
      alert(err?.data?.detail || "Failed to cancel item");
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm("Cancel this entire order?")) return;
    try {
      await cancelOrder(orderId).unwrap();
      router.push("/orders");
    } catch (err: any) {
      alert(err?.data?.detail || "Failed to cancel order");
    }
  };

  const handlePayment = async () => {
    if (!order) return;

    // Validate payment_ref is required for CARD and QR
    if (
      (paymentMethod === "CARD" || paymentMethod === "QR") &&
      !paymentRef.trim()
    ) {
      alert("Payment reference is required for Card and QR Code payments");
      return;
    }

    // Backend will calculate paid_price from order.total_price and points_used
    try {
      await createPayment({
        order_id: orderId,
        // paid_price is optional - backend will calculate from order.total_price and points_used
        points_used: pointsUsed,
        payment_method: paymentMethod,
        payment_ref:
          paymentMethod === "CARD" || paymentMethod === "QR"
            ? paymentRef.trim()
            : null,
      }).unwrap();

      // Reset payment form
      setPaymentMethod("CASH");
      setPaymentRef("");
      setPointsUsed(0);
      setShowPayment(false);
      router.push("/orders");
    } catch (err: any) {
      alert(err?.data?.detail || "Failed to process payment");
    }
  };

  const categories = [
    "all",
    ...new Set(menus?.map((item) => item.category) || []),
  ];

  // Backend filters menus based on category parameter
  const filteredMenus = menus || [];

  // Can only process payment when all items are DONE or CANCELLED, and at least one is DONE
  const canProcessPayment =
    orderItems &&
    orderItems.length > 0 &&
    orderItems.every(
      (item) => item.status === "DONE" || item.status === "CANCELLED"
    ) &&
    orderItems.some((item) => item.status === "DONE");

  // Check if there are items still in progress (ORDERED or PREPARING)
  const hasOrderedItems =
    orderItems?.some((item) => item.status === "ORDERED") || false;
  const hasPreparingItems =
    orderItems?.some((item) => item.status === "PREPARING") || false;

  if (orderLoading || itemsLoading || menuLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading order...</div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-red-500">Order not found</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push("/orders")}
              className="text-blue-600 hover:text-blue-800 mb-2"
            >
              ← Back to Orders
            </button>
            <h1 className="text-3xl font-bold text-gray-800">
              Order #{order.order_id}
            </h1>
            <p className="text-gray-600 mt-1">
              {order.order_type} • {order.status}
            </p>
          </div>
          <div className="flex gap-2">
            {order.status === "UNPAID" && (
              <>
                <button
                  onClick={() => setShowBill(true)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  View Bill
                </button>
                {canProcessPayment ? (
                  <button
                    onClick={() => setShowPayment(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Process Payment
                  </button>
                ) : (
                  <button
                    disabled
                    className="px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed"
                    title={
                      hasOrderedItems
                        ? "Some items are still waiting for chef"
                        : hasPreparingItems
                        ? "Some items are still being prepared"
                        : "No items ready for payment"
                    }
                  >
                    {hasOrderedItems
                      ? "Waiting for Chef..."
                      : hasPreparingItems
                      ? "Preparing..."
                      : "Process Payment"}
                  </button>
                )}
                <button
                  onClick={handleCancelOrder}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Cancel Order
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Selection */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Menu Items
              </h2>

              {/* Category Filter */}
              <div className="mb-4 flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      selectedCategory === category
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>

              {/* Menu Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredMenus?.map((item) => (
                  <div
                    key={item.menu_item_id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-semibold text-gray-800 mb-1">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {item.description || "No description"}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-blue-600">
                        ฿{parseFloat(item.price).toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleAddItem(item.menu_item_id)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Order Items
              </h2>

              {orderItems && orderItems.length > 0 ? (
                <div className="space-y-3">
                  {orderItems.map((item) => (
                    <div
                      key={item.order_item_id}
                      className={`border rounded-lg p-3 ${
                        item.status === "CANCELLED"
                          ? "border-gray-200 bg-gray-50 opacity-60"
                          : item.status === "DONE"
                          ? "border-green-200 bg-green-50"
                          : item.status === "PREPARING"
                          ? "border-yellow-200 bg-yellow-50"
                          : "border-blue-200 bg-blue-50"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">
                            {item.menu_item?.name || "Unknown"}
                          </h4>
                          <p className="text-sm text-gray-600">
                            ฿{parseFloat(item.unit_price).toFixed(2)} each
                          </p>
                          <p className="text-sm font-medium text-gray-800">
                            ฿{parseFloat(item.line_total).toFixed(2)}
                          </p>
                        </div>
                        {/* Quantity controls - only for ORDERED items */}
                        {item.status === "ORDERED" && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleQuantityChange(
                                  item.order_item_id,
                                  item,
                                  -1
                                )
                              }
                              className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-md hover:bg-gray-300 text-lg font-bold"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                handleQuantityChange(
                                  item.order_item_id,
                                  item,
                                  1
                                )
                              }
                              className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-md hover:bg-gray-300 text-lg font-bold"
                            >
                              +
                            </button>
                          </div>
                        )}
                        {/* Just show quantity for non-ORDERED items */}
                        {item.status !== "ORDERED" && (
                          <div className="text-center">
                            <span className="text-lg font-semibold">
                              ×{item.quantity}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Status badge and actions */}
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            item.status === "ORDERED"
                              ? "bg-blue-100 text-blue-700"
                              : item.status === "PREPARING"
                              ? "bg-yellow-100 text-yellow-700"
                              : item.status === "DONE"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {item.status}
                        </span>

                        {/* Status action buttons */}
                        {item.status === "ORDERED" && (
                          <>
                            <button
                              onClick={() =>
                                handleStatusChange(
                                  item.order_item_id,
                                  "PREPARING"
                                )
                              }
                              className="px-2 py-1 text-xs bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                            >
                              Start Preparing
                            </button>
                            <button
                              onClick={() =>
                                handleCancelItem(item.order_item_id)
                              }
                              className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {item.status === "PREPARING" && (
                          <button
                            onClick={() =>
                              handleStatusChange(item.order_item_id, "DONE")
                            }
                            className="px-2 py-1 text-xs bg-green-500 text-white rounded-md hover:bg-green-600"
                          >
                            Mark Done
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No items in this order
                </p>
              )}

              {/* Total */}
              {orderItems && orderItems.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-800">
                      Total:
                    </span>
                    <span className="text-xl font-bold text-blue-600">
                      ฿{parseFloat(order.total_price).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Billing Modal */}
        {showBill && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  ORDER #{order.order_id}
                </h2>
                <p className="text-gray-500">{order.order_type}</p>
              </div>

              <div className="border-t border-b py-4 space-y-2">
                {orderItems
                  ?.filter((item) => item.status !== "CANCELLED")
                  .map((item) => (
                    <div
                      key={item.order_item_id}
                      className="flex justify-between"
                    >
                      <span className="flex-1">
                        {item.quantity}× {item.menu_item?.name}
                      </span>
                      <span className="font-medium">
                        ฿{parseFloat(item.line_total).toFixed(2)}
                      </span>
                    </div>
                  ))}
                {/* Show cancelled items greyed out */}
                {orderItems
                  ?.filter((item) => item.status === "CANCELLED")
                  .map((item) => (
                    <div
                      key={item.order_item_id}
                      className="flex justify-between text-gray-400 line-through"
                    >
                      <span className="flex-1">
                        {item.quantity}× {item.menu_item?.name}
                      </span>
                      <span>฿0.00</span>
                    </div>
                  ))}
              </div>

              <div className="py-4">
                <div className="flex justify-between text-xl font-bold">
                  <span>TOTAL:</span>
                  <span className="text-blue-600">
                    ฿{parseFloat(order.total_price).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowBill(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Close
                </button>
                {canProcessPayment && (
                  <button
                    onClick={() => {
                      setShowBill(false);
                      setShowPayment(true);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Pay ฿{parseFloat(order.total_price).toFixed(2)}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Process Payment
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Amount
                  </label>
                  <div className="text-2xl font-bold text-blue-600">
                    ฿{parseFloat(order.total_price).toFixed(2)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => {
                      setPaymentMethod(e.target.value);
                      // Clear payment_ref when switching away from CARD/QR
                      if (
                        e.target.value !== "CARD" &&
                        e.target.value !== "QR"
                      ) {
                        setPaymentRef("");
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="QR">QR Code</option>
                  </select>
                </div>
                {(paymentMethod === "CARD" || paymentMethod === "QR") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Reference <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      placeholder="Enter transaction reference number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                )}
                {order.membership && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Points to Use (Available:{" "}
                      {order.membership.points_balance})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={order.membership.points_balance}
                      value={pointsUsed}
                      onChange={(e) => setPointsUsed(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPayment(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePayment}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Confirm Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
