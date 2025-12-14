import { useState, useEffect } from "react";
import { Role, RoleCreate } from "@/store/api/rolesApi";
import { Modal } from "./Modal";

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RoleCreate) => Promise<void>;
  role?: Role | null;
}

export const RoleModal: React.FC<RoleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  role,
}) => {
  const [formData, setFormData] = useState<RoleCreate>({
    role_name: "",
    seniority: 1,
  });
  const [seniorityInput, setSeniorityInput] = useState<string>("");
  const [errors, setErrors] = useState({
    role_name: "",
    seniority: "",
  });
  const [touched, setTouched] = useState({
    role_name: false,
    seniority: false,
  });

  useEffect(() => {
    if (role) {
      setFormData({
        role_name: role.role_name,
        seniority: role.seniority,
      });
      setSeniorityInput(role.seniority.toString());
      setErrors({ role_name: "", seniority: "" });
      setTouched({ role_name: false, seniority: false });
    } else {
      setFormData({
        role_name: "",
        seniority: 1,
      });
      setSeniorityInput("1");
      setErrors({ role_name: "", seniority: "" });
      setTouched({ role_name: false, seniority: false });
    }
  }, [role, isOpen]);

  const validateRoleName = (roleName: string): string => {
    if (!roleName.trim()) {
      return "Role name is required";
    }
    return "";
  };

  const handleRoleNameChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role_name: value }));
    if (touched.role_name) {
      setErrors((prev) => ({ ...prev, role_name: validateRoleName(value) }));
    }
  };

  const handleRoleNameBlur = () => {
    setTouched((prev) => ({ ...prev, role_name: true }));
    setErrors((prev) => ({
      ...prev,
      role_name: validateRoleName(formData.role_name),
    }));
  };

  const handleSeniorityChange = (value: string) => {
    setSeniorityInput(value);

    if (value === "" || value === "-") {
      return;
    }

    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setFormData({
        ...formData,
        seniority: numValue,
      });
    }
  };

  const handleSeniorityBlur = () => {
    if (seniorityInput === "" || seniorityInput === "-") {
      setSeniorityInput("1");
      setFormData({
        ...formData,
        seniority: 1,
      });
    } else {
      const numValue = parseInt(seniorityInput, 10);
      if (isNaN(numValue) || numValue < 0) {
        setSeniorityInput("1");
        setFormData({
          ...formData,
          seniority: 1,
        });
      } else {
        setSeniorityInput(numValue.toString());
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched and validate
    setTouched({ role_name: true, seniority: true });

    const roleNameError = validateRoleName(formData.role_name);
    setErrors({
      role_name: roleNameError,
      seniority: "",
    });

    // If any errors, don't submit
    if (roleNameError) {
      return;
    }

    const finalSeniority =
      seniorityInput === "" || seniorityInput === "-"
        ? 1
        : parseInt(seniorityInput, 10) || 1;

    await onSubmit({
      ...formData,
      seniority: finalSeniority >= 0 ? finalSeniority : 1,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={role ? "Edit Role" : "Add New Role"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Role Name
          </label>
          <input
            type="text"
            required
            value={formData.role_name}
            onChange={(e) => handleRoleNameChange(e.target.value)}
            onBlur={handleRoleNameBlur}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.role_name && touched.role_name
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300"
            }`}
          />
          {errors.role_name && touched.role_name && (
            <p className="mt-1 text-sm text-red-600">{errors.role_name}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Seniority (Higher = More Senior)
          </label>
          <input
            type="text"
            required
            inputMode="numeric"
            value={seniorityInput}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "" || /^-?\d+$/.test(value)) {
                handleSeniorityChange(value);
              }
            }}
            onBlur={handleSeniorityBlur}
            placeholder="1"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
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
            {role ? "Save Changes" : "Add Role"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
