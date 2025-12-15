"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

type ChannelData = {
    name: string;
    value: number;
    [key: string]: any;
};

const COLORS = ["#0ea5e9", "#f59e0b", "#10b981"]; // Sky (Takeaway?), Amber (Delivery?), Emerald (Dine In?)

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-100">
                <p className="text-slate-500 text-sm mb-1">{payload[0].name}</p>
                <p className="text-slate-900 text-lg font-bold">
                    {payload[0].value.toLocaleString()} Orders
                </p>
            </div>
        );
    }
    return null;
};

export default function ChannelMixChart() {
    const [data, setData] = useState<ChannelData[]>([]);
    const [period, setPeriod] = useState<"today" | "7days" | "30days" | "1year">("today");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const res = await fetch(`http://localhost:8000/api/analytics/channel-mix?period=${period}`);
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
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100/60 transition-all hover:shadow-2xl duration-500 flex flex-col h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">Channel Mix</h3>
                    <p className="text-slate-500 text-sm mt-1">Dine-in vs Delivery vs Takeaway</p>
                </div>

                {/* Simple Period Toggle for Space Efficiency */}
                <div className="flex bg-slate-100/80 p-1 rounded-xl backdrop-blur-sm self-start sm:self-auto">
                    {(["today", "7days", "30days", "1year"] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${period === p
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-900"
                                }`}
                        >
                            {p === "today" ? "Today" : p === "7days" ? "7D" : p === "30days" ? "30D" : "1Y"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 min-h-[250px] relative">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10 backdrop-blur-sm">
                        <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
                    </div>
                )}

                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={6}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            {/* Insights Panel can be added below if needed */}
        </div>
    );
}
