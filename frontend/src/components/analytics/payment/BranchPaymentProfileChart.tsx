"use client";

import { useGetBranchPaymentProfileQuery } from "@/store/api/analyticsApi";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

const COLORS = {
    CASH: "#00C49F",    // Green for Cash
    CARD: "#0088FE",    // Blue for Card
    QR: "#FFBB28",      // Yellow for QR
    POINTS: "#FF8042",  // Orange for Points
    TRANSFER: "#8884d8" // Purple for Transfer
};

export default function BranchPaymentProfileChart({ period = "30days" }: { period?: string }) {
    const { data: rawData, isLoading } = useGetBranchPaymentProfileQuery({ period });

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
                No payment data available
            </div>
        );
    }

    // Determine keys from data (excluding 'name')
    const keys = Array.from(
        new Set(
            data.flatMap((item: any) => Object.keys(item).filter((k) => k !== "name"))
        )
    ) as string[];

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-800">Branch Payment Profile</h3>
                <p className="text-sm text-slate-500">"How does each branch pay?"</p>
            </div>

            <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{
                            top: 20,
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
                            formatter={(value: number) => `฿${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                        />
                        <Legend verticalAlign="top" height={36} />
                        {keys.map((key) => (
                            <Bar
                                key={key}
                                dataKey={key}
                                stackId="a"
                                fill={COLORS[key as keyof typeof COLORS] || "#8884d8"}
                                barSize={50}
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-50">
                <div className="bg-orange-50 p-3 rounded-lg">
                    <p className="text-xs text-orange-800 leading-relaxed">
                        <strong>Action:</strong> If a branch has high Cash volume, ensure strict cash handling procedures (daily bank deposits). If high QR, no need for extra EDC terminals.
                    </p>
                </div>
            </div>
        </div>
    );
}
