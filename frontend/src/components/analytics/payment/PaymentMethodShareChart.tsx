"use client";

import { useGetPaymentMethodShareQuery } from "@/store/api/analyticsApi";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export default function PaymentMethodShareChart({
    period = "30days",
}: {
    period?: string;
}) {
    const { data: rawData, isLoading } = useGetPaymentMethodShareQuery({ period });

    if (isLoading) {
        return (
            <div className="h-80 bg-slate-50 rounded-xl animate-pulse flex items-center justify-center text-slate-400">
                Loading chart...
            </div>
        );
    }

    const data = rawData || [];
    const totalValue = data.reduce((acc: number, curr: any) => acc + curr.value, 0);

    // If no data, show empty state
    if (data.length === 0 || totalValue === 0) {
        return (
            <div className="h-80 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 text-sm">
                No payment data available
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-800">Revenue Share by Method</h3>
                <p className="text-sm text-slate-500">"Where is the money coming from?"</p>
            </div>

            <div className="relative w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={110}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                                const RADIAN = Math.PI / 180;
                                const radius = outerRadius * 1.2;
                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                return (
                                    <text x={x} y={y} fill="#64748B" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
                                        {`${data[index].name} (${(percent * 100).toFixed(0)}%)`}
                                    </text>
                                );
                            }}
                        >
                            {data.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number) =>
                                `฿${value.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}`
                            }
                            contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>

                {/* Centered Total Revenue */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -mt-4 text-center pointer-events-none">
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Total Revenue</p>
                    <p className="text-xl font-bold text-slate-800">
                        ฿{(totalValue / 1000).toFixed(1)}k
                    </p>
                </div>
            </div>

        </div>
    );
}
