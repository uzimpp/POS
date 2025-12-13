"use client";

import { Layout } from "@/components/layout";
import { useGetOrdersQuery } from "@/store/api/ordersApi";
import { useGetMenuItemsQuery } from "@/store/api/menuItemsApi";
import { useGetEmployeesQuery } from "@/store/api/employeesApi";
import { useGetMembershipsQuery } from "@/store/api/membershipsApi";
import { useGetPaymentsQuery } from "@/store/api/paymentsApi";
import { useGetStockQuery } from "@/store/api/stockApi";

function DashboardStats() {
  const { data: orders, isLoading: ordersLoading } = useGetOrdersQuery();
  const { data: menuItems, isLoading: menuLoading } = useGetMenuItemsQuery();
  const { data: employees, isLoading: employeesLoading } =
    useGetEmployeesQuery();
  const { data: memberships, isLoading: membershipsLoading } =
    useGetMembershipsQuery();
  const { data: payments, isLoading: paymentsLoading } = useGetPaymentsQuery();
  const { data: stock, isLoading: stockLoading } = useGetStockQuery();

  if (
    ordersLoading ||
    menuLoading ||
    employeesLoading ||
    membershipsLoading ||
    paymentsLoading ||
    stockLoading
  ) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading dashboard data...</div>
      </div>
    );
  }

  const totalOrders = orders?.length || 0;
  const paidOrders = orders?.filter((o) => o.status === "PAID").length || 0;
  const pendingOrders =
    orders?.filter((o) => o.status === "PENDING").length || 0;
  const totalRevenue =
    payments?.reduce((sum, p) => sum + parseFloat(p.paid_price || "0"), 0) || 0;
  const totalMenuItems = menuItems?.length || 0;
  const availableMenuItems =
    menuItems?.filter((m) => m.is_available).length || 0;
  const totalEmployees = employees?.filter((e) => e.is_active).length || 0;
  const totalMemberships = memberships?.length || 0;
  const lowStockItems =
    stock?.filter((s) => s.amount_remaining < 10).length || 0;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-600 text-sm font-medium mb-2">
                Total Orders
              </h3>
              <p className="text-3xl font-bold text-blue-600">{totalOrders}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            {pendingOrders} pending
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-600 text-sm font-medium mb-2">
                Total Revenue
              </h3>
              <p className="text-3xl font-bold text-green-600">
                ฿{totalRevenue.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            {paidOrders} paid orders
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-600 text-sm font-medium mb-2">
                Menu Items
              </h3>
              <p className="text-3xl font-bold text-purple-600">
                {totalMenuItems}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            {availableMenuItems} available
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-600 text-sm font-medium mb-2">
                Memberships
              </h3>
              <p className="text-3xl font-bold text-orange-600">
                {totalMemberships}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <svg
                className="w-6 h-6 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">Active members</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Employees</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {totalEmployees}
              </p>
              <p className="text-sm text-gray-500 mt-1">Active employees</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-full">
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-6.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Stock Alert</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-red-600">{lowStockItems}</p>
              <p className="text-sm text-gray-500 mt-1">Items running low</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Home() {
  return (
    <Layout>
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-2">Overview of your POS system</p>
        </div>
        <DashboardStats />
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Welcome to POS System
          </h2>
          <p className="text-gray-600">
            This is a Point of Sale system for managing a curry rice restaurant.
            Use the sidebar navigation to access different sections of the
            system.
          </p>
        </div>
      </div>
    </Layout>
  );
}
