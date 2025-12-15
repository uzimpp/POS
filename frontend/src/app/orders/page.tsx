"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/layout";
import {
  useGetOrdersQuery,
  useCreateEmptyOrderMutation,
  OrderFilters,
} from "@/store/api/ordersApi";
import { useGetBranchesQuery } from "@/store/api/branchesApi";
import { useGetEmployeesQuery } from "@/store/api/employeesApi";

export default function OrdersPage() {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterOrderType, setFilterOrderType] = useState<string>("all");
  const [filterMinTotal, setFilterMinTotal] = useState<string>("");
  const [filterCreatedFrom, setFilterCreatedFrom] = useState<string>("");
  const [filterCreatedTo, setFilterCreatedTo] = useState<string>("");
  const [filterBranchId, setFilterBranchId] = useState<string>("");
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>("");
  const [filterMembershipId, setFilterMembershipId] = useState<string>("");

  // Build filters object
  const filters: OrderFilters | undefined = (() => {
    const filterObj: OrderFilters = {};
    if (filterStatus !== "all") {
      filterObj.status = filterStatus;
    }
    if (filterOrderType !== "all") {
      filterObj.order_type = filterOrderType;
    }
    if (filterMinTotal) {
      filterObj.min_total = filterMinTotal;
    }
    if (filterCreatedFrom) {
      filterObj.created_from = filterCreatedFrom;
    }
    if (filterCreatedTo) {
      filterObj.created_to = filterCreatedTo;
    }
    if (filterBranchId) {
      filterObj.branch_id = Number(filterBranchId);
    }
    if (filterEmployeeId) {
      filterObj.employee_id = Number(filterEmployeeId);
    }
    if (filterMembershipId) {
      filterObj.membership_id = Number(filterMembershipId);
    }
    return Object.keys(filterObj).length > 0 ? filterObj : undefined;
  })();

  const { data: orders, isLoading, error } = useGetOrdersQuery(filters);
  const { data: branches } = useGetBranchesQuery();
  const { data: employees } = useGetEmployeesQuery();
  const [createEmptyOrder] = useCreateEmptyOrderMutation();
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null
  );
  const [orderType, setOrderType] = useState<string>("DINE_IN");

  const handleTakeOrder = async () => {
    if (!selectedBranchId || !selectedEmployeeId) {
      alert("Please select both branch and employee");
      return;
    }

    try {
      const order = await createEmptyOrder({
        branch_id: selectedBranchId,
        employee_id: selectedEmployeeId,
        order_type: orderType,
      }).unwrap();
      router.push(`/orders/${order.order_id}`);
    } catch (err: any) {
      alert(err?.data?.detail || "Failed to create order");
    }
  };

  // Filter employees by selected branch
  const availableEmployees = selectedBranchId
    ? employees?.filter(
        (emp) => emp.branch_id === selectedBranchId && !emp.is_deleted
      )
    : [];

  // Backend filters orders based on status parameter
  const filteredOrders = orders || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PAID: "bg-green-100 text-green-800",
      PENDING: "bg-yellow-100 text-yellow-800",
      CANCELLED: "bg-red-100 text-red-800",
      COMPLETED: "bg-blue-100 text-blue-800",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading orders...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-red-500">Error loading orders</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Orders</h1>
              <p className="text-gray-600 mt-2">Manage and view all orders</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="UNPAID">Unpaid</option>
                  <option value="PAID">Paid</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Type
                </label>
                <select
                  value={filterOrderType}
                  onChange={(e) => setFilterOrderType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="DINE_IN">Dine In</option>
                  <option value="TAKEAWAY">Takeaway</option>
                  <option value="DELIVERY">Delivery</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {"Min Total (>=)"}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={filterMinTotal}
                  onChange={(e) => setFilterMinTotal(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 1000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch
                </label>
                <select
                  value={filterBranchId}
                  onChange={(e) => setFilterBranchId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Branches</option>
                  {branches?.map((b) => (
                    <option key={b.branch_id} value={b.branch_id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee
                </label>
                <select
                  value={filterEmployeeId}
                  onChange={(e) => setFilterEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Employees</option>
                  {employees?.map((emp) => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      {emp.first_name} {emp.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Membership ID
                </label>
                <input
                  type="number"
                  value={filterMembershipId}
                  onChange={(e) => setFilterMembershipId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Created From
                </label>
                <input
                  type="date"
                  value={filterCreatedFrom}
                  onChange={(e) => setFilterCreatedFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Created To
                </label>
                <input
                  type="date"
                  value={filterCreatedTo}
                  onChange={(e) => setFilterCreatedTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Take Order Section */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Take New Order
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch *
                </label>
                <select
                  value={selectedBranchId || ""}
                  onChange={(e) => {
                    setSelectedBranchId(
                      e.target.value ? Number(e.target.value) : null
                    );
                    setSelectedEmployeeId(null); // Reset employee when branch changes
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Branch</option>
                  {branches
                    ?.filter((b) => !b.is_deleted)
                    .map((branch) => (
                      <option key={branch.branch_id} value={branch.branch_id}>
                        {branch.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee *
                </label>
                <select
                  value={selectedEmployeeId || ""}
                  onChange={(e) =>
                    setSelectedEmployeeId(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  disabled={!selectedBranchId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select Employee</option>
                  {availableEmployees?.map((employee) => (
                    <option
                      key={employee.employee_id}
                      value={employee.employee_id}
                    >
                      {employee.first_name} {employee.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Type
                </label>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="DINE_IN">Dine In</option>
                  <option value="TAKEAWAY">Takeaway</option>
                  <option value="DELIVERY">Delivery</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleTakeOrder}
                  disabled={!selectedBranchId || !selectedEmployeeId}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Take Order
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Membership
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders && filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order.order_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.order_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.membership?.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.employee
                          ? `${order.employee.first_name} ${order.employee.last_name}`
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.order_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ฿{parseFloat(order.payment?.paid_price ?? order.total_price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() =>
                            router.push(`/orders/${order.order_id}`)
                          }
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
