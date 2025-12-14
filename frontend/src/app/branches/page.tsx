"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/layout";
import {
  useGetBranchesQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
  Branch,
  BranchCreate,
} from "@/store/api/branchesApi";

import { ErrorModal, ConfirmModal, BranchModal } from "@/components/modals";

export default function BranchesPage() {
  const router = useRouter(); // Use useRouter for navigation
  const [showDeleted, setShowDeleted] = useState(false); // Toggle state
  const {
    data: branches,
    isLoading,
    error,
  } = useGetBranchesQuery(
    showDeleted ? { is_deleted: true } : { is_deleted: false }
  );
  const [createBranch] = useCreateBranchMutation();
  const [updateBranch] = useUpdateBranchMutation();
  const [deleteBranch] = useDeleteBranchMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: "" });
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Delete Confirmation State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<number | null>(null);

  const handleOpenAdd = () => {
    setEditingBranch(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (branch: Branch) => {
    setEditingBranch(branch);
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
        setIsDeleteModalOpen(false);
        setBranchToDelete(null);
      } catch (err: any) {
        console.error("Failed to delete branch:", err);
        const errorMessage =
          err?.data?.detail || err?.message || "Failed to delete branch";
        alert(errorMessage);
        setIsDeleteModalOpen(false);
        setBranchToDelete(null);
      }
    }
  };

  const handleSubmit = async (data: BranchCreate) => {
    try {
      if (editingBranch) {
        await updateBranch({
          id: editingBranch.branch_id,
          data,
        }).unwrap();
      } else {
        await createBranch(data).unwrap();
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      let errorMessage = "Failed to save branch";

      // Try to extract validation error message from backend
      if (err?.data?.detail) {
        if (Array.isArray(err.data.detail)) {
          // Pydantic validation error array
          const messages = err.data.detail.map((e: any) => {
            const field = e.loc ? e.loc[e.loc.length - 1] : "Field";
            return `${field}: ${e.msg}`;
          });
          errorMessage = `Validation Error:\n${messages.join("\n")}`;
        } else if (typeof err.data.detail === "string") {
          // Generic detail string
          errorMessage = err.data.detail;
        }
      }

      setErrorModal({ isOpen: true, message: errorMessage });
    }
  };

  // Backend filters branches based on is_deleted parameter
  const displayBranches = branches || [];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading branches...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-red-500">Error loading branches</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Branches</h1>
            <p className="text-gray-600 mt-2">Manage your branch locations</p>
          </div>
          <div className="flex gap-2 items-center">
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={showDeleted}
                  onChange={(e) => setShowDeleted(e.target.checked)}
                />
                <div
                  className={`block w-10 h-6 rounded-full transition-colors ${
                    showDeleted ? "bg-blue-500" : "bg-gray-300"
                  }`}
                ></div>
                <div
                  className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                    showDeleted ? "transform translate-x-4" : ""
                  }`}
                ></div>
              </div>
              <div className="ml-3 text-sm font-medium text-gray-700">
                Show Inactive
              </div>
            </label>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors h-[42px]"
            >
              Add Branch
            </button>
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
                {displayBranches && displayBranches.length > 0 ? (
                  displayBranches.map((branch) => (
                    <tr
                      key={branch.branch_id}
                      className={`hover:bg-gray-50 ${
                        branch.is_deleted ? "opacity-60" : ""
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
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            !branch.is_deleted
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {!branch.is_deleted ? "Active" : "Inactive"}
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
                          {!branch.is_deleted && (
                            <button
                              onClick={() =>
                                handleDeleteClick(branch.branch_id)
                              }
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          )}
                          <button
                            onClick={() =>
                              router.push(`/branches/${branch.branch_id}`)
                            }
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No branches found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <BranchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        branch={editingBranch}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Branch"
        message="Are you sure you want to delete this branch? It will be marked as inactive."
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isDestructive={true}
      />
      <ErrorModal
        isOpen={errorModal.isOpen}
        title="Validation Error"
        message={errorModal.message}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
      />
    </Layout>
  );
}
