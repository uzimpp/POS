"use client";

import { useState, FormEvent } from "react";
import { Layout } from "../../components/Layout";
import {
    useGetRolesQuery,
    useCreateRoleMutation,
    useUpdateRoleMutation,
    useDeleteRoleMutation,
    Role,
    RoleCreate,
} from "../../store/api/rolesApi";

import { ConfirmModal } from "../../components/ConfirmModal";

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

    // Form State
    const [formData, setFormData] = useState<RoleCreate>({
        role_name: "",
        tier: 1,
    });

    const handleOpenAdd = () => {
        setEditingRole(null);
        setFormData({
            role_name: "",
            tier: 1,
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (role: Role) => {
        setEditingRole(role);
        setFormData({
            role_name: role.role_name,
            tier: role.tier,
        });
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id: number) => {
        setRoleToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (roleToDelete !== null) {
            try {
                await deleteRole(roleToDelete).unwrap();
                setIsDeleteModalOpen(false);
                setRoleToDelete(null);
            } catch (err: any) {
                console.error("Failed to delete role:", err);
                const errorMessage = err?.data?.detail || "Failed to delete role. It might be in use.";
                alert(errorMessage);
            }
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            if (editingRole) {
                await updateRole({
                    id: editingRole.role_id,
                    data: formData,
                }).unwrap();
            } else {
                await createRole(formData).unwrap();
            }
            setIsModalOpen(false);
        } catch (err) {
            console.error(err);
            alert("Failed to save role");
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading roles...</div>;
    if (error) {
        console.error("Error loading roles:", error);
    }

    return (
        <Layout>
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
                    <h1 className="text-xl font-bold text-gray-800">Role Management</h1>
                    <button
                        onClick={handleOpenAdd}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                        + Add Role
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tier
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {roles?.map((role) => (
                                <tr key={role.role_id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        #{role.role_id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {role.role_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {role.tier}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => handleOpenEdit(role)}
                                            className="text-blue-600 hover:text-blue-900 mr-4"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(role.role_id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {(!roles || roles.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                                        No roles found. Add your first role to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900">
                                {editingRole ? "Edit Role" : "Add New Role"}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <span className="sr-only">Close</span>
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Role Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.role_name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, role_name: e.target.value })
                                    }
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Tier (Higher = More Senior)
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.tier}
                                    onChange={(e) =>
                                        setFormData({ ...formData, tier: parseInt(e.target.value) })
                                    }
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    {editingRole ? "Save Changes" : "Add Role"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                title="Delete Role"
                message="Are you sure you want to delete this role? This action cannot be undone."
                onConfirm={handleConfirmDelete}
                onCancel={() => setIsDeleteModalOpen(false)}
                isDestructive={true}
            />
        </Layout>
    );
}
