"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

type TrendData = {
    name: string;
    value: number;
    [key: string]: any;
};

// Extended palette for dynamic keys (Categories)
const PALETTE = [
    "#8b5cf6", // Violet
    "#10b981", // Emerald
    "#3b82f6", // Blue
    "#f59e0b", // Amber
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#f43f5e", // Rose
    "#6366f1", // Indigo
];

// Fallback mapping for known static types
const STATIC_COLORS: Record<string, string> = {
    value: "#8b5cf6",
    "Dine In": "#10b981",
    "Take Away": "#3b82f6",
    "Delivery": "#f59e0b"
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 ring-1 ring-black/5 min-w-[180px]">
                <p className="text-slate-500 text-xs font-bold mb-3 uppercase tracking-wider">{label}</p>
                {payload.map((p: any) => (
                    <div key={p.name} className="flex items-center justify-between gap-6 mb-2 last:mb-0">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: p.stroke }} />
                            <span className="text-slate-600 text-sm font-medium capitalize">{p.name === 'value' ? 'Total' : p.name.replace('_', ' ').toLowerCase()}</span>
                        </div>
                        <span className="text-slate-800 text-lg font-bold tabular-nums">{p.value.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function OrderTrendChart() {
    const [data, setData] = useState<TrendData[]>([]);
    const [period, setPeriod] = useState<"today" | "7days" | "30days" | "1year" | "all">("today");
    const [splitBy, setSplitBy] = useState<"none" | "type" | "category">("none");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                // Determine API param: backend expects 'split_by' = value
                // If using old param convention: split_by={value}
                const res = await fetch(`http://localhost:8000/api/analytics/order-trend?period=${period}&split_by=${splitBy}`);
                if (!res.ok) throw new Error("Failed");
                const json = await res.json();
                setData(json);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [period, splitBy]);

    const dataKeys = data.length > 0 ? Object.keys(data[0]).filter(k => k !== "name") : ["value"];

    return (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
            {/* Decorative gradient blob */}
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-violet-50 rounded-full blur-3xl opacity-50 pointer-events-none group-hover:scale-110 transition-transform duration-700" />

            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6 relative z-10">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">Order Trends</h3>
                    <p className="text-slate-500 text-sm mt-1">Volume over time breakdown</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                    <div className="flex bg-slate-100/50 p-1.5 rounded-xl backdrop-blur-sm border border-slate-200/50">
                        {(["none", "type", "category"] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setSplitBy(mode)}
                                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all shadow-sm ${splitBy === mode ? "bg-white text-violet-600 shadow-md transform scale-105" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 shadow-transparent"}`}
                            >
                                {mode === "none" ? "Total" : mode === "type" ? "By Type" : "By Cat"}
                            </button>
                        ))}
                    </div>

                    <div className="flex bg-slate-100/50 p-1.5 rounded-xl backdrop-blur-sm border border-slate-200/50 overflow-x-auto scrollbar-hide">
                        {(["today", "7days", "30days", "1year", "all"] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shadow-sm ${period === p ? "bg-white text-violet-600 shadow-md transform scale-105" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 shadow-transparent"}`}
                            >
                                {p === "today" ? "Today" : p === "7days" ? "7 Days" : p === "30days" ? "30 Days" : p === "1year" ? "1 Year" : "All Time"}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="h-[400px] w-full relative z-10">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-20 backdrop-blur-sm rounded-xl">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-violet-100 border-t-violet-600 rounded-full animate-spin" />
                            <p className="text-xs font-medium text-violet-600 animate-pulse">Loading data...</p>
                        </div>
                    </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            {dataKeys.map((key, index) => {
                                const color = STATIC_COLORS[key] || PALETTE[index % PALETTE.length];
                                return (
                                    <linearGradient key={key} id={`color-${key}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                                    </linearGradient>
                                );
                            })}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.6} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#8b5cf6', strokeWidth: 2, strokeDasharray: '5 5' }} />
                        <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="circle" iconSize={8} formatter={(val) => <span className="capitalize text-slate-600 font-medium">{val}</span>} />
                        {dataKeys.map((key, index) => {
                            const color = STATIC_COLORS[key] || PALETTE[index % PALETTE.length];
                            return (
                                <Area
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={color}
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill={`url(#color-${key})`}
                                    animationDuration={1500}
                                    animationEasing="ease-out"
                                    name={key === 'value' ? 'Total' : key}
                                />
                            );
                        })}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
