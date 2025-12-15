"use client";

import { useGetWalletShareByTierQuery } from "@/store/api/analyticsApi";
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
    CASH: "#10B981", // Emerald 500
    QR: "#3B82F6",   // Blue 500
    CARD: "#8B5CF6", // Violet 500
    POINTS: "#F59E0B", // Amber 500
};

export default function WalletShareByTierChart({ period = "30days" }: { period?: string }) {
    const { data, isLoading } = useGetWalletShareByTierQuery({ period });

    if (isLoading) {
        return (
            <div className="h-80 w-full bg-white rounded-xl border border-gray-100 p-6 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="h-80 w-full bg-white rounded-xl border border-gray-100 p-6 flex flex-col items-center justify-center text-gray-400">
                <p>No wallet share data available</p>
            </div>
        );
    }

    // Sort Tiers: Non-Member, Bronze, Silver, Gold, Platinum, Diamond
    const tierOrder = ["Non-Member", "Bronze", "Silver", "Gold", "Platinum", "Diamond"];
    const sortedData = [...data].sort((a, b) => {
        const indexA = tierOrder.indexOf(a.name);
        const indexB = tierOrder.indexOf(b.name);
        // If not found (new tier?), put at end
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900">Wallet Share by Tier</h3>
                <p className="text-sm text-gray-500">"How does each tier pay?"</p>
            </div>

            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={sortedData}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#6B7280", fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#6B7280", fontSize: 12 }}
                            tickFormatter={(value) => `฿${value}`}
                        />
                        <Tooltip
                            cursor={{ fill: '#F3F4F6' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Legend iconType="circle" />

                        {/* Stacked Bars for each payment method */}
                        <Bar dataKey="CASH" stackId="a" fill={COLORS.CASH} name="Cash" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="QR" stackId="a" fill={COLORS.QR} name="QR Code" />
                        <Bar dataKey="CARD" stackId="a" fill={COLORS.CARD} name="Credit Card" />
                        <Bar dataKey="POINTS" stackId="a" fill={COLORS.POINTS} name="Points" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100 flex items-start gap-3">
                <div className="p-1 bg-indigo-100 rounded text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                </div>
                <div>
                    <h4 className="text-xs font-semibold text-indigo-900 uppercase tracking-wider mb-1">Action</h4>
                    <p className="text-sm text-indigo-800">
                        If <strong>Platinum</strong> uses heavy Cash, they might miss credit card promos (Upsell!).
                        If <strong>Bronze</strong> uses heavy Credit, valid potential for upgrade.
                    </p>
                </div>
            </div>
        </div>
    );
}
