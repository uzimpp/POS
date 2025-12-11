import { useState, useEffect } from "react";
import { Stock, StockCreate } from "../store/api/stockApi";
import { Branch } from "../store/api/branchesApi";

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
    const [formData, setFormData] = useState<StockCreate>({
        stk_name: "",
        amount_remaining: 0,
        unit: "",
        branch_id: 0,
    });

    useEffect(() => {
        if (stockItem) {
            setFormData({
                stk_name: stockItem.stk_name,
                amount_remaining: stockItem.amount_remaining,
                unit: stockItem.unit,
                branch_id: stockItem.branch_id,
            });
        } else {
            setFormData({
                stk_name: "",
                amount_remaining: 0,
                unit: "",
                branch_id: branches.length > 0 ? branches[0].branch_id : 0,
            });
        }
    }, [stockItem, isOpen, branches]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h2 className="text-xl font-bold mb-4">
                    {stockItem ? "Edit Stock Item" : "Add Stock Item"}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Name
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.stk_name}
                            onChange={(e) =>
                                setFormData({ ...formData, stk_name: e.target.value })
                            }
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Amount Remaining
                        </label>
                        <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={formData.amount_remaining}
                            onChange={(e) =>
                                setFormData({ ...formData, amount_remaining: Number(e.target.value) })
                            }
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Unit
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.unit}
                            onChange={(e) =>
                                setFormData({ ...formData, unit: e.target.value })
                            }
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Branch
                        </label>
                        <select
                            value={formData.branch_id}
                            onChange={(e) =>
                                setFormData({ ...formData, branch_id: Number(e.target.value) })
                            }
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                        >
                            <option value={0}>Select Branch</option>
                            {branches.map((branch) => (
                                <option key={branch.branch_id} value={branch.branch_id}>
                                    {branch.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                            {stockItem ? "Update" : "Create"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
