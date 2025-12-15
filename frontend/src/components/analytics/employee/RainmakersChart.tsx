"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";

type SalesData = {
    name: string;
    value: number;
};

const PALETTE = ["#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"]; // Violet shades

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-slate-100">
                <p className="text-slate-500 text-sm mb-1">{payload[0].payload.name}</p>
                <p className="text-violet-600 font-bold text-lg">
                    ฿{payload[0].value.toLocaleString()}
                </p>
            </div>
        );
    }
    return null;
};

export default function RainmakersChart() {
    const [data, setData] = useState<SalesData[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<"7days" | "30days">("30days");

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const res = await fetch(`http://localhost:8000/api/analytics/top-sales-employees?period=${period}`);
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
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col h-full relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="flex justify-between items-start mb-6 z-10">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        <span className="p-1.5 bg-violet-100 text-violet-600 rounded-lg">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </span>
                        The Rainmakers
                    </h3>
                    <p className="text-slate-500 text-sm mt-1 ml-9">Top Revenue Generators</p>
                </div>

                <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as any)}
                    className="text-xs border-none bg-slate-100 rounded-lg px-2 py-1 text-slate-600 focus:ring-0 cursor-pointer"
                >
                    <option value="7days">7 Days</option>
                    <option value="30days">30 Days</option>
                </select>
            </div>

            <div className="flex-1 min-h-[300px] relative z-10">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-20 rounded-xl">
                        <div className="w-8 h-8 border-4 border-violet-100 border-t-violet-500 rounded-full animate-spin" />
                    </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={data} margin={{ top: 5, right: 30, left: 40, bottom: 20 }} barSize={20}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fontWeight: 500, fill: "#64748b" }}
                            width={100}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
        </div>
    );
}
