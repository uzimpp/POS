"use client";

import { Layout } from "../../src/components/Layout";
import {
  useGetMenuItemsQuery,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useDeleteMenuItemMutation,
} from "../../src/store/api/menuItemsApi";
import { useState } from "react";

export default function MenuItemsPage() {
  const { data: menuItems, isLoading, refetch } = useGetMenuItemsQuery();
  const [createMenuItem] = useCreateMenuItemMutation();
  const [updateMenuItem] = useUpdateMenuItemMutation();
  const [deleteMenuItem] = useDeleteMenuItemMutation();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "dish",
    description: "",
    price: "",
    category: "Main",
    is_available: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateMenuItem({ id: editingId, data: formData }).unwrap();
        setEditingId(null);
      } else {
        await createMenuItem(formData).unwrap();
      }
      setFormData({
        name: "",
        type: "dish",
        description: "",
        price: "",
        category: "Main",
        is_available: true,
      });
      refetch();
    } catch (error) {
      console.error("Failed to save menu item:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this menu item?")) {
      try {
        await deleteMenuItem(id).unwrap();
        refetch();
      } catch (error) {
        console.error("Failed to delete menu item:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div>Loading menu items...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold mb-6">Menu Items</h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow border mb-6"
        >
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? "Edit" : "Create"} Menu Item
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full px-3 py-2 border rounded"
              >
                <option value="dish">Dish</option>
                <option value="addon">Addon</option>
                <option value="set">Set</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-3 py-2 border rounded"
              >
                <option value="Main">Main</option>
                <option value="Topping">Topping</option>
                <option value="Drink">Drink</option>
                <option value="Appetizer">Appetizer</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border rounded"
                rows={2}
              />
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_available}
                  onChange={(e) =>
                    setFormData({ ...formData, is_available: e.target.checked })
                  }
                />
                Available
              </label>
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
                    name: "",
                    type: "dish",
                    description: "",
                    price: "",
                    category: "Main",
                    is_available: true,
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
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                  Available
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {menuItems?.map((item) => (
                <tr key={item.menu_item_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm border">
                    {item.menu_item_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm border">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm border">
                    {item.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm border">
                    {item.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm border">
                    ฿{parseFloat(item.price).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm border">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        item.is_available
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {item.is_available ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm border">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingId(item.menu_item_id);
                          setFormData({
                            name: item.name,
                            type: item.type,
                            description: item.description || "",
                            price: item.price,
                            category: item.category,
                            is_available: item.is_available,
                          });
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.menu_item_id)}
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
