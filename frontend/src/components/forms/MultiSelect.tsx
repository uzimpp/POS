import { useState, useRef, useEffect } from "react";

interface Option {
    value: number | string;
    label: string;
}

interface MultiSelectProps {
    options: Option[];
    selectedValues: (number | string)[];
    onChange: (values: (number | string)[]) => void;
    label?: string;
    placeholder?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
    options,
    selectedValues,
    onChange,
    label = "Select Options",
    placeholder = "Select...",
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleToggle = (value: number | string) => {
        if (selectedValues.includes(value)) {
            onChange(selectedValues.filter((v) => v !== value));
        } else {
            onChange([...selectedValues, value]);
        }
    };

    const handleSelectAll = () => {
        if (selectedValues.length === options.length) {
            onChange([]);
        } else {
            onChange(options.map((o) => o.value));
        }
    };

    return (
        <div className="relative w-64" ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex justify-between items-center w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
                <div className="flex flex-wrap gap-1 max-w-[90%] overflow-hidden h-6 items-center">
                    {selectedValues.length === 0 ? (
                        <span className="text-gray-400 text-sm truncate">{placeholder}</span>
                    ) : (
                        options
                            .filter((o) => selectedValues.includes(o.value))
                            .map((o) => (
                                <span
                                    key={o.value}
                                    className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full truncate max-w-[100px]"
                                >
                                    {o.label}
                                </span>
                            )).slice(0, 2) // Show only first 2 chips then +N
                    )}
                    {selectedValues.length > 2 && (
                        <span className="text-xs text-gray-500">+{selectedValues.length - 2} more</span>
                    )}
                </div>
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "transform rotate-180" : ""
                        }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </div>

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    <div
                        className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                        onClick={handleSelectAll}
                    >
                        <input
                            type="checkbox"
                            checked={selectedValues.length === options.length && options.length > 0}
                            readOnly
                            className="mr-2 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 pointer-events-none"
                        />
                        <span className="text-sm font-medium text-gray-700">Select All</span>
                    </div>
                    {options.map((option) => (
                        <div
                            key={option.value}
                            className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleToggle(option.value)}
                        >
                            <input
                                type="checkbox"
                                checked={selectedValues.includes(option.value)}
                                readOnly
                                className="mr-2 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 pointer-events-none"
                            />
                            <span className="text-sm text-gray-700">{option.label}</span>
                        </div>
                    ))}
                    {options.length === 0 && (
                        <div className="px-4 py-2 text-sm text-gray-500">No options available</div>
                    )}
                </div>
            )}
        </div>
    );
};
