"use client";

import { useGetATVByMethodQuery } from "@/store/api/analyticsApi";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export default function ATVByMethodChart({ period = "30days" }: { period?: string }) {
    const { data: rawData, isLoading } = useGetATVByMethodQuery({ period });

    if (isLoading) {
        return (
            <div className="h-80 bg-slate-50 rounded-xl animate-pulse flex items-center justify-center text-slate-400">
                Loading chart...
            </div>
        );
    }

    const data = rawData || [];

    if (data.length === 0) {
        return (
            <div className="h-80 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 text-sm">
                No data available
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-800">Who Spends More?</h3>
                <p className="text-sm text-slate-500">Average Transaction Value (ATV) by Method</p>
            </div>

            <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748B" }} dy={10} />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#64748B" }}
                            tickFormatter={(value) => `฿${value}`}
                        />
                        <Tooltip
                            cursor={{ fill: "#F1F5F9" }}
                            contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                            formatter={(value: number) => [
                                `฿${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
                                "Avg. Spend",
                            ]}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={50}>
                            {data.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-50">
                <div className="bg-indigo-50 p-3 rounded-lg">
                    <p className="text-xs text-indigo-800 leading-relaxed">
                        <strong>Action:</strong> If Credit Card ATV is higher, encourage staff to upsell when they see a card, as "Pain of Paying" is lower.
                    </p>
                </div>
            </div>
        </div>
    );
}
