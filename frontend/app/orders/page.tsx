"use client";

import { Layout } from "../../src/components/Layout";
import {
  useGetOrdersQuery,
  useDeleteOrderMutation,
} from "../../src/store/api/ordersApi";
import { useCreatePaymentMutation } from "../../src/store/api/paymentsApi";
import { useGetMenuItemsQuery } from "../../src/store/api/menuItemsApi";
import { useState } from "react";

export default function OrdersPage() {
  const { data: orders, isLoading, refetch } = useGetOrdersQuery();
  const { data: menuItems } = useGetMenuItemsQuery();
  const [createPayment] = useCreatePaymentMutation();
  const [deleteOrder] = useDeleteOrderMutation();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handlePay = async (orderId: number, totalPrice: number) => {
    const paidPrice = (totalPrice * 1.07).toFixed(2);
    try {
      await createPayment({
        order_id: orderId,
        paid_price: paidPrice,
        points_used: 0,
        payment_method: "CASH",
      }).unwrap();
      refetch();
    } catch (error) {
      console.error("Failed to pay order:", error);
    }
  };

  const handleDelete = async (orderId: number) => {
    if (confirm("Are you sure you want to delete this order?")) {
      try {
        await deleteOrder(orderId).unwrap();
        refetch();
      } catch (error) {
        console.error("Failed to delete order:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div>Loading orders...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Orders</h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {showCreateForm ? "Cancel" : "Create New Order"}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                  Paid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders?.map((order) => (
                <tr key={order.order_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm border">
                    {order.order_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm border">
                    {order.order_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm border">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        order.status === "PAID"
                          ? "bg-green-100 text-green-800"
                          : order.status === "CANCELLED"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm border">
                    {order.membership?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm border">
                    ฿{parseFloat(order.total_price).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm border">
                    {order.payment
                      ? `฿${parseFloat(order.payment.paid_price).toFixed(2)}`
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm border">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm border">
                    <div className="flex gap-2">
                      {order.status === "UNPAID" && (
                        <button
                          onClick={() =>
                            handlePay(
                              order.order_id,
                              parseFloat(order.total_price)
                            )
                          }
                          className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                        >
                          Pay
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(order.order_id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
