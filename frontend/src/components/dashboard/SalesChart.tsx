"use client";

import { useState, useEffect } from "react";
import {
    LineChart,
    Line,
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
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">Sales Overview</h3>
                    <p className="text-sm text-slate-500">
                        {period === "today"
                            ? "Hourly sales performance for today"
                            : period === "7days"
                                ? "Daily sales performance for the last 7 days"
                                : "Daily sales performance for the last 30 days"}
                    </p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setPeriod("today")}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${period === "today"
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                    >
                        Today
                    </button>
                    <button
                        onClick={() => setPeriod("7days")}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${period === "7days"
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                    >
                        7 Days
                    </button>
                    <button
                        onClick={() => setPeriod("30days")}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${period === "30days"
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                    >
                        30 Days
                    </button>
                </div>
            </div>

            <div className="h-[300px] w-full">
                {loading ? (
                    <div className="h-full w-full flex items-center justify-center text-slate-400">
                        Loading chart data...
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#64748B", fontSize: 12 }}
                                tickMargin={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#64748B", fontSize: 12 }}
                                tickFormatter={(value) => `฿${value}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#fff",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "8px",
                                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                }}
                                itemStyle={{ color: "#4F46E5" }}
                                formatter={(value: number) => [`฿${value.toFixed(2)}`, "Sales"]}
                            />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#4F46E5"
                                strokeWidth={3}
                                dot={{ r: 4, fill: "#4F46E5", strokeWidth: 2, stroke: "#fff" }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
