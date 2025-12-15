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

            <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            innerRadius={60}
                            fill="#8884d8"
                            dataKey="value"
                            paddingAngle={5}
                        >
                            {data.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-50">
                <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-blue-800 leading-relaxed">
                        <strong>Insight:</strong> Keep an eye on Credit Card fees. If High Spending customers use cards, upsell desserts to cover MDR fees.
                    </p>
                </div>
            </div>
        </div>
    );
}
