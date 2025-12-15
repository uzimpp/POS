"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

type BasketData = {
    items: string;
    count: number;
    [key: string]: any;
};

export default function BasketSizeChart() {
    const [data, setData] = useState<BasketData[]>([]);
    const [period, setPeriod] = useState<"today" | "7days" | "30days" | "1year">("today");
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
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100/60 transition-all hover:shadow-2xl duration-500 flex flex-col h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">Basket Size</h3>
                    <p className="text-slate-500 text-sm mt-1">Items per order</p>
                </div>
                <div className="flex bg-slate-100/80 p-1 rounded-xl backdrop-blur-sm self-start sm:self-auto">
                    {(["today", "7days", "30days", "1year"] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${period === p
                                ? "bg-white text-orange-500 shadow-sm"
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
                        <div className="w-8 h-8 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin" />
                    </div>
                )}

                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="items" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                        <Tooltip
                            cursor={{ fill: '#f1f5f9' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
