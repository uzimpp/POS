import { useState, useEffect } from "react";
import { Branch, BranchCreate } from "@/store/api/branchesApi";
import { Modal } from "./Modal";

interface BranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BranchCreate) => Promise<void>;
  branch?: Branch | null;
}

export const BranchModal: React.FC<BranchModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  branch,
}) => {
  const [formData, setFormData] = useState<BranchCreate>({
    name: "",
    address: "",
    phone: "",
    is_deleted: false,
  });
  const [errors, setErrors] = useState({
    name: "",
    address: "",
    phone: "",
  });
  const [touched, setTouched] = useState({
    name: false,
    address: false,
    phone: false,
  });

  useEffect(() => {
    if (branch) {
      setFormData({
        name: branch.name,
        address: branch.address,
        phone: branch.phone,
        is_deleted: branch.is_deleted,
      });
      setErrors({ name: "", address: "", phone: "" });
      setTouched({ name: false, address: false, phone: false });
    } else {
      setFormData({
        name: "",
        address: "",
        phone: "",
        is_deleted: false,
      });
      setErrors({ name: "", address: "", phone: "" });
      setTouched({ name: false, address: false, phone: false });
    }
  }, [branch, isOpen]);

  const validateName = (name: string): string => {
    if (!name.trim()) {
      return "Branch name is required";
    }
    return "";
  };

  const validateAddress = (address: string): string => {
    if (!address.trim()) {
      return "Address is required";
    }
    return "";
  };

  const validatePhone = (phone: string): string => {
    // Remove any non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, "");

    if (digitsOnly.length === 0) {
      return "Phone number is required";
    }

    if (digitsOnly.length < 9) {
      return "Phone number must be at least 9 digits";
    }

    if (digitsOnly.length > 10) {
      return "Phone number must be at most 10 digits";
    }

    if (digitsOnly.length !== 9 && digitsOnly.length !== 10) {
      return "Phone number must be 9 digits (company) or 10 digits (normal)";
    }

    return "";
  };

  const handleNameChange = (value: string) => {
    setFormData((prev) => ({ ...prev, name: value }));
    if (touched.name) {
      setErrors((prev) => ({ ...prev, name: validateName(value) }));
    }
  };

  const handleNameBlur = () => {
    setTouched((prev) => ({ ...prev, name: true }));
    setErrors((prev) => ({ ...prev, name: validateName(formData.name) }));
  };

  const handleAddressChange = (value: string) => {
    setFormData((prev) => ({ ...prev, address: value }));
    if (touched.address) {
      setErrors((prev) => ({ ...prev, address: validateAddress(value) }));
    }
  };

  const handleAddressBlur = () => {
    setTouched((prev) => ({ ...prev, address: true }));
    setErrors((prev) => ({
      ...prev,
      address: validateAddress(formData.address),
    }));
  };

  const handlePhoneChange = (value: string) => {
    // Only allow digits
    const digitsOnly = value.replace(/\D/g, "");

    // Limit to 10 digits
    const limitedValue = digitsOnly.slice(0, 10);

    setFormData((prev) => ({ ...prev, phone: limitedValue }));

    // Validate only if user has touched the field
    if (touched.phone) {
      setErrors((prev) => ({ ...prev, phone: validatePhone(limitedValue) }));
    }
  };

  const handlePhoneBlur = () => {
    setTouched((prev) => ({ ...prev, phone: true }));
    setErrors((prev) => ({ ...prev, phone: validatePhone(formData.phone) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched and validate
    setTouched({ name: true, address: true, phone: true });

    const nameError = validateName(formData.name);
    const addressError = validateAddress(formData.address);
    const phoneError = validatePhone(formData.phone);

    setErrors({
      name: nameError,
      address: addressError,
      phone: phoneError,
    });

    // If any errors, don't submit
    if (nameError || addressError || phoneError) {
      return;
    }

    await onSubmit(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={branch ? "Edit Branch" : "Add New Branch"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Branch Name
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            onBlur={handleNameBlur}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.name && touched.name
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300"
            }`}
          />
          {errors.name && touched.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Address
          </label>
          <input
            type="text"
            required
            value={formData.address}
            onChange={(e) => handleAddressChange(e.target.value)}
            onBlur={handleAddressBlur}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.address && touched.address
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300"
            }`}
          />
          {errors.address && touched.address && (
            <p className="mt-1 text-sm text-red-600">{errors.address}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Phone
            <span className="ml-1 text-xs text-gray-500 font-normal">
              (9 digits for company, 10 digits for normal)
            </span>
          </label>
          <input
            type="text"
            required
            inputMode="tel"
            value={formData.phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            onBlur={handlePhoneBlur}
            placeholder="e.g. 0987654321"
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.phone && touched.phone
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300"
            }`}
          />
          {errors.phone && touched.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
          )}
          {!errors.phone && formData.phone && touched.phone && (
            <p className="mt-1 text-xs text-gray-500">
              {formData.phone.replace(/\D/g, "").length === 9
                ? "Company phone (9 digits)"
                : "Normal phone (10 digits)"}
            </p>
          )}
        </div>
        <div className="pt-4 flex justify-end gap-3">
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
            {branch ? "Save Changes" : "Add Branch"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
