"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type GrowthData = {
    name: string;
    value: number;
    new: number;
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-slate-100">
                <p className="text-slate-500 text-sm mb-1">{label}</p>
                <div className="flex flex-col gap-1">
                    <p className="text-violet-600 font-bold text-lg">
                        {payload[0].value.toLocaleString()} <span className="text-sm font-normal text-slate-500">total members</span>
                    </p>
                    <p className="text-emerald-500 text-sm font-medium">
                        +{payload[0].payload.new} <span className="text-slate-400">new this month</span>
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

export default function AcquisitionGrowthChart() {
    const [data, setData] = useState<GrowthData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const res = await fetch("http://localhost:8000/api/analytics/acquisition-growth");
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
    }, []);

    return (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col h-full relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="mb-6 z-10">
                <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                    <span className="p-1.5 bg-violet-100 text-violet-600 rounded-lg">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </span>
                    Acquisition Growth
                </h3>
                <p className="text-slate-500 text-sm mt-1 ml-9">Cumulative members over time</p>
            </div>

            <div className="flex-1 min-h-[250px] relative z-10">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-20 rounded-xl">
                        <div className="w-8 h-8 border-4 border-violet-100 border-t-violet-600 rounded-full animate-spin" />
                    </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorGrowth)"
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Background Decor */}
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-violet-50 rounded-full blur-3xl opacity-50 group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
        </div>
    );
}
