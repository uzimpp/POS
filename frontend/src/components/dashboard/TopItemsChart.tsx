"use client";

import { useState, useEffect } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts";

interface ItemData {
    name: string;
    value: number;
}

const COLORS = ["#f59e0b", "#ec4899", "#8b5cf6", "#3b82f6", "#10b981"];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-100 min-w-[150px]">
                <p className="text-slate-500 text-sm mb-2">{label}</p>
                <p className="text-amber-600 text-xl font-bold">
                    ฿{payload[0].value.toLocaleString()}
                </p>
            </div>
        );
    }
    return null;
};

export default function TopItemsChart({ branchId }: { branchId?: number }) {
    const [data, setData] = useState<ItemData[]>([]);
    const [period, setPeriod] = useState<"today" | "7days" | "30days" | "1year" | "all">("today");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const queryParams = new URLSearchParams({ period: period });
                if (branchId) {
                    queryParams.append("branch_ids", branchId.toString());
                }
                const res = await fetch(`http://localhost:8000/api/dashboard/top-items?${queryParams}`);
                if (!res.ok) throw new Error("Failed to fetch data");
                const json = await res.json();
                setData(json);
            } catch (error) {
                console.error("Error fetching top items data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [period, branchId]);

    return (
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100/60 overflow-hidden relative transition-all hover:shadow-2xl duration-500 flex flex-col h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /><circle cx="12" cy="12" r="10" /></svg>
                            {/* Changed icon to something generic or food related if possible, sticking to generic for safe default or X for error? No, use star or list. Let's use a Utensils icon approximation or similar. Actually let's use the standard "List" or "Star" icon. */}
                            {/* Star Icon */}
                            <svg className="absolute hidden" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                        </div>
                        {/* Replacing Icon with explicit Utensils/Star SVG */}
                        <div className="p-2 bg-amber-50 rounded-lg text-amber-600 absolute top-6 left-6">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 tracking-tight ml-10">Top Menu Items</h3>
                    </div>
                    <p className="text-slate-500 text-sm ml-11">
                        Best selling items by revenue
                    </p>
                </div>

                <div className="flex bg-slate-100/80 p-1 rounded-xl backdrop-blur-sm overflow-x-auto shadow-inner self-start sm:self-auto">
                    {(["today", "7days", "30days", "1year", "all"] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-300 ease-out whitespace-nowrap ${period === p
                                ? "bg-white text-amber-600 shadow-sm ring-1 ring-black/5 scale-[1.02]"
                                : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                                }`}
                        >
                            {p === "today" ? "Today" : p === "7days" ? "7D" : p === "30days" ? "30D" : p === "1year" ? "1Y" : "All"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 min-h-[350px] w-full relative">
                {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-10 transition-opacity duration-300">
                        <div className="w-8 h-8 border-4 border-amber-100 border-t-amber-500 rounded-full animate-spin" />
                        <p className="text-amber-600 text-sm font-medium mt-3 animate-pulse">Updating...</p>
                    </div>
                ) : null}

                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        layout="vertical"
                        data={data}
                        margin={{ top: 0, right: 30, bottom: 0, left: 40 }}
                        barGap={4}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis
                            type="number"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
                            tickFormatter={(value) => `฿${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                            dy={10}
                        />
                        <YAxis
                            dataKey="name"
                            type="category"
                            axisLine={false}
                            tickLine={false}
                            width={110}
                            tick={{ fill: "#475569", fontSize: 12, fontWeight: 600 }}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                        <Bar
                            dataKey="value"
                            radius={[0, 6, 6, 0]}
                            barSize={32}
                            animationDuration={1000}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
