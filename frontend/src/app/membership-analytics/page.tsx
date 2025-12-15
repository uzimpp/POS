"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AcquisitionGrowthChart from "../../components/analytics/membership/AcquisitionGrowthChart";
import TierPyramidChart from "../../components/analytics/membership/TierPyramidChart";
import ValueGapChart from "../../components/analytics/membership/ValueGapChart";
import WhaleAnalysisChart from "../../components/analytics/membership/WhaleAnalysisChart";
import { Layout } from "../../components/layout";

type MembershipStats = {
    total_members: number;
    total_tiers: number;
    start_tier_count: number;
    member_ratio: number;
};

export default function MembershipAnalyticsPage() {
    const [stats, setStats] = useState<MembershipStats>({
        total_members: 0,
        total_tiers: 0,
        start_tier_count: 0,
        member_ratio: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            setLoading(true);
            try {
                const res = await fetch("http://localhost:8000/api/analytics/membership-stats");
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

    return (
        <Layout>
            <div className="min-h-screen bg-slate-50/50 p-6 sm:p-10 space-y-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/memberships" className="group p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all shadow-sm hover:shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform"><path d="m15 18-6-6 6-6" /></svg>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Membership Analytics</h1>
                            <p className="text-slate-500 font-medium">Customer Loyalty & Value Insights</p>
                        </div>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Members */}
                    <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="relative z-10">
                            <p className="text-slate-500 font-medium text-sm">Total Members</p>
                            <h3 className="text-3xl font-bold text-slate-800 mt-2">{stats.total_members.toLocaleString()}</h3>
                            <div className="flex items-center gap-2 mt-3">
                                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">+12%</span>
                                <span className="text-slate-400 text-xs">vs last month</span>
                            </div>
                        </div>
                        <div className="absolute right-[-20px] top-[-20px] text-slate-50 opacity-50 group-hover:text-violet-50 group-hover:scale-110 transition-all duration-500">
                            <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                        </div>
                    </div>

                    {/* Member Ratio */}
                    <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="relative z-10">
                            <p className="text-slate-500 font-medium text-sm">Member Order Ratio</p>
                            <h3 className="text-3xl font-bold text-slate-800 mt-2">{stats.member_ratio}%</h3>
                            <div className="flex items-center gap-2 mt-3">
                                <span className="text-slate-400 text-xs">of total daily orders</span>
                            </div>
                        </div>
                        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-50 rounded-full blur-xl opacity-50 group-hover:scale-150 transition-transform duration-700" />
                    </div>

                    {/* Active Tiers */}
                    <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="relative z-10">
                            <p className="text-slate-500 font-medium text-sm">Active Tiers</p>
                            <h3 className="text-3xl font-bold text-slate-800 mt-2">{stats.total_tiers}</h3>
                            <div className="flex items-center gap-2 mt-3">
                                <span className="text-slate-400 text-xs">loyalty levels</span>
                            </div>
                        </div>
                        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-amber-50 rounded-full blur-xl opacity-50 group-hover:scale-150 transition-transform duration-700" />
                    </div>

                    {/* Placeholder / Marketing effectiveness? */}
                    <div className="bg-gradient-to-br from-violet-600 to-indigo-600 p-6 rounded-[1.5rem] shadow-lg text-white relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-violet-100 font-medium text-sm">Retention Rate</p>
                            <h3 className="text-3xl font-bold mt-2">85%</h3>
                            <div className="flex items-center gap-2 mt-3">
                                <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full border border-white/10">High</span>
                                <span className="text-violet-100 text-xs">loyalty score</span>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-[60px] opacity-20 pointer-events-none mix-blend-overlay group-hover:opacity-30 transition-opacity" />
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Row 1: Growth & Pyramid */}
                    <div className="h-[400px]">
                        <AcquisitionGrowthChart />
                    </div>
                    <div className="h-[400px]">
                        <TierPyramidChart />
                    </div>

                    {/* Row 2: Value Gap & Whale Analysis */}
                    <div className="h-[400px]">
                        <ValueGapChart />
                    </div>
                    <div className="h-[400px]">
                        <WhaleAnalysisChart />
                    </div>
                </div>

            </div>
        </Layout>
    );
}
