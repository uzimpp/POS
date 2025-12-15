"use client";

import { useGetRevenueStreamQuery } from "@/store/api/analyticsApi";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

const COLORS = {
    CASH: "#00C49F",    // Green
    CARD: "#0088FE",    // Blue
    QR: "#FFBB28",      // Yellow
    POINTS: "#FF8042",  // Orange
    TRANSFER: "#8884d8" // Purple
};

export default function CashFlowStreamChart({
    period = "30days",
}: {
    period?: string;
}) {
    const { data: rawData, isLoading } = useGetRevenueStreamQuery({ period });

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
                No flow data available
            </div>
        );
    }

    // Determine keys from data (excluding 'date')
    const keys = Array.from(
        new Set(
            data.flatMap((item: any) => Object.keys(item).filter((k) => k !== "date"))
        )
    );

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-800">Cash Flow Stream</h3>
                <p className="text-sm text-slate-500">"Is the money flowing consistently?"</p>
            </div>

            <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 30,
                            left: 0,
                            bottom: 0,
                        }}
                    >
                        <defs>
                            {keys.map((key) => (
                                <linearGradient key={`grad-${key}`} id={`color-${key}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={COLORS[key as keyof typeof COLORS] || "#8884d8"} stopOpacity={0.8} />
                                    <stop offset="95%" stopColor={COLORS[key as keyof typeof COLORS] || "#8884d8"} stopOpacity={0} />
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#64748B" }}
                            dy={10}
                            tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#64748B" }}
                            tickFormatter={(value) => `฿${value}`}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                            formatter={(value: number) => `฿${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                        />
                        <Legend />
                        {keys.map((key) => (
                            <Area
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stackId="1"
                                stroke={COLORS[key as keyof typeof COLORS] || "#8884d8"}
                                fill={`url(#color-${key})`}
                            />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-50">
                <div className="bg-emerald-50 p-3 rounded-lg">
                    <p className="text-xs text-emerald-800 leading-relaxed">
                        <strong>Insight:</strong> Cash/QR provides immediate liquidity. Credit/Delivery apps have a credit term (delay). Watch for gaps in Cash flow to ensure you have liquidity for payroll.
                    </p>
                </div>
            </div>
        </div>
    );
}
