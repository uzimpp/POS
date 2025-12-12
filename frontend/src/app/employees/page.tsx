"use client";

import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useGetEmployeesQuery,
  useDeleteEmployeeMutation,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  Employee,
  EmployeeCreate,
} from "@/store/api/employeesApi";
import { useGetRolesQuery } from "@/store/api/rolesApi";
import { useGetBranchesQuery } from "@/store/api/branchesApi";
import { MultiSelect } from "@/components/forms";
import { EmployeeModal } from "@/components/modals";

export default function EmployeesPage() {
  const [selectedBranchIds, setSelectedBranchIds] = useState<
    (number | string)[]
  >([]);
  const {
    data: employees,
    isLoading,
    error,
  } = useGetEmployeesQuery({
    branch_ids:
      selectedBranchIds.length > 0
        ? (selectedBranchIds as number[])
        : undefined,
  });
  const { data: roles } = useGetRolesQuery();
  const { data: branches } = useGetBranchesQuery();
  const [deleteEmployee] = useDeleteEmployeeMutation();
  const [createEmployee] = useCreateEmployeeMutation();
  const [updateEmployee] = useUpdateEmployeeMutation();
  const [filterActive, setFilterActive] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>(
    undefined
  );

  const handleCreate = () => {
    setEditingEmployee(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: EmployeeCreate) => {
    try {
      if (editingEmployee) {
        await updateEmployee({
          id: editingEmployee.employee_id,
          data,
        }).unwrap();
      } else {
        await createEmployee(data).unwrap();
      }
      setIsModalOpen(false);
    } catch (err) {
      alert(`Failed to ${editingEmployee ? "update" : "create"} employee`);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      try {
        await deleteEmployee(id).unwrap();
      } catch (err) {
        alert("Failed to delete employee");
      }
    }
  };

  const filteredEmployees =
    filterActive === "all"
      ? employees
      : filterActive === "active"
      ? employees?.filter((emp) => emp.is_active)
      : employees?.filter((emp) => !emp.is_active);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading employees...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-red-500">Error loading employees</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Employees</h1>
            <p className="text-gray-600 mt-2">Manage your staff members</p>
          </div>
          <div className="flex gap-2">
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
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-[42px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors h-[42px]"
              >
                Add Employee
              </button>
            </div>
          </div>
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
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Salary
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
                {filteredEmployees && filteredEmployees.length > 0 ? (
                  filteredEmployees.map((employee) => (
                    <tr key={employee.employee_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{employee.employee_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.first_name} {employee.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.role?.role_name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.branch?.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(employee.joined_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ฿{employee.salary.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            employee.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {employee.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(employee)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(employee.employee_id)}
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
                      colSpan={7}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No employees found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        employee={editingEmployee}
        roles={roles || []}
        branches={branches?.filter((b) => b.is_active) || []}
      />
    </Layout>
  );
}
