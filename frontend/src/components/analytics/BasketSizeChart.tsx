"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

type BasketData = {
    items: string;
    count: number;
    [key: string]: any;
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 ring-1 ring-black/5">
                <p className="text-slate-500 text-xs font-bold mb-1 uppercase tracking-wider">{label} Items</p>
                <p className="text-slate-900 text-lg font-bold tabular-nums">
                    {payload[0].value} <span className="text-slate-400 text-xs font-medium ml-1">orders</span>
                </p>
            </div>
        );
    }
    return null;
};

export default function BasketSizeChart() {
    const [data, setData] = useState<BasketData[]>([]);
    const [period, setPeriod] = useState<"today" | "7days" | "30days" | "1year" | "all">("today");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const res = await fetch(`http://localhost:8000/api/analytics/basket-size?period=${period}`);
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
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 flex flex-col h-full relative overflow-hidden group">
            {/* Decorative background element */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-orange-50 rounded-full blur-3xl opacity-50 pointer-events-none group-hover:scale-110 transition-transform duration-700" />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 z-10">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">Basket Size</h3>
                    <p className="text-slate-500 text-sm mt-1">Items per order</p>
                </div>
                <div className="flex bg-slate-100/50 p-1 rounded-xl backdrop-blur-sm self-start sm:self-auto border border-slate-200/50">
                    {(["today", "7days", "30days", "1year", "all"] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${period === p
                                ? "bg-white text-orange-500 shadow-sm transform scale-105"
                                : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                                }`}
                        >
                            {p === "today" ? "Today" : p === "7days" ? "7D" : p === "30days" ? "30D" : p === "1year" ? "1Y" : "All"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 min-h-[250px] relative z-10">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-20 backdrop-blur-sm rounded-xl">
                        <div className="w-8 h-8 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin" />
                    </div>
                )}

                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorBasket" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f97316" stopOpacity={0.8} />
                                <stop offset="100%" stopColor="#f97316" stopOpacity={0.4} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="items" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }} dy={5} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', radius: 4 }} />
                        <Bar
                            dataKey="count"
                            fill="url(#colorBasket)"
                            radius={[6, 6, 0, 0]}
                            barSize={32}
                            className="drop-shadow-sm"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
