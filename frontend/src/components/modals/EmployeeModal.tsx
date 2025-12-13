import { useState, useEffect } from "react";
import { Employee, EmployeeCreate } from "@/store/api/employeesApi";
import { Role } from "@/store/api/rolesApi";
import { Branch } from "@/store/api/branchesApi";
import { Modal } from "./Modal";

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EmployeeCreate) => Promise<void>;
  employee?: Employee;
  roles: Role[];
  branches: Branch[];
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  employee,
  roles,
  branches,
}) => {
  const [formData, setFormData] = useState<EmployeeCreate>({
    first_name: "",
    last_name: "",
    role_id: 0,
    branch_id: 0,
    salary: 0,
    is_active: true,
  });
  const [salaryInput, setSalaryInput] = useState<string>("");
  const [errors, setErrors] = useState({
    first_name: "",
    last_name: "",
    role_id: "",
    branch_id: "",
  });
  const [touched, setTouched] = useState({
    first_name: false,
    last_name: false,
    role_id: false,
    branch_id: false,
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        first_name: employee.first_name,
        last_name: employee.last_name,
        role_id: employee.role_id,
        branch_id: employee.branch_id || 0,
        salary: employee.salary,
        is_active: employee.is_active,
      });
      setSalaryInput(employee.salary.toString());
      setErrors({ first_name: "", last_name: "", role_id: "", branch_id: "" });
      setTouched({
        first_name: false,
        last_name: false,
        role_id: false,
        branch_id: false,
      });
    } else {
      setFormData({
        first_name: "",
        last_name: "",
        role_id: roles.length > 0 ? roles[0].role_id : 0,
        branch_id: branches.length > 0 ? branches[0].branch_id : 0,
        salary: 0,
        is_active: true,
      });
      setSalaryInput("");
      setErrors({ first_name: "", last_name: "", role_id: "", branch_id: "" });
      setTouched({
        first_name: false,
        last_name: false,
        role_id: false,
        branch_id: false,
      });
    }
  }, [employee, isOpen, roles, branches]);

  const validateFirstName = (firstName: string): string => {
    if (!firstName.trim()) {
      return "First name is required";
    }
    return "";
  };

  const validateLastName = (lastName: string): string => {
    if (!lastName.trim()) {
      return "Last name is required";
    }
    return "";
  };

  const validateRole = (roleId: number): string => {
    if (roleId === 0) {
      return "Please select a role";
    }
    return "";
  };

  const validateBranch = (branchId: number): string => {
    if (branchId === 0) {
      return "Please select a branch";
    }
    return "";
  };

  const handleFirstNameChange = (value: string) => {
    setFormData((prev) => ({ ...prev, first_name: value }));
    if (touched.first_name) {
      setErrors((prev) => ({ ...prev, first_name: validateFirstName(value) }));
    }
  };

  const handleFirstNameBlur = () => {
    setTouched((prev) => ({ ...prev, first_name: true }));
    setErrors((prev) => ({
      ...prev,
      first_name: validateFirstName(formData.first_name),
    }));
  };

  const handleLastNameChange = (value: string) => {
    setFormData((prev) => ({ ...prev, last_name: value }));
    if (touched.last_name) {
      setErrors((prev) => ({ ...prev, last_name: validateLastName(value) }));
    }
  };

  const handleLastNameBlur = () => {
    setTouched((prev) => ({ ...prev, last_name: true }));
    setErrors((prev) => ({
      ...prev,
      last_name: validateLastName(formData.last_name),
    }));
  };

  const handleRoleChange = (roleId: number) => {
    setFormData((prev) => ({ ...prev, role_id: roleId }));
    if (touched.role_id) {
      setErrors((prev) => ({ ...prev, role_id: validateRole(roleId) }));
    }
  };

  const handleRoleBlur = () => {
    setTouched((prev) => ({ ...prev, role_id: true }));
    setErrors((prev) => ({ ...prev, role_id: validateRole(formData.role_id) }));
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

  const handleSalaryChange = (value: string) => {
    setSalaryInput(value);

    if (value === "" || value === "-") {
      return;
    }

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setFormData({
        ...formData,
        salary: numValue,
      });
    }
  };

  const handleSalaryBlur = () => {
    if (salaryInput === "" || salaryInput === "-") {
      setSalaryInput("0");
      setFormData({
        ...formData,
        salary: 0,
      });
    } else {
      const numValue = parseFloat(salaryInput);
      if (isNaN(numValue) || numValue < 0) {
        setSalaryInput("0");
        setFormData({
          ...formData,
          salary: 0,
        });
      } else {
        setSalaryInput(numValue.toString());
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched and validate
    setTouched({
      first_name: true,
      last_name: true,
      role_id: true,
      branch_id: true,
    });

    const firstNameError = validateFirstName(formData.first_name);
    const lastNameError = validateLastName(formData.last_name);
    const roleError = validateRole(formData.role_id);
    const branchError = validateBranch(formData.branch_id);

    setErrors({
      first_name: firstNameError,
      last_name: lastNameError,
      role_id: roleError,
      branch_id: branchError,
    });

    // If any errors, don't submit
    if (firstNameError || lastNameError || roleError || branchError) {
      return;
    }

    const finalSalary =
      salaryInput === "" || salaryInput === "-"
        ? 0
        : parseFloat(salaryInput) || 0;

    await onSubmit({
      ...formData,
      salary: finalSalary >= 0 ? finalSalary : 0,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={employee ? "Edit Employee" : "Add Employee"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            First Name
          </label>
          <input
            type="text"
            required
            value={formData.first_name}
            onChange={(e) => handleFirstNameChange(e.target.value)}
            onBlur={handleFirstNameBlur}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.first_name && touched.first_name
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300"
            }`}
          />
          {errors.first_name && touched.first_name && (
            <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Last Name
          </label>
          <input
            type="text"
            required
            value={formData.last_name}
            onChange={(e) => handleLastNameChange(e.target.value)}
            onBlur={handleLastNameBlur}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.last_name && touched.last_name
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300"
            }`}
          />
          {errors.last_name && touched.last_name && (
            <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Role
          </label>
          <select
            value={formData.role_id}
            onChange={(e) => handleRoleChange(Number(e.target.value))}
            onBlur={handleRoleBlur}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.role_id && touched.role_id
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300"
            }`}
          >
            <option value={0}>Select Role</option>
            {roles.map((role) => (
              <option key={role.role_id} value={role.role_id}>
                {role.role_name}
              </option>
            ))}
          </select>
          {errors.role_id && touched.role_id && (
            <p className="mt-1 text-sm text-red-600">{errors.role_id}</p>
          )}
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
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Salary
          </label>
          <input
            type="text"
            required
            inputMode="numeric"
            value={salaryInput}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "" || /^-?\d*\.?\d*$/.test(value)) {
                handleSalaryChange(value);
              }
            }}
            onBlur={handleSalaryBlur}
            placeholder="0"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) =>
              setFormData({ ...formData, is_active: e.target.checked })
            }
            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <label
            htmlFor="is_active"
            className="ml-2 block text-sm text-gray-900"
          >
            Active Employee
          </label>
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
            {employee ? "Update" : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
