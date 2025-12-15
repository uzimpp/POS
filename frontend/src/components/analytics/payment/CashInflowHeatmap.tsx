"use client";

import { useGetCashInflowHeatmapQuery } from "@/store/api/analyticsApi";

export default function CashInflowHeatmap({ period = "30days" }: { period?: string }) {
    const { data: rawData, isLoading } = useGetCashInflowHeatmapQuery({ period });

    const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const HOURS = Array.from({ length: 24 }, (_, i) => i);

    if (isLoading) {
        return (
            <div className="h-80 w-full bg-white rounded-xl border border-gray-100 p-6 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    // Process Data
    // Map -> { "day_index-hour_index": value }
    const dataMap = new Map();
    let maxValue = 0;

    if (rawData) {
        rawData.forEach((item: any) => {
            const key = `${item.day_index}-${item.hour_index}`;
            dataMap.set(key, item.value);
            if (item.value > maxValue) maxValue = item.value;
        });
    }

    const getColorClass = (value: number) => {
        if (value === 0) return "bg-gray-50";
        const ratio = value / maxValue;
        if (ratio < 0.2) return "bg-emerald-100";
        if (ratio < 0.4) return "bg-emerald-200";
        if (ratio < 0.6) return "bg-emerald-300";
        if (ratio < 0.8) return "bg-emerald-400";
        return "bg-emerald-500";
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900">Cash Inflow Heatmap</h3>
                <p className="text-sm text-gray-500">"When does money flow in?"</p>
            </div>

            <div className="w-full overflow-x-auto">
                <div className="min-w-[800px]">
                    {/* Header Row (Hours) */}
                    <div className="flex">
                        <div className="w-12 flex-shrink-0"></div> {/* Row Label Spacer */}
                        {HOURS.map((hour) => (
                            <div key={hour} className="flex-1 text-center text-[10px] text-gray-400 pb-2">
                                {hour}:00
                            </div>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="flex flex-col gap-1">
                        {DAYS.map((day, dayIndex) => (
                            <div key={day} className="flex items-center gap-1">
                                <div className="w-12 flex-shrink-0 text-xs font-medium text-gray-500">
                                    {day}
                                </div>
                                {HOURS.map((hour) => {
                                    const value = dataMap.get(`${dayIndex}-${hour}`) || 0;
                                    return (
                                        <div
                                            key={`${day}-${hour}`}
                                            className={`flex-1 aspect-[2/1] rounded-sm ${getColorClass(value)} relative group transition-all duration-200 hover:scale-110 hover:z-10`}
                                        >
                                            {/* Tooltip */}
                                            <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap z-20 pointer-events-none">
                                                <div className="font-bold">{day}, {hour}:00 - {hour}:59</div>
                                                <div>Revenue: ฿{value.toLocaleString()}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-6 flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Less</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 bg-gray-50 rounded-sm border border-gray-100"></div>
                        <div className="w-3 h-3 bg-emerald-100 rounded-sm"></div>
                        <div className="w-3 h-3 bg-emerald-300 rounded-sm"></div>
                        <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
                    </div>
                    <span>More</span>
                </div>

            </div>
        </div>
    );
}
