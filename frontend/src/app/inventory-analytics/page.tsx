"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Layout } from "@/components/layout";
import InventoryLevelsChart from "@/components/analytics/inventory/InventoryLevelsChart";
import ActivityBreakdownChart from "@/components/analytics/inventory/ActivityBreakdownChart";
import FlowAnalysisChart from "@/components/analytics/inventory/FlowAnalysisChart";
import WasteTrendChart from "@/components/analytics/inventory/WasteTrendChart";

export default function InventoryAnalyticsPage() {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch("http://localhost:8000/api/analytics/inventory-stats");
                if (res.ok) {
                    const json = await res.json();
                    setStats(json);
                }
            } catch (e) {
                console.error(e);
            }
        }
        fetchStats();
    }, []);

    return (
        <Layout>
            <div className="min-h-screen pb-12">
                <div className="mb-8 flex items-center gap-4">
                    <Link
                        href="/stock"
                        className="p-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 transition-colors"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 19l-7-7m0 0l7-7m-7 7h18"
                            />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                            Inventory Overview
                        </h1>
                        <p className="text-slate-500">Stock Levels & Movement Insights</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">
                                Total Items
                            </p>
                            <h2 className="text-3xl font-bold text-slate-800">
                                {stats ? stats.total_items : "-"}
                            </h2>
                        </div>
                        <div className="p-3 bg-violet-100 rounded-xl">
                            <svg
                                className="w-8 h-8 text-violet-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                />
                            </svg>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">
                                Low Stock Items
                            </p>
                            <h2 className="text-3xl font-bold text-red-600">
                                {stats ? stats.low_stock_count : "-"}
                            </h2>
                        </div>
                        <div className="p-3 bg-red-100 rounded-xl">
                            <svg
                                className="w-8 h-8 text-red-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">
                                Waste Rate
                            </p>
                            <h2 className="text-3xl font-bold text-orange-600">
                                {stats ? `${stats.waste_rate}%` : "-"}
                            </h2>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-xl">
                            <svg
                                className="w-8 h-8 text-orange-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="space-y-6">
                    {/* Top Level: Inventory Levels (Stacked Bar) */}
                    <div className="h-[400px]">
                        <InventoryLevelsChart />
                    </div>

                    {/* Middle Level: Activity & Flow */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="h-[400px]">
                            <ActivityBreakdownChart />
                        </div>
                        <div className="h-[400px]">
                            <FlowAnalysisChart />
                        </div>
                    </div>

                    {/* Bottom Level: Waste Trend */}
                    <div className="h-[400px]">
                        <WasteTrendChart />
                    </div>
                </div>
            </div>
        </Layout>
    );
}
