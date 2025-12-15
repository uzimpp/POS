"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, Sector } from "recharts";

type ChannelData = {
    name: string;
    value: number;
    [key: string]: any;
};

const COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6"];

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-100">
                <p className="text-slate-500 text-sm mb-1">{payload[0].name}</p>
                <p className="text-slate-900 text-lg font-bold">
                    {payload[0].value.toLocaleString()} Orders
                </p>
            </div>
        );
    }
    return null;
};

// Removed custom active shape to match MembershipChart style (simple scaling handled by Recharts or simple hover)
// Will use simple hover effect for consistency

export default function ChannelMixChart() {
    const [data, setData] = useState<ChannelData[]>([]);
    const [period, setPeriod] = useState<"today" | "7days" | "30days" | "1year">("today");
    const [loading, setLoading] = useState(true);
    // const [activeIndex, setActiveIndex] = useState(0); // Removing complex interaction to match dashboard simplicity if desired, or keeping it?
    // User asked for "like dashboard", dashboard is simple donut with center text. 
    // I will simplify to match MembershipChart but keep the nice colors.

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const res = await fetch(`http://localhost:8000/api/analytics/channel-mix?period=${period}`);
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

    const total = data.reduce((acc, cur) => acc + cur.value, 0);

    return (
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100/60 overflow-hidden relative transition-all hover:shadow-2xl duration-500 flex flex-col h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" /><path d="M10 2c1 .5 2 2 2 5" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 tracking-tight">Channel Mix</h3>
                    </div>
                    <p className="text-slate-500 text-sm ml-11">Dine-in vs Delivery vs Takeaway</p>
                </div>

                <div className="flex bg-slate-100/80 p-1 rounded-xl backdrop-blur-sm shadow-inner self-start sm:self-auto">
                    {(["today", "7days", "30days", "1year"] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 ease-out whitespace-nowrap ${period === p
                                ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5 scale-[1.02]"
                                : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                                }`}
                        >
                            {p === "today" ? "Today" : p === "7days" ? "7D" : p === "30days" ? "30D" : "1Y"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 min-h-[300px] relative">
                {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-10 transition-opacity duration-300">
                        <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
                        <p className="text-blue-600 text-sm font-medium mt-3 animate-pulse">Updating...</p>
                    </div>
                ) : null}

                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={8}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none" />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                            formatter={(value) => <span className="text-slate-600 font-medium ml-1">{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Text for Total */}
                {!loading && total > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8 text-center">
                        <div>
                            <p className="text-4xl font-extrabold text-slate-800 tracking-tight">{total.toLocaleString()}</p>
                            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mt-1">Total Orders</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
