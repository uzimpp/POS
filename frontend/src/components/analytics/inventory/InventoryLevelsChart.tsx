"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Dynamic palettes for branches? Or fixed set.
const COLORS = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316",
    "#eab308", "#10b981", "#06b6d4", "#3b82f6", "#a855f7"
];

export default function InventoryLevelsChart() {
    const [data, setData] = useState<any[]>([]);
    const [branches, setBranches] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const res = await fetch("http://localhost:8000/api/analytics/inventory-levels");
                if (!res.ok) throw new Error("Failed");
                const json = await res.json();
                setData(json);

                // Extract all unique branch names from the data keys
                const uniqueBranches = new Set<string>();
                json.forEach((item: any) => {
                    Object.keys(item).forEach(key => {
                        if (key !== "name") {
                            uniqueBranches.add(key);
                        }
                    });
                });
                setBranches(Array.from(uniqueBranches));

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    return (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col h-full relative overflow-hidden">
            <div className="mb-4">
                <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                    <span className="p-1.5 bg-violet-100 text-violet-600 rounded-lg">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </span>
                    Current Inventory Levels
                </h3>
                <p className="text-slate-500 text-sm ml-9">Top 10 Ingredients by Branch</p>
            </div>

            <div className="flex-1 min-h-[300px] relative">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-20 rounded-xl">
                        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin" />
                    </div>
                )}

                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: "#64748b" }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: "#64748b" }}
                        />
                        <Tooltip
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend iconType="circle" iconSize={8} />
                        {branches.map((branch, index) => (
                            <Bar key={branch} dataKey={branch} stackId="a" fill={COLORS[index % COLORS.length]} radius={[4, 4, 0, 0]} />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
