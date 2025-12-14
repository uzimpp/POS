import { useState, useEffect } from "react";
import { Modal } from "./Modal";
import {
  useGetRecipesByMenuQuery,
  useCreateRecipeMutation,
  useUpdateRecipeMutation,
  useDeleteRecipeMutation,
  Recipe,
} from "@/store/api/recipeApi";
import { useGetIngredientsQuery, Ingredient } from "@/store/api/ingredientsApi";
import { Menu } from "@/store/api/menuApi";

interface RecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  menu: Menu;
}

export const RecipeModal: React.FC<RecipeModalProps> = ({
  isOpen,
  onClose,
  menu,
}) => {
  const { data: recipes, isLoading: recipesLoading } = useGetRecipesByMenuQuery(
    menu.menu_item_id
  );
  const { data: ingredients, isLoading: ingredientsLoading } =
    useGetIngredientsQuery();
  const [createRecipe] = useCreateRecipeMutation();
  const [updateRecipe] = useUpdateRecipeMutation();
  const [deleteRecipe] = useDeleteRecipeMutation();

  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    ingredient_id: "",
    qty_per_unit: "",
  });
  const [errors, setErrors] = useState({
    ingredient_id: "",
    qty_per_unit: "",
  });

  useEffect(() => {
    if (!isOpen) {
      setEditingRecipe(null);
      setShowAddForm(false);
      setFormData({ ingredient_id: "", qty_per_unit: "" });
      setErrors({ ingredient_id: "", qty_per_unit: "" });
    }
  }, [isOpen]);

  const handleAdd = () => {
    setShowAddForm(true);
    setEditingRecipe(null);
    setFormData({ ingredient_id: "", qty_per_unit: "" });
    setErrors({ ingredient_id: "", qty_per_unit: "" });
  };

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setShowAddForm(false);
    setFormData({
      ingredient_id: recipe.ingredient_id.toString(),
      qty_per_unit: recipe.qty_per_unit,
    });
    setErrors({ ingredient_id: "", qty_per_unit: "" });
  };

  const handleCancel = () => {
    setEditingRecipe(null);
    setShowAddForm(false);
    setFormData({ ingredient_id: "", qty_per_unit: "" });
    setErrors({ ingredient_id: "", qty_per_unit: "" });
  };

  const validate = () => {
    const newErrors = { ingredient_id: "", qty_per_unit: "" };
    let isValid = true;

    if (!formData.ingredient_id) {
      newErrors.ingredient_id = "Ingredient is required";
      isValid = false;
    }

    if (!formData.qty_per_unit || parseFloat(formData.qty_per_unit) <= 0) {
      newErrors.qty_per_unit = "Quantity must be greater than 0";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const recipeData = {
        menu_item_id: menu.menu_item_id,
        ingredient_id: Number(formData.ingredient_id),
        qty_per_unit: formData.qty_per_unit,
      };

      if (editingRecipe) {
        await updateRecipe({
          id: editingRecipe.id,
          data: recipeData,
        }).unwrap();
      } else {
        await createRecipe(recipeData).unwrap();
      }

      handleCancel();
    } catch (err: any) {
      alert(err?.data?.detail || "Failed to save recipe");
    }
  };

  const handleDelete = async (recipeId: number) => {
    if (!confirm("Delete this recipe entry?")) return;
    try {
      await deleteRecipe(recipeId).unwrap();
    } catch (err: any) {
      alert(err?.data?.detail || "Failed to delete recipe");
    }
  };

  const activeIngredients = ingredients?.filter((ing) => !ing.is_deleted) || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Manage Recipe: ${menu.name}`}
    >
      <div className="space-y-4">
        {/* Add/Edit Form */}
        {(showAddForm || editingRecipe) && (
          <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">
              {editingRecipe ? "Edit Recipe" : "Add Ingredient"}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ingredient *
                </label>
                <select
                  value={formData.ingredient_id}
                  onChange={(e) =>
                    setFormData({ ...formData, ingredient_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Ingredient</option>
                  {activeIngredients.map((ing) => (
                    <option key={ing.ingredient_id} value={ing.ingredient_id}>
                      {ing.name} ({ing.base_unit})
                    </option>
                  ))}
                </select>
                {errors.ingredient_id && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.ingredient_id}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity per Unit *
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.qty_per_unit}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^\d*\.?\d*$/.test(value)) {
                      setFormData({ ...formData, qty_per_unit: value });
                    }
                  }}
                  onBlur={() => {
                    if (
                      formData.qty_per_unit &&
                      parseFloat(formData.qty_per_unit) <= 0
                    ) {
                      setErrors({
                        ...errors,
                        qty_per_unit: "Quantity must be greater than 0",
                      });
                    } else {
                      setErrors({ ...errors, qty_per_unit: "" });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
                {errors.qty_per_unit && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.qty_per_unit}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingRecipe ? "Update" : "Add"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Recipe List */}
        {recipesLoading || ingredientsLoading ? (
          <div className="text-center py-4 text-gray-500">Loading...</div>
        ) : recipes && recipes.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-800">Current Recipe</h3>
              {!showAddForm && !editingRecipe && (
                <button
                  onClick={handleAdd}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  + Add Ingredient
                </button>
              )}
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Ingredient
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Quantity
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Unit
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recipes.map((recipe) => {
                    const ingredient = ingredients?.find(
                      (ing) => ing.ingredient_id === recipe.ingredient_id
                    );
                    return (
                      <tr key={recipe.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {ingredient?.name || "Unknown"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {parseFloat(recipe.qty_per_unit).toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {ingredient?.base_unit || "-"}
                        </td>
                        <td className="px-4 py-2 text-sm text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(recipe)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(recipe.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              No recipe ingredients added yet
            </p>
            {!showAddForm && !editingRecipe && (
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                + Add First Ingredient
              </button>
            )}
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
