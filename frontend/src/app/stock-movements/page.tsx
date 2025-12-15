"use client";

import Link from "next/link";
import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useGetStockMovementsQuery,
  useCreateStockMovementMutation,
  useGetStockQuery,
  StockMovementCreate,
} from "@/store/api/stockApi";
import { useGetBranchesQuery } from "@/store/api/branchesApi";
import { useGetEmployeesQuery } from "@/store/api/employeesApi";

export default function StockMovementsPage() {
  const [filterBranchId, setFilterBranchId] = useState<number | undefined>(
    undefined
  );
  const [filterReason, setFilterReason] = useState<string>("all");
  const [filterIngredientId, setFilterIngredientId] = useState<
    number | undefined
  >(undefined);
  const [filterEmployeeId, setFilterEmployeeId] = useState<number | undefined>(
    undefined
  );
  const [filterQtyMin, setFilterQtyMin] = useState<string>("");
  const [filterQtyMax, setFilterQtyMax] = useState<string>("");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: movements, isLoading } = useGetStockMovementsQuery({
    branch_id: filterBranchId,
    reason: filterReason === "all" ? undefined : filterReason,
    ingredient_id: filterIngredientId,
    employee_id: filterEmployeeId,
    qty_min: filterQtyMin ? Number(filterQtyMin) : undefined,
    qty_max: filterQtyMax ? Number(filterQtyMax) : undefined,
    created_from: filterDateFrom || undefined,
    created_to: filterDateTo || undefined,
  });
  const { data: branches } = useGetBranchesQuery({ is_deleted: false });
  const { data: allStock } = useGetStockQuery({ is_deleted: false });
  const { data: employees } = useGetEmployeesQuery();
  const [createMovement] = useCreateStockMovementMutation();

  const [formData, setFormData] = useState<StockMovementCreate>({
    stock_id: 0,
    qty_change: 0,
    reason: "RESTOCK",
    note: "",
  });
  const [qtyInput, setQtyInput] = useState<string>("0");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedQty = parseFloat(qtyInput);
      if (isNaN(parsedQty)) {
        alert("Quantity is required and must be a number");
        return;
      }

      const adjustedData = {
        ...formData,
        qty_change:
          formData.reason === "WASTE" ? -Math.abs(parsedQty) : parsedQty,
      };
      await createMovement(adjustedData).unwrap();
      setIsModalOpen(false);
      setFormData({ stock_id: 0, qty_change: 0, reason: "RESTOCK", note: "" });
      setQtyInput("0");
    } catch (err: any) {
      alert(err?.data?.detail || "Failed to create movement");
    }
  };

  const filteredMovements =
    movements?.filter(
      (m) => filterReason === "all" || m.reason === filterReason
    ) || [];

  const getReasonBadgeColor = (reason: string) => {
    switch (reason) {
      case "RESTOCK":
        return "bg-green-100 text-green-800";
      case "SALE":
        return "bg-blue-100 text-blue-800";
      case "WASTE":
        return "bg-red-100 text-red-800";
      case "ADJUST":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get stock items filtered by selected branch
  const stockForBranch = filterBranchId
    ? allStock?.filter((s) => s.branch_id === filterBranchId)
    : allStock;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading stock movements...</div>
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
              Stock Movements
            </h1>
            <p className="text-gray-600 mt-2">
              Track all stock changes across branches
            </p>
            <div className="flex gap-4 mt-4">
              <Link
                href="/inventory-analytics"
                className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 rounded-lg hover:bg-slate-50 transition-colors border border-slate-200 font-medium"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Overview
              </Link>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Movement
              </button>
            </div>
          </div>
          <button
            onClick={() => {
              setFormData({
                stock_id: 0,
                qty_change: 0,
                reason: "RESTOCK",
                note: "",
              });
              setQtyInput("0");
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Movement
          </button>
        </div>

        {/* Filters */}
        <div className="mb-2 text-sm text-gray-600 font-semibold">Filters</div>
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <select
            value={filterBranchId || ""}
            onChange={(e) =>
              setFilterBranchId(
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Branches</option>
            {branches?.map((branch) => (
              <option key={branch.branch_id} value={branch.branch_id}>
                {branch.name}
              </option>
            ))}
          </select>
          <select
            value={filterReason}
            onChange={(e) => setFilterReason(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="all">All Types</option>
            <option value="RESTOCK">Restock</option>
            <option value="SALE">Sale</option>
            <option value="WASTE">Waste</option>
            <option value="ADJUST">Adjust</option>
          </select>
          <select
            value={filterIngredientId || ""}
            onChange={(e) =>
              setFilterIngredientId(
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Ingredients</option>
            {Object.values(
              (allStock || []).reduce<
                Record<number, { id: number; name: string }>
              >((acc, s) => {
                if (s.ingredient) {
                  const id = s.ingredient.ingredient_id;
                  if (!acc[id]) {
                    acc[id] = { id, name: s.ingredient.name };
                  }
                }
                return acc;
              }, {})
            ).map((ing) => (
              <option key={ing.id} value={ing.id}>
                {ing.name}
              </option>
            ))}
          </select>
          <select
            value={filterEmployeeId || ""}
            onChange={(e) =>
              setFilterEmployeeId(
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Employees</option>
            {employees?.map((emp) => (
              <option key={emp.employee_id} value={emp.employee_id}>
                {emp.first_name} {emp.last_name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
            placeholder="From date"
          />
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
            placeholder="To date"
          />
          <input
            type="number"
            step="0.01"
            value={filterQtyMin}
            onChange={(e) => setFilterQtyMin(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
            placeholder="Qty min"
          />
          <input
            type="number"
            step="0.01"
            value={filterQtyMax}
            onChange={(e) => setFilterQtyMax(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
            placeholder="Qty max"
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-600 text-sm font-medium">Restocks</div>
            <div className="text-2xl font-bold text-green-700">
              {filteredMovements.filter((m) => m.reason === "RESTOCK").length}
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-blue-600 text-sm font-medium">Sales</div>
            <div className="text-2xl font-bold text-blue-700">
              {filteredMovements.filter((m) => m.reason === "SALE").length}
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-600 text-sm font-medium">Waste</div>
            <div className="text-2xl font-bold text-red-700">
              {filteredMovements.filter((m) => m.reason === "WASTE").length}
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-yellow-600 text-sm font-medium">
              Adjustments
            </div>
            <div className="text-2xl font-bold text-yellow-700">
              {filteredMovements.filter((m) => m.reason === "ADJUST").length}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Branch
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ingredient
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Change
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Unit
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Reason
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Employee
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Note
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMovements.map((m) => (
                  <tr key={m.movement_id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{m.movement_id}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(m.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {m.stock?.branch?.name || "-"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {m.stock?.ingredient?.name || "Unknown"}
                    </td>
                    <td
                      className={`px - 4 py - 4 whitespace - nowrap text - sm font - semibold text - right ${
                        Number(m.qty_change) >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      } `}
                    >
                      {Number(m.qty_change) >= 0 ? "+" : ""}
                      {Number(m.qty_change).toFixed(2)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {m.stock?.ingredient?.base_unit || "-"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span
                        className={`px - 2 py - 1 rounded - full text - xs font - medium ${getReasonBadgeColor(
                          m.reason
                        )} `}
                      >
                        {m.reason}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {m.employee
                        ? `${m.employee.first_name} ${m.employee.last_name} `
                        : "-"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {m.order_id ? `#${m.order_id} ` : "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {m.note || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredMovements.length === 0 && (
              <p className="text-center py-8 text-gray-500">
                No stock movements found.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Movement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-medium mb-4">Add Stock Movement</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Branch
                </label>
                <select
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  value={filterBranchId || ""}
                  onChange={(e) =>
                    setFilterBranchId(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                >
                  <option value="">Select Branch</option>
                  {branches?.map((branch) => (
                    <option key={branch.branch_id} value={branch.branch_id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Stock Item *
                </label>
                <select
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  value={formData.stock_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stock_id: Number(e.target.value),
                    })
                  }
                >
                  <option value={0}>Select Stock Item</option>
                  {stockForBranch?.map((item) => (
                    <option key={item.stock_id} value={item.stock_id}>
                      {item.branch?.name} - {item.ingredient?.name || "Unknown"}{" "}
                      ({Number(item.amount_remaining).toFixed(2)}{" "}
                      {item.ingredient?.base_unit})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Reason *
                </label>
                <select
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                >
                  <option value="RESTOCK">Restock (Add)</option>
                  <option value="WASTE">Waste (Remove)</option>
                  <option value="ADJUST">Adjust (+/-)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Quantity *{" "}
                  {formData.reason === "WASTE" && "(will be subtracted)"}
                  {formData.reason === "ADJUST" &&
                    "(positive to add, negative to subtract)"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  value={qtyInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setQtyInput(value);
                    if (value === "" || value === "-") {
                      setFormData({ ...formData, qty_change: 0 });
                      return;
                    }
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue)) {
                      setFormData({ ...formData, qty_change: numValue });
                    }
                  }}
                  placeholder={
                    formData.reason === "ADJUST"
                      ? "e.g., -100 to subtract, 100 to add"
                      : formData.reason === "WASTE"
                      ? "Enter amount to remove"
                      : "Enter amount"
                  }
                />
                {formData.reason === "ADJUST" && (
                  <p className="mt-1 text-xs text-gray-500">
                    Enter positive value to add stock, negative value to
                    subtract (e.g., -50, +50)
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Note
                </label>
                <textarea
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  value={formData.note || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
