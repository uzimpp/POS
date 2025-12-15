"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";

type WasteData = {
    name: string;
    value: number;
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-slate-100">
                <p className="text-slate-500 text-sm mb-1">{payload[0].payload.name}</p>
                <p className="text-red-600 font-bold text-lg">
                    {payload[0].value} <span className="text-sm font-normal text-slate-500">units</span>
                </p>
            </div>
        );
    }
    return null;
};

export default function WasteMakersChart() {
    const [data, setData] = useState<WasteData[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<"7days" | "30days">("30days");

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const res = await fetch(`http://localhost:8000/api/analytics/top-waste-employees?period=${period}`);
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
                        <span className="p-1.5 bg-red-100 text-red-600 rounded-lg">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </span>
                        The Waste Makers
                    </h3>
                    <p className="text-slate-500 text-sm mt-1 ml-9">Top Waste Contributors</p>
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
                        <div className="w-8 h-8 border-4 border-red-100 border-t-red-500 rounded-full animate-spin" />
                    </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barSize={40}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500, fill: "#64748b" }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                        <Bar dataKey="value" fill="#ef4444" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            {/* Background Decor */}
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
        </div>
    );
}
