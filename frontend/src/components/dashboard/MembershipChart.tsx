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
    [key: string]: any;
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

export default function MembershipChart({ branchId }: { branchId?: number }) {
    const [data, setData] = useState<RatioData[]>([]);
    const [period, setPeriod] = useState<"today" | "7days" | "30days" | "1year" | "all">("today");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const queryParams = new URLSearchParams({ period: period });
                if (branchId) {
                    queryParams.append("branch_ids", branchId.toString());
                }
                const res = await fetch(`http://localhost:8000/api/dashboard/membership-ratio?${queryParams}`);
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
    }, [period, branchId]);

    const total = data.reduce((acc, cur) => acc + cur.value, 0);

    return (
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100/60 overflow-hidden relative transition-all hover:shadow-2xl duration-500 flex flex-col h-full">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 bg-violet-50 rounded-lg text-violet-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 tracking-tight">Membership</h3>
                    </div>
                    <p className="text-slate-500 text-sm ml-11">
                        Member vs Guest orders
                    </p>
                </div>

                {/* Segmented Control */}
                <div className="flex bg-slate-100/80 p-1 rounded-xl backdrop-blur-sm shadow-inner self-start xl:self-auto">
                    {(["today", "7days", "30days", "1year", "all"] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 ease-out whitespace-nowrap ${period === p
                                ? "bg-white text-violet-600 shadow-sm ring-1 ring-black/5 scale-[1.02]"
                                : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                                }`}
                        >
                            {p === "today" ? "Today" : p === "7days" ? "7D" : p === "30days" ? "30D" : p === "1year" ? "1Y" : "All"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 min-h-[300px] w-full relative">
                {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-10 transition-opacity duration-300">
                        <div className="w-8 h-8 border-4 border-violet-100 border-t-violet-500 rounded-full animate-spin" />
                        <p className="text-violet-600 text-sm font-medium mt-3 animate-pulse">Updating...</p>
                    </div>
                ) : null}

                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={105}
                            paddingAngle={5}
                            dataKey="value"
                            cornerRadius={8}
                            stroke="none"
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
                            formatter={(value, entry: any) => (
                                <span className="text-slate-600 font-medium ml-1">{value}</span>
                            )}
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
