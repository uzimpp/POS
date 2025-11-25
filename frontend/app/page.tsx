"use client";

import { Layout } from "../src/components/Layout";
import { useGetOrdersQuery } from "../src/store/api/ordersApi";
import { useGetMenuItemsQuery } from "../src/store/api/menuItemsApi";

function DashboardStats() {
  const { data: orders, isLoading: ordersLoading } = useGetOrdersQuery();
  const { data: menuItems, isLoading: menuLoading } = useGetMenuItemsQuery();

  if (ordersLoading || menuLoading) {
    return <div>Loading...</div>;
  }

  const totalOrders = orders?.length || 0;
  const paidOrders = orders?.filter((o) => o.status === "PAID").length || 0;
  const totalMenuItems = menuItems?.length || 0;
  const availableMenuItems =
    menuItems?.filter((m) => m.is_available).length || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-gray-600 text-sm font-medium mb-2">Total Orders</h3>
        <p className="text-3xl font-bold text-blue-600">{totalOrders}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-gray-600 text-sm font-medium mb-2">Paid Orders</h3>
        <p className="text-3xl font-bold text-green-600">{paidOrders}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-gray-600 text-sm font-medium mb-2">
          Total Menu Items
        </h3>
        <p className="text-3xl font-bold text-purple-600">{totalMenuItems}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-gray-600 text-sm font-medium mb-2">
          Available Items
        </h3>
        <p className="text-3xl font-bold text-orange-600">
          {availableMenuItems}
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <DashboardStats />
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4">Welcome to POS System</h2>
          <p className="text-gray-600">
            This is a Point of Sale system for managing a curry rice restaurant.
            Use the navigation menu to access different sections.
          </p>
        </div>
      </div>
    </Layout>
  );
}
