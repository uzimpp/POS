"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Layout } from "@/components/layout";
import RainmakersChart from "@/components/analytics/employee/RainmakersChart";
import EfficiencyMatrixChart from "@/components/analytics/employee/EfficiencyMatrixChart";
import LoyaltyCheckChart from "@/components/analytics/employee/LoyaltyCheckChart";
import TopRolesChart from "@/components/analytics/employee/TopRolesChart";
import StatusDonutChart from "@/components/analytics/employee/StatusDonutChart";
import TopBranchesEmployeeChart from "@/components/analytics/employee/TopBranchesEmployeeChart";

export default function EmployeeAnalyticsPage() {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch("http://localhost:8000/api/analytics/employee-stats");
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
                        href="/employees"
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
                            Employee Analytics
                        </h1>
                        <p className="text-slate-500">Workforce & Performance Insights</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">
                                Active Staff
                            </p>
                            <h2 className="text-3xl font-bold text-slate-800">
                                {stats ? stats.active_employees : "-"}
                            </h2>
                        </div>
                        <div className="p-3 bg-emerald-100 rounded-xl">
                            <svg
                                className="w-8 h-8 text-emerald-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                            </svg>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">
                                Monthly Payroll (Active)
                            </p>
                            <h2 className="text-3xl font-bold text-slate-800">
                                ฿{stats ? stats.total_payroll.toLocaleString() : "-"}
                            </h2>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <svg
                                className="w-8 h-8 text-blue-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">
                                Inactive Count
                            </p>
                            <h2 className="text-3xl font-bold text-slate-800">
                                {stats ? stats.inactive_employees : "-"}
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
                                    d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6"
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 mb-6">
                    {/* Top Sales - The Rainmakers */}
                    <div className="h-[400px]">
                        <RainmakersChart />
                    </div>
                </div>

                {/* Efficiency Matrix - Full Width */}
                <div className="h-[500px] mb-6">
                    <EfficiencyMatrixChart />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Loyalty Check - Tenure */}
                    <div className="h-[400px]">
                        <LoyaltyCheckChart />
                    </div>

                    {/* Status Donut */}
                    <div className="h-[400px]">
                        <StatusDonutChart />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Roles */}
                    <div className="h-[400px]">
                        <TopRolesChart />
                    </div>

                    {/* Top Branches */}
                    <div className="h-[400px]">
                        <TopBranchesEmployeeChart />
                    </div>
                </div>
            </div>
        </Layout>
    );
}
