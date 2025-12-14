"use client";

import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useGetIngredientsQuery,
  useDeleteIngredientMutation,
  useCreateIngredientMutation,
  useUpdateIngredientMutation,
  Ingredient,
} from "@/store/api/ingredientsApi";
import { ConfirmModal } from "@/components/modals";
import React from "react";

interface IngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    base_unit: string;
    is_deleted?: boolean;
  }) => Promise<void>;
  ingredient?: Ingredient | null;
}

const IngredientModal: React.FC<IngredientModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  ingredient,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    base_unit: "",
    is_deleted: false,
  });
  const [errors, setErrors] = useState({
    name: "",
    base_unit: "",
  });
  const [touched, setTouched] = useState({
    name: false,
    base_unit: false,
  });

  React.useEffect(() => {
    if (ingredient) {
      setFormData({
        name: ingredient.name,
        base_unit: ingredient.base_unit,
        is_deleted: ingredient.is_deleted,
      });
      setErrors({ name: "", base_unit: "" });
      setTouched({ name: false, base_unit: false });
    } else {
      setFormData({
        name: "",
        base_unit: "",
        is_deleted: false,
      });
      setErrors({ name: "", base_unit: "" });
      setTouched({ name: false, base_unit: false });
    }
  }, [ingredient, isOpen]);

  const validate = () => {
    const newErrors = { name: "", base_unit: "" };
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    }

    if (!formData.base_unit.trim()) {
      newErrors.base_unit = "Base unit is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, base_unit: true });
    if (!validate()) return;

    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      // Error handling
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            {ingredient ? "Edit Ingredient" : "Add Ingredient"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (touched.name) {
                  setErrors({
                    ...errors,
                    name: e.target.value.trim() ? "" : "Name is required",
                  });
                }
              }}
              onBlur={() => setTouched({ ...touched, name: true })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name && touched.name
                  ? "border-red-300"
                  : "border-gray-300"
              }`}
            />
            {errors.name && touched.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base Unit *
            </label>
            <input
              type="text"
              value={formData.base_unit}
              onChange={(e) => {
                setFormData({ ...formData, base_unit: e.target.value });
                if (touched.base_unit) {
                  setErrors({
                    ...errors,
                    base_unit: e.target.value.trim()
                      ? ""
                      : "Base unit is required",
                  });
                }
              }}
              onBlur={() => setTouched({ ...touched, base_unit: true })}
              placeholder="g, ml, piece, etc."
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.base_unit && touched.base_unit
                  ? "border-red-300"
                  : "border-gray-300"
              }`}
            />
            {errors.base_unit && touched.base_unit && (
              <p className="text-red-500 text-xs mt-1">{errors.base_unit}</p>
            )}
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={!formData.is_deleted}
                onChange={(e) =>
                  setFormData({ ...formData, is_deleted: !e.target.checked })
                }
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              {ingredient ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function IngredientsPage() {
  const [filterActive, setFilterActive] = useState<string>("all");
  const {
    data: ingredients,
    isLoading,
    error,
  } = useGetIngredientsQuery(
    filterActive === "all"
      ? undefined
      : filterActive === "active"
      ? { is_deleted: false }
      : { is_deleted: true }
  );
  const [deleteIngredient] = useDeleteIngredientMutation();
  const [createIngredient] = useCreateIngredientMutation();
  const [updateIngredient] = useUpdateIngredientMutation();
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteName, setDeleteName] = useState<string>("");
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(
    null
  );

  const handleDelete = (id: number, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (deleteId !== null) {
      try {
        await deleteIngredient(deleteId).unwrap();
        setShowDeleteModal(false);
        setDeleteId(null);
        setDeleteName("");
      } catch (err) {
        alert("Failed to delete ingredient");
      }
    }
  };

  const handleEdit = (item: Ingredient) => {
    setEditingIngredient(item);
    setShowModal(true);
  };

  const handleCreate = async (data: {
    name: string;
    base_unit: string;
    is_deleted?: boolean;
  }) => {
    await createIngredient(data).unwrap();
  };

  const handleUpdate = async (data: {
    name: string;
    base_unit: string;
    is_deleted?: boolean;
  }) => {
    if (editingIngredient) {
      await updateIngredient({
        id: editingIngredient.ingredient_id,
        data,
      }).unwrap();
    }
  };

  // Backend filters ingredients based on is_deleted parameter
  const filteredIngredients = ingredients || [];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading ingredients...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-red-500">Error loading ingredients</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Ingredient"
        message={`Are you sure you want to delete "${deleteName}"? This will deactivate the ingredient.`}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        isDestructive={true}
      />
      <IngredientModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingIngredient(null);
        }}
        onSubmit={editingIngredient ? handleUpdate : handleCreate}
        ingredient={editingIngredient}
      />
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Ingredients</h1>
            <p className="text-gray-600 mt-2">Manage ingredient definitions</p>
          </div>
          <div className="flex gap-2">
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => {
                setEditingIngredient(null);
                setShowModal(true);
              }}
            >
              Add Ingredient
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
                    Base Unit
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
                {filteredIngredients && filteredIngredients.length > 0 ? (
                  filteredIngredients.map((item) => (
                    <tr
                      key={item.ingredient_id}
                      className={`hover:bg-gray-50 ${
                        item.is_deleted ? "opacity-50" : ""
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{item.ingredient_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.base_unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            !item.is_deleted
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {!item.is_deleted ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(item.ingredient_id, item.name)
                            }
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
                      colSpan={5}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No ingredients found
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
