"use client";

import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useGetMenuItemsQuery,
  useDeleteMenuItemMutation,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  MenuItem,
} from "@/store/api/menuItemsApi";
import { ConfirmModal, MenuItemModal } from "@/components/modals";

export default function MenuItemsPage() {
  const { data: menuItems, isLoading, error } = useGetMenuItemsQuery();
  const [deleteMenuItem] = useDeleteMenuItemMutation();
  const [createMenuItem] = useCreateMenuItemMutation();
  const [updateMenuItem] = useUpdateMenuItemMutation();
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterAvailable, setFilterAvailable] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  const [deleteItemName, setDeleteItemName] = useState<string>("");
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);

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

  const handleEdit = (item: MenuItem) => {
    setEditingMenuItem(item);
    setShowModal(true);
  };

  const handleCreate = async (data: any) => {
    await createMenuItem(data).unwrap();
  };

  const handleUpdate = async (data: any) => {
    if (editingMenuItem) {
      await updateMenuItem({
        id: editingMenuItem.menu_item_id,
        data,
      }).unwrap();
    }
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
      <MenuItemModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingMenuItem(null);
        }}
        onSubmit={editingMenuItem ? handleUpdate : handleCreate}
        menuItem={editingMenuItem}
      />
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Menu Items</h1>
            <p className="text-gray-600 mt-2">Manage your restaurant menu</p>
          </div>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => {
              setEditingMenuItem(null);
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
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs whitespace-normal wrap-break-word">
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
