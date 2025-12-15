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
            label: "Total Orders",
            value: stats.total_orders,
            gradient: "from-blue-500 to-indigo-600",
            shadow: "shadow-blue-500/30",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
            )
        },
        {
            label: "Paid Orders",
            value: stats.paid_orders,
            gradient: "from-emerald-400 to-teal-500",
            shadow: "shadow-emerald-500/30",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
            )
        },
        {
            label: "Pending",
            value: stats.pending_orders,
            gradient: "from-amber-400 to-orange-500",
            shadow: "shadow-amber-500/30",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            )
        },
        {
            label: "Cancelled",
            value: stats.cancelled_orders,
            gradient: "from-rose-400 to-red-500",
            shadow: "shadow-rose-500/30",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
            )
        },
    ];

    return (
        <Layout>
            <div className="pb-8 space-y-8 min-h-screen bg-slate-50/50">
                {/* Header */}
                <div className="flex items-center gap-4 pt-4">
                    <Link href="/orders" className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-100 hover:bg-blue-50 transition-all duration-300 group">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-blue-600 transition-colors"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
                    </Link>
                    <div>
                        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600 tracking-tight">Order Analytics</h1>
                        <p className="text-slate-500 mt-1 font-medium">Real-time insights into your business performance</p>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((stat, idx) => (
                        <div key={idx} className="relative overflow-hidden bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                            {/* Decorative background blur */}
                            <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />

                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <p className="text-slate-500 text-sm font-semibold tracking-wide uppercase opacity-80">{stat.label}</p>
                                    <p className="text-4xl font-extrabold text-slate-800 mt-3 tracking-tight">{stat.value.toLocaleString()}</p>
                                </div>
                                <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg ${stat.shadow} transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
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
