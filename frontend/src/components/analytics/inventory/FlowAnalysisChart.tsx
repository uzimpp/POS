"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

type FlowData = {
    name: string; // Week
    usage: number;
    restock: number;
};

export default function FlowAnalysisChart() {
    const [data, setData] = useState<FlowData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const res = await fetch("http://localhost:8000/api/analytics/inventory-flow");
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
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col h-full relative overflow-hidden">
            <div className="mb-4">
                <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                    <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                    </span>
                    Flow Analysis
                </h3>
                <p className="text-slate-500 text-sm ml-9">Consumption vs Restock (Weekly)</p>
            </div>

            <div className="flex-1 min-h-[300px] relative">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-20 rounded-xl">
                        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
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
                        <Bar dataKey="usage" name="Consumption" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                        <Bar dataKey="restock" name="Restock" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
