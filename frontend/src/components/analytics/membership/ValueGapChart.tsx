"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, CartesianGrid } from "recharts";

type ValueData = {
    name: string;
    value: number;
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-slate-100">
                <p className="text-slate-500 text-sm mb-1">{label}</p>
                <p className="text-slate-800 font-bold text-lg">
                    ฿{payload[0].value.toFixed(0)} <span className="text-sm font-normal text-slate-500">avg. ticket</span>
                </p>
            </div>
        );
    }
    return null;
};

export default function ValueGapChart() {
    const [data, setData] = useState<ValueData[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<"today" | "7days" | "30days">("today");

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const res = await fetch(`http://localhost:8000/api/analytics/value-gap?period=${period}`);
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
                        <span className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </span>
                        The &quot;Value Gap&quot;
                    </h3>
                    <p className="text-slate-500 text-sm mt-1 ml-9">Member vs Guest Spending</p>
                </div>

                {/* Simple Period Toggle */}
                <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as any)}
                    className="text-xs border-none bg-slate-100 rounded-lg px-2 py-1 text-slate-600 focus:ring-0 cursor-pointer"
                >
                    <option value="today">Today</option>
                    <option value="7days">7 Days</option>
                    <option value="30days">30 Days</option>
                </select>
            </div>

            <div className="flex-1 min-h-[250px] relative z-10">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-20 rounded-xl">
                        <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
                    </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barSize={60}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fontWeight: 600, fill: "#64748b" }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} unit="฿" />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.name === 'Member' ? '#10b981' : '#cbd5e1'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            {/* Background Decor */}
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-50 rounded-full blur-3xl opacity-50 group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
        </div>
    );
}
