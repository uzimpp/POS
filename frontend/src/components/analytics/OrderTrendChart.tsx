"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

type TrendData = {
    name: string;
    value: number;
    [key: string]: any;
};

const COLORS: Record<string, string> = {
    value: "#6366f1",
    "Dine In": "#10b981",
    "Take Away": "#0ea5e9",
    "Delivery": "#f59e0b"
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-100">
                <p className="text-slate-500 text-xs font-semibold mb-2 uppercase tracking-wide">{label}</p>
                {payload.map((p: any) => (
                    <div key={p.name} className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.stroke }} />
                        <span className="text-slate-600 text-sm font-medium">{p.name === 'value' ? 'Total' : p.name}:</span>
                        <span className="text-slate-900 text-sm font-bold">{p.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function OrderTrendChart() {
    const [data, setData] = useState<TrendData[]>([]);
    const [period, setPeriod] = useState<"today" | "7days" | "30days" | "1year">("today");
    const [splitBy, setSplitBy] = useState<"none" | "type">("none");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
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
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100/60 transition-all hover:shadow-2xl duration-500">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">Order Trends</h3>
                    <p className="text-slate-500 text-sm ml-1">Volume over time</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                    <div className="flex bg-slate-100/80 p-1 rounded-xl backdrop-blur-sm shadow-inner">
                        <button onClick={() => setSplitBy("none")} className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${splitBy === "none" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}>Total</button>
                        <button onClick={() => setSplitBy("type")} className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${splitBy === "type" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}>By Type</button>
                    </div>

                    <div className="flex bg-slate-100/80 p-1 rounded-xl backdrop-blur-sm shadow-inner overflow-x-auto">
                        {(["today", "7days", "30days", "1year"] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${period === p ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}
                            >
                                {p === "today" ? "Today" : p === "7days" ? "7D" : p === "30days" ? "30D" : "1Y"}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="h-[350px] w-full relative">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10 backdrop-blur-sm">
                        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                    </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            {dataKeys.map((key) => (
                                <linearGradient key={key} id={`color-${key}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={COLORS[key] || "#6366f1"} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={COLORS[key] || "#6366f1"} stopOpacity={0} />
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="circle" />
                        {dataKeys.map((key) => (
                            <Area
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={COLORS[key] || "#6366f1"}
                                strokeWidth={3}
                                fillOpacity={1}
                                fill={`url(#color-${key})`}
                            />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
