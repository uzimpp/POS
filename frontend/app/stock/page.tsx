"use client";

import { Layout } from "../../src/components/Layout";
import {
  useGetStockQuery,
  useCreateStockItemMutation,
  useUpdateStockItemMutation,
  useDeleteStockItemMutation,
} from "../../src/store/api/stockApi";
import { useState } from "react";

export default function StockPage() {
  const { data: stock, isLoading, refetch } = useGetStockQuery();
  const [createStockItem] = useCreateStockItemMutation();
  const [updateStockItem] = useUpdateStockItemMutation();
  const [deleteStockItem] = useDeleteStockItemMutation();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    stk_name: "",
    amount_remaining: "",
    unit: "g",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateStockItem({ id: editingId, data: formData }).unwrap();
        setEditingId(null);
      } else {
        await createStockItem(formData).unwrap();
      }
      setFormData({ stk_name: "", amount_remaining: "", unit: "g" });
      refetch();
    } catch (error) {
      console.error("Failed to save stock item:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this stock item?")) {
      try {
        await deleteStockItem(id).unwrap();
        refetch();
      } catch (error) {
        console.error("Failed to delete stock item:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div>Loading stock...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold mb-6">Stock Management</h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow border mb-6"
        >
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? "Edit" : "Create"} Stock Item
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={formData.stk_name}
                onChange={(e) =>
                  setFormData({ ...formData, stk_name: e.target.value })
                }
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Amount Remaining
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount_remaining}
                onChange={(e) =>
                  setFormData({ ...formData, amount_remaining: e.target.value })
                }
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unit</label>
              <select
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                className="w-full px-3 py-2 border rounded"
              >
                <option value="g">g (grams)</option>
                <option value="ml">ml (milliliters)</option>
                <option value="piece">piece</option>
                <option value="kg">kg (kilograms)</option>
                <option value="l">l (liters)</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {editingId ? "Update" : "Create"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    stk_name: "",
                    amount_remaining: "",
                    unit: "g",
                  });
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                  Amount Remaining
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                  Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stock?.map((item) => (
                <tr key={item.stock_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm border">
                    {item.stock_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm border">
                    {item.stk_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm border">
                    {parseFloat(item.amount_remaining).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm border">
                    {item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm border">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingId(item.stock_id);
                          setFormData({
                            stk_name: item.stk_name,
                            amount_remaining: item.amount_remaining,
                            unit: item.unit,
                          });
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.stock_id)}
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
