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
      // Check if an order item with this menu_item_id already exists and is not cancelled
      const existingItem = orderItems?.find(
        (item) =>
          item.menu_item_id === menuItemId && item.status !== "CANCELLED"
      );

      if (existingItem) {
        // Increment quantity of existing item
        await updateOrderItem({
          id: existingItem.order_item_id,
          data: {
            order_id: orderId,
            menu_item_id: menuItemId,
            quantity: existingItem.quantity + 1,
            status: existingItem.status, // Keep the current status
          },
        }).unwrap();
      } else {
        // Create new order item
        await createOrderItem({
          order_id: orderId,
          menu_item_id: menuItemId,
          quantity: 1,
          status: "PREPARING",
        }).unwrap();
      }
    } catch (err: any) {
      alert(err?.data?.detail || "Failed to add item");
    }
  };

  const handleStatusChange = async (itemId: number, newStatus: string) => {
    try {
      await updateOrderItemStatus({
        id: itemId,
        status: newStatus,
      }).unwrap();
      // The order should be automatically refetched due to invalidation
    } catch (err: any) {
      alert(err?.data?.detail || "Failed to update status");
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

    // Backend will calculate paid_price from order.total_price and points_used
    // We can pass null or omit paid_price, but for now we'll pass it for validation
    // The backend will recalculate and validate it
    try {
      await createPayment({
        order_id: orderId,
        // paid_price is optional - backend will calculate from order.total_price and points_used
        points_used: pointsUsed,
        payment_method: paymentMethod,
        payment_ref: null,
      }).unwrap();
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

  const canProcessPayment =
    orderItems &&
    orderItems.length > 0 &&
    orderItems.every(
      (item) => item.status === "DONE" || item.status === "CANCELLED"
    );

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
                {canProcessPayment && (
                  <button
                    onClick={() => setShowPayment(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Process Payment
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
                      className="border border-gray-200 rounded-lg p-3"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">
                            {item.menu_item?.name || "Unknown"}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Qty: {item.quantity} × ฿
                            {parseFloat(item.unit_price).toFixed(2)}
                          </p>
                          <p className="text-sm font-medium text-gray-800">
                            ฿{parseFloat(item.line_total).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={item.status}
                          onChange={(e) =>
                            handleStatusChange(
                              item.order_item_id,
                              e.target.value
                            )
                          }
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="PREPARING">Preparing</option>
                          <option value="DONE">Done</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                        {item.status === "PREPARING" && (
                          <button
                            onClick={() => handleCancelItem(item.order_item_id)}
                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                          >
                            Cancel
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

        {/* Bill Modal */}
        {showBill && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Bill</h2>
              <div className="space-y-2 mb-4">
                {orderItems
                  ?.filter((item) => item.status !== "CANCELLED")
                  .map((item) => (
                    <div
                      key={item.order_item_id}
                      className="flex justify-between text-sm"
                    >
                      <span>
                        {item.menu_item?.name} × {item.quantity}
                      </span>
                      <span>฿{parseFloat(item.line_total).toFixed(2)}</span>
                    </div>
                  ))}
              </div>
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total:</span>
                <span>฿{parseFloat(order.total_price).toFixed(2)}</span>
              </div>
              <button
                onClick={() => setShowBill(false)}
                className="mt-4 w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Close
              </button>
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
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="QR">QR Code</option>
                  </select>
                </div>
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
