"use client";

import { useState, useEffect } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface SalesData {
    name: string;
    value: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-100 min-w-[150px]">
                <p className="text-slate-500 text-sm mb-1">{label}</p>
                <p className="text-indigo-600 text-2xl font-bold">
                    ฿{payload[0].value.toLocaleString()}
                </p>
            </div>
        );
    }
    return null;
};

export default function SalesChart() {
    const [data, setData] = useState<SalesData[]>([]);
    const [period, setPeriod] = useState<"today" | "7days" | "30days">("today");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const res = await fetch(`http://localhost:8000/api/dashboard/sales-chart?period=${period}`);
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
    }, [period]);

    return (
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100/60 overflow-hidden relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">Sales Overview</h3>
                    <p className="text-slate-500 text-sm mt-1">
                        {period === "today"
                            ? "Hourly revenue performance"
                            : period === "7days"
                                ? "Weekly revenue trends"
                                : "Monthly revenue analysis"}
                    </p>
                </div>

                {/* Segmented Control */}
                <div className="flex bg-slate-100/80 p-1.5 rounded-xl backdrop-blur-sm">
                    {(["today", "7days", "30days"] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ease-out ${period === p
                                    ? "bg-white text-indigo-600 shadow-md ring-1 ring-black/5"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                                }`}
                        >
                            {p === "today" ? "Today" : p === "7days" ? "7 Days" : "30 Days"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-[350px] w-full -ml-2">
                {loading ? (
                    <div className="h-full w-full flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
                        <p className="text-slate-400 text-sm font-medium">Loading sales data...</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
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
                                tickMargin={15}
                                dy={5}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }}
                                tickFormatter={(value) => `฿${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}`}
                                dx={-5}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#6366f1"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorValue)"
                                animationDuration={1500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
