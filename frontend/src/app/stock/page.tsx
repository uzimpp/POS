"use client";
import { useState } from "react";
import { Plus, Search, Filter, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { Layout } from "@/components/layout";
import {
  useGetStockQuery,
  useDeleteStockMutation,
  useCreateStockMutation,
  useUpdateStockMutation,
  useGetOutOfStockCountQuery,
  Stock,
  StockCreate,
} from "@/store/api/stockApi";
import { useGetBranchesQuery } from "@/store/api/branchesApi";
import { MultiSelect } from "@/components/forms";
import { StockModal, ConfirmModal } from "@/components/modals";

export default function StockPage() {
  const [selectedBranchIds, setSelectedBranchIds] = useState<
    (number | string)[]
  >([]);
  const [filterOutOfStock, setFilterOutOfStock] = useState<boolean>(false);
  const [showDeleted, setShowDeleted] = useState<boolean>(false);
  const {
    data: stock,
    isLoading,
    error,
  } = useGetStockQuery({
    branch_ids:
      selectedBranchIds.length > 0
        ? (selectedBranchIds as number[])
        : undefined,
    out_of_stock_only: filterOutOfStock,
    is_deleted: showDeleted,
  });
  const { data: outOfStockData } = useGetOutOfStockCountQuery({
    branch_ids:
      selectedBranchIds.length > 0
        ? (selectedBranchIds as number[])
        : undefined,
  });
  const { data: branches } = useGetBranchesQuery();
  const [deleteStockItem] = useDeleteStockMutation();
  const [createStock] = useCreateStockMutation();
  const [updateStock] = useUpdateStockMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | undefined>(
    undefined
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [stockToDelete, setStockToDelete] = useState<number | null>(null);

  const handleCreate = () => {
    setEditingStock(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (item: Stock) => {
    setEditingStock(item);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: StockCreate) => {
    try {
      if (editingStock) {
        await updateStock({ id: editingStock.stock_id, data }).unwrap();
      } else {
        await createStock(data).unwrap();
      }
      setIsModalOpen(false);
    } catch (err) {
      alert(`Failed to ${editingStock ? "update" : "create"} stock item`);
    }
  };

  const handleDeleteClick = (id: number) => {
    setStockToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (stockToDelete !== null) {
      try {
        await deleteStockItem(stockToDelete).unwrap();
        setIsDeleteModalOpen(false);
        setStockToDelete(null);
      } catch (err: any) {
        const errorMessage =
          err?.data?.detail || err?.message || "Failed to delete stock item";
        alert(errorMessage);
        setIsDeleteModalOpen(false);
        setStockToDelete(null);
      }
    }
  };

  const outOfStockCount = outOfStockData?.count || 0;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading stock...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-red-500">Error loading stock</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Stock Inventory
            </h1>
            <p className="text-gray-600 mt-2">Manage your inventory</p>
          </div>
          <div className="flex gap-2 items-center">
            <div className="z-50">
              <MultiSelect
                options={
                  branches?.map((b) => ({
                    value: b.branch_id,
                    label: b.name,
                  })) || []
                }
                selectedValues={selectedBranchIds}
                onChange={setSelectedBranchIds}
                label=""
                placeholder="Filter by Branch"
              />
            </div>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors h-[42px] flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Stock Item
            </button>
          </div>
        </div>

        {outOfStockCount > 0 && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-600 mr-2"
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
              <span className="text-red-800 font-medium">
                {outOfStockCount} item(s) out of stock
              </span>
            </div>
          </div>
        )}

        <div className="mb-4 flex gap-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filterOutOfStock}
              onChange={(e) => setFilterOutOfStock(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">
              Show out of stock only
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm text-gray-700">Show Deleted</span>
            <div
              className="relative inline-block w-10 h-6"
              onClick={() => setShowDeleted(!showDeleted)}
            >
              <div
                className={`block w-10 h-6 rounded-full transition-colors ${showDeleted ? "bg-blue-500" : "bg-gray-300"
                  }`}
              >
                <div
                  className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showDeleted ? "transform translate-x-4" : ""
                    }`}
                ></div>
              </div>
            </div>
          </label>
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
                    Ingredient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount Remaining
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stock && stock.length > 0 ? (
                  stock.map((item) => {
                    const amount = item.amount_remaining;
                    return (
                      <tr key={item.stock_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{item.stock_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.ingredient?.name || "Unknown"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {Number(amount).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.ingredient?.base_unit || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.branch?.name || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <div className="flex gap-4">
                              <Link
                                href="/inventory-analytics"
                                className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 rounded-lg hover:bg-slate-50 transition-colors border border-slate-200 font-medium"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Overview
                              </Link>
                            </div>
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClick(item.stock_id)}
                              className="text-red-600 hover:text-red-900 flex items-center gap-1"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No stock items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <StockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        stockItem={editingStock}
        branches={branches?.filter((b) => !b.is_deleted) || []}
      />
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Stock Item"
        message="Are you sure you want to delete this stock item? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setStockToDelete(null);
        }}
        isDestructive={true}
      />
    </Layout>
  );
}
