"use client";

import { useGetPaymentAnalyticsStatsQuery } from "@/store/api/analyticsApi";

export default function PaymentStats({ period = "30days" }: { period?: string }) {
    const { data: stats, isLoading } = useGetPaymentAnalyticsStatsQuery({ period });

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-pulse">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 h-32"></div>
                ))}
            </div>
        );
    }

    const realizedRevenue = stats?.realized_revenue || 0;
    const atv = stats?.atv || 0;
    const cancelRate = stats?.cancellation_rate || 0;
    const lostRevenue = stats?.lost_revenue || 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Realized Revenue */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-slate-500 text-sm font-medium mb-1">Realized Revenue</h3>
                <p className="text-2xl font-bold text-slate-800">
                    ฿{realizedRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-green-600 mt-2 flex items-center">
                    <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md mr-1">Paid</span>
                    From completed orders
                </p>
            </div>

            {/* ATV */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-slate-500 text-sm font-medium mb-1">Average Transaction Value</h3>
                <p className="text-2xl font-bold text-slate-800">
                    ฿{atv.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-blue-600 mt-2 flex items-center">
                    <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md mr-1">Avg</span>
                    Per paid order
                </p>
            </div>

            {/* Cancellation Rate */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-slate-500 text-sm font-medium mb-1">Cancellation Rate</h3>
                <p className="text-2xl font-bold text-slate-800">
                    {cancelRate.toFixed(1)}%
                </p>
                <p className="text-xs text-orange-600 mt-2 flex items-center">
                    <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-md mr-1">
                        {stats?.cancelled_count || 0}
                    </span>
                    Cancelled orders
                </p>
            </div>

            {/* Lost Revenue */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-slate-500 text-sm font-medium mb-1">Lost Revenue</h3>
                <p className="text-2xl font-bold text-red-600">
                    ฿{lostRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-red-600 mt-2 flex items-center">
                    <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md mr-1">Missed</span>
                    From cancelled orders
                </p>
            </div>
        </div>
    );
}
