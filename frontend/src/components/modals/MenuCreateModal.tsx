import { useState, useEffect } from "react";
import { MenuCreate, useCreateMenuMutation } from "@/store/api/menuApi";
import { useCreateRecipeMutation, RecipeCreate } from "@/store/api/recipeApi";
import { useGetIngredientsQuery } from "@/store/api/ingredientsApi";
import { Modal } from "./Modal";

interface MenuCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void; // Called when both steps are complete
}

export const MenuCreateModal: React.FC<MenuCreateModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [createdMenuId, setCreatedMenuId] = useState<number | null>(null);

  // Menu form data (Step 1)
  const [menuFormData, setMenuFormData] = useState<MenuCreate>({
    name: "",
    type: "",
    description: "",
    price: "",
    category: "",
    is_available: true,
  });
  const [menuErrors, setMenuErrors] = useState({
    name: "",
    type: "",
    category: "",
    price: "",
  });
  const [menuTouched, setMenuTouched] = useState({
    name: false,
    type: false,
    category: false,
    price: false,
  });

  // Recipe form data (Step 2)
  const [recipeFormData, setRecipeFormData] = useState({
    ingredient_id: "",
    qty_per_unit: "",
  });
  const [recipes, setRecipes] = useState<
    Array<{ ingredient_id: number; qty_per_unit: string }>
  >([]);
  const [editingRecipeIndex, setEditingRecipeIndex] = useState<number | null>(
    null
  );
  const [recipeErrors, setRecipeErrors] = useState({
    ingredient_id: "",
    qty_per_unit: "",
  });

  const [createMenu] = useCreateMenuMutation();
  const [createRecipe] = useCreateRecipeMutation();
  const { data: ingredients } = useGetIngredientsQuery();

  const activeIngredients = ingredients?.filter((ing) => !ing.is_deleted) || [];

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setCreatedMenuId(null);
      setMenuFormData({
        name: "",
        type: "",
        description: "",
        price: "",
        category: "",
        is_available: true,
      });
      setRecipes([]);
      setRecipeFormData({ ingredient_id: "", qty_per_unit: "" });
      setEditingRecipeIndex(null);
      setMenuErrors({ name: "", type: "", category: "", price: "" });
      setMenuTouched({
        name: false,
        type: false,
        category: false,
        price: false,
      });
      setRecipeErrors({ ingredient_id: "", qty_per_unit: "" });
    }
  }, [isOpen]);

  // Validation functions for Step 1
  const validateName = (name: string): string => {
    if (!name.trim()) return "Name is required";
    if (name.length > 50) return "Name must be 50 characters or less";
    return "";
  };

  const validateType = (type: string): string => {
    if (!type) return "Please select a type";
    return "";
  };

  const validateCategory = (category: string): string => {
    if (!category) return "Please select a category";
    return "";
  };

  const validatePrice = (price: string): string => {
    if (!price.trim()) return "Price is required";
    const numValue = parseFloat(price);
    if (isNaN(numValue)) return "Price must be a valid number";
    if (numValue < 0) return "Price cannot be negative";
    if (numValue > 999999) return "Price cannot exceed 999999";
    const parts = price.split(".");
    if (parts[1] && parts[1].length > 2)
      return "Price can have at most 2 decimal places";
    return "";
  };

  // Validation for Step 2
  const validateRecipe = () => {
    const newErrors = { ingredient_id: "", qty_per_unit: "" };
    let isValid = true;

    if (!recipeFormData.ingredient_id) {
      newErrors.ingredient_id = "Ingredient is required";
      isValid = false;
    }

    if (
      !recipeFormData.qty_per_unit ||
      parseFloat(recipeFormData.qty_per_unit) <= 0
    ) {
      newErrors.qty_per_unit = "Quantity must be greater than 0";
      isValid = false;
    }

    setRecipeErrors(newErrors);
    return isValid;
  };

  // Handle Step 1 submission
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();

    setMenuTouched({ name: true, type: true, category: true, price: true });

    const nameError = validateName(menuFormData.name);
    const typeError = validateType(menuFormData.type);
    const categoryError = validateCategory(menuFormData.category);
    const priceError = validatePrice(menuFormData.price);

    setMenuErrors({
      name: nameError,
      type: typeError,
      category: categoryError,
      price: priceError,
    });

    if (nameError || typeError || categoryError || priceError) {
      return;
    }

    try {
      const result = await createMenu(menuFormData).unwrap();
      setCreatedMenuId(result.menu_item_id);
      setStep(2);
    } catch (err: any) {
      alert(err?.data?.detail || "Failed to create menu item");
    }
  };

  // Handle adding/editing recipe
  const handleAddRecipe = () => {
    if (!validateRecipe()) return;

    const recipe = {
      ingredient_id: Number(recipeFormData.ingredient_id),
      qty_per_unit: recipeFormData.qty_per_unit,
    };

    if (editingRecipeIndex !== null) {
      // Update existing recipe
      const updated = [...recipes];
      updated[editingRecipeIndex] = recipe;
      setRecipes(updated);
      setEditingRecipeIndex(null);
    } else {
      // Check if ingredient already exists in the list
      const existingIndex = recipes.findIndex(
        (r) => r.ingredient_id === recipe.ingredient_id
      );

      if (existingIndex !== -1) {
        // Increment quantity for existing ingredient
        const updated = [...recipes];
        const existingQty =
          parseFloat(updated[existingIndex].qty_per_unit) || 0;
        const newQty = parseFloat(recipe.qty_per_unit) || 0;
        updated[existingIndex] = {
          ...updated[existingIndex],
          qty_per_unit: (existingQty + newQty).toFixed(2),
        };
        setRecipes(updated);
      } else {
        // Add new recipe
        setRecipes([...recipes, recipe]);
      }
    }

    setRecipeFormData({ ingredient_id: "", qty_per_unit: "" });
    setRecipeErrors({ ingredient_id: "", qty_per_unit: "" });
  };

  const handleEditRecipe = (index: number) => {
    const recipe = recipes[index];
    setRecipeFormData({
      ingredient_id: recipe.ingredient_id.toString(),
      qty_per_unit: recipe.qty_per_unit,
    });
    setEditingRecipeIndex(index);
  };

  const handleDeleteRecipe = (index: number) => {
    setRecipes(recipes.filter((_, i) => i !== index));
    if (editingRecipeIndex === index) {
      setEditingRecipeIndex(null);
      setRecipeFormData({ ingredient_id: "", qty_per_unit: "" });
    }
  };

  // Handle Step 2 completion
  const handleStep2Complete = async () => {
    if (!createdMenuId) return;

    try {
      // Create all recipes
      for (const recipe of recipes) {
        await createRecipe({
          menu_item_id: createdMenuId,
          ingredient_id: recipe.ingredient_id,
          qty_per_unit: recipe.qty_per_unit,
        }).unwrap();
      }

      onComplete();
      onClose();
    } catch (err: any) {
      alert(err?.data?.detail || "Failed to save recipes");
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleCancel = () => {
    if (step === 2 && createdMenuId) {
      if (
        confirm(
          "Are you sure you want to cancel? The menu item has been created but recipes won't be saved."
        )
      ) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={
        step === 1
          ? "Add New Menu Item - Step 1: Menu Information"
          : "Add New Menu Item - Step 2: Recipe Ingredients"
      }
    >
      {/* Step Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-center">
          <div className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                step >= 1
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              1
            </div>
            <div className="w-16 h-1 bg-gray-200 mx-2">
              <div
                className={`h-full transition-all ${
                  step >= 2 ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            </div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                step >= 2
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              2
            </div>
          </div>
        </div>
        <div className="flex justify-center mt-2 text-sm text-gray-600">
          <span className={step === 1 ? "font-semibold text-blue-600" : ""}>
            Menu Info
          </span>
          <span className="mx-4">→</span>
          <span className={step === 2 ? "font-semibold text-blue-600" : ""}>
            Recipe
          </span>
        </div>
      </div>

      {step === 1 ? (
        <form onSubmit={handleStep1Submit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                menuErrors.name && menuTouched.name
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300"
              }`}
              value={menuFormData.name}
              onChange={(e) => {
                const value = e.target.value.slice(0, 50);
                setMenuFormData((prev) => ({ ...prev, name: value }));
                if (menuTouched.name) {
                  setMenuErrors((prev) => ({
                    ...prev,
                    name: validateName(value),
                  }));
                }
              }}
              onBlur={() => {
                setMenuTouched((prev) => ({ ...prev, name: true }));
                setMenuErrors((prev) => ({
                  ...prev,
                  name: validateName(menuFormData.name),
                }));
              }}
              required
              maxLength={50}
            />
            {menuErrors.name && menuTouched.name && (
              <p className="mt-1 text-sm text-red-600">{menuErrors.name}</p>
            )}
            <p className="text-gray-400 text-xs mt-1">
              {menuFormData.name.length}/50 characters
            </p>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>
            <select
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                menuErrors.type && menuTouched.type
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300"
              }`}
              value={menuFormData.type}
              onChange={(e) => {
                setMenuFormData((prev) => ({
                  ...prev,
                  type: e.target.value,
                  is_available:
                    e.target.value === "Set" ? true : prev.is_available,
                }));
                if (menuTouched.type) {
                  setMenuErrors((prev) => ({
                    ...prev,
                    type: validateType(e.target.value),
                  }));
                }
              }}
              onBlur={() => {
                setMenuTouched((prev) => ({ ...prev, type: true }));
                setMenuErrors((prev) => ({
                  ...prev,
                  type: validateType(menuFormData.type),
                }));
              }}
              required
            >
              <option value="">Select Type</option>
              <option value="Dish">Dish</option>
              <option value="Addon">Addon</option>
              <option value="Set">Set</option>
            </select>
            {menuErrors.type && menuTouched.type && (
              <p className="mt-1 text-sm text-red-600">{menuErrors.type}</p>
            )}
          </div>

          {menuFormData.type === "Set" && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Set items are automatically set as
                available by default.
              </p>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Category *
            </label>
            <select
              className={`w-full border rounded px-3 py-2 ${
                menuErrors.category && menuTouched.category
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300"
              }`}
              value={menuFormData.category}
              onChange={(e) => {
                setMenuFormData((prev) => ({
                  ...prev,
                  category: e.target.value,
                }));
                if (menuTouched.category) {
                  setMenuErrors((prev) => ({
                    ...prev,
                    category: validateCategory(e.target.value),
                  }));
                }
              }}
              onBlur={() => {
                setMenuTouched((prev) => ({ ...prev, category: true }));
                setMenuErrors((prev) => ({
                  ...prev,
                  category: validateCategory(menuFormData.category),
                }));
              }}
              required
            >
              <option value="">Select Category</option>
              <option value="Main">Main</option>
              <option value="Topping">Topping</option>
              <option value="Drink">Drink</option>
              <option value="Appetizer">Appetizer</option>
            </select>
            {menuErrors.category && menuTouched.category && (
              <p className="mt-1 text-sm text-red-600">{menuErrors.category}</p>
            )}
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price *
              <span className="ml-1 text-xs text-gray-500 font-normal">
                (0–999999, up to 2 decimals)
              </span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                menuErrors.price && menuTouched.price
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300"
              }`}
              value={menuFormData.price}
              onChange={(e) => {
                let value = e.target.value;
                if (value.startsWith(".")) value = "0" + value;
                value = value.replace(/[^0-9.]/g, "");
                const parts = value.split(".");
                let intPart = parts[0] || "0";
                let decPart = parts[1] || "";
                if (intPart.length > 6) intPart = intPart.slice(0, 6);
                if (Number(intPart) > 999999) intPart = "999999";
                decPart = decPart.slice(0, 2);
                const newVal = decPart ? `${intPart}.${decPart}` : intPart;
                setMenuFormData((prev) => ({ ...prev, price: newVal }));
                if (menuTouched.price) {
                  setMenuErrors((prev) => ({
                    ...prev,
                    price: validatePrice(newVal),
                  }));
                }
              }}
              onBlur={() => {
                setMenuTouched((prev) => ({ ...prev, price: true }));
                setMenuErrors((prev) => ({
                  ...prev,
                  price: validatePrice(menuFormData.price),
                }));
              }}
              placeholder="e.g. 199.99"
              required
            />
            {menuErrors.price && menuTouched.price && (
              <p className="mt-1 text-sm text-red-600">{menuErrors.price}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={menuFormData.description || ""}
              onChange={(e) =>
                setMenuFormData((prev) => ({
                  ...prev,
                  description: e.target.value.slice(0, 300),
                }))
              }
              maxLength={300}
            />
            <p className="text-gray-400 text-xs mt-1">
              {menuFormData.description?.length || 0}/300 characters
            </p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={menuFormData.is_available ? "available" : "unavailable"}
              onChange={(e) =>
                setMenuFormData((prev) => ({
                  ...prev,
                  is_available: e.target.value === "available",
                }))
              }
              disabled={menuFormData.type === "Set"}
            >
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
            {menuFormData.type === "Set" && (
              <p className="text-gray-500 text-xs mt-1">
                Set items are always available by default.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Next: Add Recipe
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-sm text-blue-800">
              <strong>Step 2:</strong> Add recipe ingredients for this menu
              item. You can add multiple ingredients with their quantities.
            </p>
          </div>

          {/* Add/Edit Recipe Form */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">
              {editingRecipeIndex !== null
                ? "Edit Ingredient"
                : "Add Ingredient"}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ingredient *
                </label>
                <select
                  value={recipeFormData.ingredient_id}
                  onChange={(e) =>
                    setRecipeFormData({
                      ...recipeFormData,
                      ingredient_id: e.target.value,
                    })
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
                {recipeErrors.ingredient_id && (
                  <p className="text-red-500 text-xs mt-1">
                    {recipeErrors.ingredient_id}
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
                  value={recipeFormData.qty_per_unit}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^\d*\.?\d*$/.test(value)) {
                      setRecipeFormData({
                        ...recipeFormData,
                        qty_per_unit: value,
                      });
                    }
                  }}
                  onBlur={() => {
                    if (
                      recipeFormData.qty_per_unit &&
                      parseFloat(recipeFormData.qty_per_unit) <= 0
                    ) {
                      setRecipeErrors({
                        ...recipeErrors,
                        qty_per_unit: "Quantity must be greater than 0",
                      });
                    } else {
                      setRecipeErrors({ ...recipeErrors, qty_per_unit: "" });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
                {recipeErrors.qty_per_unit && (
                  <p className="text-red-500 text-xs mt-1">
                    {recipeErrors.qty_per_unit}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddRecipe}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingRecipeIndex !== null ? "Update" : "Add"}
                </button>
                {editingRecipeIndex !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRecipeIndex(null);
                      setRecipeFormData({
                        ingredient_id: "",
                        qty_per_unit: "",
                      });
                      setRecipeErrors({ ingredient_id: "", qty_per_unit: "" });
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Recipe List */}
          {recipes.length > 0 ? (
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
                  {recipes.map((recipe, index) => {
                    const ingredient = activeIngredients.find(
                      (ing) => ing.ingredient_id === recipe.ingredient_id
                    );
                    return (
                      <tr key={index} className="hover:bg-gray-50">
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
                              onClick={() => handleEditRecipe(index)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteRecipe(index)}
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
          ) : (
            <div className="text-center py-4 text-gray-500 border border-gray-200 rounded-lg">
              No ingredients added yet. Add at least one ingredient to continue.
            </div>
          )}

          <div className="flex justify-between gap-2 pt-4">
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              ← Back
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStep2Complete}
                disabled={recipes.length === 0}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
