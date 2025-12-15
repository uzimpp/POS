"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

type TierData = {
    name: string;
    value: number;
};

const COLORS = ["#94a3b8", "#fbbf24", "#38bdf8", "#818cf8", "#c084fc"]; // Silver, Gold, Platinum, etc.

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-slate-100">
                <p className="text-slate-500 text-sm mb-1">{label}</p>
                <p className="text-slate-800 font-bold text-lg">
                    {payload[0].value} <span className="text-sm font-normal text-slate-500">members</span>
                </p>
            </div>
        );
    }
    return null;
};

export default function TierPyramidChart() {
    const [data, setData] = useState<TierData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const res = await fetch("http://localhost:8000/api/analytics/tier-distribution");
                if (!res.ok) throw new Error("Failed");
                const json = await res.json();
                // Sort by value descending for pyramid shape (or ideally by tier rank if available, but value works for pyramid visual)
                // Let's sort by Tier Rank? Backend sends name/value. 
                // Let's assume backend sends in rank order or we sort by value for visual "Pyramid" (base widest)
                // Pyramid usually means widest at bottom. Vertical bar chart: widest bar at bottom? 
                // Or horizontal bar chart? Horizontal is better for labels.
                // Let's sort by value descending so top is widest? OR ascending?
                // Let's do horizontal bars.
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
                    <span className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </span>
                    Tier Distribution
                </h3>
                <p className="text-slate-500 text-sm mt-1 ml-9">Active members by level</p>
            </div>

            <div className="flex-1 min-h-[250px] relative z-10">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-20 rounded-xl">
                        <div className="w-8 h-8 border-4 border-amber-100 border-t-amber-500 rounded-full animate-spin" />
                    </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={data} margin={{ top: 0, right: 30, bottom: 0, left: 20 }} barCategoryGap={10}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fontWeight: 600, fill: "#64748b" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={32} animationDuration={1000}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Background Decor */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-amber-50 rounded-full blur-3xl opacity-50 group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
        </div>
    );
}
