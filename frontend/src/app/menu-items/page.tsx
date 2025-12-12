"use client";

import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useGetMenuItemsQuery,
  useDeleteMenuItemMutation,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
} from "@/store/api/menuItemsApi";
import { ConfirmModal, Modal } from "@/components/modals";

export default function MenuItemsPage() {
  const { data: menuItems, isLoading, error } = useGetMenuItemsQuery();
  const [deleteMenuItem] = useDeleteMenuItemMutation();
  const [createMenuItem] = useCreateMenuItemMutation();
  const [updateMenuItem] = useUpdateMenuItemMutation();
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterAvailable, setFilterAvailable] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  const [deleteItemName, setDeleteItemName] = useState<string>("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "",
    description: "",
    price: "",
    category: "",
    is_available: true,
  });

  const handleDelete = (id: number, name: string) => {
    setDeleteItemId(id);
    setDeleteItemName(name);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (deleteItemId !== null) {
      try {
        await deleteMenuItem(deleteItemId).unwrap();
        setShowDeleteModal(false);
        setDeleteItemId(null);
        setDeleteItemName("");
      } catch (err) {
        alert("Failed to delete menu item");
      }
    }
  };

  const handleEdit = (item: any) => {
    setForm({
      name: item.name,
      type: item.type,
      description: item.description || "",
      price: item.price,
      category: item.category,
      is_available: item.is_available,
    });
    setEditingId(item.menu_item_id);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId !== null) {
      await updateMenuItem({
        id: editingId,
        data: form,
      });
      setShowEditModal(false);
      setEditingId(null);
      setForm({
        name: "",
        type: "",
        description: "",
        price: "",
        category: "",
        is_available: true,
      });
    }
  };

  // Ensure price input stays within allowed range and at most 2 decimal places
  const handlePriceChange = (value: string) => {
    if (value === "") {
      setForm((f) => ({ ...f, price: "" }));
      return;
    }

    let v = value;
    // If user types .5 -> convert to 0.5
    if (v.startsWith(".")) v = "0" + v;
    // Remove invalid characters (allow digits and dot only)
    v = v.replace(/[^0-9.]/g, "");
    const parts = v.split(".");
    let intPart = parts[0] || "0";
    let decPart = parts[1] || "";

    // Limit integer digits to 6 (max 999999)
    if (intPart.length > 6) {
      intPart = intPart.slice(0, 6);
    }
    // Clamp numeric value
    if (Number(intPart) > 999999) {
      intPart = "999999";
    }

    // Limit decimals to 2 digits
    decPart = decPart.slice(0, 2);

    const newVal = decPart ? `${intPart}.${decPart}` : intPart;
    setForm((f) => ({ ...f, price: newVal }));
  };

  const categories = Array.from(
    new Set(menuItems?.map((item) => item.category) || [])
  );

  const filteredItems = menuItems?.filter((item) => {
    const categoryMatch =
      filterCategory === "all" || item.category === filterCategory;

    const availableMatch =
      filterAvailable === "all" ||
      (filterAvailable === "available" && item.is_available) ||
      (filterAvailable === "unavailable" && !item.is_available);

    const query = searchTerm.trim().toLowerCase();

    const searchMatch =
      query === "" ||
      item.name.toLowerCase().includes(query) ||
      String(item.menu_item_id).includes(query);

    return categoryMatch && availableMatch && searchMatch;
  });

  const sortedItems = filteredItems
    ? [...filteredItems].sort((a, b) => {
        // First: Available (true) before Unavailable (false)
        if (a.is_available !== b.is_available) {
          return a.is_available ? -1 : 1;
        }
        // If both have same availability, sort by ID ascending
        return a.menu_item_id - b.menu_item_id;
      })
    : [];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading menu items...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-red-500">Error loading menu items</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Menu Item"
        message={`Are you sure you want to delete "${deleteItemName}"? This action cannot be undone. You will have to re-enter the information of this menu again if you wish to add it back.`}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        isDestructive={true}
      />
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setForm({
            name: "",
            type: "",
            description: "",
            price: "",
            category: "",
            is_available: true,
          });
        }}
        title="Add New Menu Item"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await createMenuItem(form);
            setShowModal(false);
            setForm({
              name: "",
              type: "",
              description: "",
              price: "",
              category: "",
              is_available: true,
            });
          }}
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  name: e.target.value.slice(0, 50),
                }))
              }
              required
              maxLength={50}
            />
            <p className="text-gray-400 text-xs mt-1">
              {form.name.length}/50 characters
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={form.type}
              onChange={(e) => {
                const newType = e.target.value;
                setForm((f) => ({
                  ...f,
                  type: newType,
                  // Set available to true by default, especially for Set type
                  is_available: newType === "Set" ? true : f.is_available,
                }));
              }}
              required
            >
              <option value="" className="text-gray-400">
                Select Type
              </option>
              <option value="Dish">Dish</option>
              <option value="Addon">Addon</option>
              <option value="Set">Set</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="block mb-1">Category</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
              required
            >
              <option value="" className="text-gray-400">
                Select Category
              </option>
              <option value="Main">Main</option>
              <option value="Topping">Topping</option>
              <option value="Drink">Drink</option>
              <option value="Appetizer">Appetizer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price
              <span className="ml-1 text-xs text-gray-500 font-normal">
                (0–999999, up to 2 decimals)
              </span>
            </label>
            <input
              type="number"
              min="0"
              max="999999"
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={form.price}
              onChange={(e) => handlePriceChange(e.target.value)}
              placeholder="e.g. 199.99"
              required
            />
            <p className="text-gray-400 text-xs mt-1">
              Price must be between <span className="font-bold">0</span> and{" "}
              <span className="font-bold">999999</span>, with at most{" "}
              <span className="font-bold">2 decimal places</span>.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  description: e.target.value.slice(0, 300),
                }))
              }
              maxLength={300}
            />
            <p className="text-gray-400 text-xs mt-1">
              {form.description.length}/300 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={form.is_available ? "available" : "unavailable"}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  is_available: e.target.value === "available",
                }))
              }
              disabled={form.type === "Set"}
            >
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
            {form.type === "Set" && (
              <p className="text-gray-500 text-xs mt-1">
                Set items are always available by default.
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Item
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingId(null);
          setForm({
            name: "",
            type: "",
            description: "",
            price: "",
            category: "",
            is_available: true,
          });
        }}
        title="Edit Menu Item"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  name: e.target.value.slice(0, 50),
                }))
              }
              required
              maxLength={50}
            />
            <p className="text-gray-400 text-xs mt-1">
              {form.name.length}/50 characters
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={form.type}
              onChange={(e) => {
                const newType = e.target.value;
                setForm((f) => ({
                  ...f,
                  type: newType,
                  // Set available to true by default, especially for Set type
                  is_available: newType === "Set" ? true : f.is_available,
                }));
              }}
              required
            >
              <option value="" className="text-gray-400">
                Select Type
              </option>
              <option value="Dish">Dish</option>
              <option value="Addon">Addon</option>
              <option value="Set">Set</option>
            </select>
          </div>
          {form.type === "Set" && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Set items are automatically set as
                available by default.
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
              required
            >
              <option value="" className="text-gray-400">
                Select Category
              </option>
              <option value="Main">Main</option>
              <option value="Topping">Topping</option>
              <option value="Drink">Drink</option>
              <option value="Appetizer">Appetizer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price
              <span className="ml-1 text-xs text-gray-500 font-normal">
                (0–999999, up to 2 decimals)
              </span>
            </label>
            <input
              type="number"
              min="0"
              max="999999"
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={form.price}
              onChange={(e) => handlePriceChange(e.target.value)}
              placeholder="e.g. 199.99"
              required
            />
            <p className="text-gray-400 text-xs mt-1">
              Price must be between <span className="font-bold">0</span> and{" "}
              <span className="font-bold">999999</span>, with at most{" "}
              <span className="font-bold">2 decimal places</span>.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  description: e.target.value.slice(0, 300),
                }))
              }
              maxLength={300}
            />
            <p className="text-gray-400 text-xs mt-1">
              {form.description.length}/300 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={form.is_available ? "available" : "unavailable"}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  is_available: e.target.value === "available",
                }))
              }
              disabled={form.type === "Set"}
            >
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
            {form.type === "Set" && (
              <p className="text-gray-500 text-xs mt-1">
                Set items are always available by default.
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Menu Items</h1>
            <p className="text-gray-600 mt-2">Manage your restaurant menu</p>
          </div>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => {
              setForm({
                name: "",
                type: "",
                description: "",
                price: "",
                category: "",
                is_available: true, // Default to available for all new items
              });
              setShowModal(true);
            }}
          >
            Add Menu Item
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={filterAvailable}
            onChange={(e) => setFilterAvailable(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Items</option>
            <option value="available">Available Only</option>
            <option value="unavailable">Unavailable Only</option>
          </select>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID or name"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 max-w-xs"
          />
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
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
                {sortedItems && sortedItems.length > 0 ? (
                  sortedItems.map((item) => (
                    <tr
                      key={item.menu_item_id}
                      className={`hover:bg-gray-50 ${
                        item.is_available ? "" : "opacity-50"
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{item.menu_item_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ฿{parseFloat(item.price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs whitespace-normal break-words">
                        {item.description || "N/A"}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() =>
                            updateMenuItem({
                              id: item.menu_item_id,
                              data: {
                                ...item,
                                is_available: !item.is_available,
                              },
                            })
                          }
                          className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                            item.is_available
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                        >
                          {item.is_available ? "Available" : "Unavailable"}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(item.menu_item_id, item.name)
                            }
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No menu items found
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
