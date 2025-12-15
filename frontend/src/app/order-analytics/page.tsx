"use client";

import { Layout } from "@/components/layout";
import { useEffect, useState } from "react";
import OrderTrendChart from "@/components/analytics/OrderTrendChart";
import ChannelMixChart from "@/components/analytics/ChannelMixChart";
import TicketSizeChart from "@/components/analytics/TicketSizeChart";
import BasketSizeChart from "@/components/analytics/BasketSizeChart";
import TopBranchesVolumeChart from "@/components/analytics/TopBranchesVolumeChart";
import Link from "next/link";


export default function OrderAnalyticsPage() {
    const [stats, setStats] = useState({ total_orders: 0, paid_orders: 0, pending_orders: 0, cancelled_orders: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch("http://localhost:8000/api/analytics/order-stats");
                if (res.ok) {
                    const json = await res.json();
                    setStats(json);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    const statCards = [
        {
            label: "Total Orders", value: stats.total_orders, color: "bg-blue-50 text-blue-600", icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
            )
        },
        {
            label: "Paid Orders", value: stats.paid_orders, color: "bg-emerald-50 text-emerald-600", icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
            )
        },
        {
            label: "Pending", value: stats.pending_orders, color: "bg-amber-50 text-amber-600", icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            )
        },
        {
            label: "Cancelled", value: stats.cancelled_orders, color: "bg-rose-50 text-rose-600", icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
            )
        },
    ];

    return (
        <Layout>
            <div className="pb-8 space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/orders" className="p-2 bg-white rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Order Analytics</h1>
                        <p className="text-slate-500 mt-1">Deep dive into order performance and trends</p>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((stat, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                                    <p className="text-3xl font-bold text-slate-800 mt-2">{stat.value.toLocaleString()}</p>
                                </div>
                                <div className={`p-3 rounded-2xl ${stat.color}`}>
                                    {stat.icon}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Trend Chart (Full Width) */}
                <div className="w-full">
                    <OrderTrendChart />
                </div>

                {/* Second Row: Channel Mix & Ticket Size & Basket Size */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <ChannelMixChart />
                    <TicketSizeChart />
                    <BasketSizeChart />
                </div>

                {/* Third Row: Top Branches */}
                <div className="grid grid-cols-1 gap-6">
                    <TopBranchesVolumeChart />
                </div>
            </div>
        </Layout>
    );
}
