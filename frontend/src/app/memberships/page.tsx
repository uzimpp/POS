"use client";

import { useState, useMemo } from "react";
import { Layout } from "../../components/layout";
import {
  useGetMembershipsQuery,
  useDeleteMembershipMutation,
  useCreateMembershipMutation,
  useUpdateMembershipMutation,
  Membership,
} from "../../store/api/membershipsApi";
import {
  useGetTiersQuery,
  useCreateTierMutation,
  useUpdateTierMutation,
  useDeleteTierMutation,
} from "../../store/api/tiersApi";
import { ConfirmModal } from "../../components/modals/ConfirmModal";

export default function MembershipsPage() {
  const { data: memberships, isLoading, error } = useGetMembershipsQuery();
  const { data: tiers } = useGetTiersQuery();
  const [deleteMembership] = useDeleteMembershipMutation();
  const [createMembership] = useCreateMembershipMutation();
  const [updateMembership] = useUpdateMembershipMutation();
  const [createTier] = useCreateTierMutation();
  const [updateTier] = useUpdateTierMutation();
  const [deleteTier] = useDeleteTierMutation();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterRank, setFilterRank] = useState<"all" | number>("all");
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMemberId, setDeleteMemberId] = useState<number | null>(null);
  const [deleteMemberName, setDeleteMemberName] = useState<string>("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    points_balance: "0",
    tier_id: "1",
  });
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const extractErrorDetail = (err: unknown, fallback: string) => {
    const e = err as { data?: { detail?: unknown }; error?: unknown } | undefined;
    const detail = e?.data?.detail ?? e?.error ?? fallback;
    return typeof detail === "string" ? detail : fallback;
  };

  // Derive a valid tier_id from current form value and tiers list to avoid invalid selection
  const validTierId = useMemo(() => {
    if (!tiers || tiers.length === 0) return form.tier_id;
    const currentId = Number(form.tier_id);
    const exists = tiers.some((t) => t.tier_id === currentId);
    return exists ? form.tier_id : String(tiers[0].tier_id);
  }, [tiers, form.tier_id]);

  // Consistently sorted tiers (lowest rank to highest)
  const sortedTiers = useMemo(() => {
    return tiers ? [...tiers].sort((a, b) => a.tier - b.tier) : [];
  }, [tiers]);

  // Tier Management State
  const [showTierModal, setShowTierModal] = useState(false);
  const [showTierFormModal, setShowTierFormModal] = useState(false);
  const [showDeleteTierModal, setShowDeleteTierModal] = useState(false);
  const [editingTierId, setEditingTierId] = useState<number | null>(null);
  const [tierToDelete, setTierToDelete] = useState<number | null>(null);
  const [deleteTierError, setDeleteTierError] = useState<string | null>(null);
  const [tierForm, setTierForm] = useState({
    tier_name: "",
    tier: "0",
  });
  const [tierNameError, setTierNameError] = useState<string | null>(null);
  const [tierRankError, setTierRankError] = useState<string | null>(null);

  const openDeleteModal = (id: number, name: string) => {
    setDeleteMemberId(id);
    setDeleteMemberName(name);
    setShowDeleteModal(true);
  };

  const confirmDeleteMembership = async () => {
    if (deleteMemberId !== null) {
      try {
        await deleteMembership(deleteMemberId).unwrap();
        setShowDeleteModal(false);
        setDeleteMemberId(null);
        setDeleteMemberName("");
      } catch {
        alert("Failed to delete membership");
      }
    }
  };

  const handleEdit = (membership: Membership) => {
    setForm({
      name: membership.name,
      phone: membership.phone,
      email: membership.email || "",
      points_balance: String(membership.points_balance),
      tier_id: String(membership.tier_id),
    });
    setPhoneError(null);
    setEditingId(membership.membership_id);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setForm({
      name: "",
      phone: "",
      email: "",
      points_balance: "0",
      tier_id: "1",
    });
    setPhoneError(null);
  };

  const resetTierForm = () => {
    setTierForm({
      tier_name: "",
      tier: "0",
    });
    setTierNameError(null);
    setTierRankError(null);
  };

  const handleOpenAddTier = () => {
    setEditingTierId(null);
    resetTierForm();
    setTierNameError(null);
    setTierRankError(null);
    setShowTierFormModal(true);
  };

  const handleOpenEditTier = (tier: { tier_id: number; tier_name: string; tier: number }) => {
    setEditingTierId(tier.tier_id);
    setTierForm({
      tier_name: tier.tier_name,
      tier: String(tier.tier),
    });
    setTierNameError(null);
    setTierRankError(null);
    setShowTierFormModal(true);
  };

  const handleDeleteTierClick = (id: number) => {
    setTierToDelete(id);
    setDeleteTierError(null);
    setShowDeleteTierModal(true);
  };

  const handleConfirmDeleteTier = async () => {
    if (tierToDelete !== null) {
      try {
        await deleteTier(tierToDelete).unwrap();
        setShowDeleteTierModal(false);
        setTierToDelete(null);
        setDeleteTierError(null);
      } catch {
        // Show a clear, fixed error message and keep only the Cancel button visible in the modal
        setDeleteTierError("Cannot delete tier because it is assigned to one or more memberships.");
      }
    }
  };

  const handleTierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Client-side duplicate name guard (case-insensitive)
    const nameTrimmed = tierForm.tier_name.trim();
    if (tiers && nameTrimmed) {
      const exists = tiers.some(
        (t) => t.tier_name.toLowerCase() === nameTrimmed.toLowerCase() && t.tier_id !== (editingTierId ?? -1)
      );
      if (exists) {
        setTierNameError("Tier name already exists");
        return;
      }
    }
    // Client-side duplicate rank guard
    const rankNum = Number(tierForm.tier);
    if (tiers && !Number.isNaN(rankNum)) {
      const rankTaken = tiers.some(
        (t) => t.tier === rankNum && t.tier_id !== (editingTierId ?? -1)
      );
      if (rankTaken) {
        setTierRankError("Tier rank already exists");
        return;
      }
    }
    try {
      if (editingTierId) {
        await updateTier({
          id: editingTierId,
          data: {
            tier_name: tierForm.tier_name,
            tier: Number(tierForm.tier),
          },
        }).unwrap();
      } else {
        await createTier({
          tier_name: tierForm.tier_name,
          tier: Number(tierForm.tier),
        }).unwrap();
      }
      setShowTierFormModal(false);
      resetTierForm();
      setEditingTierId(null);
    } catch (err) {
      console.error(err);
      const detail = extractErrorDetail(err, "Failed to save tier");
      if (typeof detail === "string") {
        const lower = detail.toLowerCase();
        if (lower.includes("rank")) {
          setTierRankError("Tier rank already exists");
        } else if (lower.includes("name")) {
          setTierNameError("Tier name already exists");
        } else {
          setTierNameError(detail);
        }
      } else {
        setTierNameError("Failed to save tier");
      }
    }
  };

  const filteredMemberships = useMemo(() => {
    return memberships?.filter(
      (membership) =>
        membership.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        membership.phone.includes(searchTerm)
    );
  }, [memberships, searchTerm]);

  const filteredByRankMemberships = (() => {
    if (!filteredMemberships) return filteredMemberships;
    if (filterRank === "all") return filteredMemberships;
    const getRank = (m: Membership) => tiers?.find((t) => t.tier_id === m.tier_id)?.tier ?? null;
    return filteredMemberships.filter((m) => getRank(m) === filterRank);
  })();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTierBadge = (membership: Membership) => {
    const tierData = tiers?.find(t => t.tier_id === membership.tier_id);
    const label = tierData?.tier_name || membership.tier?.tier_name || `Tier #${membership.tier_id}`;
    // Always render gray styling per requirement
    const grayClass = "bg-gray-100 text-gray-800";
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${grayClass}`}>
        {label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading memberships...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-red-500">Error loading memberships</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Add New Membership</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                // Client-side duplicate phone guard
                if (memberships && form.phone) {
                  const exists = memberships.some((m: Membership) => m.phone === form.phone);
                  if (exists) {
                    setPhoneError("This phone number has already been used");
                    return;
                  }
                }
                try {
                  await createMembership({
                    name: form.name,
                    phone: form.phone,
                    email: form.email || null,
                    points_balance: Number(form.points_balance),
                    tier_id: Number(validTierId),
                  }).unwrap();
                  setShowModal(false);
                  resetForm();
                } catch (err) {
                  const detail = extractErrorDetail(err, "Failed to create membership");
                  if (typeof detail === "string" && detail.toLowerCase().includes("phone")) {
                    setPhoneError("This phone number has already been used");
                  } else {
                    alert(typeof detail === "string" ? detail : "Failed to create membership");
                  }
                }
              }}
            >
              <div className="mb-3">
                <label className="block mb-1">Name</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value.slice(0, 100) }))}
                  required
                  maxLength={100}
                />
                <p className="text-gray-400 text-sm mt-1">{form.name.length}/100 characters</p>
              </div>
              <div className="mb-3">
                <label className="block mb-1">Phone</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={form.phone}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/[^0-9]/g, "");
                    setForm((f) => ({ ...f, phone: digitsOnly.slice(0, 10) }));
                    if (phoneError) setPhoneError(null);
                  }}
                  required
                  minLength={10}
                  maxLength={10}
                />
                {phoneError && (
                  <p className="mt-1 text-sm text-red-600">{phoneError}</p>
                )}
              </div>
              <div className="mb-3">
                <label className="block mb-1">Email (Optional)</label>
                <input
                  type="email"
                  className="w-full border rounded px-3 py-2"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value.slice(0, 100) }))}
                  maxLength={100}
                />
              </div>
              <div className="mb-3">
                <label className="block mb-1">Tier</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={validTierId}
                  onChange={(e) => setForm((f) => ({ ...f, tier_id: e.target.value }))}
                  required
                >
                  {sortedTiers.map((tier) => (
                    <option key={tier.tier_id} value={tier.tier_id}>
                      {tier.tier_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="block mb-1">Points Balance</label>
                <input
                  type="number"
                  min="0"
                  className="w-full border rounded px-3 py-2"
                  value={form.points_balance}
                  onChange={(e) => setForm((f) => ({ ...f, points_balance: e.target.value }))}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 border rounded"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add Membership
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Edit Membership</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (editingId !== null) {
                  try {
                    await updateMembership({
                      id: editingId,
                      data: {
                        name: form.name,
                        phone: form.phone,
                        email: form.email || null,
                        points_balance: Number(form.points_balance),
                        tier_id: Number(validTierId),
                      },
                    }).unwrap();
                    setShowEditModal(false);
                    setEditingId(null);
                    resetForm();
                  } catch (err) {
                    const detail = extractErrorDetail(err, "Failed to update membership");
                    if (typeof detail === "string" && detail.toLowerCase().includes("phone")) {
                      setPhoneError("This phone number has already been used");
                    } else {
                      alert(typeof detail === "string" ? detail : "Failed to update membership");
                    }
                  }
                }
              }}
            >
              <div className="mb-3">
                <label className="block mb-1">Name</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value.slice(0, 100) }))}
                  required
                  maxLength={100}
                />
                <p className="text-gray-400 text-sm mt-1">{form.name.length}/100 characters</p>
              </div>
              <div className="mb-3">
                <label className="block mb-1">Phone</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={form.phone}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/[^0-9]/g, "");
                    setForm((f) => ({ ...f, phone: digitsOnly.slice(0, 10) }));
                    if (phoneError) setPhoneError(null);
                  }}
                  required
                  minLength={10}
                  maxLength={10}
                />
                {phoneError && (
                  <p className="mt-1 text-sm text-red-600">{phoneError}</p>
                )}
              </div>
              <div className="mb-3">
                <label className="block mb-1">Email (Optional)</label>
                <input
                  type="email"
                  className="w-full border rounded px-3 py-2"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value.slice(0, 100) }))}
                  maxLength={100}
                />
              </div>
              <div className="mb-3">
                <label className="block mb-1">Tier</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={validTierId}
                  onChange={(e) => setForm((f) => ({ ...f, tier_id: e.target.value }))}
                  required
                >
                  {sortedTiers.map((tier) => (
                    <option key={tier.tier_id} value={tier.tier_id}>
                      {tier.tier_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="block mb-1">Points Balance</label>
                <input
                  type="number"
                  min="0"
                  className="w-full border rounded px-3 py-2"
                  value={form.points_balance}
                  onChange={(e) => setForm((f) => ({ ...f, points_balance: e.target.value }))}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 border rounded"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingId(null);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Manage Tiers Modal */}
      {showTierModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 sticky top-0">
              <h2 className="text-xl font-bold text-gray-800">Manage Tiers</h2>
              <div className="flex gap-2 items-center">
                <button
                  onClick={handleOpenAddTier}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  + Add Tier
                </button>
                <button
                  onClick={() => setShowTierModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[...(tiers || [])].sort((a, b) => a.tier - b.tier).map((tier) => (
                    <tr key={tier.tier_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">#{tier.tier_id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{tier.tier_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{tier.tier}</td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <button
                          onClick={() => handleOpenEditTier(tier)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTierClick(tier.tier_id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!tiers || tiers.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                        No tiers found. Add your first tier to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* Tier Form Modal */}
      {showTierFormModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                {editingTierId ? "Edit Tier" : "Add New Tier"}
              </h3>
              <button
                onClick={() => {
                  setShowTierFormModal(false);
                  resetTierForm();
                  setEditingTierId(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleTierSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tier Name</label>
                <input
                  type="text"
                  required
                  value={tierForm.tier_name}
                  onChange={(e) => {
                    setTierForm({ ...tierForm, tier_name: e.target.value });
                    if (tierNameError) setTierNameError(null);
                  }}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., Bronze, Silver, Gold"
                />
                {tierNameError && (
                  <p className="mt-1 text-sm text-red-600">{tierNameError}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Rank (Higher = Better)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={tierForm.tier}
                  onChange={(e) => {
                    setTierForm({ ...tierForm, tier: e.target.value });
                    if (tierRankError) setTierRankError(null);
                  }}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {tierRankError && (
                  <p className="mt-1 text-sm text-red-600">{tierRankError}</p>
                )}
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowTierFormModal(false);
                    resetTierForm();
                    setEditingTierId(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  {editingTierId ? "Save Changes" : "Add Tier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-red-600">Delete Membership{deleteMemberName ? `: ${deleteMemberName}` : ""}</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this membership? This action cannot be undone.
            </p>
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
              <p className="text-red-600">
                <b>You will have to re-enter this member&#39;s information again if you wish to add it back.</b>
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 border rounded hover:bg-gray-100"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={confirmDeleteMembership}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={showDeleteTierModal}
        title="Delete Tier"
        message="Are you sure you want to delete this tier? This action cannot be undone."
        onConfirm={handleConfirmDeleteTier}
        onCancel={() => setShowDeleteTierModal(false)}
        isDestructive={true}
        error={deleteTierError}
      />
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Memberships</h1>
            <p className="text-gray-600 mt-2">Manage customer memberships</p>
          </div>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => {
                resetForm();
                // Default to first available tier when opening add modal
                if (tiers && tiers.length > 0) {
                  setForm(f => ({ ...f, tier_id: String(tiers[0].tier_id) }));
                }
                setShowModal(true);
              }}
            >
              Add Membership
            </button>
            <button
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              onClick={() => setShowTierModal(true)}
            >
              Manage Tiers
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-col md:flex-row md:items-center md:gap-3">
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/3 h-10 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex items-center mt-2 md:mt-0">
            <select
              value={filterRank === "all" ? "all" : String(filterRank)}
              onChange={(e) => {
                const v = e.target.value;
                setFilterRank(v === "all" ? "all" : Number(v));
              }}
              className="h-10 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All ranks</option>
              {sortedTiers.map((t) => (
                <option key={t.tier_id} value={t.tier}>
                  {t.tier} - {t.tier_name}
                </option>
              ))}
            </select>
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
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredByRankMemberships && filteredByRankMemberships.length > 0 ? (
                  filteredByRankMemberships.map((membership) => (
                    <tr
                      key={membership.membership_id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{membership.membership_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {membership.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {membership.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {membership.email || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTierBadge(membership)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {membership.points_balance}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(membership.joined_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(membership)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openDeleteModal(membership.membership_id, membership.name)}
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
                      colSpan={8}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No memberships found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
