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

interface BranchData {
    name: string;
    value: number;
}

const COLORS = ["#10b981", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899"];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-100 min-w-[150px]">
                <p className="text-slate-500 text-sm mb-1">{label}</p>
                <p className="text-emerald-600 text-xl font-bold">
                    ฿{payload[0].value.toLocaleString()}
                </p>
            </div>
        );
    }
    return null;
};

export default function TopBranchesChart() {
    const [data, setData] = useState<BranchData[]>([]);
    const [period, setPeriod] = useState<"today" | "7days" | "30days" | "1year">("today");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const res = await fetch(`http://localhost:8000/api/dashboard/top-branches?period=${period}`);
                if (!res.ok) throw new Error("Failed to fetch data");
                const json = await res.json();
                setData(json);
            } catch (error) {
                console.error("Error fetching top branches data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [period]);

    return (
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100/60 overflow-hidden relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">Top Branches</h3>
                    <p className="text-slate-500 text-sm mt-1">
                        Best performing branches by sales
                    </p>
                </div>

                {/* Segmented Control */}
                <div className="flex bg-slate-100/80 p-1 rounded-xl backdrop-blur-sm overflow-x-auto">
                    {(["today", "7days", "30days", "1year"] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ease-out whitespace-nowrap ${period === p
                                    ? "bg-white text-emerald-600 shadow-md ring-1 ring-black/5"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                                }`}
                        >
                            {p === "today" ? "Today" : p === "7days" ? "7 Days" : p === "30days" ? "30 Days" : "1 Year"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-[350px] w-full">
                {loading ? (
                    <div className="h-full w-full flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
                        <p className="text-slate-400 text-sm font-medium">Loading branch data...</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={data}
                            margin={{ top: 0, right: 30, bottom: 0, left: 30 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                            <XAxis
                                type="number"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#94a3b8", fontSize: 12 }}
                                tickFormatter={(value) => `฿${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                            />
                            <YAxis
                                dataKey="name"
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                width={100}
                                tick={{ fill: "#475569", fontSize: 12, fontWeight: 500 }}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                            <Bar
                                dataKey="value"
                                radius={[0, 4, 4, 0]}
                                barSize={32}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
