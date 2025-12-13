import { useState, useEffect } from "react";
import { MenuItem, MenuItemCreate } from "@/store/api/menuItemsApi";
import { Modal } from "./Modal";

interface MenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MenuItemCreate) => Promise<void>;
  menuItem?: MenuItem | null;
}

export const MenuItemModal: React.FC<MenuItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  menuItem,
}) => {
  const [formData, setFormData] = useState<MenuItemCreate>({
    name: "",
    type: "",
    description: "",
    price: "",
    category: "",
    is_available: true,
  });
  const [errors, setErrors] = useState({
    name: "",
    type: "",
    category: "",
    price: "",
  });
  const [touched, setTouched] = useState({
    name: false,
    type: false,
    category: false,
    price: false,
  });

  useEffect(() => {
    if (menuItem) {
      setFormData({
        name: menuItem.name,
        type: menuItem.type,
        description: menuItem.description || "",
        price: menuItem.price,
        category: menuItem.category,
        is_available: menuItem.is_available,
      });
      setErrors({ name: "", type: "", category: "", price: "" });
      setTouched({ name: false, type: false, category: false, price: false });
    } else {
      setFormData({
        name: "",
        type: "",
        description: "",
        price: "",
        category: "",
        is_available: true,
      });
      setErrors({ name: "", type: "", category: "", price: "" });
      setTouched({ name: false, type: false, category: false, price: false });
    }
  }, [menuItem, isOpen]);

  const validateName = (name: string): string => {
    if (!name.trim()) {
      return "Name is required";
    }
    if (name.length > 50) {
      return "Name must be 50 characters or less";
    }
    return "";
  };

  const validateType = (type: string): string => {
    if (!type) {
      return "Please select a type";
    }
    return "";
  };

  const validateCategory = (category: string): string => {
    if (!category) {
      return "Please select a category";
    }
    return "";
  };

  const validatePrice = (price: string): string => {
    if (!price.trim()) {
      return "Price is required";
    }
    const numValue = parseFloat(price);
    if (isNaN(numValue)) {
      return "Price must be a valid number";
    }
    if (numValue < 0) {
      return "Price cannot be negative";
    }
    if (numValue > 999999) {
      return "Price cannot exceed 999999";
    }
    // Check decimal places
    const parts = price.split(".");
    if (parts[1] && parts[1].length > 2) {
      return "Price can have at most 2 decimal places";
    }
    return "";
  };

  const handleNameChange = (value: string) => {
    const limitedValue = value.slice(0, 50);
    setFormData((prev) => ({ ...prev, name: limitedValue }));
    if (touched.name) {
      setErrors((prev) => ({ ...prev, name: validateName(limitedValue) }));
    }
  };

  const handleNameBlur = () => {
    setTouched((prev) => ({ ...prev, name: true }));
    setErrors((prev) => ({ ...prev, name: validateName(formData.name) }));
  };

  const handleTypeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      type: value,
      // Set available to true by default, especially for Set type
      is_available: value === "Set" ? true : prev.is_available,
    }));
    if (touched.type) {
      setErrors((prev) => ({ ...prev, type: validateType(value) }));
    }
  };

  const handleTypeBlur = () => {
    setTouched((prev) => ({ ...prev, type: true }));
    setErrors((prev) => ({ ...prev, type: validateType(formData.type) }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }));
    if (touched.category) {
      setErrors((prev) => ({ ...prev, category: validateCategory(value) }));
    }
  };

  const handleCategoryBlur = () => {
    setTouched((prev) => ({ ...prev, category: true }));
    setErrors((prev) => ({
      ...prev,
      category: validateCategory(formData.category),
    }));
  };

  const handlePriceChange = (value: string) => {
    if (value === "") {
      setFormData((prev) => ({ ...prev, price: "" }));
      if (touched.price) {
        setErrors((prev) => ({ ...prev, price: validatePrice("") }));
      }
      return;
    }

    let v = value;
    // If user types .5 -> convert to 0.5
    if (v.startsWith(".")) v = "0" + v;
    // Remove invalid characters (allow digits and dot only)
    v = v.replace(/[^0-9.]/g, "");
    const parts = v.split(".");
    let intPart = parts[0] || "0";
    let decPart = parts[1] || "";

    // Limit integer digits to 6 (max 999999)
    if (intPart.length > 6) {
      intPart = intPart.slice(0, 6);
    }
    // Clamp numeric value
    if (Number(intPart) > 999999) {
      intPart = "999999";
    }

    // Limit decimals to 2 digits
    decPart = decPart.slice(0, 2);

    const newVal = decPart ? `${intPart}.${decPart}` : intPart;
    setFormData((prev) => ({ ...prev, price: newVal }));

    if (touched.price) {
      setErrors((prev) => ({ ...prev, price: validatePrice(newVal) }));
    }
  };

  const handlePriceBlur = () => {
    setTouched((prev) => ({ ...prev, price: true }));
    setErrors((prev) => ({ ...prev, price: validatePrice(formData.price) }));
  };

  const handleDescriptionChange = (value: string) => {
    const limitedValue = value.slice(0, 300);
    setFormData((prev) => ({ ...prev, description: limitedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched and validate
    setTouched({ name: true, type: true, category: true, price: true });

    const nameError = validateName(formData.name);
    const typeError = validateType(formData.type);
    const categoryError = validateCategory(formData.category);
    const priceError = validatePrice(formData.price);

    setErrors({
      name: nameError,
      type: typeError,
      category: categoryError,
      price: priceError,
    });

    // If any errors, don't submit
    if (nameError || typeError || categoryError || priceError) {
      return;
    }

    await onSubmit(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={menuItem ? "Edit Menu Item" : "Add New Menu Item"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.name && touched.name
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300"
            }`}
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            onBlur={handleNameBlur}
            required
            maxLength={50}
          />
          {errors.name && touched.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
          <p className="text-gray-400 text-xs mt-1">
            {formData.name.length}/50 characters
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.type && touched.type
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300"
            }`}
            value={formData.type}
            onChange={(e) => handleTypeChange(e.target.value)}
            onBlur={handleTypeBlur}
            required
          >
            <option value="" className="text-gray-400">
              Select Type
            </option>
            <option value="Dish">Dish</option>
            <option value="Addon">Addon</option>
            <option value="Set">Set</option>
          </select>
          {errors.type && touched.type && (
            <p className="mt-1 text-sm text-red-600">{errors.type}</p>
          )}
        </div>

        {formData.type === "Set" && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Set items are automatically set as
              available by default.
            </p>
          </div>
        )}

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            className={`w-full border rounded px-3 py-2 ${
              errors.category && touched.category
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300"
            }`}
            value={formData.category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            onBlur={handleCategoryBlur}
            required
          >
            <option value="" className="text-gray-400">
              Select Category
            </option>
            <option value="Main">Main</option>
            <option value="Topping">Topping</option>
            <option value="Drink">Drink</option>
            <option value="Appetizer">Appetizer</option>
          </select>
          {errors.category && touched.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price
            <span className="ml-1 text-xs text-gray-500 font-normal">
              (0–999999, up to 2 decimals)
            </span>
          </label>
          <input
            type="text"
            inputMode="decimal"
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.price && touched.price
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300"
            }`}
            value={formData.price}
            onChange={(e) => handlePriceChange(e.target.value)}
            onBlur={handlePriceBlur}
            placeholder="e.g. 199.99"
            required
          />
          {errors.price && touched.price && (
            <p className="mt-1 text-sm text-red-600">{errors.price}</p>
          )}
          {!errors.price && (
            <p className="text-gray-400 text-xs mt-1">
              Price must be between <span className="font-bold">0</span> and{" "}
              <span className="font-bold">999999</span>, with at most{" "}
              <span className="font-bold">2 decimal places</span>.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <input
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={formData.description || ""}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            maxLength={300}
          />
          <p className="text-gray-400 text-xs mt-1">
            {formData.description?.length || 0}/300 characters
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            value={formData.is_available ? "available" : "unavailable"}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                is_available: e.target.value === "available",
              }))
            }
            disabled={formData.type === "Set"}
          >
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
          {formData.type === "Set" && (
            <p className="text-gray-500 text-xs mt-1">
              Set items are always available by default.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {menuItem ? "Save Changes" : "Add Item"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
