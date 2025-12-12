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

  useEffect(() => {
    if (role) {
      setFormData({
        role_name: role.role_name,
        seniority: role.seniority,
      });
    } else {
      setFormData({
        role_name: "",
        seniority: 1,
      });
    }
  }, [role, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
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
            onChange={(e) =>
              setFormData({ ...formData, role_name: e.target.value })
            }
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Seniority (Higher = More Senior)
          </label>
          <input
            type="number"
            required
            min="0"
            value={formData.seniority}
            onChange={(e) =>
              setFormData({
                ...formData,
                seniority: parseInt(e.target.value),
              })
            }
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
