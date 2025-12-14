"use client";

import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  Role,
  RoleCreate,
} from "@/store/api/rolesApi";

import { ConfirmModal, RoleModal } from "@/components/modals";

export default function RolesPage() {
  const { data: roles, isLoading, error } = useGetRolesQuery();
  const [createRole] = useCreateRoleMutation();
  const [updateRole] = useUpdateRoleMutation();
  const [deleteRole] = useDeleteRoleMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Delete Confirmation State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingRole(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (role: Role) => {
    setEditingRole(role);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setRoleToDelete(id);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (roleToDelete !== null) {
      try {
        await deleteRole(roleToDelete).unwrap();
        setIsDeleteModalOpen(false);
        setRoleToDelete(null);
        setDeleteError(null);
      } catch (err: any) {
        console.error("Failed to delete role:", err);
        const errorMessage =
          err?.data?.detail || "Failed to delete role. It might be in use.";
        setDeleteError(errorMessage);
      }
    }
  };

  const handleSubmit = async (data: RoleCreate) => {
    try {
      if (editingRole) {
        await updateRole({
          id: editingRole.role_id,
          data,
        }).unwrap();
      } else {
        await createRole(data).unwrap();
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save role");
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading roles...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-red-500">Error loading roles</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Roles</h1>
            <p className="text-gray-600 mt-2">
              Manage employee roles and permissions
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors h-[42px]"
          >
            Add Role
          </button>
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
                    Role Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seniority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {roles && roles.length > 0 ? (
                  roles.map((role) => (
                    <tr key={role.role_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{role.role_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {role.role_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {role.seniority}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenEdit(role)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(role.role_id)}
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
                      colSpan={4}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No roles found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <RoleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        role={editingRole}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Role"
        message="Are you sure you want to delete this role? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isDestructive={true}
        error={deleteError}
      />
    </Layout>
  );
}
