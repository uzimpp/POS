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
  useUpdateStockMutation,
  useDeleteStockMutation,
  Stock,
  StockCreate,
} from "@/store/api/stockApi";
import { useGetBranchesQuery } from "@/store/api/branchesApi";
import { useGetIngredientsQuery } from "@/store/api/ingredientsApi";
import { useGetRolesQuery } from "@/store/api/rolesApi";

import { ConfirmModal } from "@/components/modals";

export default function BranchDetailPage({
  params,
}: {
  params: Promise<{ branchId: string }>;
}) {
  const resolvedParams = use(params);
  const branchId = parseInt(resolvedParams.branchId);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"employees" | "stock">(
    "employees"
  );

  // Fetch Branch Info (for title)
  const { data: branches } = useGetBranchesQuery();
  const branch = branches?.find((b) => b.branch_id === branchId);

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow min-h-screen pb-10">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-gray-500 hover:text-gray-700"
            >
              &larr; Back
            </button>
            <h1 className="text-xl font-bold text-gray-800">
              {branch ? `${branch.name} - Details` : `Branch #${branchId}`}
            </h1>
          </div>
          <div className="flex space-x-2">
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
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === "employees" ? (
            <EmployeeManager branchId={branchId} />
          ) : (
            <StockManager branchId={branchId} />
          )}
        </div>
      </div>
    </Layout>
  );
}

function EmployeeManager({ branchId }: { branchId: number }) {
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
    setEmployeeToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
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
            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
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
                  Tier {emp.role?.tier || emp.role_id}
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

function StockManager({ branchId }: { branchId: number }) {
  const { data: stockItems, isLoading } = useGetStockByBranchQuery(branchId);
  const { data: ingredients } = useGetIngredientsQuery();
  const [createStock] = useCreateStockMutation();
  const [updateStock] = useUpdateStockMutation();
  const [deleteStock] = useDeleteStockMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);

  // Delete Confirmation State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [stockToDelete, setStockToDelete] = useState<number | null>(null);

  const [formData, setFormData] = useState<StockCreate>({
    branch_id: branchId,
    ingredient_id: 0,
    amount_remaining: 0,
  });

  const handleOpenAdd = () => {
    setEditingStock(null);
    setFormData({
      branch_id: branchId,
      ingredient_id: 0,
      amount_remaining: 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Stock) => {
    setEditingStock(item);
    setFormData({
      branch_id: item.branch_id,
      ingredient_id: item.ingredient_id,
      amount_remaining: item.amount_remaining,
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setStockToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
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
    try {
      if (editingStock) {
        await updateStock({
          id: editingStock.stock_id,
          data: formData,
        }).unwrap();
      } else {
        await createStock(formData).unwrap();
      }
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
        <h2 className="text-lg font-semibold">Stock Inventory</h2>
        <button
          onClick={handleOpenAdd}
          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
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
                    onClick={() => handleOpenEdit(item)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Edit
                  </button>
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
            <h3 className="text-lg font-medium mb-4">
              {editingStock ? "Edit Stock Item" : "Add Stock Item"}
            </h3>
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
