"use client";

import { useState, useEffect, useMemo } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";

interface SalesData {
    name: string;
    value?: number;
    [key: string]: any; // Allow dynamic keys for order types
}

const COLORS: Record<string, string> = {
    DINE_IN: "#6366f1", // Indigo
    TAKEAWAY: "#f59e0b", // Amber
    DELIVERY: "#10b981", // Emerald
    value: "#6366f1",    // Default single line
    // Categories (examples)
    "Main Dish": "#ec4899", // Pink
    "Appetizer": "#8b5cf6", // Violet
    "Beverage": "#3b82f6", // Blue
    "Dessert": "#f43f5e", // Rose
    "Set Menu": "#06b6d4", // Cyan
};
const PALETTE = ["#6366f1", "#ec4899", "#8b5cf6", "#f59e0b", "#10b981", "#3b82f6", "#f43f5e", "#06b6d4"];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-100 min-w-[150px]">
                <p className="text-slate-500 text-sm mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-slate-600 text-sm capitalize">
                            {entry.name === 'value' ? 'Total' : entry.name.replace('_', ' ').toLowerCase()}:
                        </span>
                        <span className="text-slate-900 font-bold ml-auto">
                            ฿{entry.value.toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function SalesChart() {
    const [data, setData] = useState<SalesData[]>([]);
    const [period, setPeriod] = useState<"today" | "7days" | "30days" | "1year">("today");
    const [splitBy, setSplitBy] = useState<"none" | "type" | "category">("none");
    const [loading, setLoading] = useState(true);

    // Extract unique keys from data (excluding 'name' and 'value' if split)
    const dataKeys = useMemo(() => {
        if (!data.length) return [];
        if (splitBy === "none") return ["value"];

        const keys = new Set<string>();
        data.forEach(item => {
            Object.keys(item).forEach(k => {
                if (k !== "name" && k !== "value" && k !== "total") keys.add(k);
            });
        });
        return Array.from(keys);
    }, [data, splitBy]);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const queryParams = new URLSearchParams({
                    period: period,
                    split_by_type: (splitBy === "type").toString(),
                    split_by_category: (splitBy === "category").toString()
                });
                const res = await fetch(`http://localhost:8000/api/dashboard/sales-chart?${queryParams}`);
                if (!res.ok) throw new Error("Failed to fetch data");
                const json = await res.json();
                setData(json);
            } catch (error) {
                console.error("Error fetching sales chart data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [period, splitBy]);

    return (
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100/60 overflow-hidden relative">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">Sales Overview</h3>
                    <p className="text-slate-500 text-sm mt-1">
                        {period === "today"
                            ? "Hourly revenue performance"
                            : period === "1year"
                                ? "Monthly revenue analysis"
                                : "Daily revenue trends"}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                    {/* View Options */}
                    <div className="flex bg-slate-100/80 p-1 rounded-xl backdrop-blur-sm">
                        {/* Default (Total) */}
                        <button
                            onClick={() => setSplitBy(splitBy === "none" ? "none" : "none")}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${splitBy === "none"
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                                }`}
                        >
                            Total
                        </button>

                        {/* Type Toggle */}
                        <button
                            onClick={() => setSplitBy(splitBy === "type" ? "none" : "type")}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${splitBy === "type"
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                                }`}
                        >
                            By Type
                        </button>

                        {/* Category Toggle */}
                        <button
                            onClick={() => setSplitBy(splitBy === "category" ? "none" : "category")}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${splitBy === "category"
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                                }`}
                        >
                            By Category
                        </button>
                    </div>

                    {/* Segmented Control */}
                    <div className="flex bg-slate-100/80 p-1 rounded-xl backdrop-blur-sm overflow-x-auto">
                        {(["today", "7days", "30days", "1year"] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ease-out whitespace-nowrap ${period === p
                                    ? "bg-white text-indigo-600 shadow-md ring-1 ring-black/5"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                                    }`}
                            >
                                {p === "today" ? "Today" : p === "7days" ? "7 Days" : p === "30days" ? "30 Days" : "1 Year"}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="h-[400px] w-full -ml-4">
                {loading ? (
                    <div className="h-full w-full flex flex-col items-center justify-center gap-3 ml-4">
                        <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
                        <p className="text-slate-400 text-sm font-medium">Loading sales data...</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{ top: 10, right: 30, bottom: 20, left: 10 }}
                        >
                            <defs>
                                {dataKeys.map((key, index) => (
                                    <linearGradient key={key} id={`color-${key}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS[key] || PALETTE[index % PALETTE.length]} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={COLORS[key] || PALETTE[index % PALETTE.length]} stopOpacity={0} />
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#f1f5f9"
                            />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }}
                                tickMargin={20}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }}
                                tickFormatter={(value) => `฿${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}`}
                                dx={0}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
                            <Legend
                                wrapperStyle={{ paddingTop: "20px" }}
                                iconType="circle"
                            />

                            {dataKeys.map((key, index) => (
                                <Area
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    name={key === 'value' ? 'Total Sales' : key.replace('_', ' ')}
                                    // stackId="1" // Do NOT stack area chart usually unless specifically requested. User said "like by order type" which we did as Layered (default).
                                    // But for breakdown, stacked is often clearer if total exceeds y-axis otherwise. 
                                    // The user asked for "Mode like by order type". In previous steps we did overlapping (no stackId). 
                                    // Let's keep it overlapping (layered) for now, or stack? 
                                    // AreaChart without stackId layers them.
                                    stroke={COLORS[key] || PALETTE[index % PALETTE.length]}
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill={`url(#color-${key})`}
                                    animationDuration={1500}
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
