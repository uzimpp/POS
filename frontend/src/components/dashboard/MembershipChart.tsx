"use client";

import { useState, useEffect } from "react";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";

interface RatioData {
    name: string;
    value: number;
}

const COLORS = ["#8b5cf6", "#cbd5e1"]; // Violet (Member), Slate (Guest)

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

export default function MembershipChart() {
    const [data, setData] = useState<RatioData[]>([]);
    const [period, setPeriod] = useState<"today" | "7days" | "30days" | "1year">("today");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const res = await fetch(`http://localhost:8000/api/dashboard/membership-ratio?period=${period}`);
                if (!res.ok) throw new Error("Failed to fetch data");
                const json = await res.json();
                setData(json);
            } catch (error) {
                console.error("Error fetching membership ratio:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [period]);

    const total = data.reduce((acc, cur) => acc + cur.value, 0);

    return (
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100/60 overflow-hidden relative h-full flex flex-col">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">Membership Ratio</h3>
                    <p className="text-slate-500 text-sm mt-1">
                        Member vs Guest orders
                    </p>
                </div>

                {/* Segmented Control */}
                <div className="flex bg-slate-100/80 p-1 rounded-xl backdrop-blur-sm self-start xl:self-auto">
                    {(["today", "7days", "30days", "1year"] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ease-out whitespace-nowrap ${period === p
                                    ? "bg-white text-violet-600 shadow-md ring-1 ring-black/5"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                                }`}
                        >
                            {p === "today" ? "Today" : p === "7days" ? "7D" : p === "30days" ? "30D" : "1Y"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 min-h-[300px] w-full relative">
                {loading ? (
                    <div className="h-full w-full flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-4 border-violet-100 border-t-violet-500 rounded-full animate-spin" />
                        <p className="text-slate-400 text-sm font-medium">Loading...</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                formatter={(value, entry: any) => (
                                    <span className="text-slate-600 font-medium ml-1">{value}</span>
                                )}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                )}

                {/* Center Text for Total */}
                {!loading && total > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-slate-800">{total}</p>
                            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Orders</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
