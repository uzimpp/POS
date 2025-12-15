"use client";

import { useState, use, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { Layout } from "@/components/layout";
import {
  useGetEmployeesByBranchQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  Employee,
  EmployeeCreate,
} from "@/store/api/employeesApi";
import {
  useGetStockByBranchQuery,
  useCreateStockMutation,
  useDeleteStockMutation,
  useGetStockMovementsQuery,
  useCreateStockMovementMutation,
  Stock,
  StockCreate,
  StockMovement,
  StockMovementCreate,
} from "@/store/api/stockApi";
import { useGetBranchesQuery } from "@/store/api/branchesApi";
import { useGetIngredientsQuery } from "@/store/api/ingredientsApi";
import { useGetRolesQuery } from "@/store/api/rolesApi";

import { ConfirmModal } from "@/components/modals";
import DashboardOverview from "@/components/dashboard/DashboardOverview";

export default function BranchDetailPage({
  params,
}: {
  params: Promise<{ branchId: string }>;
}) {
  const resolvedParams = use(params);
  const branchId = parseInt(resolvedParams.branchId);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "overview" | "employees" | "stock" | "movements"
  >("overview");

  // Fetch Branch Info (for title)
  const { data: branches } = useGetBranchesQuery();
  const branch = branches?.find((b) => b.branch_id === branchId);
  const isBranchDeleted = !!branch?.is_deleted;

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow min-h-screen pb-10">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50 rounded-t-lg">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-gray-500 hover:text-gray-700"
            >
              &larr; Back
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                {branch ? branch.name : `Branch #${branchId}`}
              </h1>
              {branch && (
                <p className="text-sm text-gray-500">
                  {branch.address} • {branch.phone}
                </p>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "overview"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("employees")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "employees"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Employees
            </button>
            <button
              onClick={() => setActiveTab("stock")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "stock"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Stock
            </button>
            <button
              onClick={() => setActiveTab("movements")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "movements"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Movements
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isBranchDeleted && (
            <div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
              This branch is deleted. All actions are disabled.
            </div>
          )}
          {activeTab === "overview" ? (
            <DashboardOverview branchId={branchId} />
          ) : activeTab === "employees" ? (
            <EmployeeManager branchId={branchId} readOnly={isBranchDeleted} />
          ) : activeTab === "stock" ? (
            <StockManager branchId={branchId} readOnly={isBranchDeleted} />
          ) : (
            <StockMovementsManager
              branchId={branchId}
              readOnly={isBranchDeleted}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}

function EmployeeManager({
  branchId,
  readOnly,
}: {
  branchId: number;
  readOnly: boolean;
}) {
  const { data: employees, isLoading } = useGetEmployeesByBranchQuery(branchId);
  const { data: roles } = useGetRolesQuery();
  const [createEmployee] = useCreateEmployeeMutation();
  const [updateEmployee] = useUpdateEmployeeMutation();
  const [deleteEmployee] = useDeleteEmployeeMutation();

  const [showInactive, setShowInactive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Delete Confirmation State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState<EmployeeCreate>({
    branch_id: branchId,
    role_id: roles?.[0]?.role_id || 0,
    first_name: "",
    last_name: "",
    salary: 15000,
    is_deleted: false,
  });

  const handleOpenAdd = () => {
    if (readOnly) return;
    setEditingEmployee(null);
    setFormData({
      branch_id: branchId,
      role_id: roles?.[0]?.role_id || 0,
      first_name: "",
      last_name: "",
      salary: 15000,
      is_deleted: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    if (readOnly) return;
    setEditingEmployee(emp);
    setFormData({
      branch_id: emp.branch_id || branchId, // fallback if missing
      role_id: emp.role_id,
      first_name: emp.first_name,
      last_name: emp.last_name,
      salary: emp.salary,
      is_deleted: emp.is_deleted,
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    if (readOnly) return;
    setEmployeeToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (readOnly) return;
    if (employeeToDelete !== null) {
      try {
        await deleteEmployee(employeeToDelete).unwrap();
        setIsDeleteModalOpen(false);
        setEmployeeToDelete(null);
      } catch (err) {
        console.error(err);
        alert("Failed to delete employee");
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (readOnly) {
      alert("This branch is deleted. Actions are disabled.");
      return;
    }
    try {
      if (editingEmployee) {
        await updateEmployee({
          id: editingEmployee.employee_id,
          data: formData,
        }).unwrap();
      } else {
        await createEmployee(formData).unwrap();
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save employee");
    }
  };

  const displayEmployees = employees
    ? employees.filter((e) => showInactive || !e.is_deleted)
    : [];

  if (isLoading) return <div>Loading employees...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Employees</h2>
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            Show Inactive
          </label>
          <button
            onClick={handleOpenAdd}
            className={`px-3 py-1 rounded ${
              readOnly
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
            disabled={readOnly}
          >
            + Add Employee
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Salary
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayEmployees.map((emp) => (
              <tr
                key={emp.employee_id}
                className={emp.is_deleted ? "opacity-50 bg-gray-50" : ""}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  #{emp.employee_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {emp.first_name} {emp.last_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {emp.role?.role_name || `Role #${emp.role_id}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {emp.salary.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      !emp.is_deleted
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {!emp.is_deleted ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleOpenEdit(emp)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Edit
                  </button>
                  {!emp.is_deleted && (
                    <button
                      onClick={() => handleDeleteClick(emp.employee_id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {displayEmployees.length === 0 && (
          <p className="text-center py-4 text-gray-500">No employees found.</p>
        )}
      </div>

      {/* Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-medium mb-4">
              {editingEmployee ? "Edit Employee" : "Add Employee"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  value={formData.role_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role_id: parseInt(e.target.value),
                    })
                  }
                >
                  {roles?.map((role) => (
                    <option key={role.role_id} value={role.role_id}>
                      {role.role_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Salary
                </label>
                <input
                  type="number"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  value={formData.salary}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      salary: parseInt(e.target.value),
                    })
                  }
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
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Employee"
        message="Are you sure you want to delete this employee? (Soft Delete)"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isDestructive={true}
      />
    </div>
  );
}

function StockManager({
  branchId,
  readOnly,
}: {
  branchId: number;
  readOnly: boolean;
}) {
  const { data: stockItems, isLoading } = useGetStockByBranchQuery(branchId);
  const { data: ingredients } = useGetIngredientsQuery();
  const [createStock] = useCreateStockMutation();
  const [deleteStock] = useDeleteStockMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Delete Confirmation State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [stockToDelete, setStockToDelete] = useState<number | null>(null);

  const [formData, setFormData] = useState<StockCreate>({
    branch_id: branchId,
    ingredient_id: 0,
    amount_remaining: 0,
  });

  const handleOpenAdd = () => {
    if (readOnly) return;
    setFormData({
      branch_id: branchId,
      ingredient_id: 0,
      amount_remaining: 0,
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    if (readOnly) return;
    setStockToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (readOnly) return;
    if (stockToDelete !== null) {
      try {
        await deleteStock(stockToDelete).unwrap();
        setIsDeleteModalOpen(false);
        setStockToDelete(null);
      } catch (err) {
        console.error(err);
        alert("Failed to delete stock");
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (readOnly) {
      alert("This branch is deleted. Actions are disabled.");
      return;
    }
    try {
      await createStock(formData).unwrap();
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save stock");
    }
  };

  if (isLoading) return <div>Loading stock...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold">Stock Inventory</h2>
          <p className="text-sm text-gray-500 mt-1">
            Stock records are immutable. To change quantities, use the Movements
            tab.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className={`px-3 py-1 rounded ${
            readOnly
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
          disabled={readOnly}
        >
          + Add Stock
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Ingredient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Unit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stockItems?.map((item) => (
              <tr key={item.stock_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  #{item.stock_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.ingredient?.name || "Unknown"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {Number(item.amount_remaining).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.ingredient?.base_unit || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleDeleteClick(item.stock_id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {stockItems?.length === 0 && (
          <p className="text-center py-4 text-gray-500">
            No stock items found.
          </p>
        )}
      </div>

      {/* Stock Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-medium mb-4">Add Stock Item</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Ingredient *
                </label>
                <select
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  value={formData.ingredient_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ingredient_id: Number(e.target.value),
                    })
                  }
                >
                  <option value={0}>Select Ingredient</option>
                  {ingredients
                    ?.filter((ing) => !ing.is_deleted)
                    .map((ingredient) => (
                      <option
                        key={ingredient.ingredient_id}
                        value={ingredient.ingredient_id}
                      >
                        {ingredient.name} ({ingredient.base_unit})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Quantity *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  value={formData.amount_remaining}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amount_remaining: parseFloat(e.target.value) || 0,
                    })
                  }
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
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Stock"
        message="Are you sure you want to delete this stock item? (Hard Delete)"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isDestructive={true}
      />
    </div>
  );
}

function StockMovementsManager({
  branchId,
  readOnly,
}: {
  branchId: number;
  readOnly: boolean;
}) {
  const [filterReason, setFilterReason] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [filterQtyMin, setFilterQtyMin] = useState<string>("");
  const [filterQtyMax, setFilterQtyMax] = useState<string>("");

  const { data: movements, isLoading } = useGetStockMovementsQuery({
    branch_id: branchId,
    reason: filterReason === "all" ? undefined : filterReason,
    created_from: filterDateFrom || undefined,
    created_to: filterDateTo || undefined,
    qty_min: filterQtyMin ? Number(filterQtyMin) : undefined,
    qty_max: filterQtyMax ? Number(filterQtyMax) : undefined,
  });
  const { data: stockItems } = useGetStockByBranchQuery(branchId);
  const [createMovement] = useCreateStockMovementMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<StockMovementCreate>({
    stock_id: 0,
    qty_change: 0,
    reason: "RESTOCK",
    note: "",
  });
  const [qtyInput, setQtyInput] = useState<string>("0");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (readOnly) {
      alert("This branch is deleted. Actions are disabled.");
      return;
    }
    try {
      const parsedQty = parseFloat(qtyInput);
      if (isNaN(parsedQty)) {
        alert("Quantity is required and must be a number");
        return;
      }

      // For WASTE, make qty_change negative
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
    movements
      ?.filter((m) => filterReason === "all" || m.reason === filterReason)
      ?.filter((m) => {
        if (filterDateFrom && new Date(m.created_at) < new Date(filterDateFrom))
          return false;
        if (filterDateTo && new Date(m.created_at) > new Date(filterDateTo))
          return false;
        if (filterQtyMin && Number(m.qty_change) < Number(filterQtyMin))
          return false;
        if (filterQtyMax && Number(m.qty_change) > Number(filterQtyMax))
          return false;
        return true;
      }) || [];

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

  if (isLoading) return <div>Loading stock movements...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Stock Movements</h2>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <div className="flex gap-2">
            <select
              value={filterReason}
              onChange={(e) => setFilterReason(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="all">All Types</option>
              <option value="RESTOCK">Restock</option>
              <option value="SALE">Sale</option>
              <option value="WASTE">Waste</option>
              <option value="ADJUST">Adjust</option>
            </select>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              placeholder="From"
            />
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              placeholder="To"
            />
            <input
              type="number"
              step="0.01"
              value={filterQtyMin}
              onChange={(e) => setFilterQtyMin(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm w-28"
              placeholder="Qty min"
            />
            <input
              type="number"
              step="0.01"
              value={filterQtyMax}
              onChange={(e) => setFilterQtyMax(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm w-28"
              placeholder="Qty max"
            />
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
            className={`px-3 py-1 rounded ${
              readOnly
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
            disabled={readOnly}
          >
            + Add Movement
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
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
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredMovements.map((m) => (
              <tr key={m.movement_id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{m.movement_id}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(m.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {m.stock?.ingredient?.name || "Unknown"}
                </td>
                <td
                  className={`px-4 py-4 whitespace-nowrap text-sm font-semibold text-right ${
                    Number(m.qty_change) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {Number(m.qty_change) >= 0 ? "+" : ""}
                  {Number(m.qty_change).toFixed(2)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {m.stock?.ingredient?.base_unit || "-"}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getReasonBadgeColor(
                      m.reason
                    )}`}
                  >
                    {m.reason}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {m.employee
                    ? `${m.employee.first_name} ${m.employee.last_name}`
                    : "-"}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {m.order_id ? `#${m.order_id}` : "-"}
                </td>
                <td className="px-4 py-4 text-sm text-gray-500 max-w-xs truncate">
                  {m.note || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredMovements.length === 0 && (
          <p className="text-center py-4 text-gray-500">
            No stock movements found.
          </p>
        )}
      </div>

      {/* Movement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-medium mb-4">Add Stock Movement</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  {stockItems?.map((item) => (
                    <option key={item.stock_id} value={item.stock_id}>
                      {item.ingredient?.name || "Unknown"} (
                      {Number(item.amount_remaining).toFixed(2)}{" "}
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
    </div>
  );
}
