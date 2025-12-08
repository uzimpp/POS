import React from 'react';

interface ErrorModalProps {
    isOpen: boolean;
    title?: string;
    message: string;
    onClose: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
    isOpen,
    title = "Error",
    message,
    onClose,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden transform transition-all">
                <div className="px-6 py-4 bg-red-50 border-b border-red-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-red-100">
                            <svg
                                className="h-5 w-5 text-red-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-red-800">
                            {title}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-red-400 hover:text-red-500 focus:outline-none"
                    >
                        <span className="sr-only">Close</span>
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="px-6 py-4">
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {message}
                    </p>
                </div>

                <div className="px-6 py-3 bg-gray-50 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};
