"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

type TrendData = {
    name: string; // Month
    value: number;
};

export default function WasteTrendChart() {
    const [data, setData] = useState<TrendData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const res = await fetch("http://localhost:8000/api/analytics/waste-trend");
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
                    <span className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </span>
                    Waste Trend
                </h3>
                <p className="text-slate-500 text-sm ml-9">Monthly Waste Quantity</p>
            </div>

            <div className="flex-1 min-h-[300px] relative">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-20 rounded-xl">
                        <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                    </div>
                )}

                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                            cursor={{ stroke: '#f97316', strokeWidth: 1, strokeDasharray: '5 5' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Line type="monotone" dataKey="value" name="Waste Qty" stroke="#f97316" strokeWidth={3} dot={{ r: 4, fill: "#f97316", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
