"use client";

import { useState, useEffect } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, ReferenceLine } from "recharts";

type EfficiencyData = {
    name: string;
    role: string;
    salary: number;
    revenue: number;
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-slate-100 min-w-[150px]">
                <p className="text-slate-800 font-bold text-sm mb-1">{data.name}</p>
                <p className="text-slate-500 text-xs mb-2">{data.role}</p>
                <div className="flex flex-col gap-1 text-xs">
                    <div className="flex justify-between">
                        <span className="text-slate-400">Revenue:</span>
                        <span className="font-semibold text-emerald-600">฿{data.revenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">Salary:</span>
                        <span className="font-semibold text-rose-600">฿{data.salary.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export default function EfficiencyMatrixChart() {
    const [data, setData] = useState<EfficiencyData[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<"30days">("30days");

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const res = await fetch(`http://localhost:8000/api/analytics/efficiency-matrix?period=${period}`);
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

    // Calculate averages for quadrants
    const avgSalary = data.length ? data.reduce((sum, item) => sum + item.salary, 0) / data.length : 0;
    const avgRevenue = data.length ? data.reduce((sum, item) => sum + item.revenue, 0) / data.length : 0;

    return (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col h-full relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="flex justify-between items-start mb-6 z-10">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        <span className="p-1.5 bg-sky-100 text-sky-600 rounded-lg">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </span>
                        Efficiency Matrix
                    </h3>
                    <p className="text-slate-500 text-sm mt-1 ml-9">Salary vs Revenue Generated</p>
                </div>

                {/* Period is fixed to 30 days for now as salary is monthly */}
                <span className="text-xs font-medium text-slate-400 px-2 py-1 bg-slate-50 rounded-lg">30 Days</span>
            </div>

            <div className="flex-1 min-h-[300px] relative z-10">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-20 rounded-xl">
                        <div className="w-8 h-8 border-4 border-sky-100 border-t-sky-500 rounded-full animate-spin" />
                    </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                            type="number"
                            dataKey="salary"
                            name="Salary"
                            unit="฿"
                            tick={{ fontSize: 10, fill: "#94a3b8" }}
                            label={{ value: 'Monthly Salary', position: 'bottom', offset: 0, fontSize: 11, fill: "#64748b" }}
                        />
                        <YAxis
                            type="number"
                            dataKey="revenue"
                            name="Revenue"
                            unit="฿"
                            tick={{ fontSize: 10, fill: "#94a3b8" }}
                            label={{ value: 'Revenue (30d)', angle: -90, position: 'left', offset: 0, fontSize: 11, fill: "#64748b" }}
                        />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />

                        {/* Quadrant Lines */}
                        <ReferenceLine x={avgSalary} stroke="#cbd5e1" strokeDasharray="3 3" />
                        <ReferenceLine y={avgRevenue} stroke="#cbd5e1" strokeDasharray="3 3" />

                        {/* Labels for Quadrants (Optional/Advanced: absolute positioning overlay is easier than ReferenceArea labels sometimes) */}

                        <Scatter name="Employees" data={data} fill="#0ea5e9">
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={
                                    entry.revenue > avgRevenue && entry.salary < avgSalary ? "#10b981" : // High Rev, Low Sal (Star)
                                        entry.revenue > avgRevenue && entry.salary > avgSalary ? "#3b82f6" : // High Rev, High Sal (Solid)
                                            entry.revenue < avgRevenue && entry.salary < avgSalary ? "#f59e0b" : // Low Rev, Low Sal (Junior)
                                                "#ef4444" // Low Rev, High Sal (Warning)
                                } />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex gap-4 justify-center mt-2 pb-2">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[10px] text-slate-500">Hidden Gem</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-[10px] text-slate-500">Solid Performer</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span className="text-[10px] text-slate-500">Developing</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div><span className="text-[10px] text-slate-500">Review</span></div>
            </div>
        </div>
    );
}
