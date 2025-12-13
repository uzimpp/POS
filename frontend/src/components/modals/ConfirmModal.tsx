import React from "react";

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDestructive?: boolean;
    error?: string | null;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    isDestructive = false,
    error,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 bg-opacity-50 transition-opacity">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm transform transition-all scale-100">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className={`text-lg font-semibold ${isDestructive ? "text-red-600" : "text-gray-900"}`}>
                        {title}
                    </h3>
                </div>
                <div className="px-6 py-4">
                    <p className="text-gray-600 text-sm">{message}</p>
                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}
                </div>
                <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDestructive
                            ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                            : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                            }`}
                    >
                        {isDestructive ? "Delete" : "Confirm"}
                    </button>
                </div>
            </div>
        </div>
    );
};
