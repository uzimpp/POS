"use client";

import { Layout } from "../../src/components/Layout";
import {
  useGetMembershipsQuery,
  useCreateMembershipMutation,
  useUpdateMembershipMutation,
  useDeleteMembershipMutation,
} from "../../src/store/api/membershipsApi";
import { useState } from "react";

export default function MembershipsPage() {
  const { data: memberships, isLoading, refetch } = useGetMembershipsQuery();
  const [createMembership] = useCreateMembershipMutation();
  const [updateMembership] = useUpdateMembershipMutation();
  const [deleteMembership] = useDeleteMembershipMutation();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    points_balance: 0,
    membership_tier: "Bronze",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateMembership({ id: editingId, data: formData }).unwrap();
        setEditingId(null);
      } else {
        await createMembership(formData).unwrap();
      }
      setFormData({
        name: "",
        phone: "",
        email: "",
        points_balance: 0,
        membership_tier: "Bronze",
      });
      refetch();
    } catch (error) {
      console.error("Failed to save membership:", error);
      alert("Failed to save membership. Phone number might already exist.");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this membership?")) {
      try {
        await deleteMembership(id).unwrap();
        refetch();
      } catch (error) {
        console.error("Failed to delete membership:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div>Loading memberships...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold mb-6">Memberships</h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow border mb-6"
        >
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? "Edit" : "Create"} Membership
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Email (optional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Points Balance
              </label>
              <input
                type="number"
                value={formData.points_balance}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    points_balance: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Membership Tier
              </label>
              <select
                value={formData.membership_tier}
                onChange={(e) =>
                  setFormData({ ...formData, membership_tier: e.target.value })
                }
                className="w-full px-3 py-2 border rounded"
              >
                <option value="Bronze">Bronze</option>
                <option value="Silver">Silver</option>
                <option value="Gold">Gold</option>
                <option value="Platinum">Platinum</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {editingId ? "Update" : "Create"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    name: "",
                    phone: "",
                    email: "",
                    points_balance: 0,
                    membership_tier: "Bronze",
                  });
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                  Tier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                  Join Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {memberships?.map((membership) => (
                <tr key={membership.membership_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm border">
                    {membership.membership_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm border">
                    {membership.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm border">
                    {membership.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm border">
                    {membership.email || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm border">
                    {membership.points_balance}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm border">
                    <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                      {membership.membership_tier}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm border">
                    {new Date(membership.joined_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm border">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingId(membership.membership_id);
                          setFormData({
                            name: membership.name,
                            phone: membership.phone,
                            email: membership.email || "",
                            points_balance: membership.points_balance,
                            membership_tier: membership.membership_tier,
                          });
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(membership.membership_id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
