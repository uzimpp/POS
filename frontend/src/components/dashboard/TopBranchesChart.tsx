"use client";

import { useState, useEffect, useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Legend
} from "recharts";

interface BranchData {
    name: string;
    value?: number;
    total?: number;
    [key: string]: any;
}

const COLORS = ["#10b981", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899"];
const STACK_PALETTE = ["#ec4899", "#8b5cf6", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b"];

const CustomTooltip = ({ active, payload, label, splitBy }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-100 min-w-[150px]">
                <p className="text-slate-500 text-sm mb-2">{label}</p>
                {splitBy === "category" ? (
                    payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-slate-600 text-sm">{entry.name}:</span>
                            <span className="text-slate-900 font-bold ml-auto">฿{entry.value.toLocaleString()}</span>
                        </div>
                    ))
                ) : (
                    <p className="text-emerald-600 text-xl font-bold">
                        ฿{payload[0].value.toLocaleString()}
                    </p>
                )}
            </div>
        );
    }
    return null;
};

export default function TopBranchesChart({ branchId }: { branchId?: number }) {
    const [data, setData] = useState<BranchData[]>([]);
    const [period, setPeriod] = useState<"today" | "7days" | "30days" | "1year" | "all">("today");
    const [splitBy, setSplitBy] = useState<"none" | "category">("none");
    const [loading, setLoading] = useState(true);

    // Extract keys for stacked bar
    const dataKeys = useMemo(() => {
        if (!data.length || splitBy === "none") return ["value"];
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
                    split_by_category: (splitBy === "category").toString()
                });
                if (branchId) {
                    queryParams.append("branch_ids", branchId.toString());
                }
                const res = await fetch(`http://localhost:8000/api/dashboard/top-branches?${queryParams}`);
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
    }, [period, splitBy, branchId]);

    return (
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100/60 overflow-hidden relative transition-all hover:shadow-2xl duration-500 flex flex-col h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 tracking-tight">Top Branches</h3>
                    </div>
                    <p className="text-slate-500 text-sm ml-11">
                        Best performing branches by sales
                    </p>
                </div>

                <div className="flex flex-col gap-3 w-full sm:w-auto">
                    {/* Mode Toggle */}
                    <div className="flex bg-slate-100/80 p-1 rounded-xl backdrop-blur-sm shadow-inner self-start sm:self-end">
                        <button
                            onClick={() => setSplitBy("none")}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 ease-out ${splitBy === "none"
                                ? "bg-white text-emerald-600 shadow-sm ring-1 ring-black/5 scale-[1.02]"
                                : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                                }`}
                        >
                            Total
                        </button>
                        <button
                            onClick={() => setSplitBy(splitBy === "category" ? "none" : "category")}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 ease-out ${splitBy === "category"
                                ? "bg-white text-emerald-600 shadow-sm ring-1 ring-black/5 scale-[1.02]"
                                : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                                }`}
                        >
                            By Category
                        </button>
                    </div>

                    {/* Period Control */}
                    <div className="flex bg-slate-100/80 p-1 rounded-xl backdrop-blur-sm overflow-x-auto shadow-inner">
                        {(["today", "7days", "30days", "1year", "all"] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-300 ease-out whitespace-nowrap ${period === p
                                    ? "bg-white text-emerald-600 shadow-sm ring-1 ring-black/5 scale-[1.02]"
                                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                                    }`}
                            >
                                {p === "today" ? "Today" : p === "7days" ? "7D" : p === "30days" ? "30D" : p === "1year" ? "1Y" : "All"}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-[350px] w-full relative">
                {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-10 transition-opacity duration-300">
                        <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
                        <p className="text-emerald-600 text-sm font-medium mt-3 animate-pulse">Updating...</p>
                    </div>
                ) : null}

                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        layout="vertical"
                        data={data}
                        margin={{ top: 0, right: 30, bottom: 0, left: 30 }}
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
                            width={100}
                            tick={{ fill: "#475569", fontSize: 12, fontWeight: 600 }}
                        />
                        <Tooltip content={<CustomTooltip splitBy={splitBy} />} cursor={{ fill: "#f8fafc" }} />
                        {splitBy === "category" ? (
                            <>
                                <Legend
                                    wrapperStyle={{ paddingTop: "15px" }}
                                    iconType="circle"
                                    formatter={(value) => <span className="text-slate-500 font-medium text-xs ml-1">{value}</span>}
                                />
                                {dataKeys.map((key, index) => (
                                    <Bar
                                        key={key}
                                        dataKey={key}
                                        stackId="a"
                                        fill={STACK_PALETTE[index % STACK_PALETTE.length]}
                                        radius={index === dataKeys.length - 1 ? [0, 6, 6, 0] : [0, 0, 0, 0]}
                                        barSize={32}
                                        animationDuration={1000}
                                    />
                                ))}
                            </>
                        ) : (
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
                        )}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
