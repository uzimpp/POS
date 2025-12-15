"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";

type BranchData = {
    name: string;
    value: number;
    [key: string]: any;
};

const COLORS = ["#10b981", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899"];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-100 min-w-[150px]">
                <p className="text-slate-500 text-sm mb-2">{label}</p>
                <p className="text-violet-600 text-xl font-bold">
                    {payload[0].value.toLocaleString()} <span className="text-sm font-normal text-slate-500">orders</span>
                </p>
            </div>
        );
    }
    return null;
};

export default function TopBranchesVolumeChart() {
    const [data, setData] = useState<BranchData[]>([]);
    const [period, setPeriod] = useState<"today" | "7days" | "30days" | "1year" | "all">("today");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const res = await fetch(`http://localhost:8000/api/analytics/top-branches-volume?period=${period}`);
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
    }, [period]);

    return (
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100/60 overflow-hidden relative transition-all hover:shadow-2xl duration-500 flex flex-col h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 bg-violet-50 rounded-lg text-violet-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 7v14" /><path d="M5 12h14" /><path d="M3 3h18" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 tracking-tight">Top Branches</h3>
                    </div>
                    <p className="text-slate-500 text-sm ml-11">
                        Highest volume locations
                    </p>
                </div>

                {/* Period Control */}
                <div className="flex bg-slate-100/80 p-1 rounded-xl backdrop-blur-sm overflow-x-auto shadow-inner">
                    {(["today", "7days", "30days", "1year", "all"] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-300 ease-out whitespace-nowrap ${period === p
                                ? "bg-white text-violet-600 shadow-sm ring-1 ring-black/5 scale-[1.02]"
                                : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                                }`}
                        >
                            {p === "today" ? "Today" : p === "7days" ? "7D" : p === "30days" ? "30D" : p === "1year" ? "1Y" : "All"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 min-h-[300px] w-full relative">
                {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-10 transition-opacity duration-300">
                        <div className="w-8 h-8 border-4 border-violet-100 border-t-violet-500 rounded-full animate-spin" />
                        <p className="text-violet-600 text-sm font-medium mt-3 animate-pulse">Updating...</p>
                    </div>
                ) : null}

                <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={data} margin={{ top: 0, right: 30, bottom: 0, left: 30 }} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            axisLine={false}
                            tickLine={false}
                            width={100}
                            tick={{ fontSize: 12, fontWeight: 600, fill: "#475569" }}
                        />
                        <Tooltip
                            cursor={{ fill: '#f8fafc' }}
                            content={<CustomTooltip />}
                        />
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
