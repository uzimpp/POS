"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "../../components/Layout";
import {
  useGetBranchesQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
  Branch,
  BranchCreate,
} from "../../store/api/branchesApi";

import { ConfirmModal } from "../../components/ConfirmModal";

export default function BranchesPage() {
  const router = useRouter(); // Use useRouter for navigation
  const { data: branches, isLoading, error } = useGetBranchesQuery();
  const [createBranch] = useCreateBranchMutation();
  const [updateBranch] = useUpdateBranchMutation();
  const [deleteBranch] = useDeleteBranchMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [showDeleted, setShowDeleted] = useState(false); // Toggle state

  // Delete Confirmation State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<number | null>(null);

  const [formData, setFormData] = useState<BranchCreate>({
    name: "",
    address: "",
    phone: "",
    is_active: true,
  });

  const handleOpenAdd = () => {
    setEditingBranch(null);
    setFormData({
      name: "",
      address: "",
      phone: "",
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      is_active: branch.is_active,
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setBranchToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (branchToDelete !== null) {
      try {
        await deleteBranch(branchToDelete).unwrap();
        // alert("Branch deleted successfully");
        setIsDeleteModalOpen(false);
        setBranchToDelete(null);
      } catch (err) {
        console.error("Failed to delete branch:", err);
        alert("Failed to delete branch");
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingBranch) {
        await updateBranch({
          id: editingBranch.branch_id,
          data: formData,
        }).unwrap();
        // alert("Branch updated successfully");
      } else {
        await createBranch(formData).unwrap();
        // alert("Branch created successfully");
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save branch");
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading branches...</div>;
  if (error) {
    console.error("Error loading branches:", error);
    // Don't return error UI, just show empty table or "No branches" if that's the result
  }

  // Filter branches based on toggle
  const displayBranches = branches
    ? branches.filter((b) => showDeleted || b.is_active)
    : [];

  return (
    <Layout>
      {(!branches || branches.length === 0) ? (
        <div className="text-center py-20">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">No branches found</h2>
          <p className="text-gray-500 mb-8">Get started by creating your first branch.</p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Add First Branch
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
            <h1 className="text-xl font-bold text-gray-800">Branch Management</h1>
            <div className="flex items-center gap-4">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={showDeleted}
                    onChange={(e) => setShowDeleted(e.target.checked)}
                  />
                  <div
                    className={`block w-10 h-6 rounded-full transition-colors ${showDeleted ? "bg-blue-500" : "bg-gray-300"
                      }`}
                  ></div>
                  <div
                    className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showDeleted ? "transform translate-x-4" : ""
                      }`}
                  ></div>
                </div>
                <div className="ml-3 text-sm font-medium text-gray-700">
                  Show Inactive
                </div>
              </label>
              <button
                onClick={handleOpenAdd}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                + Add Branch
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
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
                {displayBranches.map((branch) => (
                  <tr
                    key={branch.branch_id}
                    className={`transition-colors ${!branch.is_active ? "bg-gray-50 opacity-60" : "hover:bg-gray-50"
                      }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{branch.branch_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {branch.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {branch.address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {branch.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${branch.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                          }`}
                      >
                        {branch.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenEdit(branch)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        {branch.is_active && (
                          <button
                            onClick={() => handleDeleteClick(branch.branch_id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        )}

                        <button
                          onClick={() => router.push(`/branches/${branch.branch_id}`)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm font-medium transition-colors ml-2"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {
        isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingBranch ? "Edit Branch" : "Add New Branch"}
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
                    Branch Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
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
                    {editingBranch ? "Save Changes" : "Add Branch"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Branch"
        message="Are you sure you want to delete this branch? It will be marked as inactive."
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isDestructive={true}
      />
    </Layout >
  );
}
