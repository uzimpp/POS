import { useState, useEffect } from "react";
import { Stock, StockCreate } from "@/store/api/stockApi";
import { Branch } from "@/store/api/branchesApi";
import { useGetIngredientsQuery } from "@/store/api/ingredientsApi";
import { Modal } from "./Modal";

interface StockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StockCreate) => Promise<void>;
  stockItem?: Stock;
  branches: Branch[];
}

export const StockModal: React.FC<StockModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  stockItem,
  branches,
}) => {
  const { data: ingredients } = useGetIngredientsQuery();
  const [formData, setFormData] = useState<StockCreate>({
    ingredient_id: 0,
    amount_remaining: 0,
    branch_id: 0,
  });
  const [amountInput, setAmountInput] = useState<string>("");
  const [errors, setErrors] = useState({
    ingredient_id: "",
    branch_id: "",
  });
  const [touched, setTouched] = useState({
    ingredient_id: false,
    branch_id: false,
  });

  useEffect(() => {
    if (stockItem) {
      setFormData({
        ingredient_id: stockItem.ingredient_id,
        amount_remaining: stockItem.amount_remaining,
        branch_id: stockItem.branch_id,
      });
      setAmountInput(stockItem.amount_remaining.toString());
      setErrors({ ingredient_id: "", branch_id: "" });
      setTouched({ ingredient_id: false, branch_id: false });
    } else {
      setFormData({
        ingredient_id: 0,
        amount_remaining: 0,
        branch_id: branches.length > 0 ? branches[0].branch_id : 0,
      });
      setAmountInput("");
      setErrors({ ingredient_id: "", branch_id: "" });
      setTouched({ ingredient_id: false, branch_id: false });
    }
  }, [stockItem, isOpen, branches]);

  const validateIngredient = (ingredientId: number): string => {
    if (ingredientId === 0) {
      return "Please select an ingredient";
    }
    return "";
  };

  const validateBranch = (branchId: number): string => {
    if (branchId === 0) {
      return "Please select a branch";
    }
    return "";
  };

  const handleIngredientChange = (ingredientId: number) => {
    setFormData((prev) => ({ ...prev, ingredient_id: ingredientId }));
    if (touched.ingredient_id) {
      setErrors((prev) => ({
        ...prev,
        ingredient_id: validateIngredient(ingredientId),
      }));
    }
  };

  const handleIngredientBlur = () => {
    setTouched((prev) => ({ ...prev, ingredient_id: true }));
    setErrors((prev) => ({
      ...prev,
      ingredient_id: validateIngredient(formData.ingredient_id),
    }));
  };

  const handleBranchChange = (branchId: number) => {
    setFormData((prev) => ({ ...prev, branch_id: branchId }));
    if (touched.branch_id) {
      setErrors((prev) => ({ ...prev, branch_id: validateBranch(branchId) }));
    }
  };

  const handleBranchBlur = () => {
    setTouched((prev) => ({ ...prev, branch_id: true }));
    setErrors((prev) => ({
      ...prev,
      branch_id: validateBranch(formData.branch_id),
    }));
  };

  const handleAmountChange = (value: string) => {
    // Allow empty string for better UX
    setAmountInput(value);

    // Only update formData if it's a valid number
    if (value === "" || value === "-") {
      // Keep empty or allow negative sign for typing
      return;
    }

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setFormData({
        ...formData,
        amount_remaining: numValue,
      });
    }
  };

  const handleAmountBlur = () => {
    // On blur, ensure we have a valid number
    if (amountInput === "" || amountInput === "-") {
      setAmountInput("0");
      setFormData({
        ...formData,
        amount_remaining: 0,
      });
    } else {
      const numValue = parseFloat(amountInput);
      if (isNaN(numValue) || numValue < 0) {
        setAmountInput("0");
        setFormData({
          ...formData,
          amount_remaining: 0,
        });
      } else {
        // Normalize the display (remove leading zeros, etc.)
        setAmountInput(numValue.toString());
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched and validate
    setTouched({ ingredient_id: true, branch_id: true });

    const ingredientError = validateIngredient(formData.ingredient_id);
    const branchError = validateBranch(formData.branch_id);

    setErrors({
      ingredient_id: ingredientError,
      branch_id: branchError,
    });

    // If any errors, don't submit
    if (ingredientError || branchError) {
      return;
    }

    // Ensure we have a valid number before submit
    const finalAmount =
      amountInput === "" || amountInput === "-"
        ? 0
        : parseFloat(amountInput) || 0;

    await onSubmit({
      ...formData,
      amount_remaining: finalAmount >= 0 ? finalAmount : 0,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={stockItem ? "Edit Stock Item" : "Add Stock Item"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Ingredient *
          </label>
          <select
            value={formData.ingredient_id}
            onChange={(e) => handleIngredientChange(Number(e.target.value))}
            onBlur={handleIngredientBlur}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.ingredient_id && touched.ingredient_id
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300"
            }`}
          >
            <option value={0}>Select Ingredient</option>
            {ingredients
              ?.filter((ing) => !ing.is_deleted)
              .map((ingredient) => (
                <option
                  key={ingredient.ingredient_id}
                  value={ingredient.ingredient_id}
                >
                  {ingredient.name} ({ingredient.base_unit})
                </option>
              ))}
          </select>
          {errors.ingredient_id && touched.ingredient_id && (
            <p className="mt-1 text-sm text-red-600">{errors.ingredient_id}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Amount Remaining *
          </label>
          <input
            type="text"
            required
            inputMode="decimal"
            value={amountInput}
            onChange={(e) => {
              const value = e.target.value;
              // Allow: empty, numbers, decimal point, and negative sign (for typing)
              if (value === "" || /^-?\d*\.?\d*$/.test(value)) {
                handleAmountChange(value);
              }
            }}
            onBlur={handleAmountBlur}
            placeholder="0.00"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Branch
          </label>
          <select
            value={formData.branch_id}
            onChange={(e) => handleBranchChange(Number(e.target.value))}
            onBlur={handleBranchBlur}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.branch_id && touched.branch_id
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300"
            }`}
          >
            <option value={0}>Select Branch</option>
            {branches.map((branch) => (
              <option key={branch.branch_id} value={branch.branch_id}>
                {branch.name}
              </option>
            ))}
          </select>
          {errors.branch_id && touched.branch_id && (
            <p className="mt-1 text-sm text-red-600">{errors.branch_id}</p>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {stockItem ? "Update" : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
